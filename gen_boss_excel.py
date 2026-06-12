"""生成孤云支线18Boss数值Excel — 含精确特性数值"""
import openpyxl
from openpyxl.styles import Font, Alignment, Border, Side, PatternFill
from openpyxl.utils import get_column_letter

wb = openpyxl.Workbook()
ws = wb.active
ws.title = "孤云支线18Boss"

# === 样式 ===
header_font = Font(name="微软雅黑", size=11, bold=True, color="FFFFFF")
header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
boss_fill = PatternFill(start_color="FFF2CC", end_color="FFF2CC", fill_type="solid")
normal_fill = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid")
thin_border = Border(
    left=Side(style="thin"), right=Side(style="thin"),
    top=Side(style="thin"), bottom=Side(style="thin")
)
center_align = Alignment(horizontal="center", vertical="center", wrap_text=True)
left_align = Alignment(horizontal="left", vertical="center", wrap_text=True)

# === 数据 (精确数值取自 battleSystem.js 源码) ===
bosses = [
    # (月份, 名称, 图标, HP, QI, ATK, DEF, COMBO, HIT, DODGE, CRIT, SPEED, rank, 有特性?, 特性代码, 精确特性数值)
    ("M2", "堂口捕头·刘铁", "捕", 500, 180, 40, 16, 3, 65, 5, 6, 1.15, 1, False, "", "—"),
    ("M4", "缉捕队长·钱虎", "缉", 750, 240, 55, 22, 3, 68, 5, 7, 1.20, 1, False, "", "—"),
    ("M6", "铁手·周通", "拳", 1000, 320, 70, 28, 5, 70, 6, 10, 1.25, 2, True, "armorBreak", "玩家防御仅55%生效；每次命中玩家DEF-2\n（紫霄清心诀可减为DEF-1）"),
    ("M8", "先锋营统领·马如龙", "将", 1500, 420, 85, 34, 4, 72, 7, 9, 1.30, 2, False, "", "—"),
    ("M10", "护法副将·杨震", "将", 2000, 520, 100, 40, 4, 75, 8, 10, 1.35, 3, True, "miniArmor", "开场护体盾 = 20% HP\n（吸收 400 伤害）"),
    ("M12", "杭州堂主·赵崇岳", "刀", 4000, 1200, 120, 48, 5, 80, 10, 14, 1.50, 5, True, "lowHpBerserk", "≤30% HP 触发：ATK×1.30，SPEED+0.08\n→ ATK 120→156，SPEED 1.50→1.58"),
    ("M14", "沈千山帐前哨长·杜威", "哨", 2500, 600, 110, 44, 4, 74, 9, 10, 1.40, 3, False, "", "—"),
    ("M16", "寒剑·柳长卿", "剑", 3000, 750, 125, 50, 5, 76, 14, 14, 1.50, 3, True, "miniFrost", "每回合玩家寒气+1\n（自带高闪避14；有紫霄清心诀时寒气上限降低）"),
    ("M18", "夜袭队长·秦烈", "袭", 3500, 780, 140, 56, 5, 78, 10, 12, 1.48, 4, False, "", "—"),
    ("M20", "「血手」崔命", "血", 4000, 850, 155, 62, 4, 80, 12, 14, 1.52, 4, True, "miniBleed", "每回合玩家流血+2（上限10）\n流血每回合扣HP=流血层数"),
    ("M22", "无影·叶孤", "影", 4500, 1000, 170, 68, 7, 88, 30, 18, 1.80, 4, True, "highDodge", "基础DODGE=30（极高）\n≤50% HP 触发「影步」：DODGE+5 → 35"),
    ("M24", "左护法·沈千山", "戟", 8000, 2400, 200, 80, 6, 88, 14, 18, 1.65, 7, True, "berserkSummon", "阶段1 ≤70%HP：ATK×1.15→230，SPEED+0.05→1.70\n阶段2 ≤30%HP：ATK×1.20→240，DEF×1.15→92"),
    ("M26", "狂刀·钱彪", "刀", 5000, 1100, 185, 74, 5, 82, 10, 14, 1.60, 5, True, "lowHpBerserk", "≤30% HP 触发：ATK×1.30→240，SPEED+0.08→1.68"),
    ("M28", "精英卫队长·卫岳", "卫", 5500, 1200, 200, 80, 5, 84, 10, 15, 1.65, 5, False, "", "—"),
    ("M30", "烽火统领·霍烽", "烽", 6000, 1400, 215, 86, 5, 85, 9, 16, 1.70, 6, True, "armorBreak", "玩家防御仅55%生效；每次命中玩家DEF-2\n（紫霄清心诀可减为DEF-1）"),
    ("M32", "右护法·公孙烈", "枪", 6500, 1600, 230, 92, 6, 85, 10, 16, 1.75, 6, True, "armorBreak", "玩家防御仅55%生效；每次命中玩家DEF-2\n（紫霄清心诀可减为DEF-1）"),
    ("M34", "地牢典狱长·阎铁", "狱", 7000, 1800, 245, 98, 4, 88, 12, 14, 1.80, 6, True, "pointStrike", "每次命中30%概率打穴：\n额外伤害=ATK×0.3=73.5，玩家SPEED-0.25（最低0.5）"),
    ("M36", "武盟统领·楚宗玄", "魔", 15000, 4000, 280, 112, 8, 95, 20, 24, 2.00, 10, True, "shieldPurityBerserk", "开场：护体盾=25%HP=3750\n≤50%HP：净化全部负面+回血20%=3000\n≤15%HP：ATK×2=560，DEF=0（燃命一击）"),
]

