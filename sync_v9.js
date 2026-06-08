// sync_v9.js — 处理 Windows 换行符 + 逐行替换 content.js

const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '孤云逐浪_v5.4.md');
const contentPath = path.join(__dirname, 'src', 'data', 'content.js');

// ── 1. 从 MD 提取完整 text（处理 Windows/Unix 换行） ────
const md = fs.readFileSync(mdPath, 'utf8').replace(/\r\n/g, '\n');

const fullTexts = {};

// 直接找所有 JS 块，提取 month + text
const jsRe = /```js\n([\s\S]*?)```/g;
let jsMatch;

while ((jsMatch = jsRe.exec(md)) !== null) {
  const jsContent = jsMatch[1];
  
  // 提取 month 编号
  const monthMatch = jsContent.match(/month:\s*(\d+)/);
  if (!monthMatch) continue;
  const monthNum = parseInt(monthMatch[1]);
  
  // 提取 text: "..."  — 支持 \" 转义
  const textMatch = jsContent.match(/^\s+text:\s*"((?:[^"\\]|\\.)*)"/m);
  if (textMatch) {
    fullTexts[monthNum] = textMatch[1];
    console.log(`  M${monthNum}: 提取 text`);
  }
}

console.log(`\nMD 提取到 ${Object.keys(fullTexts).length} 个月份`);

// ── 2. 逐行替换 content.js ──────────────────────────────
let content = fs.readFileSync(contentPath, 'utf8');

// 找到 DATA.wandererMonths 的 range
const startIdx = content.indexOf('DATA.wandererMonths = {');
if (startIdx === -1) throw new Error('找不到 DATA.wandererMonths');

// 找匹配的结束大括号
let brace = 0, endIdx = -1, inStr = false, esc = false;
for (let i = startIdx + 'DATA.wandererMonths = {'.length - 1; i < content.length; i++) {
  const c = content[i];
  if (esc) { esc = false; continue; }
  if (c === '\\' && inStr) { esc = true; continue; }
  if (c === '"' && !esc) { inStr = !inStr; continue; }
  if (!inStr) {
    if (c === '{') brace++;
    else if (c === '}') { brace--; if (brace === 0) { endIdx = i + 1; break; } }
  }
}

// 对每个月份，用字符串替换 text 字段
let target = content.substring(startIdx, endIdx);
let replacementCount = 0;

for (const [monthNum, fullText] of Object.entries(fullTexts)) {
  // Escaped   for JS string
  const escaped = fullText.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  
  // 找到该月份对象的位置，然后找到里面的 text: "..."
  // 策略：匹配 `N: {` 到 `  },` 之间的完整月份对象
  const monthObjRe = new RegExp(
    `(\\n\\s+${parseInt(monthNum)}:\\s*\\{[\\s\\S]*?\\n\\s+)text:\\s*"[^"]*"`,
    'm'
  );
  
  const newTarget = target.replace(monthObjRe, `$1text: "${escaped}"`);
  
  if (newTarget !== target) {
    target = newTarget;
    replacementCount++;
    console.log(`  ✓ M${monthNum} text 已替换`);
  }
}

console.log(`\n成功替换 ${replacementCount} 个 text 字段`);

// 拼接回 content
const newContent = content.substring(0, startIdx) + target + content.substring(endIdx);
fs.writeFileSync(contentPath, newContent, 'utf8');

console.log('✅ content.js 已更新！');
