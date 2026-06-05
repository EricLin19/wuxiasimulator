export const BASIC_STATS = ["hp", "qi", "atk", "def"];
export const EXTRA_STATS = ["combo", "hit", "dodge", "crit", "speed"];
export const STAT_KEYS = [...BASIC_STATS, ...EXTRA_STATS];

export const STAT_LABELS = {
  hp: "血量",
  qi: "内力",
  atk: "攻击",
  def: "防御",
  combo: "连击",
  hit: "命中",
  dodge: "闪避",
  crit: "暴击",
  speed: "出手速度"
};

export const SCHOOLS = {
  blade: { id: "blade", name: "刀法", debuff: "流血", icon: "刀" },
  hidden: { id: "hidden", name: "暗器", debuff: "中毒", icon: "镖" },
  fist: { id: "fist", name: "拳掌", debuff: "内伤", icon: "拳" },
  lightness: { id: "lightness", name: "轻功", debuff: "身法", icon: "靴" }
};

export const RARITIES = {
  blue: { id: "blue", name: "蓝", rank: 1, year: 1, color: "#1e73ad" },
  orange: { id: "orange", name: "橙", rank: 2, year: 2, color: "#d56a12" },
  red: { id: "red", name: "红", rank: 3, year: 3, color: "#b9372e" }
};

function stats(hp, qi, atk, def, combo, hit, dodge, crit, speed) {
  return { hp, qi, atk, def, combo, hit, dodge, crit, speed };
}

function gain(combo, hit, dodge, crit, speed) {
  return { combo, hit, dodge, crit, speed };
}

function skill(id, name, school, rarity, power, qi, cd, train, debuff, debuffStacks, tags, statGain, trait, icon) {
  return { id, name, icon: icon || SCHOOLS[school].icon, school, rarity, power, qi, cd, train, debuff, debuffStacks, tags, statGain, trait, desc: trait.desc, battle: school !== "lightness" };
}

function qinggong(id, name, rarity, train, statGain, trait) {
  return { id, name, icon: SCHOOLS.lightness.icon, school: "lightness", rarity, power: 0, qi: 0, cd: 0, train, debuff: null, debuffStacks: 0, tags: ["passive"], statGain, trait, desc: trait.desc, battle: false };
}

