// sync_v8.js — 逐行解析 content.js，替换 DATA.wandererMonths 里每个月的 text 字段

const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '孤云逐浪_v5.4.md');
const contentPath = path.join(__dirname, 'src', 'data', 'content.js');

// ── 1. 从 MD 文件提取每个月完整 text ─────────────────────
const md = fs.readFileSync(mdPath, 'utf8');
const fullTexts = {};

const sections = md.split(/(?=^#### M\d+ ·)/m);
for (const sec of sections) {
  if (!sec.startsWith('#### M')) continue;
  const m = sec.match(/^#### M(\d+) ·/m);
  if (!m) continue;
  const jsMatch = sec.match(/```js\n([\s\S]*?)```/);
  if (!jsMatch) continue;
  const textMatch = jsMatch[1].match(/^\s+text:\s*"((?:[^"\\]|\\.)*)"/m);
  if (textMatch) fullTexts[parseInt(m[1])] = textMatch[1];
}

console.log(`MD 提取到 ${Object.keys(fullTexts).length} 个月份的完整 text`);

// ── 2. 逐行解析 content.js，替换 text 字段 ─────────────────
const lines = fs.readFileSync(contentPath, 'utf8').split('\n');

let inWM = false;       // 是否在 DATA.wandererMonths 内
let globalDepth = 0;  // 全局花括号深度
let inMonth = false;    // 是否在某个具体月份的对象内
let monthBrace = 0;    // 当前月份对象内的花括号深度
let currentMonth = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // 进入 DATA.wandererMonths
  if (!inWM && line.includes('DATA.wandererMonths = {')) {
    inWM = true;
    globalDepth = 1;
    continue;
  }
  if (!inWM) continue;

  // 更新全局花括号深度
  const open = (line.match(/\{/g) || []).length;
  const close = (line.match(/\}/g) || []).length;
  globalDepth += open - close;

  // 离开 DATA.wandererMonths
  if (globalDepth === 0) { inWM = false; continue; }

  // 检测月份对象开始：「  N: {」
  if (!inMonth) {
    const mm = line.match(/^\s+(\d+):\s*\{/);
    if (mm) {
      currentMonth = parseInt(mm[1]);
      inMonth = true;
      monthBrace = 1;
      continue;
    }
  }

  if (!inMonth || currentMonth === null) continue;

  // 更新当前月份对象的花括号深度
  monthBrace += (line.match(/\{/g) || []).length;
  monthBrace -= (line.match(/\}/g) || []).length;

  // 检测并替换 text: "..." 行
  const tm = line.match(/^(\s+)text:\s*"/);
  if (tm && fullTexts[currentMonth]) {
    lines[i] = `${tm[1]}text: "${fullTexts[currentMonth]}"`;
    console.log(`  ✓ M${currentMonth} text 已替换`);
    currentMonth = null;
    // 不在这里设 inMonth=false，让月份对象的 } 来触发
    continue;
  }

  // 月份对象结束
  if (monthBrace <= 0) {
    inMonth = false;
    currentMonth = null;
  }
}

fs.writeFileSync(contentPath, lines.join('\n'), 'utf8');
console.log('✅ content.js 同步完成！');
