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
      1: { id: "wanderer_boss_y1", name: "杭州堂主·赵崇岳", icon: "刀", portraitImage: "assets/portraits_pixel/lu_wenchuan_pixel_320.webp", year: 1, hp: 8000, qi: 1800, atk: 160, def: 90, combo: 5, hit: 80, dodge: 10, crit: 14, speed: 1.50, boss: true, bossTrait: "lowHpBerserk", bossTraitDesc: "低血时攻速双升；九环刀法范围攻击" },
      2: { id: "wanderer_boss_y2", name: "左护法·沈千山", icon: "戟", portraitImage: "assets/portraits_pixel/meng_tianheng_pixel_320.webp", year: 2, hp: 15000, qi: 3500, atk: 240, def: 160, combo: 6, hit: 88, dodge: 14, crit: 18, speed: 1.65, boss: true, bossTrait: "berserkSummon", bossTraitDesc: "70%血狂暴；30%血召唤护卫；均衡全面" },
      3: { id: "wanderer_final", name: "武盟统领·楚宗玄", icon: "魔", portraitImage: "assets/portraits_pixel/yue_zongxuan_pixel_320.webp", year: 3, hp: 30000, qi: 6000, atk: 320, def: 220, combo: 8, hit: 95, dodge: 20, crit: 24, speed: 1.80, boss: true, bossTrait: "shieldPurityBerserk", bossTraitDesc: "开场25%护体；50%血净化一次；15%血攻翻倍防归零" }
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