# === 列定义 ===
headers = ["月份", "名称", "图标", "rank", "HP", "QI", "ATK", "DEF", "COMBO", "HIT", "DODGE", "CRIT", "SPEED", "Boss特性代码", "精确特性数值（源码实现）"]
col_widths = [6, 24, 5, 6, 8, 8, 8, 8, 8, 8, 8, 8, 8, 18, 52]

# === 写入 ===
ws.merge_cells("A1:O1")
title_cell = ws["A1"]
title_cell.value = "孤云逐浪 · 孤云支线18Boss九维与特性总表（含精确数值）"
title_cell.font = Font(name="微软雅黑", size=16, bold=True, color="1F3864")
title_cell.alignment = Alignment(horizontal="center", vertical="center")
ws.row_dimensions[1].height = 36

for col_idx, h in enumerate(headers, 1):
    cell = ws.cell(row=2, column=col_idx, value=h)
    cell.font = header_font
    cell.fill = header_fill
    cell.alignment = center_align
    cell.border = thin_border
ws.row_dimensions[2].height = 24

for row_idx, b in enumerate(bosses, 3):
    is_boss = b[11]
    values = [
        b[0],  b[1],  b[2],  b[11], b[3], b[4], b[5], b[6],
        b[7],  b[8],  b[9],  b[10], b[12], b[13] if is_boss else "—", b[14],
    ]
    fill = boss_fill if is_boss else normal_fill
    h = 42 if is_boss and b[13] in ("shieldPurityBerserk", "berserkSummon", "pointStrike") else (34 if is_boss else 22)
    for col_idx, v in enumerate(values, 1):
        cell = ws.cell(row=row_idx, column=col_idx, value=v)
        cell.font = Font(name="微软雅黑", size=10)
        cell.fill = fill
        cell.border = thin_border
        if col_idx in (1, 3, 4):
            cell.alignment = center_align
        elif col_idx in (2, 14, 15):
            cell.alignment = left_align
        else:
            cell.alignment = center_align
    ws.row_dimensions[row_idx].height = h

for i, w in enumerate(col_widths, 1):
    ws.column_dimensions[get_column_letter(i)].width = w

