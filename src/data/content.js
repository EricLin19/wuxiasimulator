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
  lightness: { id: "lightness", name: "腿法", debuff: "身法", icon: "腿" }
};

export const STYLE_LABELS = {
  combo: "连击",
  critPalm: "暴击",
  qiBreak: "断脉",
  bleed: "流血",
  frost: "寒冰",
  hamstring: "断筋",
  gu: "下蛊",
  poison: "淬毒",
  coin: "金钱",
  evasive: "高闪避",
  lowKick: "下盘",
  steal: "偷盗"
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
  const power = rarity === "red" ? 170 : rarity === "orange" ? 110 : 62;
  const qi = rarity === "red" ? 125 : rarity === "orange" ? 78 : 42;
  const cd = rarity === "red" ? 3 : rarity === "orange" ? 2 : 1;
  return { id, name, icon: SCHOOLS.lightness.icon, school: "lightness", rarity, power, qi, cd, train, debuff: null, debuffStacks: 0, tags: ["leg"], statGain, trait, desc: trait.desc, battle: true };
}

export const DATA = {
  characters: [
    { id: "wanderer", name: "沈孤云", faction: "江湖浪客", icon: "浪", portrait: "wanderer", desc: "走南闯北的散人，出手灵活，适合尝试各类构筑。", traitText: "浪游：战斗开始出手速度+0.12，胜利金钱+8%。", stats: stats(250, 275, 56, 34, 6, 62, 4, 7, 1.45), traits: ["wanderer"], skills: ["mixedFist"] },
    { id: "constable", name: "陆惊尘", faction: "镇抚司", icon: "鹰", portrait: "constable", desc: "朝廷鹰犬，命中高、压制强，适合稳扎稳打。", traitText: "缉凶：命中+6，击败敌人额外获得经验。", stats: stats(270, 250, 60, 38, 4, 70, 2, 6, 1.35), traits: ["constable"], skills: ["quickSlash"] },
    { id: "orthodox", name: "顾明昭", faction: "天衡剑派", icon: "正", portrait: "orthodox", desc: "名门正派弟子，根基厚实，成长稳定。", traitText: "正脉：最大血量+50，最大内力+40，修炼经验+8%。", stats: stats(300, 300, 54, 42, 5, 60, 3, 5, 1.25), traits: ["orthodox"], skills: ["fist_blue_1"] }
  ],
  treasures: [
    { id: "inkTally", name: "青玉功牌", icon: "牌", desc: "所有经验获取+12%。", effect: "expBoost" },
    { id: "goldAbacus", name: "金错算盘", icon: "算", desc: "所有金钱获取+18%。", effect: "moneyBoost" },
    { id: "springGourd", name: "回春葫芦", icon: "葫", desc: "每月开始恢复45血量和45内力。", effect: "monthRecover" },
    { id: "dragonSeal", name: "龙纹令", icon: "令", desc: "通关后解锁。战斗开始攻击+18，命中+8，暴击+5。", effect: "battleSeal", locked: true },
    { id: "starManual", name: "星斗秘匣", icon: "匣", desc: "通关后解锁。秘籍价格-18%，修炼秘籍额外获得30经验。", effect: "manualMastery", locked: true },
    { id: "jadeArmor", name: "玄玉护心镜", icon: "镜", desc: "通关后解锁。最大血量+90，最大内力+70，每场战斗开始获得护体。", effect: "jadeGuard", locked: true }
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

    fist_blue_1: skill("fist_blue_1", "绵掌", "fist", "blue", 62, 45, 1, 3, "inner", 1, ["combo", "threeWaves"], gain(4, 0, 0, 1, 0), { id: "softBone", name: "连绵不绝", desc: "连击+4，暴击+1。", effects: { combo: 4, crit: 1 } }),
    fist_blue_2: skill("fist_blue_2", "摧心掌", "fist", "blue", 70, 55, 2, 3, "inner", 2, ["combo"], gain(3, 0, 0, 2, 0), { id: "heartBreak", name: "摧心暗劲", desc: "连击+3，暴击+2。", effects: { combo: 3, crit: 2 } }),
    fist_blue_3: skill("fist_blue_3", "太祖长拳", "fist", "blue", 58, 35, 1, 3, "inner", 1, ["combo"], gain(5, 1, 0, 0, 0), { id: "founderFist", name: "拳路绵密", desc: "连击+5，命中+1。", effects: { combo: 5, hit: 1 } }),
    fist_blue_4: skill("fist_blue_4", "劈空掌", "fist", "blue", 75, 60, 2, 3, "inner", 1, ["combo"], gain(3, 1, 0, 1, 0), { id: "airPalm", name: "隔空透劲", desc: "连击+3，命中+1，暴击+1。", effects: { combo: 3, hit: 1, crit: 1 } }),
    fist_orange_1: skill("fist_orange_1", "排云掌", "fist", "orange", 120, 90, 2, 4, "inner", 2, ["combo", "threeWaves"], gain(6, 1, 0, 3, 0), { id: "vajraPalm", name: "排云叠劲", desc: "连击+6，暴击+3。", effects: { combo: 6, hit: 1, crit: 3 } }),
    fist_orange_2: skill("fist_orange_2", "黯然销魂掌", "fist", "orange", 105, 85, 2, 4, "inner", 3, ["combo"], gain(7, 0, 1, 2, 0), { id: "sadPalm", name: "情至无声", desc: "连击+7，闪避+1，暴击+2。", effects: { combo: 7, dodge: 1, crit: 2 } }),
    fist_red_1: skill("fist_red_1", "惊涛掌", "fist", "red", 190, 145, 3, 5, "inner", 4, ["combo", "threeWaves"], gain(9, 2, 0, 5, 0), { id: "dragonPalm", name: "惊涛拍岸", desc: "连击+9，暴击+5，暴击倍率提高。", effects: { combo: 9, hit: 2, crit: 5, critPower: 0.35 } }),
    fist_orange_3: skill("fist_orange_3", "截脉掌", "fist", "orange", 108, 82, 2, 4, "inner", 3, ["combo"], gain(5, 2, 0, 2, 0), { id: "cutMeridian", name: "截脉断息", desc: "连击+5，命中+2，暴击+2。", effects: { combo: 5, hit: 2, crit: 2 } }),
    fist_red_2: skill("fist_red_2", "碎星拳", "fist", "red", 178, 135, 3, 5, "inner", 3, ["combo"], gain(6, 2, 0, 9, 0), { id: "starCrush", name: "碎星暴劲", desc: "暴击+9，命中+2，暴击倍率提高。", effects: { combo: 6, hit: 2, crit: 9, critPower: 0.3 } }),
    fist_red_3: skill("fist_red_3", "断海掌", "fist", "red", 168, 130, 3, 5, "inner", 5, ["combo"], gain(8, 3, 0, 4, 0), { id: "seaBreak", name: "断海截息", desc: "连击+8，命中+3，暴击+4。", effects: { combo: 8, hit: 3, crit: 4 } }),

    light_blue_1: qinggong("light_blue_1", "草上飞", "blue", 3, gain(0, 0, 3, 0, 0.08), { id: "grassStep", name: "踏草无痕", desc: "闪避+3，出手速度+0.08。", effects: { dodge: 3, speed: 0.08 } }),
    light_blue_2: qinggong("light_blue_2", "燕子三抄水", "blue", 3, gain(0, 0, 4, 0, 0.06), { id: "swallowStep", name: "燕影回环", desc: "闪避+4，出手速度+0.06。", effects: { dodge: 4, speed: 0.06 } }),
    light_blue_3: qinggong("light_blue_3", "八步赶蝉", "blue", 3, gain(0, 1, 2, 0, 0.08), { id: "eightSteps", name: "步步抢先", desc: "命中+1，闪避+2，出手速度+0.08。", effects: { hit: 1, dodge: 2, speed: 0.08 } }),
    light_blue_4: qinggong("light_blue_4", "壁虎游墙功", "blue", 3, gain(0, 0, 5, 0, 0.03), { id: "wallWalk", name: "贴壁游身", desc: "闪避+5，出手速度+0.03。", effects: { dodge: 5, speed: 0.03 } }),
    light_orange_1: qinggong("light_orange_1", "神行百变", "orange", 4, gain(0, 1, 7, 0, 0.12), { id: "manySteps", name: "百变身法", desc: "命中+1，闪避+7，出手速度+0.12。", effects: { hit: 1, dodge: 7, speed: 0.12 } }),
    light_orange_2: qinggong("light_orange_2", "梯云纵", "orange", 4, gain(0, 0, 8, 0, 0.1), { id: "cloudLadder", name: "凌虚踏云", desc: "闪避+8，出手速度+0.10。", effects: { dodge: 8, speed: 0.1 } }),
    light_red_1: qinggong("light_red_1", "凌波微步", "red", 5, gain(0, 2, 12, 0, 0.18), { id: "lingbo", name: "步生波纹", desc: "命中+2，闪避+12，出手速度+0.18。", effects: { hit: 2, dodge: 12, speed: 0.18 } }),
    blade_orange_3: skill("blade_orange_3", "裂筋刀", "blade", "orange", 112, 78, 2, 4, "hamstring", 2, ["crit"], gain(0, 2, 0, 4, 0.03), { id: "sinewCut", name: "裂筋卸力", desc: "命中+2，暴击+4，速度+0.03。", effects: { hit: 2, crit: 4, speed: 0.03 } }),
    blade_red_2: skill("blade_red_2", "玄冥寒刀", "blade", "red", 170, 132, 3, 5, "frost", 4, ["crit"], gain(0, 3, 0, 6, 0.06), { id: "deepFrost", name: "玄冥寒意", desc: "命中+3，暴击+6，速度+0.06。", effects: { hit: 3, crit: 6, speed: 0.06 } }),
    blade_red_3: skill("blade_red_3", "天残断筋刀", "blade", "red", 166, 126, 3, 5, "hamstring", 4, ["crit"], gain(0, 4, 1, 5, 0.04), { id: "crippleBlade", name: "天残刀势", desc: "命中+4，闪避+1，暴击+5。", effects: { hit: 4, dodge: 1, crit: 5, speed: 0.04 } }),
    hidden_orange_3: skill("hidden_orange_3", "金叶飞花", "hidden", "orange", 0, 0, 2, 4, "coin", 0, ["surehit", "coin"], gain(0, 6, 0, 2, 0.05), { id: "goldLeaf", name: "金叶破空", desc: "命中+6，暴击+2，速度+0.05。", effects: { hit: 6, crit: 2, speed: 0.05 } }, "钱"),
    hidden_red_2: skill("hidden_red_2", "九窍蛊针", "hidden", "red", 145, 125, 3, 5, "gu", 5, ["surehit"], gain(0, 9, 2, 1, 0.07), { id: "nineGu", name: "九窍封息", desc: "命中+9，闪避+2，速度+0.07。", effects: { hit: 9, dodge: 2, crit: 1, speed: 0.07 } }),
    hidden_red_3: skill("hidden_red_3", "漫天金雨", "hidden", "red", 0, 0, 3, 5, "coin", 0, ["surehit", "coin"], gain(0, 10, 1, 4, 0.08), { id: "goldRain", name: "金雨无空", desc: "命中+10，暴击+4，速度+0.08。", effects: { hit: 10, dodge: 1, crit: 4, speed: 0.08 } }, "钱"),
    light_orange_3: qinggong("light_orange_3", "飞檐探云腿", "orange", 4, gain(0, 2, 4, 2, 0.16), { id: "cloudThief", name: "探云取利", desc: "命中+2，闪避+4，暴击+2，速度+0.16。" }),
    light_red_2: qinggong("light_red_2", "碎岳沉桩腿", "red", 5, gain(0, 4, 3, 4, 0.08), { id: "mountainKick", name: "碎岳真劲", desc: "命中+4，闪避+3，暴击+4，速度+0.08。" }),
    light_red_3: qinggong("light_red_3", "摘星无影腿", "red", 5, gain(0, 3, 8, 3, 0.22), { id: "starThief", name: "摘星掠影", desc: "命中+3，闪避+8，暴击+3，速度+0.22。" })
  },
  strategies: [],
  traits: [
    { id: "wanderer", name: "浪游", desc: "战斗开始出手速度+0.12，金钱获取+8%。" },
    { id: "constable", name: "缉凶", desc: "命中+6，获得经验时额外+8。" },
    { id: "orthodox", name: "正脉", desc: "血量+50，内力+40，经验获取+8%。" },
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
    { id: "highDodgeAssassin", name: "踏影刺客", icon: "影", hp: 300, qi: 220, atk: 66, def: 24, combo: 5, hit: 76, dodge: 42, crit: 14, speed: 1.85, rank: 2, trait: "evasive", traitName: "高闪避", traitDesc: "闪避极高，考验命中和必中招式。" },
    { id: "armorBreakBlade", name: "裂甲刀客", icon: "破", hp: 390, qi: 210, atk: 74, def: 34, combo: 3, hit: 68, dodge: 2, crit: 9, speed: 1.42, rank: 3, trait: "armorBreak", traitName: "破防刀", traitDesc: "攻击会忽略部分防御，并削弱防御。" },
    { id: "qiSuppressFist", name: "断脉拳师", icon: "拳", hp: 420, qi: 280, atk: 68, def: 38, combo: 7, hit: 70, dodge: 4, crit: 8, speed: 1.38, rank: 3, trait: "qiSuppress", traitName: "压制内力", traitDesc: "攻击会额外削减内力，逼迫调息节奏。" },
    { id: "witch", name: "毒娘子", icon: "毒", hp: 390, qi: 260, atk: 58, def: 32, combo: 4, hit: 66, dodge: 5, crit: 9, speed: 1.45, rank: 3 },
    { id: "demon", name: "心魔", icon: "魔", hp: 560, qi: 300, atk: 82, def: 42, combo: 6, hit: 66, dodge: 4, crit: 12, speed: 1.4, rank: 4 }
  ],
  bosses: [
    { id: "boss_y1", name: "青竹寨主", icon: "刀", year: 1, hp: 560, qi: 260, atk: 78, def: 42, combo: 4, hit: 68, dodge: 4, crit: 10, speed: 1.35, boss: true },
    { id: "boss_y2", name: "黑风堂主", icon: "魔", year: 2, hp: 820, qi: 360, atk: 98, def: 55, combo: 5, hit: 72, dodge: 5, crit: 12, speed: 1.45, boss: true },
    { id: "finalBoss", name: "颍川五虎门主", icon: "魔", year: 3, hp: 1120, qi: 480, atk: 122, def: 68, combo: 7, hit: 78, dodge: 7, crit: 16, speed: 1.58, boss: true }
  ]
};

