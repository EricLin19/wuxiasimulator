// sync_wanderer_final.js
// 从孤云逐浪_v5.4.md 提取完整 text，同步到 content.js 的 DATA.wandererMonths

const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '孤云逐浪_v5.4.md');
const contentPath = path.join(__dirname, 'src', 'data', 'content.js');

// ── 1. 从 MD 文件提取每个月的完整 text ────────────────────
const md = fs.readFileSync(mdPath, 'utf8');

// 分割每个月的区块
const monthSections = md.split(/(?=^#### M\d+ ·)/m);

const fullTexts = {};  // { monthNum: fullText }

for (const section of monthSections) {
  const headerMatch = section.match(/^#### M(\d+) ·/m);
  if (!headerMatch) continue;
  const monthNum = parseInt(headerMatch[1]);

  // 找 JS block（```js ... ```）
  const jsMatch = section.match(/```js\n([\s\S]*?)```/);
  if (!jsMatch) continue;

  // 从 JS block 里提取 text: "..." 的值
  // 注：text 字段可能跨多行（如果完整文案很长）
  // 但当前 MD 文件里 text 字段已被写成单行
  const jsContent = jsMatch[1];
  const textMatch = jsContent.match(/^\s+text:\s*"((?:[^"\\]|\\.)*)"/m);
  if (textMatch) {
    fullTexts[monthNum] = textMatch[1];
  }
}

console.log(`从 MD 提取到 ${Object.keys(fullTexts).length} 个月的 text`);

// ── 2. 读取 content.js，替换 DATA.wandererMonths 里的 text ───
let content = fs.readFileSync(contentPath, 'utf8');

// 找到 DATA.wandererMonths = { 的位置
const startMarker = 'DATA.wandererMonths = {';
const startIdx = content.indexOf(startMarker);
if (startIdx === -1) {
  console.error('找不到 DATA.wandererMonths');
  process.exit(1);
}

// 找到匹配的右花括号（ Account for nesting）
let braceCount = 0;
let endIdx = -1;
for (let i = startIdx + startMarker.length - 1; i < content.length; i++) {
  if (content[i] === '{') braceCount++;
  else if (content[i] === '}') {
    braceCount--;
    if (braceCount === 0) { endIdx = i; break; }
  }
}
if (endIdx === -1) {
  console.error('找不到 DATA.wandererMonths 的结束位置');
  process.exit(1);
}

// 只处理这块区域
let before = content.substring(0, startIdx + startMarker.length);
let target = content.substring(startIdx + startMarker.length, endIdx);
let after = content.substring(endIdx);

// 逐月替换 target 中的 text 字段
for (const [monthNum, fullText] of Object.entries(fullTexts)) {
  // 构造正则：匹配 `  N: {` 之后的 `    text: "..."`
  // 目标格式（content.js 中的缩进是 2 空格）：
  //   1: {
  //     title: "...",
  //     text: "...",    <-- 替换这行
  //     choices: [...]
  //   },

  // 先用正则找到该月的区块，再替换其中的 text
  const monthRegex = new RegExp(
    `(\\n\\s+${parseInt(monthNum)}:\\s*\\{)[\\s\\S]*?(\\n\\s+text:\\s*"[^"]*")`,
    'm'
  );

  const monthMatch = target.match(monthRegex);
  if (!monthMatch) {
    console.warn(`  content.js 中找不到 M${monthNum} 的 text 字段`);
    continue;
  }

  // 替换：保留缩进，写入完整 text
  // monthMatch[1] = 换行+缩进+ "1: {"
  // monthMatch[2] = 换行+缩进+ 'text: "...'
  // 我们需要替换 monthMatch[2] 中的文本内容

  // 更稳健的做法：在 target 中直接做字符串替换
  // 找到 `  N: {` 的位置，然后在这个月块内找 `    text:`
}

// 上面的方法太复杂，改用简单的行级处理
console.log('改用行级处理...');

const lines = content.split('\n');
let inWandererMonths = false;
let inMonthBlock = false;
let braceDepth = 0;
let currentMonth = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // 进入 DATA.wandererMonths
  if (line.includes('DATA.wandererMonths = {')) {
    inWandererMonths = true;
    continue;
  }
  if (!inWandererMonths) continue;

  // 检查是否离开 DATA.wandererMonths（顶层结束）
  // 通过花括号计数来判断
  // 简化：遇到 `}` 且不在嵌套对象中时结束
  // 实际上我们可以通过跟踪缩进/花括号来判断

  // 找到月份开始：`  N: {`
  const monthStartMatch = line.match(/^\s+(\d+):\s*\{/);
  if (monthStartMatch && inWandererMonths) {
    currentMonth = parseInt(monthStartMatch[1]);
    inMonthBlock = true;
    braceDepth = 1;
    continue;
  }

  if (!inMonthBlock) continue;

  // 跟踪花括号深度
  const openBraces = (line.match(/\{/g) || []).length;
  const closeBraces = (line.match(/\}/g) || []).length;
  braceDepth += openBraces - closeBraces;

  // 找 text: "..." 行并替换
  if (currentMonth && fullTexts[currentMonth]) {
    const textMatch = line.match(/^(\s+)text:\s*"[^"]*"/);
    if (textMatch) {
      const indent = textMatch[1];
      // 转义：JS 字符串中的 " 必须写成 \"
      const escaped = fullTexts[currentMonth]
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"');
      lines[i] = `${indent}text: "${escaped}"`;
      console.log(`  ✓ M${currentMonth} text 字段已替换`);
      currentMonth = null; // 每个月只有一个 text 字段
    }
  }

  // 月份块结束
  if (braceDepth <= 0) {
    inMonthBlock = false;
    currentMonth = null;
  }
}

const newContent = lines.join('\n');
fs.writeFileSync(contentPath, newContent, 'utf8');
console.log('✅ content.js 同步完成！');
