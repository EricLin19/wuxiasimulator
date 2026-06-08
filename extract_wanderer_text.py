import re

with open(r"C:\Users\ericc\Desktop\wuxiasimulator\孤云逐浪_v5.4.md", "r", encoding="utf-8") as f:
    content = f.read()

# 分割每个月份的完整文案
# 模式：#### Mx · 标题  之后，```js 之前的文字
# 然后替换对应 JS block 里的 text 字段

months = re.split(r'(?=#### M\d+ ·)', content)

result = content

# 手动整理每个月完整文案 -> 对应 JS text 字段的映射
# 文案在 #### 和 ```js 之间，去掉多余空行和引号转义

month_data = {}

pattern = r'#### (M\d+ · [^\n]+)\n\n([\s\S]*?)```js'
matches = re.findall(pattern, content)

for m in matches:
    key = m[0].split(' · ')[0]  # "M1"
    raw_text = m[1].strip()
    # 去掉每行开头的 > 或空格，合并成一段
    lines = [l.strip() for l in raw_text.split('\n') if l.strip() and not l.strip().startswith('---')]
    full_text = ''.join(lines)
    month_data[key] = full_text

print("找到月份：", list(month_data.keys()))

# 现在替换每个 JS block 里的 text 字段
# text: "..." -> text: "完整文案"
for mk, full_text in month_data.items():
    # 转义 JS 字符串中的引号
    escaped = full_text.replace('\\', '\\\\').replace('"', '\\"')
    # 找到对应月份的 JS block 并替换 text 字段
    # 使用更精准的正则：匹配 month: N, title: "...", \n  text: "..."
    pass

# 改用直接字符串替换方式，手动构造新的 text 字段
# 先输出每个月完整文案，供后续手动/半自动替换
for mk in sorted(month_data.keys(), key=lambda x: int(x[1:])):
    print(f"\n=== {mk} ===")
    print(repr(month_data[mk][:100]))