const SKILL_TIER_LABELS = {
  basic: "基础",
  advanced: "进阶",
  ultimate: "终极"
};

export const STYLE_TRAITS = {
  combo: { id: "comboMastery", name: "长江三叠浪", desc: "连击掌触发连击时，其他连击掌冷却-1；若有掌法就绪，可立即继续出掌。" },
  critPalm: { id: "critPalmMastery", name: "碎星连震", desc: "暴击拳掌暴击率提高，暴击倍率提高。" },
  qiBreak: { id: "qiBreakMastery", name: "断脉归元", desc: "断脉拳掌削内力提高，目标内力归零时额外受伤。" },
  bleed: { id: "bleedBladeMastery", name: "百创刀势", desc: "流血刀造成流血时额外+1层，流血伤害提高。" },
  frost: { id: "frostBladeMastery", name: "玄冥寒河", desc: "寒冰刀附加更多寒气，并进一步削减内力。" },
  hamstring: { id: "hamstringBladeMastery", name: "天残绝路", desc: "断筋刀额外削攻击，断筋目标速度更低。" },
  gu: { id: "guMastery", name: "九窍蛊王", desc: "下蛊暗器附加更多蛊，并提高目标招式消耗。" },
  poison: { id: "poisonMastery", name: "孔雀毒雨", desc: "淬毒暗器中毒更深，并额外削减内力。" },
  coin: { id: "coinMastery", name: "漫天金雨", desc: "金钱暗器固定伤害提高，终极金钱暗器花费降低。" },
  evasive: { id: "evasiveLegMastery", name: "凌波回息", desc: "闪避后减冷却与调息效果提高。" },
  lowKick: { id: "lowKickMastery", name: "地裂无声", desc: "下盘腿法真伤提高，并额外压低目标速度。" },
  steal: { id: "stealLegMastery", name: "摘星夺魄", desc: "偷盗型腿法获得更多金钱，并提高出手速度。" }
};