# === 特性代码对照 Sheet ===
ws2 = wb.create_sheet("特性代码对照")
trait_data = [
    ("armorBreak", "M6·M30·M32", "玩家DEF仅剩55%；每次命中玩家DEF-2（紫霄清心诀-1）"),
    ("miniArmor", "M10", "开场护体盾 = 20% HP"),
    ("lowHpBerserk", "M12·M26", "≤30% HP：ATK×1.3，SPEED+0.08"),
    ("miniFrost", "M16", "每回合玩家寒气+1（每层寒气减速、增耗内）"),
    ("miniBleed", "M20", "每回合玩家流血+2（上限10；流血每回合扣HP=层数）"),
    ("highDodge", "M22", "基础DODGE=30（极高）；≤50%HP：DODGE+5→35"),
    ("berserkSummon", "M24", "≤70%HP：ATK×1.15,SPEED+0.05；≤30%HP：ATK×1.2,DEF×1.15"),
    ("pointStrike", "M34", "命中30%打穴：额外伤害=ATK×30%, 玩家SPEED-0.25(≥0.5)"),
    ("shieldPurityBerserk", "M36", "开场护体25%HP；≤50%HP净化+回血20%；≤15%HP ATK×2,DEF=0"),
]
ws2.merge_cells("A1:C1")
ws2["A1"].value = "Boss特性代码对照表（精确数值）"
ws2["A1"].font = Font(name="微软雅黑", size=14, bold=True, color="1F3864")
ws2["A1"].alignment = Alignment(horizontal="center")
ws2.row_dimensions[1].height = 30

for ci, h in enumerate(["特性代码", "出现Boss", "精确数值效果"], 1):
    cell = ws2.cell(row=2, column=ci, value=h)
    cell.font = header_font
    cell.fill = PatternFill(start_color="548235", end_color="548235", fill_type="solid")
    cell.alignment = center_align
    cell.border = thin_border

for ri, (code, bosses_str, desc) in enumerate(trait_data, 3):
    for ci, v in enumerate([code, bosses_str, desc], 1):
        cell = ws2.cell(row=ri, column=ci, value=v)
        cell.font = Font(name="微软雅黑", size=10)
        cell.border = thin_border
        cell.alignment = left_align
    ws2.row_dimensions[ri].height = 28

ws2.column_dimensions["A"].width = 22
ws2.column_dimensions["B"].width = 18
ws2.column_dimensions["C"].width = 56

# === 九维说明 Sheet ===
ws3 = wb.create_sheet("九维说明")
ws3.merge_cells("A1:B1")
ws3["A1"].value = "九维属性说明"
ws3["A1"].font = Font(name="微软雅黑", size=14, bold=True, color="1F3864")
ws3["A1"].alignment = Alignment(horizontal="center")
ws3.row_dimensions[1].height = 28

stats_info = [
    ("HP", "生命值 — 归零即战败"),
    ("QI", "内力值 — 释放技能消耗"),
    ("ATK", "攻击力 — 基础伤害"),
    ("DEF", "防御力 — 减免伤害"),
    ("COMBO", "连击数 — 每回合攻击次数上限"),
    ("HIT", "命中 — 决定攻击是否命中"),
    ("DODGE", "闪避 — 决定能否闪避攻击"),
    ("CRIT", "暴击率 — 触发暴击的概率"),
    ("SPEED", "速度 — 决定出手顺序（倍率，基准1.0）"),
    ("rank", "位阶 — 1~10，影响掉落品质和难度"),
]
for ri, (k, v) in enumerate(stats_info, 2):
    ws3.cell(row=ri, column=1, value=k).font = Font(name="微软雅黑", size=10, bold=True)
    ws3.cell(row=ri, column=2, value=v).font = Font(name="微软雅黑", size=10)
    ws3.cell(row=ri, column=1).alignment = center_align
    ws3.cell(row=ri, column=2).alignment = left_align
    for ci in (1, 2):
        ws3.cell(row=ri, column=ci).border = thin_border

ws3.column_dimensions["A"].width = 12
ws3.column_dimensions["B"].width = 36

# 冻结
ws.freeze_panes = "A3"

out_path = "C:/Users/Administrator.DESKTOP-O2PR2VT/WorkBuddy/2026-06-09-10-29-33/孤云支线18Boss数值表.xlsx"
wb.save(out_path)
print(f"OK: {out_path}")