// ============================================================
// 孤云逐浪 36月叙事数据（v5.4）
// ============================================================
DATA.wandererMonths = {
  1: {
    title: "活人变鬼",
    text: "半个月前隔壁老李被武盟带走，说是去杭州\"做差事\"，一个月二十两银子。他老婆当时还笑。今天老李回来了——是被抬回来的，一床破席裹着，两条腿没了，胸口一道贯穿伤。他老婆哭到晕厥时，你听到老李微弱地说了一句：\"别……别去登记……那是矿坑……\"第二天，一张烫金帖子飞进院门：「三日内杭州堂口入册。逾期者，强制押解。」你握着剑柄的手在抖。不是因为怕——是因为愤怒。",
    choices: [
      { id:"accept", label:"顺应：暂且登记", desc:"先稳住，摸清底细再图后计", effect:{mainThreat:1, money:120, flag:"registered"} },
      { id:"resist", label:"抗争：撕帖明志", desc:"老子不入那个册", effect:{triggerBattle:true, enemyId:"tangkou_enforcer", exp:80, flag:"publicResist"} }
    ]
  },
  2: {
    title: "故人夜叩",
    text: "子时敲门——三声顿，两声续。方平来了。但他这次没带银子。左臂缠着渗血的布条，脸色苍白如纸：\"昨晚他们来抓我了……我跑了一个时辰才甩掉。\"他从怀里掏出一卷皱巴巴的纸，展开来，血迹尚未干透。上面密密麻麻写着名字和去向——矿坑、边关哨所、某位员外的私邸……大部分名字旁边打了一个叉。方平低声说：\"打了叉的，死了。\"话音未落，院门外传来杂乱的脚步声。火把的光映上了窗纸。",
    choices: [
      { id:"accept", label:"顺应：带方平撤离", desc:"保住人要紧，留得青山在", effect:{money:-80, flag:"fangpingBond_deep", gainItem:"waibian_team_roster"} },
      { id:"resist", label:"抗争：正面突围", desc:"让散人不好惹", effect:{triggerBattle:true, enemyId:"capture_squad", exp:150, atk:1, flag:"publicResist", gainItem:"waibian_team_roster"} }
    ],
    triggerBattle: true, enemyId: "capture_squad",
    battleDesc: "持火把破门而入的抓捕队员。领头一脸横肉，腰间挂着短棍与绳索——专门来收人的。方平左臂有伤，你得独自挡住大部。",
    battleReward: { exp:180, money:50, gainItem:"enforcer_captured_weapon", fame:20 }
  },
  3: {
    title: "密令与茶",
    text: "你在堂口偷翻到一封密令，内容比你想的更狠：「江南散人入编进度迟缓。即日起改行强硬手段——拒册者一律编入'敢死队'，充作剿匪前驱。另：每交付合格外编人员五十名，堂口可获赏银五百两及总坛功勋牌一枚。」角落批注是赵崇岳亲笔：\"人命不值钱。加把劲。\"散人在武盟眼里根本不是人——是五百两银一批发的人肉货币。送去剿匪当前驱送死，或者卖给权贵当私兵、角斗士取乐。登记就是卖身契。离开时廊下遇一个灰袍人喝茶。他看了看你手里的东西，没告发你。自称孟天衡。当晚，你决定独闯堂口找那个胖执事算账。",
    choices: [
      { id:"accept", label:"顺势传播证据", desc:"让天下散人都看清真相", effect:{mainThreat:1, exp:120, fame:50, flag:"leakedIntel"} },
      { id:"resist", label:"独自消化情报", desc:"留作日后致命底牌", effect:{int:2, gainItem:"wumeng_slavery_order", flag:"keptIntel"} }
    ],
    triggerBattle: true, enemyId: "tangkou_fat_boss",
    battleDesc: "堂口执事带着弟子拦路。胖子武功不高，但桌上有花名册和外编调拨文书——必须抢到手，这是能置武盟于死地的证据。",
    battleReward: { exp:200, money:80, gainItem:"hangzhou_registry_copy", gainItem2:"slave_allocation_records" }
  },
  4: {
    title: "铁窗内外",
    text: "方平还是被抓了。但这次你知道为什么——因为他在茶馆里大声念那张外编队名单上的名字，一个一个地念，连死因都念出来了。消息传来时你的剑掉在了地上。他入狱前的最后一句话传出来是笑着说的：\"老子念的是真话。有种来杀我啊。\"你赶到杭州大牢，隔着铁栅栏看到的不仅是嘴角的淤青——还有他右手食指和中指的扭曲变形。那是审讯留下的痕迹。狱卒冷眼旁观：\"拒册又煽动的，按新规矩——要么入册签卖身契，要么……\"他没说完，但指了指后院的方向。那里传来隐约的呻吟声。",
    choices: [
      { id:"accept", label:"顺应：丑时闯牢", desc:"武力救人，不再等", effect:{mainThreat:2, def:3, triggerBattle:true, enemyId:"jail_captain", exp:150, flag:"fangpingSaved"} },
      { id:"resist", label:"抗争：求那灰袍人", desc:"赌他还有底线", effect:{money:-400, flag:"fangpingSaved", flag2:"oweMeng"} }
    ]
  },
  5: {
    title: "满城金旗",
    text: "金色令旗一夜之间插遍江南。令旗下的新规只有三条：一、窝藏拒册者，同罪论处，编入外编队。二、举报拒册散人者，赏银十两。三、抗拒抓捕者——格杀勿论。第三条是新增的。以前是\"拘押\"，现在是\"格杀\"。你在苏州官道亲眼见到的一幕刻进了骨子里：几个武盟弟子拖着一个年轻散人往马车上拽。那散人不过十几岁的样子，哭着喊\"我没犯法，我只是不想登记\"。领头的弟子面无表情，拔刀在他腿上划了一道——不是为了杀他，是为了让他走不了，只能被拖上车。周围那么多人看着，没有一个人上前。方平攥紧了拳头，指节泛白。你握紧了剑柄，走了上去。",
    choices: [
      { id:"accept", label:"暗中联络各方", desc:"结成暗网互通风声", effect:{mainThreat:2, flag:"builtNetwork"} },
      { id:"resist", label:"蛰伏修炼", desc:"实力不足救人等于送死", effect:{exp:300, atk:2, def:2, flag:"focusedTraining"} }
    ],
    triggerBattle: true, enemyId: "patrol_squad",
    battleDesc: "巡逻弟子正将年轻散人拖上马车。领头使刀，其余人持绳索木棒——这是他们的日常工作。你拔剑而出。",
    battleReward: { exp:120, fame:30, flag:"savedYoungWanderer" }
  },
  6: {
    title: "梅边二叙",
    text: "那灰袍人第二次来找你。槐树下喝酒，他的杯子端了很久都没喝。他自称姓孟，是武盟中人，但看不下去赵崇岳干的事。他告诉你赵崇岳将散人打包出售——江南富商三百两买家丁护卫，北方将军要免费的探路炮灰，城南地下角斗场消耗剩余人力。他还透露杭州城外龙井谷聚集了一批散人，领头的叫韩铁衣。他说三个月后会奉命来彻查——到时候给他一个能交代的理由。话音未落，赵崇岳麾下执法队长周通带着人堵住了院子。周通掂了掂手中的铁手套，咧嘴一笑：\"奉命'劝导'拒册散人。劝不听的话——我这双手套开过不少瓢。\"",
    choices: [
      { id:"accept", label:"坦诚相待", desc:"赌这灰袍人的底线还在", effect:{mengFavor:2, flag:"mengAlliance_open"} },
      { id:"resist", label:"虚与委蛇", desc:"继续观察不暴露底牌", effect:{int:2, flag:"mengAlliance_none"} }
    ],
    triggerBattle: true, enemyId: "zhou_tong_iron_hand",
    isMiniBoss: true, bossRank: 2,
    battleDesc: "铁手周通使一对精铁手套，每一拳都带着骨裂之声。他是赵崇岳麾下得力干将——劝导不成便动手，手上不止一条人命。",
    battleReward: { exp:350, fame:80, gainItem:"iron_glove_fragment", atk:2 }
  },
  7: {
    title: "清剿令下",
    text: "总坛批复到了——赵崇岳获准武力清剿。批复上四个字格外刺眼：「格杀勿论」。你终于明白：从第一天起，这就不是什么\"管束\"的问题。武盟要的不是散人听话——是要散人死，或者变成他们的财产。你对方平说：\"去龙井谷，韩铁衣那里是第一个目标。\"方平问：\"就我们两个？\"你说：\"先去。能救多少救多少。\"",
    choices: [
      { id:"accept", label:"求援各方", desc:"集结力量守谷", effect:{mainThreat:2, fame:150, flag:"qingyunReinforced"} },
      { id:"resist", label:"主动阻击", desc:"打乱敌军部署争取时间", effect:{mainThreat:3, atk:3, exp:250, triggerBattle:true, enemyId:"vanguard_captain", flag:"vanguardDelayed"} }
    ]
  },
  8: {
    title: "山雨欲来",
    text: "距大军抵达还有十天。你在龙井谷外围设防时撞上了武盟斥候小队。对方发现你后立刻试图发信号——必须在他们报信之前全部拿下。这一仗不能输，输了龙井谷的位置就暴露了。",
    choices: [
      { id:"accept", label:"坚守防御", desc:"加固工事打守城战", effect:{def:5, flag:"preparedDefense"} },
      { id:"resist", label:"奇谋伏击", desc:"运动中歼敌", effect:{int:4, exp:200, flag:"preparedAmbush"} }
    ],
    triggerBattle: true, enemyId: "scout_team",
    battleDesc: "武盟斥候在山脊线上侦察龙井谷防御。被发现后他们试图发信号——一旦烽烟升起，总坛立刻收到警报！",
    battleReward: { exp:180, gainItem:"enemy_signal_plan", int:1 }
  },
  9: {
    title: "血色黎明",
    text: "黎明时分，赵崇岳的大军布满了整座山谷。韩铁衣走到你身边。他穿着一身洗到发白的粗布短打，袖口磨出了线头，但腰杆挺得笔直。手上端着一碗素面，热气在晨光里升腾。\"谢了。\"他顿了顿，\"要不是你提前报信，这谷里的人昨晚就没了。\"他没再多说，低头把面吃完。碗搁在石头上时，山下号角吹响了——进攻开始。这一战，避无可避。",
    choices: [
      { id:"accept", label:"承诺接班", desc:"若幸存则接领袖之责", effect:{fame:200, flag:"promisedLeadership"} },
      { id:"resist", label:"专注眼前", desc:"不正面回应承诺", effect:{flag:"promisedLeadership_false"} }
    ]
  },
  10: {
    title: "龙井谷血战",
    text: "这一天打了整整一天。三轮攻势下来，龙井谷已成一片火海。浓烟中找到韩铁衣时，他倒在地上浑身是伤。身边的敌人都是一击毙命。他费力睁开眼笑了：\"还好赶上了……见最后一面……\"他咳出一口血，抓住你的手腕——力气大得不像将死之人。\"兄弟……散人的这面旗……太沉……你得接着扛。\"然后他的手松开了。你跪在烟雾中看着自己沾满血灰的手。这双手，再也洗不干净了。幸存者围了上来。一个小伙子哑着嗓子问：\"扛旗的人没了……我们怎么办？\"你站起来，用尽全身力气把那面被烟火熏黑的旗插进了焦土里。",
    choices: [
      { id:"accept", label:"立誓接旗", desc:"承接散人领袖之责", effect:{mainThreat:3, atk:5, def:3, fame:300, flag:"becameLeader"} },
      { id:"resist", label:"收集证据", desc:"优先记录罪证留日后清算", effect:{mainThreat:1, int:3, gainItem:"longjing_massacre_evidence", flag:"evidenceCollector"} }
    ],
    triggerBattle: true, enemyId: "protectorate_deputy",
    isClimaxBattle: true,
    battleDesc: "左护法麾下副将率精锐冲破防线杀入谷中。这是龙井谷最惨烈的一战——韩铁衣刚刚牺牲，愤怒的你如同一头出笼猛虎。",
    battleReward: { exp:500, fame:200, gainItem:"tieyi_last_letter", atk:3, def:2 }
  },
  11: {
    title: "四面楚歌",
    text: "龙井谷的消息飞遍了江湖。武盟加大了搜捕力度，每天都有散人来投奔或者求救。方平熬红了眼擦剑，说：\"我一闭眼就看见韩铁衣，还有那个小伙子的脸。\"门外又有马蹄声响——据线报，一支残部正在附近搜捕逃散的幸存者。接到的新命令是：\"宁可错杀，不可漏网。\"",
    choices: [
      { id:"accept", label:"设擂立威", desc:"公开凝聚人心", effect:{mainThreat:2, exp:350, fame:400, flag:"publicFigure"} },
      { id:"resist", label:"分化瓦解", desc:"策反中层从内部瓦解", effect:{mainThreat:1, int:4, gainItem:"wumeng_defector_list", flag:"subversionActive"} }
    ],
    triggerBattle: true, enemyId: "remnant_squad",
    battleDesc: "溃军正在搜捕龙井谷幸存的散人。命令是宁可错杀不可漏网。你亲自带队追击——这一次，不再是一个人在战斗。",
    battleReward: { exp:250, money:150, fame:60 }
  },
  12: {
    title: "年终之战·赵崇岳之死",
    text: "黄昏，赵崇岳亲临谷前。九环大刀插在地上，刀环叮当作响。\"你就是那个拒册的散人？\"他拔刀，夕阳染红整片山谷，\"知不知道因为你一个人，我少赚了多少银子？\"他居然在笑——那种数钱时候才会有的表情。这场仗打了一整个时辰。最后你抓住第九环刀法的收招间隙，剑入了他的胸膛。赵崇岳倒地前还在笑：\"你以为杀了我……事情就完了？总坛不会……放过你的……\"他到死都没有后悔。因为他真的只把你和我看成了一笔亏了的账。第一年，结束。",
    choices: [
      { id:"accept", label:"收兵安顿", desc:"收殓死者安顿幸存者", effect:{mainThreat:2, fame:200, flag:"year1Completed", yearEnding:"peaceful"} },
      { id:"resist", label:"乘胜追击", desc:"扩大战果不留余地", effect:{mainThreat:4, exp:500, atk:3, flag:"year1Completed", flag2:"aggressivePursuit", yearEnding:"aggressive"} }
    ],
    triggerFinalBoss: "zhao_chongyue", isYearEndBoss: true,
    bossInfo: { name:"赵崇岳", title:"杭州堂主", weapon:"九环大刀", style:"大开大合的力量型", rank:5, hp:8000, skills:["九环劈山","横扫千军","金刚护体"] },
    battleReward: { exp:1000, fame:500, gainItem:"zhao_nine_ring_blade", money:500, atk:5, def:3 }
  },
  13: {
    title: "风暴再起",
    text: "赵崇岳的死讯传到了总坛。据说总坛震动，随即下令——左护法沈千山亲率大军南下。但真正让你心寒的是另一件事。武盟发布了新的「入册补充条款」，条款写得冠冕堂皇——\"为保障散人权益，设立安置营统一管理\"。但你从截获的信件中读到：所谓\"安置营\"就是集中营的别名。进去的人按技能分类——有武功的去前线当炮灰，没武功的送到矿坑和作坊，用到不能再用为止。方平问你怕不怕。你说怕。他又问还干不干。你说干。",
    choices: [
      { id:"accept", label:"召开散人大会", desc:"正式组建联盟对抗", effect:{fame:300, flag:"leagueFounded"} },
      { id:"resist", label:"分散隐蔽", desc:"化整为零避锋芒", effect:{int:3, mainThreat:0, flag:"guerrillaMode"} }
    ]
  },
  14: {
    title: "昆仑结盟",
    text: "首次散人大会在昆仑山召开，各路散人武者纷纷到场。会上争论不休之际，一个武盟探子混进了人群。被人识破后，他当即拔刀伤人，企图突围出去报信。此人的武功不低，人群中穿梭如电——若让他回去，后果不堪设想。",
    choices: [
      { id:"accept", label:"集中指挥", desc:"统一调度更高效", effect:{fame:150, flag:"centralizedCommand"} },
      { id:"resist", label:"松散自治", desc:"各队自行决策", effect:{flag:"looseConfederation"} }
    ],
    triggerBattle: true, enemyId: "wumeng_spy_assassin",
    battleDesc: "潜伏大会中的武盟探子暴露后拔刀行凶，人群中穿梭如电——不能让他活着回去报信！",
    battleReward: { exp:200, int:1, gainItem:"wumeng_infiltration_letter" }
  },
  15: {
    title: "峡谷截击",
    text: "沈千山的副手柳长卿先行试探。此人使寒铁长剑，剑术诡异莫测，设伏被你和方平合力逼退。临走时他说：\"左护法说了，愿入籍的话待遇从优，不必去外编队。\"这话本身就是最大的侮辱——不必去外编队，意思是其他人活该去送死。接连战胜赵崇岳和柳长卿，散人们看你的眼光变了。他们开始相信，你真的能带他们走出一条生路。",
    choices: [
      { id:"accept", label:"接受谈判邀请", desc:"见见沈千山的底牌", effect:{flag:"metShenInvitation"} },
      { id:"resist", label:"拒绝并追击", desc:"不给任何喘息空间", effect:{triggerBattle:true, enemyId:"liu_changqing_retreat", exp:300, flag:"liuChase"} }
    ],
    triggerBattle: true, enemyId: "hanjian_liu_changqing",
    isMiniBoss: true, bossRank: 3,
    bossInfo: { name:"柳长卿", title:"左护法副使·寒剑", weapon:"寒铁长剑", style:"高速诡变剑术", rank:3, hp:4500, skills:["寒霜剑气","幻影分身","冰封三尺"] },
    battleReward: { exp:500, fame:150, gainItem:"cold_iron_shard", agi:3 }
  },
  16: {
    title: "孟天衡的信",
    text: "一只信鸽落在你窗台上。信上只有八个字：「安置营位置图附后。」信封里是一张画在羊皮纸上的地图——一个个红圈标记着江南各地\"安置营\"的位置，每个旁边标注着人数。没有署名。但你认得这笔迹。孟天衡在用自己的命给你递一把刀。这张图足以让武盟的罪行无所遁形。",
    choices: [
      { id:"accept", label:"趁夜突袭安置营", desc:"抢在转移之前救人", effect:{triggerBattle:true, enemyId:"camp_guard_captain", exp:250, mainThreat:2, flag:"nightRaid"} },
      { id:"resist", label:"按兵不动", desc:"保存实力先用地图布局", effect:{int:2, flag:"patientStrategy", mengFavor:1, gainItem:"camp_location_map"} }
    ]
  },
  17: {
    title: "内鬼",
    text: "联盟内部出了问题——粮草调配名单外泄，接连三次行动都被武盟提前预知。方平查到一个可疑人物：负责后勤的老张，最近频繁往杭州方向送信。对质那天，老张直接拔了刀。他脸上的表情不是愧疚，而是恐惧——一种比面对你更深沉的恐惧。\"他们……他们在俺老家……全家……\"老张的声音在抖，\"俺不送信……他们就……\"你忽然意识到：武盟控制人的手段不只是暴力——还有你所爱的人。他不是坏人，只是个被人捏住了软肋的父亲。",
    choices: [
      { id:"accept", label:"帮他救家人再处置", desc:"人可以被胁迫，但选择权在自己", effect:{money:-300, flag:"rescuedTraitorsFamily"} },
      { id:"resist", label:"依律处置不留后患", desc:"军法无情但派人暗助其家人", effect:{flag:"publicExecution", flag2:"secretFamilyRescue", int:2, gainItem:"traitor_upstream_info"} }
    ],
    triggerBattle: true, enemyId: "traitor_oldzhang_with_aids",
    battleDesc: "老张狗急跳墙，两名同伙也从暗处窜出。他不是坏人——只是个被人捏住了软肋的父亲。但背叛就是背叛，你必须在这里做一个决断。",
    battleReward: { exp:180, gainItem:"bribe_gold_list", money:200 }
  },
  18: {
    title: "灵寺夜话",
    text: "你决定去见一见沈千山。不是投降，而是想看看这个亲手屠谷、把人当成货物贩卖的人到底在想什么。灵隐寺深夜，沈千山独自坐在大殿里擦拭佩剑。见到你没有惊讶，只说了一句：\"你确实很勇敢。\"你们谈了一个时辰。提起外编队和安置营的时候，他的反应出乎意料地平淡：\"打仗要花钱。养人要花钱。钱从哪来？散人不交税、不服役、不产粮——他们占着江湖的资源却不出力。我做的不过是资源合理配置罢了。\"\"把人当资源配置？\"你问。\"把所有人当资源配置。\"他纠正道，\"包括你我。区别只是价格不同。\"",
    choices: [
      { id:"accept", label:"暂缓对抗", desc:"争取时间整合力量", effect:{mainThreat:1, flag:"temporaryTruce"} },
      { id:"resist", label:"当场决裂", desc:"表明绝不妥协的态度", effect:{mainThreat:3, fame:200, flag:"openHostility"} }
    ]
  },
  19: {
    title: "突袭",
    text: "谈判破裂后的第三天凌晨，护法堂一支突击队摸进了联盟驻地。等你被警报惊醒时，他们已经放火烧毁了粮仓。火光映红了半边天，四周喊杀声一片——这不是试探，这是正式宣战。",
    choices: [
      { id:"accept", label:"死守阵地", desc:"保护剩余物资和人员", effect:{def:4, flag:"heldGround"} },
      { id:"resist", label:"诱敌深入", desc:"放弃驻地引敌入陷阱", effect:{atk:3, exp:300, flag:"ambushSuccess", triggerBattle:true, enemyId:"assault_team_trapped"} }
    ],
    triggerBattle: true, enemyId: "fata_squad",
    battleDesc: "精锐攻入驻地核心区。粮仓起火，四周喊杀声一片——必须尽快肃清这批敌人！",
    battleReward: { exp:350, fame:80, def:2 }
  },
  20: {
    title: "四面树敌",
    text: "沈千山正式发布了通缉令——悬赏五千两捉拿你。一夜之间，江湖上的赏金猎人和投机分子都盯上了你。方平笑着说：\"操，咱俩现在值五千两了，还挺值钱的。\"你没笑。因为你清楚，武盟通缉你不光因为你是\"拒册头目\"。更关键的是——你手里那份外编队名单和奴隶调拨记录，一旦公之于众，整个武盟的根基都会动摇。他们要的不只是你的人头。他们要的是所有证据和你一起消失。",
    choices: [
      { id:"accept", label:"公开露面", desc:"让所有人知道你不怕", effect:{fame:300, flag:"publicDefiance"} },
      { id:"resist", label:"隐匿行踪保护证据", desc:"减少暴露", effect:{agi:3, mainThreat:1, flag:"stealthMode"} }
    ]
  },
  21: {
    title: "刺客之夜",
    text: "深夜，一道黑影潜入了你的房间。快刀，极快。你滚下床的瞬间枕头已经被剖成了两半。来人是江湖上有名的杀手\"无影\"叶孤——沈千山花重金请来的。交手三十招后你才发现不对劲——他的目标不是杀你。他的目标是你枕下那份外编队名单原件。武盟派刺客来不是为了灭口，是为了销赃——让证据永远消失于世。",
    choices: [
      { id:"accept", label:"正面迎击硬拼", desc:"以硬碰硬保护证据", effect:{triggerBattle:true, enemyId:"ye_gu_duel", evidencePreserved:true} },
      { id:"resist", label:"利用地形周旋", desc:"用智慧保护证据和自己", effect:{evidencePreserved:true} }
    ],
    triggerBattle: true, enemyId: "shadow_killer_yegu",
    isMiniBoss: true, bossRank: 3,
    bossInfo: { name:"叶孤", title:"无影刺客", weapon:"蝉翼双刃", style:"极速暗杀流", rank:3, hp:3800, skills:["影遁","瞬杀","毒刃"] },
    battleReward: { exp:450, fame:120, agi:4 }
  },
  22: {
    title: "分崩离析",
    text: "五千两悬赏的压力开始显现。联盟中的队伍陆续动摇——有人率先退出，理由很直白：\"损失太重，撑不住了。\"其他人也在摇摆不定。方平摔了杯子：\"关键时刻掉链子！\"你沉默了很久。然后说：\"让他们走吧。愿意走的本来就不是我们的兄弟，留下的才是。\"但心里清楚——留下的人每一天都在用命换明天。而那些走的，也许才是聪明的。",
    choices: [
      { id:"accept", label:"宽容放行", desc:"不勉强任何人留下", effect:{fame:150, flag:"tolerantLeader"} },
      { id:"resist", label:"强硬挽留", desc:"以纪律约束动摇者", effect:{mainThreat:2, flag:"ironFistDiscipline"} }
    ]
  },
  23: {
    title: "反击号角",
    text: "与其被动挨打不如主动出击。你带领核心成员主动出击，清剿那些蠢蠢欲动的赏金猎人在联盟周边设立的据点。这些人装备精良且配合默契，为了五千两赏金什么都做得出来。但这已经不是当年那个单枪匹马在巷战中躲闪的你了。",
    choices: [
      { id:"accept", label:"全面清剿", desc:"彻底清除周边威胁", effect:{fame:200, exp:400, flag:"bountyHuntersCleared"} },
      { id:"resist", label:"擒贼擒王", desc:"直取首领震慑其余", effect:{gainItem:"hunter_leader_badge", int:2, fame:300} }
    ],
    triggerBattle: true, enemyId: "bounty_hunter_squad",
    battleDesc: "赏金猎人在据点中等着你。装备精良且配合默契——但这已经不是当年单枪匹马的你。",
    battleReward: { exp:320, money:400, gainItem:"hunter_equipment_set" }
  },
  24: {
    title: "年终之战·沈千山之败",
    text: "决战在太湖之滨展开。沈千山一身黑甲，手持方天画戟。他没有废话，只说了一句：\"你很不错。可惜站错了边。\"战斗持续了近两个时辰。沈千山的武学造诣远超赵崇岳——他能同时应对你和方平的夹攻而不落下风。就在你即将力竭之际——一道分光剑气从侧面切入了战场。孟天衡来了。他浑身是血，显然是一路打过来的。他对沈千山说：\"够了。\"三人联手，终于击倒了沈千山。倒地前沈千山看着孟天衡，忽然笑了：\"好……安置营的事……统领早就……批过了……\"沈千山死了。但他的最后一句话像一根刺扎进了你心里——**连沈千山都只是执行者，真正的源头在上面。**第二年，结束。",
    choices: [
      { id:"accept", label:"收编降卒", desc:"给予俘虏生路瓦解敌方军心", effect:{fame:300, flag:"mercifulVictory", yearEnding:"unified"} },
      { id:"resist", label:"彻底清算", desc:"不留后患斩草除根", effect:{mainThreat:5, exp:800, flag:"ruthlessVictory", yearEnding:"dominance"} }
    ],
    triggerFinalBoss: "shen_yueshan", isYearEndBoss: true,
    specialEvent: "meng_tianheng_betrayal",
    bossInfo: { name:"沈千山", title:"武盟左护法", weapon:"方天画戟", style:"均衡全面的大师级", rank:7, hp:15000, skills:["画戟开山","铁壁铜墙","连环戟","护法真气"] },
    battleReward: { exp:2000, fame:800, gainItem:"shen_halberd_fragment", money:1000, atk:8, def:6 }
  },
  25: {
    title: "天下震动",
    text: "沈千山之死的消息传到了太行总坛。据说楚宗玄在正殿坐了一整天，谁也没见。江湖格局变了。武盟内部裂成了三派——主战的、主和的、中立的。而你，从一个籍籍无名的散人，变成了让武盟统领都不得不正视的存在。但更重要的消息是：你手中的证据开始发酵了。外编队名单、奴隶调拨记录、安置营地图——这些材料通过散人网络悄悄流传开来，江湖上越来越多的人知道了武盟的真面目。孟天衡战后失踪了。有人说他被抓回去了，也有人说隐居去了。",
    choices: [
      { id:"accept", label:"广发英雄帖", desc:"号召天下共讨武盟", effect:{fame:500, flag:"globalCallToArms"} },
      { id:"resist", label:"韬光养晦", desc:"利用武盟内耗壮大自己", effect:{int:5, mainThreat:1, flag:"layLowAndGrow"} }
    ]
  },
  26: {
    title: "各方势力",
    text: "武盟内部主战派不甘失败，暗中派人四处袭扰散人。巡视途中遭遇了\"狂刀\"钱彪一伙。这些人眼中透着的不是贪婪，而是一种狂热的信仰。他们真心相信楚宗玄正在建立一种新的秩序，相信把散人变成资源是为了实现更大的整体利益。这种信仰比贪婪更可怕——因为它不可收买，也不可理喻。",
    choices: [
      { id:"accept", label:"招抚为主", desc:"争取感化而非消灭", effect:{flag:"conversionFocus"} },
      { id:"resist", label:"杀鸡儆猴", desc:"用雷霆手段立威", effect:{fame:200, atk:2, flag:"terrorTactics"} }
    ],
    triggerBattle: true, enemyId: "fanatic_qianbiao_with_men",
    battleDesc: "狂刀钱彪使厚背大砍刀招式凶猛但不精细。手下个个眼中透着狂热——已被洗脑坚信把散人当资源是为了建立更好的秩序。",
    battleReward: { exp:280, money:180, gainItem:"fanatic_oath_token" }
  },
  27: {
    title: "太行之邀",
    text: "烫金请帖再次出现。落款两个字：楚宗玄。「闻君屡建奇功，特邀太行一叙。」打开帖子，里面夹层有一行小字：\"有些事，当面说比较清楚。关于你手中那些材料……\"他知道你有证据。这是最后通牒——也是请君入瓮。方平拍桌子：\"去不去？\"\"去。\"\"你疯了？\"\"不去怎么赢。\"",
    choices: [
      { id:"accept", label:"只身赴约", desc:"看看楚宗玄的真实意图", effect:{flag:"metYue"} },
      { id:"resist", label:"公之于众", desc:"将证据彻底公开逼迫表态", effect:{fame:600, mainThreat:4, flag:"publicPressure"} }
    ]
  },
  28: {
    title: "统领真容",
    text: "见到了楚宗玄。不像传说中那样凶神恶煞，反而像一个饱读诗书的隐士。谈论了整整两个时辰关于\"江湖秩序\"。他的话有道理，问题在于手段是暴力。当你拿出证据摊在他面前时，反应出乎意料——他没有否认也没有愤怒，只是平静地说：\"我知道。这些事都是我批准的。维持这个机构的运转需要钱——很多钱。而散人是最容易变现的资源。二十年来我惩办恶霸超过千人、调解纠纷超过万起——这些都是真的。代价是什么？代价是每年有几百个散人变成了数字。你觉得这值得吗？我觉得值得。你觉得不值得——所以才有了今天。\"谈判崩了。走出大门时，守卫拦住了去路。",
    choices: [
      { id:"accept", label:"速战速决", desc:"最快速度突破包围", effect:{exp:400} },
      { id:"resist", label:"稳扎稳打", desc:"节省体力应对后续", effect:{hpRecovery:20} }
    ],
    triggerBattle: true, enemyId: "elite_guard_squad",
    battleDesc: "总坛精英守卫呈扇形包围每个人武功都不弱于堂口执事——这才是真正的精锐。",
    battleReward: { exp:500, fame:150, gainItem:"taihang_guard_uniform" }
  },
  29: {
    title: "孟天衡的去向",
    text: "多方打听之后确认——孟天衡确实被押回了总坛，关在地牢深处。楚宗玄没有杀他，留了一条命。也许是念旧情，也许是在等待什么时机。方平问：\"要不要救？\"\"当然要。\"\"就我们？\"\"不。\"你开始集结所有能够调动的力量。这一次你要去的地方是地狱的最底层。而你要带出来的那个人，曾经站在你的对面，如今却成了你最想救回的人。",
    choices: [
      { id:"accept", label:"营救孟天衡", desc:"他值得赌一把", effect:{flag:"rescueMengPlan", mengFavor:3} },
      { id:"resist", label:"集中兵力攻总坛", desc:"救人不如直接终结源头", effect:{atk:4, flag:"directAssault"} }
    ]
  },
  30: {
    title: "最后的筹备",
    text: "总攻前三天，在太行山外围清理耳目。最后一波斥候在被发现后试图点燃烽火台向总坛报警——必须在狼烟升起来之前阻止，否则不到半盏茶的功夫总坛就会收到警报，届时所有部署都将付诸东流。这是一场与时间的赛跑。",
    choices: [
      { id:"accept", label:"正面强攻路线", desc:"堂堂正正打上山门", effect:{flag:"assaultTactic_frontal"} },
      { id:"resist", label:"奇袭后山路线", desc:"小分队直取正殿", effect:{flag:"assaultTactic_stealth"} }
    ],
    triggerBattle: true, enemyId: "beacon_scout_captain",
    battleDesc: "斥候队长正在点燃烽火台。一旦狼烟升起总坛立刻收到警报——时间不多了！",
    battleReward: { exp:220, gainItem:"taihang_beacon_map", int:2 }
  },
  31: {
    title: "大军压境",
    text: "散人联军在太行山下列阵。方平立于左侧，各路散人首领列于右侧。你拔剑指向天空，身后呐喊声震动了山林间的飞鸟。楚宗玄站在高高的台阶之上，白衣胜雪，目光平静如水，缓缓开口：\"你本是将才。可惜选了死路。\"你握紧剑柄。这条路不是死的——是自己一步一步选来的，也是自己要走到底的。",
    choices: [
      { id:"accept", label:"鼓舞士气演说", desc:"让每个人都明白为何而战", effect:{fame:400, flag:"inspiringSpeech"} },
      { id:"resist", label:"默默拔剑行动说话", desc:"无需多言", effect:{atk:3, flag:"silentDetermination"} }
    ]
  },
  32: {
    title: "突破外层",
    text: "总坛前的第一道防线由右护法公孙烈率亲卫镇守。此人使一杆浑铁枪，力大无穷，招式狠辣，是楚宗玄麾下第一猛将。麾下亲卫结阵配合，枪出如龙——这是通往正殿的首道难关，也是最难闯的一关。",
    choices: [
      { id:"accept", label:"分兵牵制各个击破", desc:"战术性分割逐一瓦解", effect:{allyLossReduced:30} },
      { id:"resist", label:"中央突破直捣黄龙", desc:"集中力量撕开口子", effect:{atkBonus:4} }
    ],
    triggerBattle: true, enemyId: "right_protector_gongsun",
    isMidBoss: true, bossRank: 6,
    bossInfo: { name:"公孙烈", title:"武盟右护法", weapon:"浑铁枪", style:"刚猛强攻型", hp:10000, skills:["铁枪破阵","横扫八方","护法金刚"] },
    battleReward: { exp:1500, fame:500, atk:5, def:5 }
  },
  33: {
    title: "地牢营救",
    text: "带着方平和几个最信任的人摸进了总坛地牢。沿途肃清了好几波巡逻队。在最深处的囚室里找到了孟天衡——被锁链吊在半空中，浑身是伤，但那双眼睛仍然亮着。他沙哑地问：\"你来干什么？\"你说：\"来兑现你欠我的。\"挥剑斩断了锁链。他要站起来的时候晃了一下，你扶住了他——这个曾经站在你对面的男人，如今瘦得脱了形。杀出血路带他出去。",
    choices: [
      { id:"accept", label:"掩护孟天衡先撤", desc:"确保安全撤出去", effect:{flag:"mengRescued", mengFavor:4} },
      { id:"resist", label:"一起杀上去", desc:"多一人多一分力", effect:{flag:"mengFightsAlongside"} }
    ],
    triggerBattle: true, enemyId: "dungeon_warden_with_guards",
    battleDesc: "地牢看守长使判官笔专打穴道。守卫层层封锁阴暗甬道里杀气弥漫——必须杀出血路才能带他出去！",
    battleReward: { exp:400, fame:100 }
  },
  34: {
    title: "安顿与切磋",
    text: "走出地牢，天边已泛鱼肚白。孟天衡和方平都伤得不轻——孟天衡被铁链吊了数月，站都站不稳；方平在突围时左肩中了一剑，血浸透了半边衣襟。你在后山找了个隐蔽的石窟，把他们安顿下来。方平靠在石壁上，忽然笑了一声：\"他娘的，打了三年仗，最后倒在这破山洞里。\"\"你不是说要收尸吗，\"你递过水囊，\"还没到时候。\"沉默片刻，他挣扎着站起来，抽出剑。\"来。最后打一场。\"他咧嘴一笑，\"打完这场，你一个人去。我在这等你。\"你们在石窟前的空地上切磋了最后一场。剑光映着破晓的微光，没有胜负——只有三年并肩走过来的默契。收剑时方平拍了拍你的肩，没说话。你知道他想说什么。",
    choices: [
      { id:"accept", label:"和他切磋到最后", desc:"实战检验彼此成长", effect:{exp:200} },
      { id:"resist", label:"安静陪他歇息", desc:"有些话不需要用剑说", effect:{maxHpBoost:50, flag:"quietRest"} }
    ],
    optionalSparring: { opponent: "fangping", desc: "与方平的最后一场切磋", reward: {exp:150} }
  },
  35: {
    title: "正殿门前",
    text: "安顿好两人后，你独自穿过长长的廊道，向正殿走去。沿途再无阻拦。该打的仗都打完了，只剩最后一场。正殿大门紧闭。你知道楚宗玄就在里面。你整了整衣襟，深吸一口气，推开了门。",
    choices: [
      { id:"accept", label:"从容赴约", desc:"以最好的状态面对最后一战", effect:{maxHpBoost:100, qiBoost:50, flag:"readyForFinal"} },
      { id:"resist", label:"燃起斗志", desc:"让愤怒成为力量", effect:{atk:8, critBonus:10, flag:"battleFury"} }
    ]
  },
  36: {
    title: "最终之战·太行之巅",
    text: "正殿之中，楚宗玄负手而立。面前的茶尚温热，看起来一点都不惊讶，仿佛一直在等你。须发皆白，目光如同山岳压顶而来。缓缓开口：\"三十年前，最好的朋友被邪教高手杀了，没人管。于是我发誓建立一个机构，让江湖不再有这种悲剧。二十年来惩办恶霸超千人，调解纠纷过万起——这些都是真的。然后我开始把人当成资源。为了更大的秩序，必须有人做出牺牲。你以为你代表正义？你身后那些人只是换了一个主人。今天你赢了，明天你就会变成下一个我。\"沉默片刻。他又说：\"来吧。\"天罡正气第十一重。大殿地面砖石龟裂，温度骤降。\"别让我失望。\"",
    isEndNode: true,
    choices: [
      { id:"accept", label:"顺应结局：归云入泽", desc:"战后与残余谈判为散人争未来", effect:{ending:"wanderer_accept", endingEpilogue:"settle"} },
      { id:"resist", label:"抗争结局：孤云独行", desc:"拒绝所有妥协走最自由也最难的路", effect:{ending:"wanderer_resist", endingEpilogue:"wander"} },
      { id:"special", label:"隐藏结局：继任统领", desc:"【条件】以统领身份重塑规则", condition:"fame>=2000 && becameLeader && publicFigure", effect:{ending:"wanderer_reform", endingEpilogue:"reform"} }
    ],
    triggerFinalBoss: "chu_zongxuan_final", isFinalBoss: true,
    bossInfo: { name:"楚宗玄", title:"武盟统领", weapon:"天罡正气", style:"纯内力压制终极boss", rank:10, hp:30000, skills:["天罡正气十一重(范围冲击)","万法归一(反弹伤害)","乾坤一掷(终结爆发)"] },
    battleReward: { exp:5000, fame:2000, money:3000, atk:10, def:10, int:10, agi:10 }
  }
};