const SKILL_STYLES = {
  fist_blue_1: ["combo", "basic", "绵掌", "连击掌基础式。CD短，靠连击抢节奏。"],
  fist_orange_1: ["combo", "advanced", "排云掌", "连击掌进阶式。威力更高，配合三叠浪循环出掌。"],
  fist_red_1: ["combo", "ultimate", "惊涛掌", "连击掌终极式。高威力长冷却，连击后带动整套掌法。"],
  fist_blue_3: ["critPalm", "basic", "太祖长拳", "暴击拳掌基础式。拳路正而力猛。"],
  fist_orange_2: ["critPalm", "advanced", "黯然掌", "暴击拳掌进阶式。暴击收益更高。"],
  fist_red_2: ["critPalm", "ultimate", "碎星拳", "暴击拳掌终极式。重拳碎星，暴击倍率提高。"],
  mixedFist: ["qiBreak", "basic", "断脉乱拳", "断脉拳掌基础式。拳劲入脉，削减内力。"],
  fist_orange_3: ["qiBreak", "advanced", "截脉掌", "断脉拳掌进阶式。以掌截息，削内力更强。"],
  fist_red_3: ["qiBreak", "ultimate", "断海掌", "断脉拳掌终极式。断海截息，压垮内力。"],
  quickSlash: ["bleed", "basic", "雁门快刀", "流血刀基础式。制造伤口并持续流血。"],
  blade_orange_1: ["bleed", "advanced", "燃木刀法", "流血刀进阶式。刀势焦灼，伤口更深。"],
  blade_red_1: ["bleed", "ultimate", "傲寒六诀", "流血刀终极式。寒刃封喉，重创见血。"],
  blade_blue_2: ["frost", "basic", "寒枝刀", "寒冰刀基础式。减速并削内力。"],
  blade_orange_2: ["frost", "advanced", "雪岭刀", "寒冰刀进阶式。寒气入脉，压低速度。"],
  blade_red_2: ["frost", "ultimate", "玄冥寒刀", "寒冰刀终极式。玄冥寒意，冻气断息。"],
  blade_blue_3: ["hamstring", "basic", "断步刀", "断筋刀基础式。减速并削攻击。"],
  blade_orange_3: ["hamstring", "advanced", "裂筋刀", "断筋刀进阶式。裂筋卸力。"],
  blade_red_3: ["hamstring", "ultimate", "天残断筋刀", "断筋刀终极式。断岳残步，攻势尽折。"],
  shadowSting: ["gu", "basic", "影蛊刺", "下蛊暗器基础式。提高目标冷却和内力消耗。"],
  hidden_orange_2: ["gu", "advanced", "生死蛊符", "下蛊暗器进阶式。蛊入经络，扰乱出招。"],
  hidden_red_2: ["gu", "ultimate", "九窍蛊针", "下蛊暗器终极式。九窍封息。"],
  springNeedle: ["poison", "basic", "回春毒针", "淬毒暗器基础式。扣血并扣内力。"],
  hidden_orange_1: ["poison", "advanced", "冰魄毒针", "淬毒暗器进阶式。寒毒入脉。"],
  hidden_red_1: ["poison", "ultimate", "孔雀毒翎", "淬毒暗器终极式。毒雨齐发。"],
  hidden_blue_4: ["coin", "basic", "金钱镖", "金钱暗器基础式。消耗金钱，固定伤害且必中。"],
  hidden_orange_3: ["coin", "advanced", "金叶飞花", "金钱暗器进阶式。以钱开路，伤害稳定。"],
  hidden_red_3: ["coin", "ultimate", "漫天金雨", "金钱暗器终极式。金雨无空。"],
  light_blue_1: ["evasive", "basic", "燕回腿", "高闪避腿法基础式。闪避后减冷却并调息。"],
  light_orange_1: ["evasive", "advanced", "游龙腿", "高闪避腿法进阶式。游身避锋。"],
  light_red_1: ["evasive", "ultimate", "凌波腿", "高闪避腿法终极式。步生波纹。"],
  light_blue_2: ["lowKick", "basic", "扫堂腿", "下盘腿法基础式。忽略闪避和防御造成真伤。"],
  light_orange_2: ["lowKick", "advanced", "盘龙腿", "下盘腿法进阶式。盘根折势。"],
  light_red_2: ["lowKick", "ultimate", "碎岳沉桩腿", "下盘腿法终极式。碎岳真劲。"],
  light_blue_3: ["steal", "basic", "探囊腿", "偷盗型腿法基础式。高出手且能获取额外金钱。"],
  light_orange_3: ["steal", "advanced", "飞檐探云腿", "偷盗型腿法进阶式。出手更快。"],
  light_red_3: ["steal", "ultimate", "摘星无影腿", "偷盗型腿法终极式。摘星取利。"]
};

