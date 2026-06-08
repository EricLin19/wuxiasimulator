// sync_wanderer.js
// 从孤云逐浪_v5.4.md 提取完整 text，同步到 content.js 的 DATA.wandererMonths

const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '孤云逐浪_v5.4.md');
const contentPath = path.join(__dirname, 'src', 'data', 'content.js');

// ── 第一步：从 MD 文件提取每个月的完整 text ──────────
const md = fs.readFileSync(mdPath, 'utf8');
const fullTexts = {};

// 分割每个月份区块
const sections = md.split(/(?=^#### M\d+ ·)/m);

for (const sec of sections) {
  if (!sec.trim()) continue;
  const m = sec.match(/^#### M(\d+) ·/m);
  if (!m) continue;
  const monthNum = parseInt(m[1]);

  // 找 JS block
  const jsMatch = sec.match(/```js\n([\s\S]*?)```/);
  if (!jsMatch) continue;

  // 提取 text: "..."  — 支持 \" 转义
  const textMatch = jsMatch[1].match(/^\s+text:\s*"((?:[^"\\]|\\.)*)"/m);
  if (textMatch) {
    fullTexts[monthNum] = textMatch[1];
  }
}

console.log(`从 MD 提取到 ${Object.keys(fullTexts).length} 个月的完整 text`);

// ── 第二步：用 eval 解析 content.js 中的 DATA.wandererMonths ──
let content = fs.readFileSync(contentPath, 'utf8');

// 找到 DATA.wandererMonths = { 的起始和结束位置
const startIdx = content.indexOf('DATA.wandererMonths = {');
if (startIdx === -1) { console.error('找不到 DATA.wandererMonths'); process.exit(1); }

// 找匹配的结束大括号（处理嵌套）
let brace = 0;
let endIdx = -1;
let inStr = false;
let esc = false;
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
if (endIdx === -1) { console.error('找不到 DATA.wandererMonths 结束位置'); process.exit(1); }

console.log(`DATA.wandererMonths 范围：${startIdx} ~ ${endIdx}`);

// 用 eval 解析这段 JS 对象字面量
const DATA = {};
const objLiteral = content.substring(startIdx, endIdx);
eval(objLiteral);

console.log(`解析得到 ${Object.keys(DATA.wandererMonths).length} 个月份数据`);

// ── 第三步：替换 text 字段 ──────────────────────────────────
for (const [num, txt] of Object.entries(fullTexts)) {
  if (DATA.wandererMonths[num]) {
    DATA.wandererMonths[num].text = txt;
    console.log(`  ✓ M${num} text 已更新`);
  }
}

// ── 第四步：把更新后的对象生成回 JS 代码 ──────────────────
// 按原格式手写生成（保持缩进风格）
function objToJs(obj, indent = 0) {
  const pad = ' '.repeat(indent);
  const pad1 = ' '.repeat(indent + 2);
  let lines = [];
  for (const [k, v] of Object.entries(obj)) {
    const val = typeof v === 'string'
      ? `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
      : Array.isArray(v)
        ? arrToJs(v, indent + 2)
        : typeof v === 'object' && v !== null
          ? `{\n${objToJs(v, indent + 2)}\n${pad}}`
          : String(v);
    lines.push(`${pad1}${k}: ${val}`);
  }
  return lines.join(',\n');
}

function arrToJs(arr, indent) {
  const pad = ' '.repeat(indent);
  const pad1 = ' '.repeat(indent + 2);
  let lines = arr.map(item => {
    if (typeof item === 'string') return `${pad1}"${item.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    if (typeof item === 'object' && item !== null) return `${pad1}{\n${objToJs(item, indent + 2)}\n${pad1}}`;
    return `${pad1}${item}`;
  });
  return `[\n${lines.join(',\n')}\n${pad}]`;
}

// 生成完整的新 DATA.wandererMonths 字符串
let newObjStr = 'DATA.wandererMonths = {\n';
for (const [k, v] of Object.entries(DATA.wandererMonths)) {
  newObjStr += `  ${k}: {\n${objToJs(v, 2)}\n  },\n`;
}
newObjStr += '}';

// 替换回 content
const newContent = content.substring(0, startIdx) + newObjStr + content.substring(endIdx);

fs.writeFileSync(contentPath, newContent, 'utf8');
console.log('✅ content.js 同步完成！');