// ============================================================
// 孤云逐浪 成长事件池（20个随机奇遇）
// 权重分布：传功10% | 道具10% | 属性20% | 打斗30% | 金钱30%
// ============================================================
DATA.wandererGrowthEvents = {
  heritage: [
    {
      id: "wanderer_heritage_tieyi",
      name: "龙井谷铁衣遗志",
      category: "传功",
      desc: "龙井谷废墟的石壁上刻着韩铁衣最后的手迹。不是招式，而是一个命令：「散人不打花拳——打一刀要让对面流血三天；扛不住就练筋骨，练到扛住为止。」你用手掌抚过石壁上的刻痕，每一条都入石三分。这是他死前用最后的力气刻上去的。不是留给你学的——是留给你活的。",
      trigger: "M10之后",
      effect: { traitGain: "tieyi_legacy", desc: "获得特性「铁衣遗志」：流血招式层数+3，防御永久+10" }
    },
    {
      id: "wanderer_heritage_meng",
      name: "灰袍手札",
      category: "传功",
      desc: "信鸽落在窗台上，腿上绑着一卷薄纸。展开来看是几页手写的修行心得——笔迹你认得，和那份安置营地图一模一样。孟天衡在末尾写了一行小字：「这些东西武盟不让外传。但你用得着。」没有署名，没有问候。他把命押给了你，连一句废话都不多说。",
      trigger: "M16之后",
      effect: { qiUp: 80, traitGain: "clearMind", desc: "内力上限+80，获得特性「明心」：负面状态持续时间-20%" }
    }
  ],
  item: [
    {
      id: "wanderer_item_relic",
      name: "外编队遗物",
      category: "道具",
      desc: "在一处废弃的外编队矿坑中，你发现了散人矿工藏起来的包裹。里面有几颗丹药、还有一封没寄出去的家书。家书最后一段写着「娘，矿坑塌了一次，我腿断了。不过没事，有个姓韩的大哥偷偷塞给我药。」日期是老李死前三个月。",
      trigger: "M6之后",
      effect: { items: ["pill","pill","statPill","statPill"], desc: "获得金疮药×2、小还丹×2" }
    },
    {
      id: "wanderer_item_merchant",
      name: "游商秘货",
      category: "道具",
      desc: "一个尖嘴猴腮的游商在茶寮拦住你，掀开袍子露出一排挂着的装备。「兄弟，这些货都是从武盟那边倒出来的。他们死了人，装备归我——我卖给你，公平合理。」他挤挤眼，「你跟武盟有仇对吧？用他们的东西打他们，痛快。」",
      trigger: "M6之后",
      effect: { desc: "花钱购买随机防具（蓝/橙品质），价格7折；或直接花200金获得硬布背心" }
    }
  ],
  stat: [
    {
      id: "wanderer_stat_hp",
      name: "铁衣遗训·锻体",
      category: "属性",
      desc: "深夜在龙井谷废墟独自练功。韩铁衣说过「散人没有师门，身体就是最后的武器。」你一拳一拳打在焦黑的树干上，直到月光偏西。",
      trigger: "M10之后",
      statKey: "hp",
      values: { y1: 120, y2: 168, y3: 240 }
    },
    {
      id: "wanderer_stat_qi",
      name: "龙井废墟·吐纳",
      category: "属性",
      desc: "龙井谷废墟的清晨有股特别的清气。韩铁衣生前每天早上都在这里打坐——他说「谷里的风会教你呼吸」。你盘腿坐在他坐过的石头上，让风吹进丹田。",
      trigger: "M10之后",
      statKey: "qi",
      values: { y1: 28, y2: 39, y3: 56 }
    },
    {
      id: "wanderer_stat_dodge",
      name: "韩铁衣的轻功步法",
      category: "属性",
      desc: "在一本韩铁衣留下的破旧账本里，你发现他用蝇头小字记录的步法要诀。账本封面上歪歪扭扭写着「跑得快比打得赢重要——活下来才能接着打」。",
      trigger: "M10之后",
      statKey: "dodge",
      values: { y1: 2, y2: 3, y3: 4 }
    },
    {
      id: "wanderer_stat_hit",
      name: "孟天衡指点眼力",
      category: "属性",
      desc: "一个戴着斗笠的人在你练剑时突然出声：「第三招的起手慢了半拍。」你转头看到孟天衡靠在树下，手里捏着茶杯。他没多说，只丢过来一句话：「楚宗玄的剑法比你快——你得比他看得更早。」",
      trigger: "M25之后",
      statKey: "hit",
      values: { y1: 3, y2: 4, y3: 5 }
    }
  ],
  fight: [
    {
      id: "wanderer_fight_remnant",
      name: "武盟残部",
      category: "切磋",
      desc: "几个赵崇岳死后的残余堂口弟子在乡间横行。他们没有头目了，但更加危险——因为无所顾忌。领头的一个看见了你的剑，咧嘴一笑：「这把剑我见过……你就是杀了赵堂主那个散人。」他拔刀的时候手在发抖，但眼神是饿狼的眼神。",
      trigger: "M13之后",
      years: [1,2],
      enemyDesc: "赵崇岳残部堂口弟子×2~3，小概率带一个执事",
      enemyRank: 1
    },
    {
      id: "wanderer_fight_bounty",
      name: "赏金猎人",
      category: "切磋",
      desc: "五千两的悬赏让这些人从四面八方赶来。装备精良，配合默契，每一个都号称「猎过不下十个散人」。领头的独眼汉子打量着你：「真人比画像精神。不过无所谓——脑袋砍下来都一样值钱。」",
      trigger: "M20之后",
      years: [2,3],
      enemyDesc: "赏金猎人团×3~4，配合默契，有合击技能",
      enemyRank: 2
    },
    {
      id: "wanderer_fight_traitor",
      name: "叛徒清剿",
      category: "切磋",
      desc: "散人队伍里又少了一个人。追了两天在一间客栈堵住了他——正在跟武盟的人做交易。他看见你的时候脸上的表情不是愧疚，而是如释重负：「别怪我。我家还有老娘。」",
      trigger: "M6之后",
      years: [1,3],
      enemyDesc: "叛徒+接应的武盟弟子×2",
      enemyRank: 1,
      branch: "战胜后可选择放了（获取情报）或处决（震慑其他叛徒）"
    },
    {
      id: "wanderer_fight_arena",
      name: "擂台立威",
      category: "切磋",
      desc: "「散人现在不好惹了，你是领头的——敢不敢让我试试？」一个江湖刀客在散人营地外面摆下擂台。围观的人越来越多，你发现其中混着几张陌生的脸——也许是想投奔的散人，也许是武盟的探子。无论如何，这一场必须赢。",
      trigger: "M6之后",
      years: [1,3],
      enemyDesc: "武盟探子/江湖挑战者×1（Rank随年份）",
      enemyRank: 1
    },
    {
      id: "wanderer_fight_escort",
      name: "护送家眷",
      category: "切磋",
      desc: "三个散人的家眷要穿过武盟控制区转移到安全地带。都是老人和孩子。路上走不快，但夜色是最好的掩护。远处火把的光芒忽明忽暗——巡逻队正在靠近。",
      trigger: "M6之后",
      years: [1,3],
      enemyDesc: "巡逻追兵×3~4；失败则失去护送对象（影响散人营地士气）",
      enemyRank: 1
    },
    {
      id: "wanderer_fight_camp",
      name: "安置营看守",
      category: "切磋",
      desc: "孟天衡的地图上标注了这个安置营——里面关着三十几个散人。看守换班的间隙只有一炷香的时间。你和几个兄弟翻过围墙时，看守长正在打牌。牌桌上的银子大概也是从散人身上搜刮来的。",
      trigger: "M16之后",
      years: [2,3],
      enemyDesc: "看守长+守卫×4（小Boss级，Rank 3）",
      enemyRank: 3,
      victoryEffect: "救出散人→散人营地人口增加，士气提升"
    }
  ],
  coin: [
    {
      id: "wanderer_coin_escort",
      name: "替散人运镖",
      category: "金钱",
      desc: "韩铁衣生前搭了一条散人自己的物资线——从山里收药材，运到城郊黑市换粮食。武盟封锁之后这条线断了。一个老镖头找到你：「路不好走，但货得送。沿路的散人都指着这批粮食。」他递过来一张皱巴巴的路线图——上面标注的每一个安全点，都是韩铁衣拿血换来的。",
      trigger: "M10之后",
      reward: { y1: 150, y2: 210, y3: 300 },
      bonusDesc: "运气好可额外获得跑镖途中捡到的随机丹药×1"
    },
    {
      id: "wanderer_coin_rebuild",
      name: "龙井谷重建",
      category: "金钱",
      desc: "血战之后的龙井谷需要重建。散人里面老的小的都有，能扛能打的没几个。你卷起袖子搬石头、修棚子、挖水沟——干的都是最重的体力活。天黑收工时一个老妇人端来一碗热汤：「小伙子，我们家男人要是还活着，也是你这把年纪。」",
      trigger: "M10之后",
      reward: { y1: 120, y2: 180, y3: 260 },
      bonusDesc: "额外小幅提升散人营地士气"
    },
    {
      id: "wanderer_coin_intel",
      name: "孟天衡情报费",
      category: "金钱",
      desc: "一个从不露面的人托人送来一封信和十两银子。信上只有几个字：「城西茶楼，申时，留意左手戴铁指环的人。」你去看了——那人和武盟的人接头，说出了三个散人据点的位置。你把他摁在巷子里的时候，他塞过来一包银子：「兄弟别杀我，我知道更多。」五天后，又有人送来一封信，银子里夹了一张纸条：「干得不错。——孟」",
      trigger: "M16之后，需孟天衡信任",
      reward: { y2: 240, y3: 360 }
    },
    {
      id: "wanderer_coin_fangping",
      name: "方平的私活",
      category: "金钱",
      desc: "方平在村口朝你招手：「别绷着一张脸了，出来挣点钱。」他接了一单江湖活——给一个退隐的老拳师修院子。活不累，但老拳师看你们手脚麻利，多结了工钱不说还指点了几招：「年轻人，拳头是最后的东西。靠力气吃饭不丢人。」方平把银子分你一半：「下次换个来钱快的，这个老家伙太能唠了。」",
      trigger: "M2之后",
      reward: { y1: 180, y2: 250, y3: 350 },
      bonusDesc: "有概率随机属性临时+1（老拳师指点）"
    },
    {
      id: "wanderer_coin_labor",
      name: "安置营杂工",
      category: "金钱",
      desc: "混进武盟的安置营当临时杂工——搬货、扫地、倒马桶。一天累死累活只挣几个铜板，但你趁着干活把安置营的布局摸了个透：看守换班时间、仓库位置、哪面墙最矮。走的时候领班骂你偷懒，你低着头不吭声——心里已经把救人的路线画好了。",
      trigger: "M13之后",
      reward: { y1: 100, y2: 160, y3: 240 },
      bonusDesc: "下次安置营相关战斗时命中+5（地形情报加成）"
    },
    {
      id: "wanderer_coin_market",
      name: "散人集市帮手",
      category: "金钱",
      desc: "散人营地外有个小集市——卖草药的、修兵器的、缝衣服的，全是散人自己。今天人手不够，你帮忙搬货、跑腿送东西、替一个不识字的大娘读账本。一天下来腿都跑细了，但集市的散人们凑了一包碎银子塞给你，一个老裁缝还顺手给你缝好了袖口的破洞。",
      trigger: "M6之后",
      reward: { y1: 130, y2: 190, y3: 280 },
      bonusDesc: "有概率获得「散人缝补」：下次战斗中受到的第一次伤害-15%"
    }
  ]
};