export const DATA = {
  characters: [
    { id: "scholar", name: "林修涯", faction: "潜龙会", icon: "书", desc: "均衡成长，适合先观察秘籍池再定流派。", traitText: "鬼谋神算：开局获得一个计略。", stats: stats(210, 297, 52, 33, 4, 60, 1, 5, 1.4), traits: ["planner"], skills: ["mixedFist"] },
    { id: "swordsman", name: "谢扶风", faction: "听雪楼", icon: "刀", desc: "速度和暴击较高，适合刀法爆发。", traitText: "迅影：出手速度+0.25，闪避+4。", stats: stats(230, 250, 58, 31, 3, 64, 6, 8, 1.75), traits: ["swift"], skills: ["quickSlash"] },
    { id: "boxer", name: "铁山", faction: "铁掌帮", icon: "拳", desc: "血防扎实，适合拳掌连击。", traitText: "铜皮铁骨：血量+80，防御+10。", stats: stats(320, 210, 62, 48, 9, 56, 0, 4, 1.1), traits: ["tough"], skills: ["ironPalm"] },
    { id: "healer", name: "苏青萍", faction: "药王谷", icon: "药", desc: "续航优秀，容错率高。", traitText: "青囊：治疗效果+25%。", stats: stats(240, 310, 46, 36, 4, 58, 3, 4, 1.3), traits: ["healer"], skills: ["springNeedle"] },
    { id: "assassin", name: "燕无声", faction: "暗香阁", icon: "镖", desc: "命中和速度突出，适合暗器毒伤。", traitText: "夜行：暴击+8，毒伤更强。", stats: stats(200, 260, 64, 26, 5, 68, 7, 14, 1.8), traits: ["nightPoison"], skills: ["shadowSting"] }
  ],
  treasures: [
    { id: "goldFeather", name: "黄金羽", icon: "羽", desc: "初始金钱+300，战斗开始攻击+10。", effect: "moneyAtk" },
    { id: "purpleCup", name: "紫金杯", icon: "杯", desc: "每月开始恢复30血量和30内力。", effect: "monthRecover" },
    { id: "moonPearl", name: "万象珠", icon: "珠", desc: "获得计略时，有25%概率额外获得一个蓝色计略。", effect: "strategyLuck" },
    { id: "jadeRing", name: "玲珑环", icon: "环", desc: "最大行动力+20，传武堂秘籍价格-10%。", effect: "moreAp" },
    { id: "darkBag", name: "暗器袋", icon: "袋", desc: "每场战斗开始获得一个飞镖道具。", effect: "battleDart" },
    { id: "herbBottle", name: "青岚瓶", icon: "瓶", desc: "治疗效果+20%，商人价格-5%。", effect: "healPlus" },
    { id: "warDrum", name: "破阵鼓", icon: "鼓", desc: "Boss战开始时攻击+25，防御+10。", effect: "bossPower", locked: true },
    { id: "cloudBoots", name: "云纹靴", icon: "靴", desc: "出手速度+0.15，随机事件闪避收益+1。", effect: "speedBoost", locked: true }
  ],
  skills: {
    mixedFist: skill("mixedFist", "混混拳法", "fist", "blue", 60, 40, 1, 3, "inner", 1, ["combo"], gain(2, 0, 0, 1, 0), { id: "roughChain", name: "乱拳连环", desc: "连击+2，暴击+1。", effects: { combo: 2, crit: 1 } }),
    quickSlash: skill("quickSlash", "迅剑式", "blade", "blue", 55, 45, 1, 3, "bleed", 1, ["crit"], gain(0, 0, 0, 2, 0.03), { id: "quickEdge", name: "快刃", desc: "暴击+2，出手速度+0.03。", effects: { crit: 2, speed: 0.03 } }),
    ironPalm: skill("ironPalm", "铁掌", "fist", "blue", 70, 50, 2, 3, "inner", 1, ["combo"], gain(2, 0, 0, 1, 0), { id: "ironForce", name: "铁劲", desc: "连击+2，暴击+1。", effects: { combo: 2, crit: 1 } }),
    springNeedle: skill("springNeedle", "回春针", "hidden", "blue", 42, 45, 2, 3, "poison", 1, ["surehit", "heal"], gain(0, 2, 0, 0, 0.03), { id: "needleSense", name: "针感", desc: "命中+2，出手速度+0.03。", effects: { hit: 2, speed: 0.03 } }),
    shadowSting: skill("shadowSting", "影刺", "hidden", "blue", 58, 45, 1, 3, "poison", 1, ["surehit"], gain(0, 2, 0, 0, 0.03), { id: "shadowStep", name: "影步", desc: "命中+2，出手速度+0.03。", effects: { hit: 2, speed: 0.03 } }),

    blade_blue_1: skill("blade_blue_1", "五虎断门刀", "blade", "blue", 68, 45, 1, 3, "bleed", 1, ["crit"], gain(0, 0, 0, 3, 0.03), { id: "tigerBite", name: "虎口夺血", desc: "暴击+3，速度+0.03。", effects: { crit: 3, speed: 0.03 } }),
    blade_blue_2: skill("blade_blue_2", "柴刀十八路", "blade", "blue", 62, 38, 1, 3, "bleed", 1, ["crit"], gain(0, 1, 0, 2, 0.04), { id: "woodcutter", name: "劈柴入骨", desc: "命中+1，暴击+2，速度+0.04。", effects: { hit: 1, crit: 2, speed: 0.04 } }),
    blade_blue_3: skill("blade_blue_3", "狂风快刀", "blade", "blue", 55, 50, 1, 3, "bleed", 1, ["crit", "speed"], gain(0, 0, 1, 2, 0.06), { id: "windBlade", name: "风中递刃", desc: "闪避+1，暴击+2，速度+0.06。", effects: { dodge: 1, crit: 2, speed: 0.06 } }),
    blade_blue_4: skill("blade_blue_4", "雁行刀", "blade", "blue", 72, 55, 2, 3, "bleed", 2, ["crit"], gain(0, 1, 0, 3, 0.02), { id: "gooseLine", name: "雁阵切喉", desc: "命中+1，暴击+3，速度+0.02。", effects: { hit: 1, crit: 3, speed: 0.02 } }),
    blade_orange_1: skill("blade_orange_1", "燃木刀法", "blade", "orange", 118, 85, 2, 4, "bleed", 2, ["crit"], gain(0, 1, 0, 5, 0.05), { id: "burningEdge", name: "烈焰刀意", desc: "暴击+5，速度+0.05。", effects: { hit: 1, crit: 5, speed: 0.05 } }),
    blade_orange_2: skill("blade_orange_2", "血战十式", "blade", "orange", 105, 75, 2, 4, "bleed", 3, ["crit"], gain(0, 0, 1, 5, 0.04), { id: "bloodBattle", name: "浴血追斩", desc: "暴击+5，闪避+1，速度+0.04。", effects: { dodge: 1, crit: 5, speed: 0.04 } }),
    blade_red_1: skill("blade_red_1", "傲寒六诀", "blade", "red", 180, 135, 3, 5, "bleed", 4, ["crit"], gain(0, 2, 1, 9, 0.08), { id: "proudCold", name: "寒刃封喉", desc: "暴击+9，命中+2，速度+0.08，暴击倍率提高。", effects: { hit: 2, dodge: 1, crit: 9, speed: 0.08, critPower: 0.25 } }),

    hidden_blue_1: skill("hidden_blue_1", "含沙射影", "hidden", "blue", 52, 35, 1, 3, "poison", 1, ["surehit"], gain(0, 3, 0, 0, 0.03), { id: "sandShadow", name: "沙影入目", desc: "命中+3，速度+0.03。", effects: { hit: 3, speed: 0.03 } }),
    hidden_blue_2: skill("hidden_blue_2", "飞蝗石", "hidden", "blue", 60, 40, 1, 3, "poison", 1, ["surehit"], gain(0, 3, 0, 1, 0.02), { id: "locustRain", name: "飞蝗连珠", desc: "命中+3，暴击+1。", effects: { hit: 3, crit: 1, speed: 0.02 } }),
    hidden_blue_3: skill("hidden_blue_3", "袖里针", "hidden", "blue", 45, 42, 1, 3, "poison", 2, ["surehit"], gain(0, 2, 1, 0, 0.03), { id: "sleeveNeedle", name: "袖底藏锋", desc: "命中+2，闪避+1，速度+0.03。", effects: { hit: 2, dodge: 1, speed: 0.03 } }),
    hidden_blue_4: skill("hidden_blue_4", "金钱镖", "hidden", "blue", 72, 58, 2, 3, "poison", 1, ["surehit"], gain(0, 4, 0, 0, 0.02), { id: "coinDart", name: "听钱辨位", desc: "命中+4，速度+0.02。", effects: { hit: 4, speed: 0.02 } }),
    hidden_orange_1: skill("hidden_orange_1", "冰魄银针", "hidden", "orange", 95, 80, 2, 4, "poison", 3, ["surehit"], gain(0, 6, 1, 0, 0.04), { id: "icePoison", name: "寒毒入脉", desc: "命中+6，闪避+1，速度+0.04。", effects: { hit: 6, dodge: 1, speed: 0.04 } }),
    hidden_orange_2: skill("hidden_orange_2", "生死符", "hidden", "orange", 88, 90, 2, 4, "poison", 4, ["surehit"], gain(0, 5, 0, 1, 0.06), { id: "lifeTalisman", name: "符入骨髓", desc: "命中+5，暴击+1，速度+0.06。", effects: { hit: 5, crit: 1, speed: 0.06 } }),
    hidden_red_1: skill("hidden_red_1", "孔雀翎", "hidden", "red", 155, 130, 3, 5, "poison", 5, ["surehit"], gain(0, 10, 2, 2, 0.08), { id: "peacockPlume", name: "万羽齐发", desc: "命中+10，闪避+2，速度+0.08，中毒更深。", effects: { hit: 10, dodge: 2, crit: 2, speed: 0.08, poisonBonus: 1 } }),

    fist_blue_1: skill("fist_blue_1", "化骨绵掌", "fist", "blue", 62, 45, 1, 3, "inner", 1, ["combo"], gain(4, 0, 0, 1, 0), { id: "softBone", name: "连绵不绝", desc: "连击+4，暴击+1。", effects: { combo: 4, crit: 1 } }),
    fist_blue_2: skill("fist_blue_2", "摧心掌", "fist", "blue", 70, 55, 2, 3, "inner", 2, ["combo"], gain(3, 0, 0, 2, 0), { id: "heartBreak", name: "摧心暗劲", desc: "连击+3，暴击+2。", effects: { combo: 3, crit: 2 } }),
    fist_blue_3: skill("fist_blue_3", "太祖长拳", "fist", "blue", 58, 35, 1, 3, "inner", 1, ["combo"], gain(5, 1, 0, 0, 0), { id: "founderFist", name: "拳路绵密", desc: "连击+5，命中+1。", effects: { combo: 5, hit: 1 } }),
    fist_blue_4: skill("fist_blue_4", "劈空掌", "fist", "blue", 75, 60, 2, 3, "inner", 1, ["combo"], gain(3, 1, 0, 1, 0), { id: "airPalm", name: "隔空透劲", desc: "连击+3，命中+1，暴击+1。", effects: { combo: 3, hit: 1, crit: 1 } }),
    fist_orange_1: skill("fist_orange_1", "大力金刚掌", "fist", "orange", 120, 90, 2, 4, "inner", 2, ["combo"], gain(6, 1, 0, 3, 0), { id: "vajraPalm", name: "金刚伏魔", desc: "连击+6，暴击+3。", effects: { combo: 6, hit: 1, crit: 3 } }),
    fist_orange_2: skill("fist_orange_2", "黯然销魂掌", "fist", "orange", 105, 85, 2, 4, "inner", 3, ["combo"], gain(7, 0, 1, 2, 0), { id: "sadPalm", name: "情至无声", desc: "连击+7，闪避+1，暴击+2。", effects: { combo: 7, dodge: 1, crit: 2 } }),
    fist_red_1: skill("fist_red_1", "降龙十八掌", "fist", "red", 190, 145, 3, 5, "inner", 4, ["combo"], gain(9, 2, 0, 5, 0), { id: "dragonPalm", name: "龙吟九霄", desc: "连击+9，暴击+5，暴击倍率提高。", effects: { combo: 9, hit: 2, crit: 5, critPower: 0.35 } }),

    light_blue_1: qinggong("light_blue_1", "草上飞", "blue", 3, gain(0, 0, 3, 0, 0.08), { id: "grassStep", name: "踏草无痕", desc: "闪避+3，出手速度+0.08。", effects: { dodge: 3, speed: 0.08 } }),
    light_blue_2: qinggong("light_blue_2", "燕子三抄水", "blue", 3, gain(0, 0, 4, 0, 0.06), { id: "swallowStep", name: "燕影回环", desc: "闪避+4，出手速度+0.06。", effects: { dodge: 4, speed: 0.06 } }),
    light_blue_3: qinggong("light_blue_3", "八步赶蝉", "blue", 3, gain(0, 1, 2, 0, 0.08), { id: "eightSteps", name: "步步抢先", desc: "命中+1，闪避+2，出手速度+0.08。", effects: { hit: 1, dodge: 2, speed: 0.08 } }),
    light_blue_4: qinggong("light_blue_4", "壁虎游墙功", "blue", 3, gain(0, 0, 5, 0, 0.03), { id: "wallWalk", name: "贴壁游身", desc: "闪避+5，出手速度+0.03。", effects: { dodge: 5, speed: 0.03 } }),
    light_orange_1: qinggong("light_orange_1", "神行百变", "orange", 4, gain(0, 1, 7, 0, 0.12), { id: "manySteps", name: "百变身法", desc: "命中+1，闪避+7，出手速度+0.12。", effects: { hit: 1, dodge: 7, speed: 0.12 } }),
    light_orange_2: qinggong("light_orange_2", "梯云纵", "orange", 4, gain(0, 0, 8, 0, 0.1), { id: "cloudLadder", name: "凌虚踏云", desc: "闪避+8，出手速度+0.10。", effects: { dodge: 8, speed: 0.1 } }),
    light_red_1: qinggong("light_red_1", "凌波微步", "red", 5, gain(0, 2, 12, 0, 0.18), { id: "lingbo", name: "步生波纹", desc: "命中+2，闪避+12，出手速度+0.18。", effects: { hit: 2, dodge: 12, speed: 0.18 } })
  },
  strategies: [],
  traits: [
    { id: "planner", name: "鬼谋", desc: "开局擅长计略，升级奖励更稳定。" },
    { id: "swift", name: "迅影", desc: "出手速度+0.25，闪避+4。" },
    { id: "tough", name: "铜皮铁骨", desc: "血量+80，防御+10。" },
    { id: "healer", name: "青囊", desc: "治疗效果+25%。" },
    { id: "nightPoison", name: "夜行", desc: "暴击+8，中毒层数更高。" },
    { id: "critUp", name: "战意", desc: "暴击+2。" },
    { id: "breath", name: "龟息", desc: "调息额外恢复80血量和内力。" },
    { id: "force", name: "刚力", desc: "伤害增加2%。" },
    { id: "clearMind", name: "明心", desc: "每月开始额外获得10行动力。" },
    { id: "merchantFriend", name: "奇智", desc: "商人价格降低15%。" },
    { id: "hardBone", name: "硬骨", desc: "最大血量+60。" },
    { id: "innerRoot", name: "内息深长", desc: "最大内力+80。" }
  ],
  items: {
    pill: { id: "pill", name: "金疮药", icon: "药", type: "heal", price: 90, desc: "恢复120血量。", hp: 120 },
    qiWine: { id: "qiWine", name: "回气酒", icon: "酒", type: "qi", price: 80, desc: "恢复120内力。", qi: 120 },
    statPill: { id: "statPill", name: "小还丹", icon: "丹", type: "stat", price: 150, desc: "永久攻击+3，防御+2，命中+1。", atk: 3, def: 2, hit: 1 }
  },
  weapons: {
    blade_w_blue: { id: "blade_w_blue", name: "雁翎刀", icon: "刀", school: "blade", rarity: "blue", price: 260, desc: "刀法伤害+8%，流血+1层。", atk: 8, debuffBonus: 1, damagePct: 8 },
    blade_w_orange: { id: "blade_w_orange", name: "屠狼刀", icon: "刀", school: "blade", rarity: "orange", price: 520, desc: "刀法伤害+16%，流血+2层。", atk: 18, debuffBonus: 2, damagePct: 16 },
    blade_w_red: { id: "blade_w_red", name: "饮血狂刀", icon: "刀", school: "blade", rarity: "red", price: 980, desc: "刀法伤害+28%，流血+3层。", atk: 35, debuffBonus: 3, damagePct: 28 },
    hidden_w_blue: { id: "hidden_w_blue", name: "飞星镖囊", icon: "镖", school: "hidden", rarity: "blue", price: 260, desc: "暗器伤害+8%，中毒+1层。", atk: 6, debuffBonus: 1, damagePct: 8 },
    hidden_w_orange: { id: "hidden_w_orange", name: "冰魄针匣", icon: "镖", school: "hidden", rarity: "orange", price: 520, desc: "暗器伤害+16%，中毒+2层。", atk: 14, debuffBonus: 2, damagePct: 16 },
    hidden_w_red: { id: "hidden_w_red", name: "孔雀机括", icon: "镖", school: "hidden", rarity: "red", price: 980, desc: "暗器伤害+28%，中毒+3层。", atk: 28, debuffBonus: 3, damagePct: 28 },
    fist_w_blue: { id: "fist_w_blue", name: "玄铁护腕", icon: "腕", school: "fist", rarity: "blue", price: 260, desc: "拳掌伤害+8%，内伤+1层。", atk: 8, debuffBonus: 1, damagePct: 8 },
    fist_w_orange: { id: "fist_w_orange", name: "金刚臂甲", icon: "腕", school: "fist", rarity: "orange", price: 520, desc: "拳掌伤害+16%，内伤+2层。", atk: 18, debuffBonus: 2, damagePct: 16 },
    fist_w_red: { id: "fist_w_red", name: "龙纹拳套", icon: "拳", school: "fist", rarity: "red", price: 980, desc: "拳掌伤害+28%，内伤+3层。", atk: 35, debuffBonus: 3, damagePct: 28 }
  },
  enemies: [
    { id: "rogue", name: "二流高手", icon: "贼", hp: 260, qi: 120, atk: 46, def: 22, combo: 2, hit: 55, dodge: 2, crit: 5, speed: 1.25, rank: 1 },
    { id: "blade", name: "快刀手", icon: "刀", hp: 330, qi: 180, atk: 62, def: 30, combo: 3, hit: 65, dodge: 3, crit: 8, speed: 1.55, rank: 2 },
    { id: "witch", name: "毒娘子", icon: "毒", hp: 390, qi: 260, atk: 58, def: 32, combo: 4, hit: 66, dodge: 5, crit: 9, speed: 1.45, rank: 3 },
    { id: "demon", name: "心魔", icon: "魔", hp: 560, qi: 300, atk: 82, def: 42, combo: 6, hit: 66, dodge: 4, crit: 12, speed: 1.4, rank: 4 }
  ],
  bosses: [
    { id: "boss_y1", name: "青竹寨主", icon: "刀", year: 1, hp: 560, qi: 260, atk: 78, def: 42, combo: 4, hit: 68, dodge: 4, crit: 10, speed: 1.35, boss: true },
    { id: "boss_y2", name: "黑风堂主", icon: "魔", year: 2, hp: 820, qi: 360, atk: 98, def: 55, combo: 5, hit: 72, dodge: 5, crit: 12, speed: 1.45, boss: true },
    { id: "finalBoss", name: "颍川五虎门主", icon: "魔", year: 3, hp: 1120, qi: 480, atk: 122, def: 68, combo: 7, hit: 78, dodge: 7, crit: 16, speed: 1.58, boss: true }
  ]
};