for (const [id, [style, tier, name, desc]] of Object.entries(SKILL_STYLES)) {
  if (!DATA.skills[id]) continue;
  DATA.skills[id].style = style;
  DATA.skills[id].tier = tier;
  DATA.skills[id].tierName = SKILL_TIER_LABELS[tier];
  DATA.skills[id].name = name;
  DATA.skills[id].desc = `【${SKILL_TIER_LABELS[tier]}】${desc}`;
  DATA.skills[id].styleName = STYLE_LABELS[style];
  DATA.skills[id].trait = STYLE_TRAITS[style];
  DATA.skills[id].debuff = {
    qiBreak: "inner",
    bleed: "bleed",
    frost: "frost",
    hamstring: "hamstring",
    gu: "gu",
    poison: "poison",
    coin: "coin"
  }[style] || null;
  if (style === "coin") DATA.skills[id].tags = [...new Set([...(DATA.skills[id].tags || []), "surehit", "coin"])];
}

DATA.styleSkillSets = Object.entries(SKILL_STYLES).reduce((sets, [id, [style, tier]]) => {
  sets[style] ||= {};
  sets[style][tier] = id;
  return sets;
}, {});
DATA.styleTraits = STYLE_TRAITS;

DATA.manuals = Object.keys(SKILL_STYLES);