// ============================================================
// 孤云逐浪 武林商人货品池（精选江湖气质秘籍/兵器/防具/丹药）
// 定价基准：100钱=50血=10内=1攻/防
// ============================================================
DATA.wandererMerchantPool = {
  manuals: [
    { id: "quickSlash", name: "雁门快刀", school: "blade", rarity: "blue", style: "bleed", price: 180, desc: "快刀+流血是绿林散人最实用的打法。雁门快刀据说是边关逃兵带回来的刀法。" },
    { id: "blade_orange_1", name: "燃木刀法", school: "blade", rarity: "orange", style: "bleed", price: 800, desc: "来自一个被武盟追杀了三年的老刀客。刀势焦灼，伤口更深。" },
    { id: "blade_red_1", name: "饮血封喉刀", school: "blade", rarity: "red", style: "bleed", price: 2800, desc: "散人中间口耳相传的终极刀法——对手流血的速度就是你的活命时间。" },
    { id: "fist_blue_3", name: "太祖长拳", school: "fist", rarity: "blue", style: "critPalm", price: 180, desc: "街头斗殴里打出来的拳法，不讲究招式讲究一拳下去对面得趴下。" },
    { id: "fist_orange_2", name: "黯魂掌", school: "fist", rarity: "orange", style: "critPalm", price: 800, desc: "据传是韩铁衣在龙井谷改良的拳路，出招时带着一股子老子跟你拼命的蛮劲。" },
    { id: "fist_red_2", name: "碎星拳", school: "fist", rarity: "red", style: "critPalm", price: 2800, desc: "重拳碎星，暴击倍率提高。散人没有门派——拳头就是最后的尊严。" },
    { id: "springNeedle", name: "青囊毒针", school: "hidden", rarity: "blue", style: "poison", price: 180, desc: "散人没有门派资源，毒是最好的以小博大手段。来自江湖郎中的偏方。" },
    { id: "hidden_orange_1", name: "冰魄毒针", school: "hidden", rarity: "orange", style: "poison", price: 800, desc: "据说是从武盟刑讯室流出来的配方——他们用来对付我们的，我们用来对付他们。" },
    { id: "hidden_red_1", name: "孔雀毒翎", school: "hidden", rarity: "red", style: "poison", price: 2800, desc: "毒雨齐发，淬毒暗器终极式。" },
    { id: "light_blue_2", name: "扫堂腿", school: "lightness", rarity: "blue", style: "lowKick", price: 180, desc: "每个散人都会的打架基本功。" },
    { id: "light_orange_2", name: "盘龙腿", school: "lightness", rarity: "orange", style: "lowKick", price: 800, desc: "龙井谷一个瘸腿老散人教的——腿断了这辈子跑不了，那就把底盘练稳，谁来踢谁。" },
    { id: "light_red_2", name: "碎岳沉桩腿", school: "lightness", rarity: "red", style: "lowKick", price: 2800, desc: "核心是站住了就是赢。" }
  ],
  weapons: [
    { id: "blade_bleed_blue", name: "饮血雁翎刀", school: "blade", rarity: "blue", price: 550 },
    { id: "blade_bleed_orange", name: "裂血长刀", school: "blade", rarity: "orange", price: 1600 },
    { id: "blade_bleed_red", name: "血河断刃", school: "blade", rarity: "red", price: 4500 },
    { id: "fist_crit_blue", name: "炽星拳套", school: "fist", rarity: "blue", price: 550 },
    { id: "fist_crit_orange", name: "纯阳拳甲", school: "fist", rarity: "orange", price: 1600 },
    { id: "fist_crit_red", name: "碎星拳套", school: "fist", rarity: "red", price: 4500 },
    { id: "hidden_poison_blue", name: "淬毒针匣", school: "hidden", rarity: "blue", price: 450 },
    { id: "hidden_poison_orange", name: "淬毒银针", school: "hidden", rarity: "orange", price: 1400 },
    { id: "hidden_poison_red", name: "孔雀毒匣", school: "hidden", rarity: "red", price: 4000 },
    { id: "leg_low_blue", name: "破门靴", school: "lightness", rarity: "blue", price: 450 },
    { id: "leg_low_orange", name: "压山靴", school: "lightness", rarity: "orange", price: 1400 },
    { id: "leg_low_red", name: "断岳沉步靴", school: "lightness", rarity: "red", price: 4000 }
  ],
  armors: [
    { id: "armor_heavy_blue", name: "硬布背心", rarity: "blue", price: 600, desc: "散人的标准防具——粗布层层叠叠缝制，不美观但是实在。" },
    { id: "armor_light_orange", name: "游云轻甲", rarity: "orange", price: 1500, desc: "据说是一个退役的武盟捕快卖给黑市的——穿上跑得快，跑路的时候派大用场。" },
    { id: "armor_wuxiang_red", name: "无相秘甲", rarity: "red", price: 4800, desc: "据传来自楚宗玄的私人武库，被孟天衡暗中调包流出来的。" }
  ],
  internalArts: [
    { id: "art_blue_3", name: "罗汉镇岳功", rarity: "blue", price: 600, desc: "少林叛僧流传出来的站桩功夫，散人没有门派护体，只能靠自己扛。" },
    { id: "art_blue_4", name: "回照心经", rarity: "blue", price: 500, desc: "江湖药店常配的内功入门——不会这个功法你连毒都扛不住。" },
    { id: "art_orange_1", name: "虚玄无相功", rarity: "orange", price: 1800, desc: "传说是一个偷遍江南的老贼头创的，内力运转不浪费一丝，真正的省着用。" },
    { id: "art_orange_2", name: "纯阳正气诀", rarity: "orange", price: 2000, desc: "名字很正派，实则是散人对抗武盟压迫的底气——心中坦荡，气贯长虹。" },
    { id: "art_red_2", name: "大罗洗髓经", rarity: "red", price: 5000, desc: "来自一个活了两甲子的老散人——洗掉过去的伤，重新站起来的功法。" },
    { id: "art_red_1", name: "九曜真功", rarity: "red", price: 5000, desc: "孤本，孟天衡从总坛藏书阁偷出来的——他自己没练，因为不想欠武盟的人情。" }
  ],
  pills: [
    { id: "pill" },
    { id: "bigPill" },
    { id: "springPaste" },
    { id: "qiWine" },
    { id: "qiPill" },
    { id: "yuanPowder" },
    { id: "statPill" }
  ],
  refreshRules: {
    y1: { quality: "蓝为主，小概率橙", interval: 3, desc: "每3月刷新" },
    y2: { quality: "蓝~橙，小概率红", interval: 2, desc: "每2月刷新" },
    y3: { quality: "橙~红，小概率终极", interval: 1, desc: "每月刷新" }
  }
};

