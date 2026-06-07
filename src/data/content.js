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

function gain(combo=0, hit=0, dodge=0, crit=0, speed=0, atk=0, def=0, hp=0, qi=0) {
  return { combo, hit, dodge, crit, speed, atk, def, hp, qi };
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
    { id: "wanderer", name: "沈孤云", faction: "江湖浪客", icon: "浪", portrait: "wanderer", portraitImage: "assets/portraits_pixel/shen_guyun_pixel_320.webp", desc: "走南闯北的散人，出手灵活，适合尝试各类构筑。", traitText: "浪游：战斗开始出手速度+0.12，胜利金钱+8%。", stats: stats(500, 275, 56, 34, 6, 62, 4, 7, 1.45), traits: ["wanderer"], skills: ["mixedFist"] },
    { id: "constable", name: "陆惊尘", faction: "镇抚司", icon: "鹰", portrait: "constable", portraitImage: "assets/portraits_pixel/lu_jingchen_pixel_320.webp", desc: "朝廷鹰犬，命中高、压制强，适合稳扎稳打。", traitText: "缉凶：命中+6，击败敌人额外获得经验。", stats: stats(540, 250, 60, 38, 4, 70, 2, 6, 1.35), traits: ["constable"], skills: ["quickSlash"] },
    { id: "orthodox", name: "顾明昭", faction: "天衡剑派", icon: "正", portrait: "orthodox", portraitImage: "assets/portraits_pixel/gu_mingzhao_pixel_320.webp", desc: "名门正派弟子，根基厚实，成长稳定。", traitText: "正脉：最大血量+50，最大内力+40，修炼经验+8%。", stats: stats(600, 300, 54, 42, 5, 60, 3, 5, 1.25), traits: ["orthodox"], skills: ["fist_blue_1"] }
  ],
  treasures: [
    { id: "inkTally", name: "青玉功牌", icon: "牌", desc: "所有经验获取+12%。", effect: "expBoost" },
    { id: "goldAbacus", name: "金错算盘", icon: "算", desc: "所有金钱获取+18%。", effect: "moneyBoost" },
    { id: "springGourd", name: "回春葫芦", icon: "葫", desc: "每月开始恢复135血量和135内力。", effect: "monthRecover" },
    { id: "dragonSeal", name: "龙纹令", icon: "令", desc: "通关后解锁。战斗开始攻击+18，命中+8，暴击+5。", effect: "battleSeal", locked: true },
    { id: "starManual", name: "星斗秘匣", icon: "匣", desc: "通关后解锁。秘籍价格-18%，修炼秘籍额外获得30经验。", effect: "manualMastery", locked: true },
    { id: "jadeArmor", name: "玄玉护心镜", icon: "镜", desc: "通关后解锁。最大血量+90，最大内力+70，每场战斗开始获得护体。", effect: "jadeGuard", locked: true }
  ],
  skills: {
    // === 基础招式（角色自带）===
    mixedFist: skill("mixedFist", "断脉乱拳", "fist", "blue", 60, 40, 1, 3, "inner", 1, ["combo"], gain(2, 0, 0, 1, 0), { id: "roughChain", name: "乱拳连环", desc: "连击+2，暴击+1。", effects: { combo: 2, crit: 1 } }),
    quickSlash: skill("quickSlash", "雁门快刀", "blade", "blue", 55, 45, 1, 3, "bleed", 1, ["crit"], gain(0, 0, 0, 2, 0, 0, 0, 0, 0), { id: "quickEdge", name: "快刃", desc: "暴击+2，出手速度+0.03。", effects: { crit: 2, speed: 0.03 } }),
    shadowSting: skill("shadowSting", "影蛊刺", "hidden", "blue", 58, 45, 1, 3, "gu", 1, ["surehit"], gain(0, 2, 0, 0, 0, 0, 0, 0, 0), { id: "shadowStep", name: "影步", desc: "命中+2，出手速度+0.03。", effects: { hit: 2, speed: 0.03 } }),
    springNeedle: skill("springNeedle", "青囊毒针", "hidden", "blue", 42, 45, 2, 3, "poison", 1, ["surehit", "heal"], gain(0, 2, 0, 0, 0, 0, 0, 0, 0), { id: "needleSense", name: "针感", desc: "命中+2，出手速度+0.03。", effects: { hit: 2, speed: 0.03 } }),

    // === 刀法 ===
    // 流血路线: quickSlash(基础) -> blade_orange_1(进阶) -> blade_red_1(终极)
    blade_orange_1: skill("blade_orange_1", "燃木刀法", "blade", "orange", 118, 85, 2, 4, "bleed", 3, ["crit"], gain(0, 1, 0, 5, 0, 0, 0, 0, 0), { id: "burningEdge", name: "烈焰刀意", desc: "命中+1，暴击+5，出手速度+0.05。", effects: { hit: 1, crit: 5, speed: 0.05 } }),
    blade_red_1: skill("blade_red_1", "饮血封喉刀", "blade", "red", 180, 135, 3, 5, "bleed", 5, ["crit"], gain(0, 2, 1, 9, 0, 0, 0, 0, 0), { id: "bloodSeal", name: "血刃封喉", desc: "暴击+9，命中+2，闪避+1，出手速度+0.08，暴击倍率提高。", effects: { hit: 2, dodge: 1, crit: 9, speed: 0.08, critPower: 0.25 } }),
    // 寒冰路线: blade_blue_2(基础) -> blade_orange_2(进阶) -> blade_red_2(终极)
    blade_blue_2: skill("blade_blue_2", "寒枝刀", "blade", "blue", 62, 38, 1, 3, "frost", 1, ["crit"], gain(0, 1, 0, 2, 0, 0, 0, 0, 0), { id: "woodcutter", name: "寒枝挂霜", desc: "命中+1，暴击+2，出手速度+0.04。", effects: { hit: 1, crit: 2, speed: 0.04 } }),
    blade_orange_2: skill("blade_orange_2", "雪岭刀", "blade", "orange", 105, 75, 2, 4, "frost", 2, ["crit"], gain(0, 0, 1, 5, 0, 0, 0, 0, 0), { id: "snowRidge", name: "雪岭留痕", desc: "暴击+5，闪避+1，出手速度+0.04。", effects: { dodge: 1, crit: 5, speed: 0.04 } }),
    blade_red_2: skill("blade_red_2", "玄冥寒刀", "blade", "red", 170, 132, 3, 5, "frost", 4, ["crit"], gain(0, 3, 0, 6, 0, 0, 0, 0, 0), { id: "deepFrost", name: "玄冥寒意", desc: "命中+3，暴击+6，出手速度+0.06。", effects: { hit: 3, crit: 6, speed: 0.06 } }),
    // 断筋路线: blade_blue_3(基础) -> blade_orange_3(进阶) -> blade_red_3(终极)
    blade_blue_3: skill("blade_blue_3", "断步刀", "blade", "blue", 55, 50, 1, 3, "hamstring", 1, ["crit"], gain(0, 0, 1, 2, 0, 0, 0, 0, 0), { id: "windBlade", name: "风中递刃", desc: "闪避+1，暴击+2，出手速度+0.06。", effects: { dodge: 1, crit: 2, speed: 0.06 } }),
    blade_orange_3: skill("blade_orange_3", "裂筋刀", "blade", "orange", 112, 78, 2, 4, "hamstring", 2, ["crit"], gain(0, 2, 0, 4, 0, 0, 0, 0, 0), { id: "sinewCut", name: "裂筋卸力", desc: "命中+2，暴击+4，出手速度+0.03。", effects: { hit: 2, crit: 4, speed: 0.03 } }),
    blade_red_3: skill("blade_red_3", "天残断筋刀", "blade", "red", 166, 126, 3, 5, "hamstring", 4, ["crit"], gain(0, 4, 1, 5, 0, 0, 0, 0, 0), { id: "crippleBlade", name: "天残刀势", desc: "命中+4，闪避+1，暴击+5。", effects: { hit: 4, dodge: 1, crit: 5, speed: 0.04 } }),

    // === 暗器 ===
    // 淬毒路线: springNeedle(基础) -> hidden_orange_1(进阶) -> hidden_red_1(终极)
    hidden_orange_1: skill("hidden_orange_1", "冰魄毒针", "hidden", "orange", 95, 80, 2, 4, "poison", 3, ["surehit"], gain(0, 6, 1, 0, 0, 0, 0, 0, 0), { id: "icePoison", name: "寒毒入脉", desc: "命中+6，闪避+1，出手速度+0.04。", effects: { hit: 6, dodge: 1, speed: 0.04 } }),
    hidden_red_1: skill("hidden_red_1", "孔雀毒翎", "hidden", "red", 155, 130, 3, 5, "poison", 5, ["surehit"], gain(0, 10, 2, 2, 0, 0, 0, 0, 0), { id: "peacockPlume", name: "万羽齐发", desc: "命中+10，闪避+2，暴击+2，出手速度+0.08，中毒更深。", effects: { hit: 10, dodge: 2, crit: 2, speed: 0.08, poisonBonus: 1 } }),
    // 下蛊路线: shadowSting(基础) -> hidden_orange_2(进阶) -> hidden_red_2(终极)
    hidden_orange_2: skill("hidden_orange_2", "生死蛊符", "hidden", "orange", 88, 90, 2, 4, "gu", 2, ["surehit"], gain(0, 5, 0, 1, 0, 0, 0, 0, 0), { id: "lifeTalisman", name: "符入骨髓", desc: "命中+5，暴击+1，出手速度+0.06。", effects: { hit: 5, crit: 1, speed: 0.06 } }),
    hidden_red_2: skill("hidden_red_2", "九窍蛊针", "hidden", "red", 145, 125, 3, 5, "gu", 4, ["surehit"], gain(0, 9, 2, 1, 0, 0, 0, 0, 0), { id: "nineGu", name: "九窍封息", desc: "命中+9，闪避+2，暴击+1，出手速度+0.07。", effects: { hit: 9, dodge: 2, crit: 1, speed: 0.07 } }),
    // 金钱路线: hidden_blue_4(基础) -> hidden_orange_3(进阶) -> hidden_red_3(终极)
    hidden_blue_4: skill("hidden_blue_4", "金钱镖", "hidden", "blue", 0, 0, 2, 3, "coin", 0, ["surehit", "coin"], gain(0, 4, 0, 0, 0, 0, 0, 0, 0), { id: "coinDart", name: "听钱辨位", desc: "命中+4，出手速度+0.02。", effects: { hit: 4, speed: 0.02 } }, "钱"),
    hidden_orange_3: skill("hidden_orange_3", "金叶飞花", "hidden", "orange", 0, 0, 2, 4, "coin", 0, ["surehit", "coin"], gain(0, 6, 0, 2, 0, 0, 0, 0, 0), { id: "goldLeaf", name: "金叶破空", desc: "命中+6，暴击+2，出手速度+0.05。", effects: { hit: 6, crit: 2, speed: 0.05 } }, "钱"),
    hidden_red_3: skill("hidden_red_3", "漫天金雨", "hidden", "red", 0, 0, 3, 5, "coin", 0, ["surehit", "coin"], gain(0, 10, 1, 4, 0, 0, 0, 0, 0), { id: "goldRain", name: "金雨无空", desc: "命中+10，闪避+1，暴击+4，出手速度+0.08。", effects: { hit: 10, dodge: 1, crit: 4, speed: 0.08 } }, "钱"),

    // === 拳掌 ===
    // 连击路线: fist_blue_1(基础) -> fist_orange_1(进阶) -> fist_red_1(终极)
    fist_blue_1: skill("fist_blue_1", "绵掌", "fist", "blue", 62, 45, 1, 3, "inner", 1, ["combo", "threeWaves"], gain(4, 0, 0, 1, 0), { id: "softBone", name: "连绵不绝", desc: "连击+4，暴击+1。", effects: { combo: 4, crit: 1 } }),
    fist_orange_1: skill("fist_orange_1", "排云掌", "fist", "orange", 120, 90, 2, 4, "inner", 2, ["combo", "threeWaves"], gain(6, 1, 0, 3, 0), { id: "vajraPalm", name: "排云叠劲", desc: "连击+6，命中+1，暴击+3。", effects: { combo: 6, hit: 1, crit: 3 } }),
    fist_red_1: skill("fist_red_1", "惊涛掌", "fist", "red", 190, 145, 3, 5, "inner", 4, ["combo", "threeWaves"], gain(9, 2, 0, 5, 0), { id: "dragonPalm", name: "惊涛拍岸", desc: "连击+9，命中+2，暴击+5，暴击倍率提高。", effects: { combo: 9, hit: 2, crit: 5, critPower: 0.35 } }),
    // 暴击路线: fist_blue_3(基础) -> fist_orange_2(进阶) -> fist_red_2(终极)
    fist_blue_3: skill("fist_blue_3", "太祖长拳", "fist", "blue", 58, 35, 1, 3, "inner", 1, ["combo"], gain(5, 1, 0, 0, 0), { id: "founderFist", name: "拳路绵密", desc: "连击+5，命中+1。", effects: { combo: 5, hit: 1 } }),
    fist_orange_2: skill("fist_orange_2", "黯然掌", "fist", "orange", 105, 85, 2, 4, "inner", 3, ["combo"], gain(7, 0, 1, 2, 0), { id: "sadPalm", name: "情至无声", desc: "连击+7，闪避+1，暴击+2。", effects: { combo: 7, dodge: 1, crit: 2 } }),
    fist_red_2: skill("fist_red_2", "碎星拳", "fist", "red", 178, 135, 3, 5, "inner", 3, ["combo"], gain(8, 2, 0, 9, 0), { id: "starCrush", name: "碎星暴劲", desc: "暴击+9，命中+2，连击+8，暴击倍率提高。", effects: { combo: 8, hit: 2, crit: 9, critPower: 0.3 } }),
    // 断脉路线: mixedFist(基础) -> fist_orange_3(进阶) -> fist_red_3(终极)
    fist_orange_3: skill("fist_orange_3", "截脉掌", "fist", "orange", 108, 82, 2, 4, "inner", 3, ["combo"], gain(5, 2, 0, 2, 0), { id: "cutMeridian", name: "截脉断息", desc: "连击+5，命中+2，暴击+2。", effects: { combo: 5, hit: 2, crit: 2 } }),
    fist_red_3: skill("fist_red_3", "断海掌", "fist", "red", 168, 130, 3, 5, "inner", 5, ["combo"], gain(8, 3, 0, 4, 0), { id: "seaBreak", name: "断海截息", desc: "连击+8，命中+3，暴击+4。", effects: { combo: 8, hit: 3, crit: 4 } }),

    // === 腿法 ===
    // 高闪避路线: light_blue_1(基础) -> light_orange_1(进阶) -> light_red_1(终极)
    light_blue_1: qinggong("light_blue_1", "燕回腿", "blue", 3, gain(0, 0, 3, 0, 0.08), { id: "grassStep", name: "踏草无痕", desc: "闪避+3，出手速度+0.08。", effects: { dodge: 3, speed: 0.08 } }),
    light_orange_1: qinggong("light_orange_1", "游龙腿", "orange", 4, gain(0, 1, 7, 0, 0.12), { id: "manySteps", name: "百变身法", desc: "命中+1，闪避+7，出手速度+0.12。", effects: { hit: 1, dodge: 7, speed: 0.12 } }),
    light_red_1: qinggong("light_red_1", "凌波腿", "red", 5, gain(0, 2, 12, 0, 0.18), { id: "lingbo", name: "步生波纹", desc: "命中+2，闪避+12，出手速度+0.18。", effects: { hit: 2, dodge: 12, speed: 0.18 } }),
    // 下盘路线: light_blue_2(基础) -> light_orange_2(进阶) -> light_red_2(终极)
    light_blue_2: qinggong("light_blue_2", "扫堂腿", "blue", 3, gain(0, 0, 4, 0, 0.06), { id: "swallowStep", name: "燕影回环", desc: "闪避+4，出手速度+0.06。", effects: { dodge: 4, speed: 0.06 } }),
    light_orange_2: qinggong("light_orange_2", "盘龙腿", "orange", 4, gain(0, 0, 8, 0, 0.10), { id: "cloudLadder", name: "盘根折势", desc: "闪避+8，出手速度+0.10。", effects: { dodge: 8, speed: 0.1 } }),
    light_red_2: qinggong("light_red_2", "碎岳沉桩腿", "red", 5, gain(0, 4, 3, 4, 0.08), { id: "mountainKick", name: "碎岳真劲", desc: "命中+4，闪避+3，暴击+4，出手速度+0.08。", effects: { hit: 4, dodge: 3, crit: 4, speed: 0.08 } }),
    // 偷盗路线: light_blue_3(基础) -> light_orange_3(进阶) -> light_red_3(终极)
    light_blue_3: qinggong("light_blue_3", "探囊腿", "blue", 3, gain(0, 1, 2, 0, 0.08), { id: "eightSteps", name: "步步抢先", desc: "命中+1，闪避+2，出手速度+0.08。", effects: { hit: 1, dodge: 2, speed: 0.08 } }),
    light_orange_3: qinggong("light_orange_3", "飞檐探云腿", "orange", 4, gain(0, 2, 4, 2, 0.16), { id: "cloudThief", name: "探云取利", desc: "命中+2，闪避+4，暴击+2，出手速度+0.16。", effects: { hit: 2, dodge: 4, crit: 2, speed: 0.16 } }),
    light_red_3: qinggong("light_red_3", "摘星无影腿", "red", 5, gain(0, 3, 8, 3, 0.22), { id: "starThief", name: "摘星掠影", desc: "命中+3，闪避+8，暴击+3，出手速度+0.22。", effects: { hit: 3, dodge: 8, crit: 3, speed: 0.22 } })
  },
  strategies: [],
  traits: [
    { id: "wanderer", name: "浪游", desc: "战斗开始出手速度+0.12，金钱获取+8%。" },
    { id: "constable", name: "缉凶", desc: "命中+6，获得经验时额外+8。" },
    { id: "orthodox", name: "正脉", desc: "血量+50，内力+40，经验获取+8%。" },
    { id: "swift", name: "迅影", desc: "出手速度+0.25，闪避+4。" },
    { id: "tough", name: "铜皮铁骨", desc: "血量+80，防御+10。" },
    { id: "healer", name: "青囊", desc: "治疗效果+25%，每月开始额外恢复90血量和内力。" },
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
    pill: { id: "pill", name: "金疮药", icon: "药", type: "heal", price: 90, desc: "恢复20%最大血量。", hpPct: 0.2 },
    bigPill: { id: "bigPill", name: "大金疮药", icon: "药", type: "heal", price: 180, desc: "恢复35%最大血量。", hpPct: 0.35 },
    springPaste: { id: "springPaste", name: "回春灵膏", icon: "药", type: "heal", price: 360, desc: "恢复50%最大血量。", hpPct: 0.5 },
    qiWine: { id: "qiWine", name: "回气酒", icon: "酒", type: "qi", price: 80, desc: "恢复25%最大内力。", qiPct: 0.25 },
    qiPill: { id: "qiPill", name: "聚气丹", icon: "酒", type: "qi", price: 170, desc: "恢复40%最大内力。", qiPct: 0.4 },
    yuanPowder: { id: "yuanPowder", name: "归元散", icon: "酒", type: "qi", price: 340, desc: "恢复60%最大内力。", qiPct: 0.6 },
    apPowder: { id: "apPowder", name: "提神散", icon: "丹", type: "ap", price: 260, desc: "当前月行动点+1，每月限用1次。", ap: 1 },
    apPill: { id: "apPill", name: "提神丸", icon: "丹", type: "ap", price: 520, desc: "当前月行动点+2，每月限用1次。", ap: 2 },
    yuanDew: { id: "yuanDew", name: "归元露", icon: "丹", type: "apHeal", price: 980, desc: "行动点+3，恢复20%血量+20%内力，每月限用1次。", ap: 3, hpPct: 0.2, qiPct: 0.2 },
    statPill: { id: "statPill", name: "小还丹", icon: "丹", type: "stat", price: 150, desc: "永久攻击+3，防御+2，命中+1。", atk: 3, def: 2, hit: 1 }
  },
  // 武器：按路线×品质拆分
  weapons: {
    // === 刀法 ===
    blade_bleed_blue: { id: "blade_bleed_blue", name: "饮血雁翎刀", icon: "刀", school: "blade", rarity: "blue", style: "bleed", price: 260, atk: 12, desc: "流血刀。流血+1，流血上限+1。", debuffBonus: 1, bleedCapBonus: 1 },
    blade_bleed_orange: { id: "blade_bleed_orange", name: "裂血长刀", icon: "刀", school: "blade", rarity: "orange", style: "bleed", price: 520, atk: 28, desc: "流血刀。流血+2，流血伤害+15%。", debuffBonus: 2, bleedDmgPct: 15 },
    blade_bleed_red: { id: "blade_bleed_red", name: "血河断刃", icon: "刀", school: "blade", rarity: "red", style: "bleed", price: 980, atk: 58, desc: "流血刀。流血+4，流血上限+3，终极流血刀引爆伤害+25%。", debuffBonus: 4, bleedCapBonus: 3, bleedBurstPct: 25 },

    blade_frost_blue: { id: "blade_frost_blue", name: "霜刃刀", icon: "刀", school: "blade", rarity: "blue", style: "frost", price: 260, atk: 12, desc: "寒冰刀。寒气+1。", frostBonus: 1 },
    blade_frost_orange: { id: "blade_frost_orange", name: "玄霜刀", icon: "刀", school: "blade", rarity: "orange", style: "frost", price: 520, atk: 28, desc: "寒冰刀。寒气+2，削内+15。", frostBonus: 2, qiBreakBonus: 15 },
    blade_frost_red: { id: "blade_frost_red", name: "寒渊刀", icon: "刀", school: "blade", rarity: "red", style: "frost", price: 980, atk: 58, desc: "寒冰刀。寒气+4，寒气上限+2，终极寒冰刀立即削内提高。", frostBonus: 4, frostCapBonus: 2, frostQiBoost: 1 },

    blade_hamstring_blue: { id: "blade_hamstring_blue", name: "断步短刀", icon: "刀", school: "blade", rarity: "blue", style: "hamstring", price: 260, atk: 11, desc: "断筋刀。断筋+1。", hamstringBonus: 1 },
    blade_hamstring_orange: { id: "blade_hamstring_orange", name: "截脉刀", icon: "刀", school: "blade", rarity: "orange", style: "hamstring", price: 520, atk: 28, desc: "断筋刀。断筋+2，削攻+2。", hamstringBonus: 2, atkBreakBonus: 2 },
    blade_hamstring_red: { id: "blade_hamstring_red", name: "天残断骨刀", icon: "刀", school: "blade", rarity: "red", style: "hamstring", price: 980, atk: 58, desc: "断筋刀。断筋+4，断筋上限+2，削攻提高。", hamstringBonus: 4, hamstringCapBonus: 2, atkBreakBonus: 4 },

    // === 拳掌 ===
    fist_combo_blue: { id: "fist_combo_blue", name: "缠丝护腕", icon: "腕", school: "fist", rarity: "blue", style: "combo", price: 260, atk: 12, desc: "连击掌。连击+6，连击掌基础招只吃半效。", comboBonus: 6 },
    fist_combo_orange: { id: "fist_combo_orange", name: "拦江臂铠", icon: "腕", school: "fist", rarity: "orange", style: "combo", price: 520, atk: 28, desc: "连击掌。连击+12，连击后本回合伤害+8%。", comboBonus: 12, comboDmgPct: 8 },
    fist_combo_red: { id: "fist_combo_red", name: "惊浪拳套", icon: "拳", school: "fist", rarity: "red", style: "combo", price: 980, atk: 58, desc: "连击掌。连击+18，三叠浪额外出掌上限+1。", comboBonus: 18, palmChainBonus: 1 },

    fist_crit_blue: { id: "fist_crit_blue", name: "炽星拳套", icon: "拳", school: "fist", rarity: "blue", style: "critPalm", price: 260, atk: 12, desc: "暴击掌。暴击+4。", critBonus: 4 },
    fist_crit_orange: { id: "fist_crit_orange", name: "纯阳拳甲", icon: "拳", school: "fist", rarity: "orange", style: "critPalm", price: 520, atk: 28, desc: "暴击掌。暴击+7，暴伤+0.2。", critBonus: 7, critPower: 0.2 },
    fist_crit_red: { id: "fist_crit_red", name: "碎星拳套", icon: "拳", school: "fist", rarity: "red", style: "critPalm", price: 980, atk: 58, desc: "暴击掌。暴击+12，暴伤+0.35。", critBonus: 12, critPower: 0.35 },

    fist_qibreak_blue: { id: "fist_qibreak_blue", name: "破劲拳套", icon: "拳", school: "fist", rarity: "blue", style: "qiBreak", price: 260, atk: 12, desc: "断脉掌。削内+8。", qiBreakBonus: 8 },
    fist_qibreak_orange: { id: "fist_qibreak_orange", name: "截脉臂甲", icon: "腕", school: "fist", rarity: "orange", style: "qiBreak", price: 520, atk: 28, desc: "断脉掌。削内+18。", qiBreakBonus: 18 },
    fist_qibreak_red: { id: "fist_qibreak_red", name: "断脉神拳套", icon: "拳", school: "fist", rarity: "red", style: "qiBreak", price: 980, atk: 58, desc: "断脉掌。削内+30，归零追加伤害提高。", qiBreakBonus: 30, qiBreakCollapseBonus: 1 },

    // === 暗器 ===
    hidden_gu_blue: { id: "hidden_gu_blue", name: "蚀骨针囊", icon: "镖", school: "hidden", rarity: "blue", style: "gu", price: 260, atk: 10, desc: "下蛊暗器。蛊+1。", guBonus: 1 },
    hidden_gu_orange: { id: "hidden_gu_orange", name: "夺魂针盒", icon: "镖", school: "hidden", rarity: "orange", style: "gu", price: 520, atk: 24, desc: "下蛊暗器。蛊+2，耗内增加。", guBonus: 2, guQiBonus: 1 },
    hidden_gu_red: { id: "hidden_gu_red", name: "九窍蛊匣", icon: "镖", school: "hidden", rarity: "red", style: "gu", price: 980, atk: 50, desc: "下蛊暗器。蛊+4，蛊上限+2。", guBonus: 4, guCapBonus: 2 },

    hidden_poison_blue: { id: "hidden_poison_blue", name: "淬毒针匣", icon: "镖", school: "hidden", rarity: "blue", style: "poison", price: 260, atk: 10, desc: "淬毒暗器。毒+1。", poisonBonus: 1 },
    hidden_poison_orange: { id: "hidden_poison_orange", name: "淬毒银针", icon: "镖", school: "hidden", rarity: "orange", style: "poison", price: 520, atk: 24, desc: "淬毒暗器。毒+2，毒伤+15%。", poisonBonus: 2, poisonDmgPct: 15 },
    hidden_poison_red: { id: "hidden_poison_red", name: "孔雀毒匣", icon: "镖", school: "hidden", rarity: "red", style: "poison", price: 980, atk: 50, desc: "淬毒暗器。毒+4，毒上限+3。", poisonBonus: 4, poisonCapBonus: 3 },

    hidden_coin_blue: { id: "hidden_coin_blue", name: "金钱飞镖", icon: "镖", school: "hidden", rarity: "blue", style: "coin", price: 260, atk: 10, desc: "金钱暗器。金钱伤害+40。", coinDamageBonus: 40 },
    hidden_coin_orange: { id: "hidden_coin_orange", name: "贯钱镖", icon: "镖", school: "hidden", rarity: "orange", style: "coin", price: 520, atk: 24, desc: "金钱暗器。金钱伤害+120。", coinDamageBonus: 120 },
    hidden_coin_red: { id: "hidden_coin_red", name: "万贯金雨匣", icon: "镖", school: "hidden", rarity: "red", style: "coin", price: 980, atk: 50, desc: "金钱暗器。金钱伤害+260，终极金钱暗器花费降低。", coinDamageBonus: 260, coinCostReduce: 1 },

    // === 腿法装备 ===
    leg_evasive_blue: { id: "leg_evasive_blue", name: "探步靴", icon: "腿", school: "lightness", rarity: "blue", style: "evasive", price: 260, atk: 10, desc: "高闪避腿法。闪避+4。", dodgeBonus: 4 },
    leg_evasive_orange: { id: "leg_evasive_orange", name: "游龙靴", icon: "腿", school: "lightness", rarity: "orange", style: "evasive", price: 520, atk: 24, desc: "高闪避腿法。闪避+8，闪避回息提高。", dodgeBonus: 8, evasiveBoost: 1 },
    leg_evasive_red: { id: "leg_evasive_red", name: "踏浪战靴", icon: "腿", school: "lightness", rarity: "red", style: "evasive", price: 980, atk: 50, desc: "高闪避腿法。闪避+14，闪避收益每回合上限+1。", dodgeBonus: 14, evasiveCapBonus: 1 },

    leg_low_blue: { id: "leg_low_blue", name: "破门靴", icon: "腿", school: "lightness", rarity: "blue", style: "lowKick", price: 260, atk: 10, desc: "下盘腿法。真伤+25。", trueDamageBonus: 25 },
    leg_low_orange: { id: "leg_low_orange", name: "压山靴", icon: "腿", school: "lightness", rarity: "orange", style: "lowKick", price: 520, atk: 24, desc: "下盘腿法。真伤+90。", trueDamageBonus: 90 },
    leg_low_red: { id: "leg_low_red", name: "断岳沉步靴", icon: "腿", school: "lightness", rarity: "red", style: "lowKick", price: 980, atk: 50, desc: "下盘腿法。真伤+220。", trueDamageBonus: 220 },

    leg_steal_blue: { id: "leg_steal_blue", name: "盗影靴", icon: "腿", school: "lightness", rarity: "blue", style: "steal", price: 260, atk: 10, desc: "偷盗腿法。速度+0.04，偷钱+10。", speedBonus: 0.04, moneyBonus: 10 },
    leg_steal_orange: { id: "leg_steal_orange", name: "飞檐靴", icon: "腿", school: "lightness", rarity: "orange", style: "steal", price: 520, atk: 24, desc: "偷盗腿法。速度+0.08，偷钱+35。", speedBonus: 0.08, moneyBonus: 35 },
    leg_steal_red: { id: "leg_steal_red", name: "摘星掠影靴", icon: "腿", school: "lightness", rarity: "red", style: "steal", price: 980, atk: 50, desc: "偷盗腿法。速度+0.16，偷钱+90。", speedBonus: 0.16, moneyBonus: 90 }
  },
  // 防具
  armors: {
    armor_light_blue: { id: "armor_light_blue", name: "青布护身衣", icon: "衣", rarity: "blue", price: 220, hp: 160, def: 5, desc: "轻便护甲。速度+0.02。", speedBonus: 0.02 },
    armor_mid_blue: { id: "armor_mid_blue", name: "铁线软甲", icon: "甲", rarity: "blue", price: 260, hp: 190, def: 6, desc: "软铁编织护甲。闪避+2。", dodgeBonus: 2 },
    armor_heavy_blue: { id: "armor_heavy_blue", name: "硬布背心", icon: "甲", rarity: "blue", price: 240, hp: 220, def: 7, desc: "厚布硬衬背心。", dodgeBonus: 0 },
    armor_light_orange: { id: "armor_light_orange", name: "游云轻甲", icon: "衣", rarity: "orange", price: 480, hp: 360, def: 10, desc: "如云轻盈的护甲。速度+0.05。", speedBonus: 0.05 },
    armor_heavy_orange: { id: "armor_heavy_orange", name: "玄铁胸甲", icon: "甲", rarity: "orange", price: 580, hp: 520, def: 14, desc: "厚重玄铁。暴击伤害降低15%。", critReduce: 0.15 },
    armor_guard_orange: { id: "armor_guard_orange", name: "护心鳞甲", icon: "甲", rarity: "orange", price: 520, hp: 440, def: 12, desc: "护心镜鳞甲。低于30%血时直接伤害-20%。", lowHpGuard: 0.2, lowHpThreshold: 0.3 },
    armor_dragon_red: { id: "armor_dragon_red", name: "龙鳞重甲", icon: "甲", rarity: "red", price: 980, hp: 1080, def: 20, desc: "龙鳞所铸重甲。战斗开始获得30%最大血量护体，每场一次。", dragonGuard: 0.3 },
    armor_wuxiang_red: { id: "armor_wuxiang_red", name: "无相秘甲", icon: "衣", rarity: "red", price: 920, hp: 840, def: 18, desc: "无形无相。每场战斗前三个己方回合免疫新负面状态，不清已有负面。", immuneTurns: 3 },
    armor_tianheng_red: { id: "armor_tianheng_red", name: "天衡御心甲", icon: "甲", rarity: "red", price: 960, hp: 900, def: 22, desc: "御心之力。低于25%血时直接伤害-50%，持续伤害-25%。", lowHpGuard: 0.5, dotReduce: 0.25, lowHpThreshold: 0.25 }
  },
  enemies: [
    { id: "rogue", name: "二流高手", icon: "贼", portraitImage: "assets/portraits_pixel/rogue_pixel_320.webp", hp: 260, qi: 120, atk: 46, def: 22, combo: 2, hit: 55, dodge: 2, crit: 5, speed: 1.25, rank: 1 },
    { id: "blade", name: "快刀手", icon: "刀", portraitImage: "assets/portraits_pixel/blade_pixel_320.webp", hp: 330, qi: 180, atk: 62, def: 30, combo: 3, hit: 65, dodge: 3, crit: 8, speed: 1.55, rank: 2 },
    { id: "highDodgeAssassin", name: "踏影刺客", icon: "影", portraitImage: "assets/portraits_pixel/highDodgeAssassin_pixel_320.webp", hp: 300, qi: 220, atk: 66, def: 24, combo: 5, hit: 76, dodge: 42, crit: 14, speed: 1.85, rank: 2, trait: "evasive", traitName: "高闪避", traitDesc: "闪避极高，考验命中和必中招式。" },
    { id: "armorBreakBlade", name: "裂甲刀客", icon: "破", portraitImage: "assets/portraits_pixel/armorBreakBlade_pixel_320.webp", hp: 390, qi: 210, atk: 74, def: 34, combo: 3, hit: 68, dodge: 2, crit: 9, speed: 1.42, rank: 3, trait: "armorBreak", traitName: "破防刀", traitDesc: "攻击会忽略部分防御，并削弱防御。" },
    { id: "qiSuppressFist", name: "断脉拳师", icon: "拳", portraitImage: "assets/portraits_pixel/qiSuppressFist_pixel_320.webp", hp: 420, qi: 280, atk: 68, def: 38, combo: 7, hit: 70, dodge: 4, crit: 8, speed: 1.38, rank: 3, trait: "qiSuppress", traitName: "断脉掌", traitDesc: "前5回合攻击会削减内力，逼迫调息节奏（第6回合起不再削内）。" },
    { id: "witch", name: "毒娘子", icon: "毒", portraitImage: "assets/portraits_pixel/witch_pixel_320.webp", hp: 390, qi: 260, atk: 58, def: 32, combo: 4, hit: 66, dodge: 5, crit: 9, speed: 1.45, rank: 3 },
    { id: "demon", name: "心魔", icon: "魔", portraitImage: "assets/portraits_pixel/demon_pixel_320.webp", hp: 560, qi: 300, atk: 82, def: 42, combo: 6, hit: 66, dodge: 4, crit: 12, speed: 1.4, rank: 4 }
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
  combo: { id: "comboMastery", name: "长江三叠浪", desc: "连击掌触发连击时，其他连击掌冷却-1；若有掌法就绪，可立即继续出掌。每己方回合最多额外出掌2次。" },
  critPalm: { id: "critPalmMastery", name: "碎星连震", desc: "暴击拳掌暴击率提高，暴击倍率提高。暴击率软上限65%。" },
  qiBreak: { id: "qiBreakMastery", name: "断脉归元", desc: "断脉拳掌削内力提高，目标内力归零时额外受伤。每己方回合最多削目标最大内力25%。" },
  bleed: { id: "bleedBladeMastery", name: "百创刀势", desc: "流血刀造成流血时额外+1层，流血上限+3，流血伤害提高。" },
  frost: { id: "frostBladeMastery", name: "玄冥寒河", desc: "寒冰刀附加更多寒气，并进一步削减内力。速度最低降至60%。" },
  hamstring: { id: "hamstringBladeMastery", name: "天残绝路", desc: "断筋刀额外削攻击，断筋目标速度更低。攻击最低降至65%。" },
  gu: { id: "guMastery", name: "九窍蛊王", desc: "下蛊暗器附加更多蛊，并提高目标招式消耗。每己方回合最多扰乱CD一次。" },
  poison: { id: "poisonMastery", name: "孔雀毒雨", desc: "淬毒暗器中毒更深，并额外削减内力。毒不暴击。" },
  coin: { id: "coinMastery", name: "漫天金雨", desc: "金钱暗器固定伤害提高，终极金钱暗器花费降低。每己方回合最多1次，不暴击。" },
  evasive: { id: "evasiveLegMastery", name: "凌波回息", desc: "闪避后减冷却与调息效果提高。每回合最多触发1次。" },
  lowKick: { id: "lowKickMastery", name: "地裂无声", desc: "下盘腿法真伤提高，并额外压低目标速度。真伤不暴击。" },
  steal: { id: "stealLegMastery", name: "摘星夺魄", desc: "偷盗型腿法获得更多金钱，并提高出手速度。每己方回合最多1次。" }
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
  blade_red_1: ["bleed", "ultimate", "饮血封喉刀", "流血刀终极式。血刃封喉，重创见血。"],
  blade_blue_2: ["frost", "basic", "寒枝刀", "寒冰刀基础式。减速并削内力。"],
  blade_orange_2: ["frost", "advanced", "雪岭刀", "寒冰刀进阶式。寒气入脉，压低速度。"],
  blade_red_2: ["frost", "ultimate", "玄冥寒刀", "寒冰刀终极式。玄冥寒意，冻气断息。"],
  blade_blue_3: ["hamstring", "basic", "断步刀", "断筋刀基础式。减速并削攻击。"],
  blade_orange_3: ["hamstring", "advanced", "裂筋刀", "断筋刀进阶式。裂筋卸力。"],
  blade_red_3: ["hamstring", "ultimate", "天残断筋刀", "断筋刀终极式。断岳残步，攻势尽折。"],
  shadowSting: ["gu", "basic", "影蛊刺", "下蛊暗器基础式。提高目标冷却和内力消耗。"],
  hidden_orange_2: ["gu", "advanced", "生死蛊符", "下蛊暗器进阶式。蛊入经络，扰乱出招。"],
  hidden_red_2: ["gu", "ultimate", "九窍蛊针", "下蛊暗器终极式。九窍封息。"],
  springNeedle: ["poison", "basic", "青囊毒针", "淬毒暗器基础式。扣血并扣内力。"],
  hidden_orange_1: ["poison", "advanced", "冰魄毒针", "淬毒暗器进阶式。寒毒入脉。"],
  hidden_red_1: ["poison", "ultimate", "孔雀毒翎", "淬毒暗器终极式。毒雨齐发。毒不暴击。"],
  hidden_blue_4: ["coin", "basic", "金钱镖", "金钱暗器基础式。消耗金钱，固定伤害且必中。不暴击。"],
  hidden_orange_3: ["coin", "advanced", "金叶飞花", "金钱暗器进阶式。以钱开路，伤害稳定。"],
  hidden_red_3: ["coin", "ultimate", "漫天金雨", "金钱暗器终极式。金雨无空。"],
  light_blue_1: ["evasive", "basic", "燕回腿", "高闪避腿法基础式。闪避后减冷却并调息。每回合最多1次。"],
  light_orange_1: ["evasive", "advanced", "游龙腿", "高闪避腿法进阶式。游身避锋。"],
  light_red_1: ["evasive", "ultimate", "凌波腿", "高闪避腿法终极式。步生波纹。"],
  light_blue_2: ["lowKick", "basic", "扫堂腿", "下盘腿法基础式。忽略闪避和防御造成真伤。真伤不暴击。"],
  light_orange_2: ["lowKick", "advanced", "盘龙腿", "下盘腿法进阶式。盘根折势。"],
  light_red_2: ["lowKick", "ultimate", "碎岳沉桩腿", "下盘腿法终极式。碎岳真劲。"],
  light_blue_3: ["steal", "basic", "探囊腿", "偷盗型腿法基础式。高出手且能获取额外金钱。每回合最多1次。"],
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

export const INTERNAL_ARTS = {
  art_blue_1: { id: "art_blue_1", name: "紫霄清心诀", rarity: "blue", icon: "清", desc: "清心寡欲之诀。负面状态持续时间略降。血量+150，内力+50，防御+4。", statGain: { hp: 150, qi: 50, def: 4 }, combatEffect: "debuffReduce", combatDesc: "负面状态持续时间略降" },
  art_blue_2: { id: "art_blue_2", name: "混元真息", rarity: "blue", icon: "混", desc: "浑元一体，根基扎实。血量+140，内力+50，攻击+2，防御+2。", statGain: { hp: 140, qi: 50, atk: 2, def: 2 } },
  art_blue_3: { id: "art_blue_3", name: "罗汉镇岳功", rarity: "blue", icon: "镇", desc: "如山如岳，不动不移。血量+180，防御+7，受到直接伤害-3%。", statGain: { hp: 180, def: 7 }, combatEffect: "dmgReduce", combatDesc: "受到直接伤害-3%" },
  art_blue_4: { id: "art_blue_4", name: "回照心经", rarity: "blue", icon: "照", desc: "心光回照，滋养肉身。血量+150，内力+40，战斗开始恢复15%血量。", statGain: { hp: 150, qi: 40 }, combatEffect: "healOnStart", combatDesc: "战斗开始时恢复15%血量" },
  art_blue_5: { id: "art_blue_5", name: "太玄入门篇", rarity: "blue", icon: "玄", desc: "玄门筑基心法。内力+60，暴击+4。", statGain: { qi: 60, crit: 4 } },
  art_blue_6: { id: "art_blue_6", name: "龙象锻骨功", rarity: "blue", icon: "象", desc: "锻骨炼体，力大无穷。血量+150，攻击+7。", statGain: { hp: 150, atk: 7 } },
  art_blue_7: { id: "art_blue_7", name: "先天归元功", rarity: "blue", icon: "先", desc: "归元守一，内息绵绵。内力+70，命中+5，每回合恢复6%最大内力（上限10%）。", statGain: { qi: 70, hit: 5 }, combatEffect: "qiRegen", combatDesc: "每回合恢复6%最大内力" },
  art_blue_8: { id: "art_blue_8", name: "葵影残篇", rarity: "blue", icon: "葵", desc: "残卷仅有速功心法。闪避+6，出手速度+0.18。", statGain: { dodge: 6, speed: 0.18 } },
  art_orange_1: { id: "art_orange_1", name: "虚玄无相功", rarity: "orange", icon: "相", desc: "无形无相，气随意转。内力+110，连击+6，招式内力消耗-12%（降耗最高22%）。", statGain: { qi: 110, combo: 6 }, combatEffect: "qiReduce", combatDesc: "所有招式内力消耗-12%" },
  art_orange_2: { id: "art_orange_2", name: "纯阳正气诀", rarity: "orange", icon: "阳", desc: "纯阳之体，正气凛然。血量+300，攻击+10，暴击+4，暴击伤害+0.2。", statGain: { hp: 300, atk: 10, crit: 4 }, combatEffect: "critUp", combatDesc: "暴击倍率+0.2" },
  art_orange_3: { id: "art_orange_3", name: "玄霜真气", rarity: "orange", icon: "冰", desc: "玄霜入脉，寒意逼人。血量+180，内力+120，命中附加1层寒气（每己方回合最多1次）。", statGain: { hp: 180, qi: 120 }, combatEffect: "frostOnHit", combatDesc: "攻击/招式命中附加1层寒气（每回合最多1次）" },
  art_orange_4: { id: "art_orange_4", name: "摄元秘法", rarity: "orange", icon: "星", desc: "夺天地之元。血量+240，内力+100，命中吸取目标8%当前内力（上限40）。", statGain: { hp: 240, qi: 100 }, combatEffect: "drainQi", combatDesc: "攻击时汲取目标8%当前内力（上限40）" },
  art_red_1: { id: "art_red_1", name: "九曜真功", rarity: "red", icon: "曜", desc: "九曜盈体，生生不息。血量+720，内力+180，每回合恢复5%最大血量（上限6%）。", statGain: { hp: 720, qi: 180 }, combatEffect: "healOnTurn", combatDesc: "每回合开始恢复5%最大血量" },
  art_red_2: { id: "art_red_2", name: "大罗洗髓经", rarity: "red", icon: "髓", desc: "脱胎换骨，洗尽铅华。血量+520，内力+160，全属性+6，开场净化，前2己方回合负面抵抗提高。", statGain: { hp: 520, qi: 160, atk: 6, def: 6, hit: 6, dodge: 6, crit: 6, speed: 0.06 }, combatEffect: "cleanse", combatDesc: "战斗开始清除所有负面状态，前2己方回合负面抵抗" },
  art_red_3: { id: "art_red_3", name: "天衡神照经", rarity: "red", icon: "衡", desc: "天衡运转，神照万象。血量+600，内力+220，战斗开始恢复25%血量和15%内力。", statGain: { hp: 600, qi: 220 }, combatEffect: "bigHealStart", combatDesc: "战斗开始恢复25%血量+15%内力" },
  art_red_4: { id: "art_red_4", name: "玄元龙象功", rarity: "red", icon: "龙", desc: "龙象之力，转化万钧。血量+480，内力+160，攻击+14，受直接伤害的20%转为内力。", statGain: { hp: 480, qi: 160, atk: 14 }, combatEffect: "dmgToQi", combatDesc: "受直接伤害的20%转为内力" }
};
DATA.internalArts = INTERNAL_ARTS;

// ============================================================
// 三主线叙事数据（v0.34）
// ============================================================
DATA.storylines = {
  wanderer: {
    id: "wanderer",
    name: "孤云逐浪",
    threatName: "武盟威势",
    threatDesc: "武盟对散人的压迫日增",
    bosses: {
      1: { id: "wanderer_boss_y1", name: "青旗堂主·陆闻川", icon: "刀", portraitImage: "assets/portraits_pixel/lu_wenchuan_pixel_320.webp", year: 1, hp: 2000, qi: 620, atk: 108, def: 64, combo: 4, hit: 76, dodge: 8, crit: 12, speed: 1.48, boss: true, bossTrait: "bleedPer3", bossTraitDesc: "每3回合对玩家叠加2层流血；直接伤害附带轻破防" },
      2: { id: "wanderer_boss_y2", name: "执法长老·孟天衡", icon: "掌", portraitImage: "assets/portraits_pixel/meng_tianheng_pixel_320.webp", year: 2, hp: 3800, qi: 1050, atk: 150, def: 105, combo: 5, hit: 84, dodge: 10, crit: 14, speed: 1.58, boss: true, bossTrait: "hamstringCap", bossTraitDesc: "断筋上限+2；玩家速度最低可被压到70%" },
      3: { id: "wanderer_final", name: "武盟帮主·岳宗玄", icon: "魔", portraitImage: "assets/portraits_pixel/yue_zongxuan_pixel_320.webp", year: 3, hp: 7600, qi: 2100, atk: 225, def: 165, combo: 8, hit: 92, dodge: 16, crit: 22, speed: 1.72, boss: true, bossTrait: "shieldCleanCounter", bossTraitDesc: "开场25%护体；50%血净化一次；低血反击" }
    },
    events: [
      { id: "wanderer_notice", name: "武盟征帖", category: "主线", icon: "帖", desc: "武盟命散人入册听调，不从者视为武林公敌。", type: "story", yearMin: 1, yearMax: 3 },
      { id: "wanderer_rescue", name: "散人求援", category: "主线", icon: "援", desc: "几位被武盟围捕的散人向你求援，声称只是不愿加入武盟。", type: "story", yearMin: 1, yearMax: 3 },
      { id: "wanderer_order", name: "堂口密令", category: "主线", icon: "令", desc: "你偶然截获一份武盟堂口的密令，其中记载了对付散人的计划。", type: "story", yearMin: 1, yearMax: 3 },
      { id: "wanderer_friend", name: "旧友被捕", category: "主线", icon: "囚", desc: "旧友因拒不入盟被武盟执法堂押走，即将受审。", type: "story", yearMin: 1, yearMax: 2 },
      { id: "wanderer_purge", name: "正派围剿", category: "主线", icon: "剿", desc: "武盟开始清洗不服从的门派和散人，你也在围剿名单上。", type: "story", yearMin: 2, yearMax: 3 }
    ]
  },
  constable: {
    id: "constable",
    name: "铁鹰入局",
    threatName: "内廷疑云",
    threatDesc: "内廷爪牙渗透日深",
    bosses: {
      1: { id: "constable_boss_y1", name: "东厂档头·韩玉阙", icon: "镖", portraitImage: "assets/portraits_pixel/han_yuque_pixel_320.webp", year: 1, hp: 1850, qi: 700, atk: 100, def: 58, combo: 5, hit: 86, dodge: 10, crit: 10, speed: 1.60, boss: true, bossTrait: "highHitPoison", bossTraitDesc: "暗器命中高；毒层结算后自然衰减" },
      2: { id: "constable_boss_y2", name: "锦衣指挥使·沈镇岳", icon: "刀", portraitImage: "assets/portraits_pixel/shen_zhenyue_pixel_320.webp", year: 2, hp: 3600, qi: 980, atk: 165, def: 92, combo: 6, hit: 88, dodge: 12, crit: 20, speed: 1.62, boss: true, bossTrait: "critBreakDef", bossTraitDesc: "暴击破防；玩家防御最多被压到75%" },
      3: { id: "constable_final", name: "司礼监掌印·魏承恩", icon: "魔", portraitImage: "assets/portraits_pixel/wei_chengen_pixel_320.webp", year: 3, hp: 7200, qi: 2300, atk: 210, def: 145, combo: 7, hit: 95, dodge: 20, crit: 18, speed: 1.82, boss: true, bossTrait: "drainQiImmuneBurst", bossTraitDesc: "每回合吸内；前3回合免疫负面；内力低时爆发" }
    },
    events: [
      { id: "constable_edict", name: "密诏夜传", category: "主线", icon: "诏", desc: "内廷密使深夜造访，传了一道密诏：要你秘密调查锦衣卫中的叛党。", type: "story", yearMin: 1, yearMax: 3 },
      { id: "constable_file", name: "灭口案卷", category: "主线", icon: "卷", desc: "一桩旧案的卷宗中藏有厂卫灭口的证据，牵连甚广。", type: "story", yearMin: 1, yearMax: 2 },
      { id: "constable_test", name: "厂卫试探", category: "主线", icon: "探", desc: "几个厂卫突然登门，说是奉命来试你的功夫——实为试探你的立场。", type: "story", yearMin: 1, yearMax: 2 },
      { id: "constable_oldcase", name: "宫中旧案", category: "主线", icon: "案", desc: "一桩宫中旧案浮出水面，牵涉到掌印太监和江湖势力的勾结。", type: "story", yearMin: 2, yearMax: 3 },
      { id: "constable_witness", name: "江湖证人", category: "主线", icon: "证", desc: "一位江湖人声称知道内廷勾结江湖的证据，但正被人追杀。", type: "story", yearMin: 2, yearMax: 3 }
    ]
  },
  orthodox: {
    id: "orthodox",
    name: "天衡照邪",
    threatName: "鬼教阴影",
    threatDesc: "鬼教势力暗中蔓延",
    bosses: {
      1: { id: "orthodox_boss_y1", name: "鬼教香主·白无咎", icon: "毒", portraitImage: "assets/portraits_pixel/bai_wujiu_pixel_320.webp", year: 1, hp: 1900, qi: 760, atk: 96, def: 60, combo: 5, hit: 78, dodge: 12, crit: 10, speed: 1.52, boss: true, bossTrait: "poisonGuPerTurn", bossTraitDesc: "每回合毒+1蛊+1；每回合只衰减一种负面" },
      2: { id: "orthodox_boss_y2", name: "黑莲护法·桑暮雨", icon: "魔", portraitImage: "assets/portraits_pixel/sang_muyu_pixel_320.webp", year: 2, hp: 3900, qi: 1200, atk: 145, def: 95, combo: 6, hit: 84, dodge: 16, crit: 14, speed: 1.65, boss: true, bossTrait: "drainQiLowShield", bossTraitDesc: "命中吸内；低血获得15%护体" },
      3: { id: "orthodox_final", name: "鬼教掌门·夜摩罗", icon: "魔", portraitImage: "assets/portraits_pixel/ye_moluo_pixel_320.webp", year: 3, hp: 7800, qi: 2200, atk: 220, def: 150, combo: 8, hit: 90, dodge: 22, crit: 20, speed: 1.78, boss: true, bossTrait: "poisonGuCapCleanse", bossTraitDesc: "毒蛊上限+3；50%血时净化并回血20%" }
    },
    events: [
      { id: "orthodox_plague", name: "村镇蛊疫", category: "主线", icon: "疫", desc: "山脚村镇突然爆发怪病，村民高烧不退，似是蛊毒作祟。", type: "story", yearMin: 1, yearMax: 2 },
      { id: "orthodox_lotus", name: "黑莲符印", category: "主线", icon: "莲", desc: "城墙上出现了鬼教的黑莲符印，城中人心惶惶。", type: "story", yearMin: 1, yearMax: 3 },
      { id: "orthodox_missing", name: "同门失踪", category: "主线", icon: "踪", desc: "几位下山巡山的同门弟子突然失踪，最后出现的地方有打斗痕迹。", type: "story", yearMin: 1, yearMax: 2 },
      { id: "orthodox_ruin", name: "邪坛遗迹", category: "主线", icon: "坛", desc: "山中发现一处古老的邪教祭坛，上面仍有新鲜的血迹。", type: "story", yearMin: 2, yearMax: 3 },
      { id: "orthodox_bell", name: "夜半钟声", category: "主线", icon: "钟", desc: "深夜钟声回荡山谷，据说是鬼教祭仪的前兆。", type: "story", yearMin: 2, yearMax: 3 }
    ]
  }
};

// 主线故事事件执行函数映射（在 runSystem.js 中实现，这里只定义数据结构）
// 注意：这些事件的实际 apply 逻辑在 runSystem.js 的 resolveStoryEvent 中

// 小Boss池
DATA.miniBosses = [
  { id: "mini_bleed_blade", name: "血刀客", icon: "刀", portraitImage: "assets/portraits_pixel/mini_bleed_blade_pixel_320.webp", yearMin: 2, hp: 1400, qi: 420, atk: 85, def: 45, combo: 4, hit: 72, dodge: 6, crit: 10, speed: 1.42, boss: true, bossTrait: "miniBleed", bossTraitDesc: "流血+2，上限10", rank: 3 },
  { id: "mini_frost_assassin", name: "寒衣刺客", icon: "影", portraitImage: "assets/portraits_pixel/mini_frost_assassin_pixel_320.webp", yearMin: 2, hp: 1200, qi: 500, atk: 78, def: 38, combo: 5, hit: 80, dodge: 28, crit: 12, speed: 1.70, boss: true, bossTrait: "miniFrost", bossTraitDesc: "高闪避，寒气+1", rank: 3 },
  { id: "mini_hamstring_blade", name: "断筋刀师", icon: "刀", portraitImage: "assets/portraits_pixel/mini_hamstring_blade_pixel_320.webp", yearMin: 2, hp: 2400, qi: 760, atk: 120, def: 70, combo: 5, hit: 80, dodge: 10, crit: 12, speed: 1.50, boss: true, bossTrait: "miniHamstring", bossTraitDesc: "断筋+2，削攻", rank: 4 },
  { id: "mini_gu_priest", name: "蛊道人", icon: "毒", portraitImage: "assets/portraits_pixel/mini_gu_priest_pixel_320.webp", yearMin: 2, hp: 2200, qi: 900, atk: 105, def: 60, combo: 4, hit: 78, dodge: 14, crit: 10, speed: 1.48, boss: true, bossTrait: "miniGu", bossTraitDesc: "蛊+2，增加耗内", rank: 4 },
  { id: "mini_coin_dart", name: "金钱镖客", icon: "镖", portraitImage: "assets/portraits_pixel/mini_coin_dart_pixel_320.webp", yearMin: 2, hp: 2000, qi: 600, atk: 110, def: 55, combo: 5, hit: 88, dodge: 12, crit: 12, speed: 1.62, boss: true, bossTrait: "miniCoin", bossTraitDesc: "每2回合一次必中固定伤害", rank: 4 },
  { id: "mini_armor_monk", name: "玄甲武师", icon: "甲", portraitImage: "assets/portraits_pixel/mini_armor_monk_pixel_320.webp", yearMin: 3, hp: 3600, qi: 1000, atk: 150, def: 130, combo: 3, hit: 82, dodge: 8, crit: 10, speed: 1.35, boss: true, bossTrait: "miniArmor", bossTraitDesc: "高防，开场20%护体", rank: 5 }
];

// 主线事件处理逻辑（由 resolveStoryEvent 调用）
// 这些函数在 runSystem.js 中通过 DATA.storyEventHandlers 注册
DATA.storyEventHandlers = {};

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
