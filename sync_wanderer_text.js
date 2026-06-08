// sync_wanderer_text.js
// 从孤云逐浪_v5.4.md 提取完整 text 字段，同步到 content.js 的 DATA.wandererMonths

const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '孤云逐浪_v5.4.md');
const contentPath = path.join(__dirname, 'src', 'data', 'content.js');

// 1. 从 MD 文件提取每个月的完整 text
const mdContent = fs.readFileSync(mdPath, 'utf8');

// 匹配每个月的区块：#### M数字 · 标题\n\n[全文]\n```js\n{...text: "..."...}\n```
// 更实用的方式：直接提取每个 JS block 里的 text 字段（已含完整文案）
const monthTexts = {};

// 用正则提取每个月区块里的 text: "..."  (JS block 里的内容）
const monthBlocks = mdContent.split(/(?=^#### M\d+ ·)/m);
for (const block of monthBlocks) {
  const headerMatch = block.match(/^#### (M(\d+)) ·/m);
  if (!headerMatch) continue;
  const monthNum = parseInt(headerMatch[2]);

  // 在 JS block 里找 text: "..."  
  // 完整文案现在已经在 text 字段里（由之前的 Python 脚本填入）
  const jsBlockMatch = block.match(/```js\n([\s\S]*?)```/);
  if (!jsBlockMatch) continue;

  const jsContent = jsBlockMatch[1];
  // 提取 text: "..."  值（可能含转义字符 \" ）
  // 用非贪婪匹配到第一个 "," 或 "}" 之前
  const textMatch = jsContent.match(/^\s+text:\s*"((?:[^"\\]|\\.)*)"/m);
  if (textMatch) {
    monthTexts[monthNum] = textMatch[1];
  }
}

console.log(`从 MD 提取到 ${Object.keys(monthTexts).length} 个 text 字段`);

// 2. 读取 content.js，替换 DATA.wandererMonths 里的 text 字段
let content = fs.readFileSync(contentPath, 'utf8');

// 找到 DATA.wandererMonths = { 的位置
const startMarker = 'DATA.wandererMonths = {';
const startIdx = content.indexOf(startMarker);
if (startIdx === -1) {
  console.error('找不到 DATA.wandererMonths');
  process.exit(1);
}

// 找到对应的结束 }（匹配花括号）
let braceCount = 0;
let endIdx = -1;
for (let i = startIdx + startMarker.length - 1; i < content.length; i++) {
  if (content[i] === '{') braceCount++;
  else if (content[i] === '}') {
    braceCount--;
    if (braceCount === 0) { endIdx = i + 1; break; }
  }
}
if (endIdx === -1) {
  console.error('找不到 DATA.wandererMonths 的结束位置');
  process.exit(1);
}

// 只处理这块区域
let before = content.substring(0, startIdx + startMarker.length);
let target = content.substring(startIdx + startMarker.length, endIdx - 1);
let after = content.substring(endIdx - 1);

// 逐月替换 target 中的 text 字段
for (const [monthNum, fullText] of Object.entries(monthTexts)) {
  // 转义：JS 字符串中的 " 必须写成 \"
  const escapedText = fullText.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  // 构造匹配模式：先找到 `monthNum: {`，然后在其中找 `text: "..."`
  // 用行级替换：找到 `  text: "` 开头那行
  const lineRegex = new RegExp(
    `(\\n\\s+${monthNum}:\\s*\\{[\\s\\S]*?\\n)(\\s+text:\\s*")([^"]*)(")`,
    'm'
  );
  
  // 更好的方式：逐行处理 target
  // 先找到月份块的起始位置
  const monthRegex = new RegExp(`(\\n\\s+)${monthNum}:\\s*\\{`, 'm');
  const monthMatch = target.match(monthRegex);
  if (!monthMatch) {
    console.warn(`在 content.js 中找不到月份 ${monthNum}`);
    continue;
  }
  
  // 现在我们处理整块 content，用更具针对性的替换
  // 直接对完整 content 做替换（更可靠）
}

// 改用更简单可靠的策略：直接逐行处理 content.js
const lines = content.split('\n');
let inWandererMonths = false;
let inMonthBlock = false;
let braceDepth = 0;
let currentMonth = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (line.includes('DATA.wandererMonths = {')) {
    inWandererMonths = true;
    continue;
  }

  if (!inWandererMonths) continue;

  // 检查是否到达 wandererMonths 结束
  if (line.trim() === '}') {
    // 需要检查花括号深度
    // 简化：遇到 } 且不在任何 month block 里时结束
    if (!inMonthBlock) break;
  }

  // 匹配月份开始：`  N: {`
  const monthStartMatch = line.match(/^\s+(\d+):\s*\{/);
  if (monthStartMatch && inWandererMonths) {
    currentMonth = parseInt(monthStartMatch[1]);
    inMonthBlock = true;
    braceDepth = 1;
    
    // 找这个月里的 text 行并替换
    for (let j = i + 1; j < lines.length; j++) {
      const ml = lines[j];
      braceDepth += (ml.match(/\{/g) || []).length;
      braceDepth -= (ml.match(/\}/g) || []).length;
      
      // 找 text: "..." 行
      const textMatch = ml.match(/^(\s+)text:\s*"[^"]*"/);
      if (textMatch && currentMonth in monthTexts) {
        const indent = textMatch[1];
        lines[j] = `${indent}text: "${monthTexts[currentMonth]}"`;
        console.log(`  替换 M${currentMonth} 的 text 字段`);
        break;
      }
      
      if (braceDepth <= 0) break;
    }
    
    // 跳过已处理的行
    // 继续外循环（i 会在循环末尾 +1）
  }
}

const newContent = lines.join('\n');
fs.writeFileSync(contentPath, newContent, 'utf8');
console.log('content.js 同步完成！');