// 主线故事事件执行函数映射（在 runSystem.js 中实现，这里只定义数据结构）
// 注意：这些事件的实际 apply 逻辑在 runSystem.js 的 resolveStoryEvent 中

// 小Boss池（通用）
DATA.miniBosses = [
  { id: "mini_bleed_blade", name: "血刀客", icon: "刀", portraitImage: "assets/portraits_pixel/mini_bleed_blade_pixel_320.webp", yearMin: 2, hp: 1400, qi: 420, atk: 85, def: 45, combo: 4, hit: 72, dodge: 6, crit: 10, speed: 1.42, boss: true, bossTrait: "miniBleed", bossTraitDesc: "流血+2，上限10", rank: 3 },
  { id: "mini_frost_assassin", name: "寒衣刺客", icon: "影", portraitImage: "assets/portraits_pixel/mini_frost_assassin_pixel_320.webp", yearMin: 2, hp: 1200, qi: 500, atk: 78, def: 38, combo: 5, hit: 80, dodge: 28, crit: 12, speed: 1.70, boss: true, bossTrait: "miniFrost", bossTraitDesc: "高闪避，寒气+1", rank: 3 },
  { id: "mini_hamstring_blade", name: "断筋刀师", icon: "刀", portraitImage: "assets/portraits_pixel/mini_hamstring_blade_pixel_320.webp", yearMin: 2, hp: 2400, qi: 760, atk: 120, def: 70, combo: 5, hit: 80, dodge: 10, crit: 12, speed: 1.50, boss: true, bossTrait: "miniHamstring", bossTraitDesc: "断筋+2，削攻", rank: 4 },
  { id: "mini_gu_priest", name: "蛊道人", icon: "毒", portraitImage: "assets/portraits_pixel/mini_gu_priest_pixel_320.webp", yearMin: 2, hp: 2200, qi: 900, atk: 105, def: 60, combo: 4, hit: 78, dodge: 14, crit: 10, speed: 1.48, boss: true, bossTrait: "miniGu", bossTraitDesc: "蛊+2，增加耗内", rank: 4 },
  { id: "mini_coin_dart", name: "金钱镖客", icon: "镖", portraitImage: "assets/portraits_pixel/mini_coin_dart_pixel_320.webp", yearMin: 2, hp: 2000, qi: 600, atk: 110, def: 55, combo: 5, hit: 88, dodge: 12, crit: 12, speed: 1.62, boss: true, bossTrait: "miniCoin", bossTraitDesc: "每2回合一次必中固定伤害", rank: 4 },
  { id: "mini_armor_monk", name: "玄甲武师", icon: "甲", portraitImage: "assets/portraits_pixel/mini_armor_monk_pixel_320.webp", yearMin: 3, hp: 3600, qi: 1000, atk: 150, def: 130, combo: 3, hit: 82, dodge: 8, crit: 10, speed: 1.35, boss: true, bossTrait: "miniArmor", bossTraitDesc: "高防，开场20%护体", rank: 5 }
];

