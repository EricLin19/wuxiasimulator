import re

filepath = r"C:\Users\ericc\Desktop\wuxiasimulator\孤云逐浪_v5.4.md"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 分割每个月份区块（从 #### M 开始到下一个 #### M 或 ---）
# 使用保留分隔符的方式
parts = re.split(r'(?=^#### M\d+ ·)', content, flags=re.MULTILINE)

result = []
for part in parts:
    if not part.strip():
        continue

    # 如果不是月份区块，原样保留
    if not re.match(r'#### M\d+ ·', part):
        result.append(part)
        continue

    # 是月份区块：找到 JS block，替换其中的 text 字段
    # 全文文案 = header 之后、```js 之前的所有文字（去掉 blockquote 标记和分隔线）

    header_match = re.match(r'#### M\d+ · [^\n]+\n\n', part)
    if not header_match:
        result.append(part)
        continue

    header_end = header_match.end()
    js_start = part.find('```js')
    if js_start == -1:
        result.append(part)
        continue

    # 提取全文文案
    raw_text = part[header_end:js_start]
    lines = []
    for ln in raw_text.split('\n'):
        stripped = ln.strip()
        if not stripped or stripped.startswith('---'):
            continue
        # 去掉 blockquote 的 > 前缀
        cleaned = stripped.lstrip('>').strip()
        if cleaned:
            lines.append(cleaned)

    full_text = ''.join(lines)
    # JS 字符串转义
    full_text_escaped = full_text.replace('\\', '\\\\').replace('"', '\\"')

    # 替换 JS block 里的 text 字段
    js_block = part[js_start:]
    # 匹配：缩进 + text: "..." + 逗号 + 换行
    new_js_block = re.sub(
        r'(\n\s+)text:\s*"[^"]*"(\s*,\s*\n)',
        f'\\1text: "{full_text_escaped}"\\2',
        js_block,
        count=1
    )

    new_part = part[:header_end] + new_js_block
    result.append(new_part)

new_content = ''.join(result)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Done! All text fields updated with full narrative text.")