Object.assign(DATA.weapons.fist_w_blue, { name: "缠丝护腕", style: "combo", comboBonus: 8, desc: "拳掌连击+8，连击掌伤害+8%。" });
Object.assign(DATA.weapons.fist_w_orange, { name: "截脉臂甲", style: "qiBreak", qiBreakBonus: 18, debuffBonus: 2, desc: "断脉拳掌削内力+18，断脉层数+2。" });
Object.assign(DATA.weapons.fist_w_red, { name: "碎星拳套", style: "critPalm", crit: 10, critPower: 0.25, desc: "暴击拳掌暴击+10，暴击倍率提高。" });
Object.assign(DATA.weapons.blade_w_blue, { name: "饮血雁翎刀", style: "bleed", debuffBonus: 2, desc: "流血刀层数+2，刀法伤害+8%。" });
Object.assign(DATA.weapons.blade_w_orange, { name: "玄霜刀", style: "frost", frostBonus: 2, qiBreakBonus: 20, desc: "寒冰刀寒气+2，额外削内力。" });
Object.assign(DATA.weapons.blade_w_red, { name: "断岳残刀", style: "hamstring", hamstringBonus: 3, atkBreakBonus: 4, desc: "断筋刀断筋+3，额外削攻击。" });
Object.assign(DATA.weapons.hidden_w_blue, { name: "蛊针匣", style: "gu", guBonus: 1, desc: "下蛊暗器蛊层+1，暗器伤害+8%。" });
Object.assign(DATA.weapons.hidden_w_orange, { name: "淬毒镖囊", style: "poison", poisonBonus: 2, qiBreakBonus: 18, desc: "淬毒暗器毒层+2，额外削内力。" });
Object.assign(DATA.weapons.hidden_w_red, { name: "金雨机括", style: "coin", coinDamageBonus: 55, desc: "金钱暗器固定伤害+55，仍然必中。" });