// ============================================================
// 孤云逐浪 专属敌人池（v5.4，数据源：孤云逐浪人物.md）
// ============================================================
DATA.wandererEnemyPool = {
  // --- 普通敌人（打斗事件专用）---
  grunts: [
    { id: "wanderer_grunt_disciple", name: "堂口弟子", icon: "卒", portraitImage: "assets/portraits_pixel/rogue_pixel_320.webp", hp: 350, qi: 120, atk: 32, def: 14, combo: 3, hit: 68, dodge: 5, crit: 6, speed: 1.20, rank: 1 },
    { id: "wanderer_grunt_patrol", name: "巡逻追兵", icon: "巡", portraitImage: "assets/portraits_pixel/blade_pixel_320.webp", hp: 500, qi: 160, atk: 45, def: 22, combo: 4, hit: 72, dodge: 8, crit: 8, speed: 1.30, rank: 2 },
    { id: "wanderer_grunt_traitor", name: "散人叛徒", icon: "叛", portraitImage: "assets/portraits_pixel/rogue_pixel_320.webp", hp: 320, qi: 100, atk: 28, def: 12, combo: 3, hit: 65, dodge: 6, crit: 5, speed: 1.25, rank: 1 },
    { id: "wanderer_grunt_bounty", name: "赏金猎人", icon: "猎", portraitImage: "assets/portraits_pixel/mini_coin_dart_pixel_320.webp", hp: 650, qi: 200, atk: 55, def: 28, combo: 4, hit: 78, dodge: 10, crit: 10, speed: 1.40, rank: 3 },
    { id: "wanderer_grunt_challenger", name: "江湖挑战者", icon: "擂", portraitImage: "assets/portraits_pixel/armorBreakBlade_pixel_320.webp", hp: 600, qi: 180, atk: 52, def: 25, combo: 4, hit: 75, dodge: 9, crit: 9, speed: 1.35, rank: 2 },
    { id: "wanderer_grunt_guard", name: "武盟守卫", icon: "卫", portraitImage: "assets/portraits_pixel/mini_armor_monk_pixel_320.webp", hp: 480, qi: 140, atk: 42, def: 24, combo: 3, hit: 70, dodge: 5, crit: 7, speed: 1.22, rank: 2 }
  ],
  // --- 小Boss（头目级，随机遭遇 + 事件专用）---
  miniBosses: [
    { id: "wanderer_mini_zhoutong", name: "铁手·周通", icon: "拳", portraitImage: "assets/portraits_pixel/qiSuppressFist_pixel_320.webp", yearMin: 1, hp: 1800, qi: 500, atk: 75, def: 52, combo: 5, hit: 80, dodge: 8, crit: 12, speed: 1.42, boss: true, bossTrait: "miniBleed", bossTraitDesc: "拳拳骨裂，流血+2", rank: 2 },
    { id: "wanderer_mini_zhishi", name: "堂口执事", icon: "吏", portraitImage: "assets/portraits_pixel/rogue_pixel_320.webp", yearMin: 1, hp: 800, qi: 200, atk: 38, def: 18, combo: 3, hit: 65, dodge: 5, crit: 5, speed: 1.15, boss: true, bossTrait: null, bossTraitDesc: null, rank: 1 },
    { id: "wanderer_mini_liuchangqing", name: "寒剑·柳长卿", icon: "剑", portraitImage: "assets/portraits_pixel/blade_pixel_320.webp", yearMin: 2, hp: 3000, qi: 850, atk: 105, def: 62, combo: 6, hit: 86, dodge: 18, crit: 15, speed: 1.65, boss: true, bossTrait: "miniFrost", bossTraitDesc: "寒霜剑气，寒气+2", rank: 3 },
    { id: "wanderer_mini_yegu", name: "无影·叶孤", icon: "影", portraitImage: "assets/portraits_pixel/highDodgeAssassin_pixel_320.webp", yearMin: 2, hp: 2200, qi: 720, atk: 95, def: 40, combo: 7, hit: 88, dodge: 30, crit: 18, speed: 1.80, boss: true, bossTrait: "highDodge", bossTraitDesc: "极速暗杀，闪避+15", rank: 3 },
    { id: "wanderer_mini_qianbiao", name: "狂刀·钱彪", icon: "刀", portraitImage: "assets/portraits_pixel/mini_bleed_blade_pixel_320.webp", yearMin: 2, hp: 2800, qi: 680, atk: 115, def: 55, combo: 5, hit: 82, dodge: 10, crit: 14, speed: 1.48, boss: true, bossTrait: "lowHpBerserk", bossTraitDesc: "低血狂暴，攻速双升", rank: 3 },
    { id: "wanderer_mini_kanzhang", name: "地牢看守长", icon: "牢", portraitImage: "assets/portraits_pixel/demon_pixel_320.webp", yearMin: 2, hp: 2500, qi: 780, atk: 90, def: 68, combo: 4, hit: 80, dodge: 12, crit: 10, speed: 1.38, boss: true, bossTrait: "pointStrike", bossTraitDesc: "判官笔专打穴道，概率封行动", rank: 3 },
    { id: "wanderer_mini_gongsunlie", name: "右护法·公孙烈", icon: "枪", portraitImage: "assets/portraits_pixel/armorBreakBlade_pixel_320.webp", yearMin: 3, hp: 7000, qi: 1800, atk: 185, def: 120, combo: 6, hit: 85, dodge: 10, crit: 16, speed: 1.52, boss: true, bossTrait: "armorBreak", bossTraitDesc: "铁枪破阵，防御贯通", rank: 6 }
  ]
};

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