DATA.manuals = Object.keys(DATA.skills).filter(id => !["mixedFist", "quickSlash", "ironPalm", "springNeedle", "shadowSting"].includes(id));

DATA.strategies = [
  ...makeStrategies("blade", ["血引", "追创", "刀势", "伤口撕裂", "血路", "斩脉", "饮血归元"]),
  ...makeStrategies("hidden", ["淬毒", "封喉", "暗劲", "毒入经脉", "百步穿杨", "腐骨散", "万毒归宗"]),
  ...makeStrategies("fist", ["震脉", "透劲", "连环", "暗劲伤腑", "刚柔并济", "寸劲", "龙吟九霄"]),
  ...makeStrategies("lightness", ["抢步", "腾挪", "借风", "移形换影", "踏雪无痕", "流云身法", "凌波化境"])
];

function makeStrategies(school, names) {
  const rarities = ["blue", "blue", "blue", "blue", "orange", "orange", "red"];
  return names.map((name, index) => {
    const rarity = rarities[index];
    const rank = RARITIES[rarity].rank;
    const effects = school === "blade"
      ? { bleedBonus: rank, crit: rank * 2 }
      : school === "hidden"
        ? { poisonBonus: rank, hit: rank * 3 }
        : school === "fist"
          ? { innerBonus: rank, combo: rank * 3 }
          : { dodge: rank * 3, speed: Number((rank * 0.04).toFixed(2)) };
    return {
      id: `${school}_strat_${index + 1}`,
      name,
      school,
      rarity,
      effects,
      desc: `${SCHOOLS[school].name}计略，强化${SCHOOLS[school].debuff}与本流派节奏。`,
      effectsText: describeEffects(effects)
    };
  });
}

function describeEffects(effects) {
  return Object.entries(effects).map(([key, value]) => {
    const map = { bleedBonus: "流血层数", poisonBonus: "中毒层数", innerBonus: "内伤层数", crit: "暴击", hit: "命中", combo: "连击", dodge: "闪避", speed: "出手速度" };
    return `${map[key] || key}+${value}`;
  }).join("，");
}

export const META_DEFAULT = {
  runs: 0,
  wins: 0,
  bestYear: 1,
  bestMonth: 1,
  metaPoints: 0,
  allocations: { hp: 0, qi: 0, atk: 0, def: 0, combo: 0, hit: 0, dodge: 0, crit: 0, speed: 0 },
  unlockedTreasures: ["goldFeather", "purpleCup", "moonPearl", "jadeRing", "darkBag", "herbBottle"],
  endlessUnlocked: false
};