DATA.strategies = [
  ...makeStrategies("fist", "combo", ["缠丝", "叠劲", "追掌", "浪涌", "三叠劲", "借势连环", "长江无尽"]),
  ...makeStrategies("fist", "critPalm", ["崩拳", "摧心", "震胆", "碎骨", "破星劲", "雷音入骨", "星陨掌意"]),
  ...makeStrategies("fist", "qiBreak", ["截息", "封脉", "断气", "逆脉", "沉劲截流", "闭关锁脉", "沧海断息"]),
  ...makeStrategies("blade", "bleed", ["血引", "追创", "伤口", "血路", "断门势", "饮血归元", "千创百孔"]),
  ...makeStrategies("blade", "frost", ["寒枝", "冷刃", "霜气", "凝脉", "雪岭刀势", "玄霜入骨", "玄冥冰河"]),
  ...makeStrategies("blade", "hamstring", ["断步", "裂筋", "卸力", "挑脉", "残步刀势", "断岳伤筋", "天残绝路"]),
  ...makeStrategies("hidden", "gu", ["蛊引", "缠心", "扰息", "封窍", "百蛊入络", "生死符令", "九窍蛊王"]),
  ...makeStrategies("hidden", "poison", ["淬毒", "入血", "腐骨", "蚀气", "冰魄毒意", "毒入经脉", "孔雀毒雨"]),
  ...makeStrategies("hidden", "coin", ["听钱", "掷金", "破空", "买命", "金叶飞花", "铜臭杀机", "漫天金雨"]),
  ...makeStrategies("lightness", "evasive", ["侧身", "燕回", "避锋", "借步", "游龙身", "踏浪回息", "凌波无形"]),
  ...makeStrategies("lightness", "lowKick", ["扫堂", "沉桩", "击膝", "碎踝", "盘龙下势", "碎岳真劲", "地裂无声"]),
  ...makeStrategies("lightness", "steal", ["探囊", "掠影", "飞檐", "顺手", "探云取利", "过墙留财", "摘星夺魄"])
];

function makeStrategies(school, style, names) {
  const rarities = ["blue", "blue", "blue", "blue", "orange", "orange", "red"];
  return names.map((name, index) => {
    const rarity = rarities[index];
    const rank = RARITIES[rarity].rank;
    const effects = styleEffects(style, rank);
    return {
      id: `${school}_${style}_strat_${index + 1}`,
      name,
      school,
      style,
      rarity,
      effects,
      desc: `${SCHOOLS[school].name}计略，强化${STYLE_LABELS[style]}路线。`,
      effectsText: describeEffects(effects)
    };
  });
}

function styleEffects(style, rank) {
  const map = {
    combo: { combo: rank * 4 },
    critPalm: { crit: rank * 3, critPower: Number((rank * 0.08).toFixed(2)) },
    qiBreak: { qiBreakBonus: rank * 12 },
    bleed: { bleedBonus: rank, crit: rank * 2 },
    frost: { frostBonus: rank, qiBreakBonus: rank * 10 },
    hamstring: { hamstringBonus: rank, atkBreakBonus: rank * 2 },
    gu: { guBonus: rank },
    poison: { poisonBonus: rank, qiBreakBonus: rank * 8 },
    coin: { coinDamageBonus: rank * 24 },
    evasive: { dodge: rank * 4, cooldownOnDodge: rank },
    lowKick: { trueDamageBonus: rank * 18 },
    steal: { speed: Number((rank * 0.06).toFixed(2)), moneyBonus: rank * 8 }
  };
  return map[style] || {};
}

function describeEffects(effects) {
  return Object.entries(effects).map(([key, value]) => {
    const map = { bleedBonus: "流血层数", poisonBonus: "淬毒层数", innerBonus: "内伤层数", frostBonus: "寒气层数", hamstringBonus: "断筋层数", guBonus: "蛊层数", qiBreakBonus: "削内力", atkBreakBonus: "削攻击", coinDamageBonus: "金钱伤害", trueDamageBonus: "真伤", cooldownOnDodge: "闪避减CD", moneyBonus: "额外金钱", critPower: "暴击倍率", crit: "暴击", hit: "命中", combo: "连击", dodge: "闪避", speed: "出手速度" };
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
  unlockedTreasures: ["inkTally", "goldAbacus", "springGourd"],
  endlessUnlocked: false
};
