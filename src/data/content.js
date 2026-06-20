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
  lightness: { id: "lightness", name: "腿法", debuff: "身法", icon: "腿" },
  none: { id: "none", name: "通用", debuff: null, icon: "秘" }
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
  steal: "偷盗",
  buff: "增益"
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

function skill(id, name, school, rarity, power, qi, cd, train, debuff, debuffStacks, tags, statGain, trait, opts, icon) {
  const extra = opts || {};
  return { id, name, icon: icon || SCHOOLS[school].icon, school, rarity, power, qi, cd, train, debuff, debuffStacks, tags, statGain, trait, desc: trait.desc, battle: school !== "lightness", ...extra };
}

function qinggong(id, name, rarity, train, statGain, trait, trueDamage, style) {
  const power = rarity === "red" ? 170 : rarity === "orange" ? 110 : 62;
  const qi = rarity === "red" ? 125 : rarity === "orange" ? 78 : 42;
  const cd = rarity === "red" ? 3 : rarity === "orange" ? 2 : 1;
  return { id, name, icon: SCHOOLS.lightness.icon, school: "lightness", rarity, power, qi, cd, train, debuff: null, debuffStacks: 0, tags: ["leg"], statGain, trait, desc: trait.desc, battle: true, trueDamage: trueDamage || 0, style: style || undefined };
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
    quickSlash: skill("quickSlash", "雁门快刀", "blade", "blue", 55, 45, 1, 3, "bleed", 2, ["crit"], gain(0, 0, 0, 2, 0, 0, 0, 0, 0), { id: "quickEdge", name: "快刃", desc: "暴击+2，出手速度+0.03。", effects: { crit: 2, speed: 0.03 } }),
    shadowSting: skill("shadowSting", "影蛊刺", "hidden", "blue", 58, 45, 1, 3, "gu", 1, ["surehit"], gain(0, 2, 0, 0, 0, 0, 0, 0, 0), { id: "shadowStep", name: "影步", desc: "命中+2，出手速度+0.03。", effects: { hit: 2, speed: 0.03 } }),
    springNeedle: skill("springNeedle", "青囊毒针", "hidden", "blue", 42, 45, 2, 3, "poison", 2, ["surehit", "heal"], gain(0, 2, 0, 0, 0, 0, 0, 0, 0), { id: "needleSense", name: "针感", desc: "命中+2，出手速度+0.03。", effects: { hit: 2, speed: 0.03 } }),

    // === 刀法 ===
    // 流血路线: quickSlash(基础) -> blade_orange_1(进阶) -> blade_red_1(终极)
    blade_orange_1: skill("blade_orange_1", "燃木刀法", "blade", "orange", 118, 85, 2, 4, "bleed", 5, ["crit"], gain(0, 1, 0, 5, 0, 0, 0, 0, 0), { id: "burningEdge", name: "烈焰刀意", desc: "命中+1，暴击+5，出手速度+0.05。", effects: { hit: 1, crit: 5, speed: 0.05 } }),
    blade_red_1: skill("blade_red_1", "饮血封喉刀", "blade", "red", 180, 135, 3, 5, "bleed", 10, ["crit"], gain(0, 2, 1, 9, 0, 0, 0, 0, 0), { id: "bloodSeal", name: "血刃封喉", desc: "暴击+9，命中+2，闪避+1，出手速度+0.08，暴击倍率提高。", effects: { hit: 2, dodge: 1, crit: 9, speed: 0.08, critPower: 0.25 } }, { noImmediateSettle: true }),
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
    hidden_orange_1: skill("hidden_orange_1", "冰魄毒针", "hidden", "orange", 95, 80, 2, 4, "poison", 5, ["surehit"], gain(0, 6, 1, 0, 0, 0, 0, 0, 0), { id: "icePoison", name: "寒毒入脉", desc: "命中+6，闪避+1，出手速度+0.04。", effects: { hit: 6, dodge: 1, speed: 0.04 } }),
    hidden_red_1: skill("hidden_red_1", "孔雀毒翎", "hidden", "red", 155, 130, 3, 5, "poison", 10, ["surehit"], gain(0, 10, 2, 2, 0, 0, 0, 0, 0), { id: "peacockPlume", name: "万羽齐发", desc: "命中+10，闪避+2，暴击+2，出手速度+0.08，中毒更深。", effects: { hit: 10, dodge: 2, crit: 2, speed: 0.08, poisonBonus: 1 } }, { noImmediateSettle: true }),
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
    fist_blue_3: skill("fist_blue_3", "太祖长拳", "fist", "blue", 58, 35, 1, 3, "breakDefense", 2, ["combo"], gain(0, 0, 0, 5, 0), { id: "founderFist", name: "拳路刚猛", desc: "暴击+5，命中+2破防。", effects: { crit: 5 } }),
    fist_orange_2: skill("fist_orange_2", "黯魂掌", "fist", "orange", 105, 85, 2, 4, "breakDefense", 5, ["combo"], gain(0, 0, 0, 10, 0), { id: "sadPalm", name: "黯魂夺魄", desc: "暴击+10，暴击倍率+0.75，命中+5破防。", effects: { crit: 10, critPower: 0.75 } }),
    fist_red_2: skill("fist_red_2", "碎星拳", "fist", "red", 178, 135, 3, 5, "breakDefense", 10, ["combo"], gain(0, 0, 0, 20, 0), { id: "starCrush", name: "碎星暴劲", desc: "暴击+20，暴击倍率+2.0，命中+10破防。", effects: { crit: 20, critPower: 2 } }),
    // 断脉路线: mixedFist(基础) -> fist_orange_3(进阶) -> fist_red_3(终极)
    fist_orange_3: skill("fist_orange_3", "截脉掌", "fist", "orange", 108, 82, 2, 4, "inner", 3, ["combo"], gain(5, 2, 0, 2, 0), { id: "cutMeridian", name: "截脉断息", desc: "连击+5，命中+2，暴击+2。", effects: { combo: 5, hit: 2, crit: 2 } }),
    fist_red_3: skill("fist_red_3", "断海掌", "fist", "red", 168, 130, 3, 5, "inner", 5, ["combo"], gain(8, 3, 0, 4, 0), { id: "seaBreak", name: "断海截息", desc: "连击+8，命中+3，暴击+4。", effects: { combo: 8, hit: 3, crit: 4 } }),

    // === 腿法 ===
    // 高闪避路线: leg_light_blue(基础) -> leg_light_orange(进阶) -> leg_light_red(终极)
    leg_light_blue: qinggong("leg_light_blue", "燕回腿", "blue", 3, gain(0, 0, 3, 0, 0.08), { id: "grassStep", name: "踏草无痕", desc: "闪避+3，出手速度+0.08。", effects: { dodge: 3, speed: 0.08 } }, 0, null),
    leg_light_orange: qinggong("leg_light_orange", "游龙腿", "orange", 4, gain(0, 1, 7, 0, 0.12), { id: "manySteps", name: "百变身法", desc: "命中+1，闪避+7，出手速度+0.12。", effects: { hit: 1, dodge: 7, speed: 0.12 } }, 0, null),
    leg_light_red: qinggong("leg_light_red", "凌波腿", "red", 5, gain(0, 2, 12, 0, 0.18), { id: "lingbo", name: "步生波纹", desc: "命中+2，闪避+12，出手速度+0.18。", effects: { hit: 2, dodge: 12, speed: 0.18 } }, 0, null),
    // 下盘路线: leg_kick_blue(基础) -> leg_kick_orange(进阶) -> leg_kick_red(终极)
    leg_kick_blue: qinggong("leg_kick_blue", "扫堂腿", "blue", 3, gain(0, 0, 4, 0, 0.06), { id: "swallowStep", name: "燕影回环", desc: "闪避+4，出手速度+0.06，真伤+100，命中时+1失衡。", effects: { dodge: 4, speed: 0.06, imbalanceBonus: 1 } }, 100, "lowKick"),
    leg_kick_orange: qinggong("leg_kick_orange", "盘龙腿", "orange", 4, gain(0, 0, 8, 0, 0.12), { id: "cloudLadder", name: "盘根折势", desc: "闪避+8，出手速度+0.12，真伤+200，命中时+3失衡。", effects: { dodge: 8, speed: 0.12, imbalanceBonus: 3 } }, 200, "lowKick"),
    leg_kick_red: qinggong("leg_kick_red", "碎岳沉桩腿", "red", 5, gain(0, 4, 3, 4, 0.20), { id: "mountainKick", name: "碎岳真劲", desc: "命中+4，闪避+3，暴击+4，出手速度+0.20，真伤+500，命中时+5失衡。", effects: { hit: 4, dodge: 3, crit: 4, speed: 0.20, imbalanceBonus: 5 } }, 500, "lowKick"),
    // 偷盗路线: leg_steal_blue(基础) -> leg_steal_orange(进阶) -> leg_steal_red(终极)
    leg_steal_blue: qinggong("leg_steal_blue", "探囊腿", "blue", 3, gain(0, 1, 2, 0, 0.08), { id: "eightSteps", name: "步步抢先", desc: "命中+1，闪避+2，出手速度+0.08。", effects: { hit: 1, dodge: 2, speed: 0.08 } }, 0, "steal"),
    leg_steal_orange: qinggong("leg_steal_orange", "飞檐探云腿", "orange", 4, gain(0, 2, 4, 2, 0.16), { id: "cloudThief", name: "探云取利", desc: "命中+2，闪避+4，暴击+2，出手速度+0.16。", effects: { hit: 2, dodge: 4, crit: 2, speed: 0.16 } }, 0, "steal"),
    leg_steal_red: qinggong("leg_steal_red", "摘星无影腿", "red", 5, gain(0, 3, 8, 3, 0.22), { id: "starThief", name: "摘星掠影", desc: "命中+3，闪避+8，暴击+3，出手速度+0.22。", effects: { hit: 3, dodge: 8, crit: 3, speed: 0.22 } }, 0, "steal"),
    // === 攻击型秘籍（自用Buff，修炼后可在战斗中使用）===
    manual_speed: {
      id: "manual_speed", name: "唯快不破", icon: "速",
      school: "none", rarity: "blue", power: 0, qi: 50, cd: 0,
      train: 3, debuff: null, debuffStacks: 0, tags: ["selfBuff"],
      style: "buff", styleName: "增益",
      isSelfBuff: true, battle: true, statGain: null, trait: null,
      selfBuff: { type: "speed", mult: 3, duration: 3 },
      desc: "读条速度提升3倍，持续3回合。消耗内力50。"
    },
    manual_atk: {
      id: "manual_atk", name: "力大无穷", icon: "力",
      school: "none", rarity: "blue", power: 0, qi: 50, cd: 0,
      train: 3, debuff: null, debuffStacks: 0, tags: ["selfBuff"],
      style: "buff", styleName: "增益",
      isSelfBuff: true, battle: true, statGain: null, trait: null,
      selfBuff: { type: "atk", mult: 2, duration: 3 },
      desc: "攻击力提升2倍，持续3回合。消耗内力50。"
    },
    manual_crit: {
      id: "manual_crit", name: "屠杀盛宴", icon: "杀",
      school: "none", rarity: "blue", power: 0, qi: 50, cd: 0,
      train: 3, debuff: null, debuffStacks: 0, tags: ["selfBuff"],
      style: "buff", styleName: "增益",
      isSelfBuff: true, battle: true, statGain: null, trait: null,
      selfBuff: { type: "crit", critAdd: 100, comboAdd: 100, critPowerAdd: 1, duration: 3 },
      desc: "暴击概率+100%，连击概率+100%，暴击倍率+1.0，持续3回合。消耗内力50。"
    }
  },
  strategies: [],
  traits: [
    { id: "constable", name: "缉凶", desc: "命中+6，获得经验时额外+8。" },
    { id: "orthodox", name: "正脉", desc: "血量+50，内力+40，经验获取+8%。" },
    { id: "swift", name: "迅影", desc: "出手速度+0.25，闪避+4。" },
    { id: "tough", name: "铜皮铁骨", desc: "血量+80，防御+10。" },
    { id: "healer", name: "青囊", desc: "治疗效果+25%，每月开始额外恢复90血量和内力。" },
    { id: "critUp", name: "战意", desc: "暴击+2。" },
    { id: "breath", name: "龟息", desc: "调息额外恢复80血量和内力。" },
    { id: "force", name: "刚力", desc: "伤害增加2%。" },
    { id: "clearMind", name: "明心", desc: "每月开始额外获得1行动力。" },
    { id: "merchantFriend", name: "奇智", desc: "商人价格降低15%。" },
    { id: "hardBone", name: "硬骨", desc: "最大血量+60。" },
    { id: "innerRoot", name: "内息深长", desc: "最大内力+80。" }
  ],
  wandererTraits: [
    { id: "wanderer", name: "浪游", desc: "战斗开始出手速度+0.12，金钱获取+8%。" },
    { id: "nightPoison", name: "夜行", desc: "暴击+8，中毒层数更高。" },
    { id: "tieyi_blood_debt", name: "血偿", desc: "流血招式层数+3，无论武器类型均生效。" },
    { id: "tieyi_body_tempering", name: "铁衣锻体", desc: "每回合调息额外恢复5%最大血量。" },
    { id: "jingxi", name: "鲸息", desc: "每回合自动恢复5%最大内力。" }
  ],
  constableTraits: [],
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
    statPill: { id: "statPill", name: "小补丸", icon: "丹", type: "stat", price: 300, desc: "永久攻击+3，防御+2，命中+1。", atk: 3, def: 2, hit: 1 },
    superPill: { id: "superPill", name: "十全大补丸", icon: "丹", type: "stat", price: 1000, desc: "永久血量+180，内力+60，攻击+6，防御+6。", hp: 180, qi: 60, atk: 6, def: 6 }
  },
  // 武器：按路线×品质拆分
  weapons: {
    // === 刀法 ===
    blade_bleed_blue: { id: "blade_bleed_blue", name: "饮血雁翎刀", icon: "刀", school: "blade", rarity: "blue", style: "bleed", price: 260, atk: 12, desc: "流血刀。流血+2。", debuffBonus: 2 },
    blade_bleed_orange: { id: "blade_bleed_orange", name: "裂血长刀", icon: "刀", school: "blade", rarity: "orange", style: "bleed", price: 520, atk: 28, desc: "流血刀。流血+5，流血上限+3。", debuffBonus: 5, bleedCapBonus: 3 },
    blade_bleed_red: { id: "blade_bleed_red", name: "血河断刃", icon: "刀", school: "blade", rarity: "red", style: "bleed", price: 980, atk: 58, desc: "流血刀。流血+10，流血上限+15。", debuffBonus: 10, bleedCapBonus: 15 },

    blade_frost_blue: { id: "blade_frost_blue", name: "霜刃刀", icon: "刀", school: "blade", rarity: "blue", style: "frost", price: 260, atk: 12, desc: "寒冰刀。寒气+1。", frostBonus: 1 },
    blade_frost_orange: { id: "blade_frost_orange", name: "玄霜刀", icon: "刀", school: "blade", rarity: "orange", style: "frost", price: 520, atk: 28, desc: "寒冰刀。寒气+2，削内+15。", frostBonus: 2, qiBreakBonus: 15 },
    blade_frost_red: { id: "blade_frost_red", name: "寒渊刀", icon: "刀", school: "blade", rarity: "red", style: "frost", price: 980, atk: 58, desc: "寒冰刀。寒气+4，寒气上限+2。", frostBonus: 4, frostCapBonus: 2 },

    blade_hamstring_blue: { id: "blade_hamstring_blue", name: "断步短刀", icon: "刀", school: "blade", rarity: "blue", style: "hamstring", price: 260, atk: 11, desc: "断筋刀。断筋+1。", hamstringBonus: 1 },
    blade_hamstring_orange: { id: "blade_hamstring_orange", name: "截脉刀", icon: "刀", school: "blade", rarity: "orange", style: "hamstring", price: 520, atk: 28, desc: "断筋刀。断筋+2。", hamstringBonus: 2 },
    blade_hamstring_red: { id: "blade_hamstring_red", name: "天残断骨刀", icon: "刀", school: "blade", rarity: "red", style: "hamstring", price: 980, atk: 58, desc: "断筋刀。断筋+4，断筋上限+2。", hamstringBonus: 4, hamstringCapBonus: 2 },

    // === 拳掌 ===
    fist_combo_blue: { id: "fist_combo_blue", name: "缠丝护腕", icon: "腕", school: "fist", rarity: "blue", style: "combo", price: 260, atk: 12, desc: "连击掌。连击+6，连击掌基础招只吃半效。", comboBonus: 6 },
    fist_combo_orange: { id: "fist_combo_orange", name: "拦江臂铠", icon: "腕", school: "fist", rarity: "orange", style: "combo", price: 520, atk: 28, desc: "连击掌。连击+12。", comboBonus: 12 },
    fist_combo_red: { id: "fist_combo_red", name: "惊浪拳套", icon: "拳", school: "fist", rarity: "red", style: "combo", price: 980, atk: 58, desc: "连击掌。连击+18，三叠浪额外出掌上限+1。", comboBonus: 18, palmChainBonus: 1 },

    fist_crit_blue: { id: "fist_crit_blue", name: "炽星拳套", icon: "拳", school: "fist", rarity: "blue", style: "critPalm", price: 500, atk: 12, desc: "暴击掌。暴击+4，破防+2。", critBonus: 4, breakDefenseBonus: 2 },
    fist_crit_orange: { id: "fist_crit_orange", name: "纯阳拳甲", icon: "拳", school: "fist", rarity: "orange", style: "critPalm", price: 1500, atk: 28, desc: "暴击掌。暴击+8，暴伤+0.75，破防+5，破防上限+3。", critBonus: 8, critPower: 0.75, breakDefenseBonus: 5, breakDefenseCapBonus: 3 },
    fist_crit_red: { id: "fist_crit_red", name: "碎星拳套", icon: "拳", school: "fist", rarity: "red", style: "critPalm", price: 4200, atk: 58, desc: "暴击掌。暴击+16，暴伤+2，破防+10，破防上限+10。", critBonus: 16, critPower: 2, breakDefenseBonus: 10, breakDefenseCapBonus: 10 },

    fist_qibreak_blue: { id: "fist_qibreak_blue", name: "破劲拳套", icon: "拳", school: "fist", rarity: "blue", style: "qiBreak", price: 260, atk: 12, desc: "断脉掌。削内+8。", qiBreakBonus: 8 },
    fist_qibreak_orange: { id: "fist_qibreak_orange", name: "截脉臂甲", icon: "腕", school: "fist", rarity: "orange", style: "qiBreak", price: 520, atk: 28, desc: "断脉掌。削内+18。", qiBreakBonus: 18 },
    fist_qibreak_red: { id: "fist_qibreak_red", name: "断脉神拳套", icon: "拳", school: "fist", rarity: "red", style: "qiBreak", price: 980, atk: 58, desc: "断脉掌。削内+30，归零追加伤害提高。", qiBreakBonus: 30, qiBreakCollapseBonus: 1 },

    // === 暗器 ===
    hidden_gu_blue: { id: "hidden_gu_blue", name: "蚀骨针囊", icon: "镖", school: "hidden", rarity: "blue", style: "gu", price: 260, atk: 10, desc: "下蛊暗器。蛊+1。", guBonus: 1 },
    hidden_gu_orange: { id: "hidden_gu_orange", name: "夺魂针盒", icon: "镖", school: "hidden", rarity: "orange", style: "gu", price: 520, atk: 24, desc: "下蛊暗器。蛊+2。", guBonus: 2 },
    hidden_gu_red: { id: "hidden_gu_red", name: "九窍蛊匣", icon: "镖", school: "hidden", rarity: "red", style: "gu", price: 980, atk: 50, desc: "下蛊暗器。蛊+4，蛊上限+2。", guBonus: 4, guCapBonus: 2 },

    hidden_poison_blue: { id: "hidden_poison_blue", name: "淬毒针匣", icon: "镖", school: "hidden", rarity: "blue", style: "poison", price: 500, atk: 10, desc: "淬毒暗器。毒+2。", poisonBonus: 2 },
    hidden_poison_orange: { id: "hidden_poison_orange", name: "淬毒银针", icon: "镖", school: "hidden", rarity: "orange", style: "poison", price: 1400, atk: 24, desc: "淬毒暗器。毒+5，毒上限+3。", poisonBonus: 5, poisonCapBonus: 3 },
    hidden_poison_red: { id: "hidden_poison_red", name: "孔雀毒匣", icon: "镖", school: "hidden", rarity: "red", style: "poison", price: 4300, atk: 50, desc: "淬毒暗器。毒+10，毒上限+15。", poisonBonus: 10, poisonCapBonus: 15 },

    hidden_coin_blue: { id: "hidden_coin_blue", name: "金钱飞镖", icon: "镖", school: "hidden", rarity: "blue", style: "coin", price: 260, atk: 10, desc: "金钱暗器。金钱伤害+40。", coinDamageBonus: 40 },
    hidden_coin_orange: { id: "hidden_coin_orange", name: "贯钱镖", icon: "镖", school: "hidden", rarity: "orange", style: "coin", price: 520, atk: 24, desc: "金钱暗器。金钱伤害+120。", coinDamageBonus: 120 },
    hidden_coin_red: { id: "hidden_coin_red", name: "万贯金雨匣", icon: "镖", school: "hidden", rarity: "red", style: "coin", price: 980, atk: 50, desc: "金钱暗器。金钱伤害+260，终极金钱暗器花费降低。", coinDamageBonus: 260, coinCostReduce: 1 },

    // === 腿法装备 ===
    leg_evasive_blue: { id: "leg_evasive_blue", name: "探步靴", icon: "腿", school: "lightness", rarity: "blue", style: "evasive", price: 260, atk: 10, desc: "高闪避腿法。闪避+4。", dodgeBonus: 4 },
    leg_evasive_orange: { id: "leg_evasive_orange", name: "游龙靴", icon: "腿", school: "lightness", rarity: "orange", style: "evasive", price: 520, atk: 24, desc: "高闪避腿法。闪避+8，闪避回息提高。", dodgeBonus: 8, evasiveBoost: 1 },
    leg_evasive_red: { id: "leg_evasive_red", name: "踏浪战靴", icon: "腿", school: "lightness", rarity: "red", style: "evasive", price: 980, atk: 50, desc: "高闪避腿法。闪避+14，闪避收益每回合上限+1。", dodgeBonus: 14, evasiveCapBonus: 1 },

    leg_low_blue: { id: "leg_low_blue", name: "破门靴", icon: "腿", school: "lightness", rarity: "blue", style: "lowKick", price: 500, atk: 10, desc: "下盘腿法。真伤+100，失衡+1。", trueDamageBonus: 100, imbalanceBonus: 1 },
    leg_low_orange: { id: "leg_low_orange", name: "压山靴", icon: "腿", school: "lightness", rarity: "orange", style: "lowKick", price: 1500, atk: 24, desc: "下盘腿法。真伤+200，失衡+3，失衡上限+3。", trueDamageBonus: 200, imbalanceBonus: 3, imbalanceCapBonus: 3 },
    leg_low_red: { id: "leg_low_red", name: "断岳沉步靴", icon: "腿", school: "lightness", rarity: "red", style: "lowKick", price: 4500, atk: 50, desc: "下盘腿法。真伤+500，失衡+5，失衡上限+10。", trueDamageBonus: 500, imbalanceBonus: 5, imbalanceCapBonus: 10 },

    leg_steal_blue: { id: "leg_steal_blue", name: "盗影靴", icon: "腿", school: "lightness", rarity: "blue", style: "steal", price: 260, atk: 10, desc: "偷盗腿法。速度+0.04，偷钱+10。", speedBonus: 0.04, moneyBonus: 10 },
    leg_steal_orange: { id: "leg_steal_orange", name: "飞檐靴", icon: "腿", school: "lightness", rarity: "orange", style: "steal", price: 520, atk: 24, desc: "偷盗腿法。速度+0.08，偷钱+35。", speedBonus: 0.08, moneyBonus: 35 },
    leg_steal_red: { id: "leg_steal_red", name: "摘星掠影靴", icon: "腿", school: "lightness", rarity: "red", style: "steal", price: 980, atk: 50, desc: "偷盗腿法。速度+0.16，偷钱+90。", speedBonus: 0.16, moneyBonus: 90 },
    // === Boss 专属红色武器（商店不出售）===
    blade_hamstring_red_zhao: { id: "blade_hamstring_red_zhao", name: "九环大刀", icon: "刀", school: "blade", rarity: "red", style: "hamstring", price: 0, atk: 58, desc: "赵崇岳的佩刀。断筋+6，断筋上限+10。", hamstringBonus: 6, hamstringCapBonus: 10, bossOnly: true },
    blade_frost_red_liu: { id: "blade_frost_red_liu", name: "寒剑", icon: "剑", school: "blade", rarity: "red", style: "frost", price: 0, atk: 58, desc: "柳长卿的佩剑。寒气+2，寒气上限+10。", frostBonus: 2, frostCapBonus: 10, bossOnly: true },
    blade_blood_frost_red_shen: { id: "blade_blood_frost_red_shen", name: "霜血方天戟", icon: "戟", school: "blade", rarity: "red", style: "bleed", price: 0, atk: 58, desc: "沈千山的方天画戟。流血+2，寒气+2，流血上限+10，寒气上限+10。", bleedBonus: 2, frostBonus: 2, bleedCapBonus: 10, frostCapBonus: 10, bossOnly: true },
    blade_bleed_red_gongsun: { id: "blade_bleed_red_gongsun", name: "浑铁裂血枪", icon: "枪", school: "blade", rarity: "red", style: "bleed", price: 0, atk: 58, desc: "公孙烈的浑铁枪。流血+6，流血上限+10。", bleedBonus: 6, bleedCapBonus: 10, bossOnly: true },
    fist_hamstring_vein_red_chu: { id: "fist_hamstring_vein_red_chu", name: "碎筋断脉套", icon: "拳", school: "fist", rarity: "red", style: "hamstring", price: 0, atk: 58, desc: "楚宗玄的拳套。断筋+6，断脉+6，断筋上限+10，断脉上限+10。", hamstringBonus: 6, veinBreakBonus: 6, hamstringCapBonus: 10, veinBreakCapBonus: 10, bossOnly: true },
    // === 第四年孤云支线Boss专属武器 ===
    boss_poison_red_lu: { id: "boss_poison_red_lu", name: "毒玉珠盘", icon: "珠", school: "hidden", rarity: "red", style: "poison", price: 0, atk: 58, desc: "卢白砚的毒账珠盘。淬毒上限+10。", poisonCapBonus: 10, bossOnly: true },
    boss_poison_vein_red_luo: { id: "boss_poison_vein_red_luo", name: "迷香鞭", icon: "鞭", school: "hidden", rarity: "red", style: "poison", price: 0, atk: 58, desc: "罗千魅的迷香鞭。淬毒上限+10，断脉上限+10。", poisonCapBonus: 10, veinBreakCapBonus: 10, bossOnly: true },
    boss_frost_red_wen: { id: "boss_frost_red_wen", name: "断魂琴", icon: "琴", school: "blade", rarity: "red", style: "frost", price: 0, atk: 58, desc: "温玉郎的断魂琴。寒气上限+10。", frostCapBonus: 10, bossOnly: true },
    boss_frost_bleed_red_shi: { id: "boss_frost_bleed_red_shi", name: "寒血幡", icon: "幡", school: "blade", rarity: "red", style: "frost", price: 0, atk: 58, desc: "石寒灯的寒血幡。寒气上限+10，流血上限+10。", frostCapBonus: 10, bleedCapBonus: 10, bossOnly: true },
    boss_all_debuff_red_xu: { id: "boss_all_debuff_red_xu", name: "万毒阴阳钗", icon: "钗", school: "hidden", rarity: "red", style: "poison", price: 0, atk: 58, desc: "徐迦笙的万毒阴阳钗。寒气上限+10，流血上限+10，淬毒上限+10。", frostCapBonus: 10, bleedCapBonus: 10, poisonCapBonus: 10, bossOnly: true }
  },
  // 防具
  armors: {
    armor_light_blue: { id: "armor_light_blue", name: "青布护身衣", icon: "衣", rarity: "blue", price: 220, hp: 160, def: 5, desc: "轻便护甲。速度+0.02。", speedBonus: 0.02 },
    armor_mid_blue: { id: "armor_mid_blue", name: "铁线软甲", icon: "甲", rarity: "blue", price: 260, hp: 190, def: 6, desc: "软铁编织护甲。闪避+2。", dodgeBonus: 2 },
    armor_heavy_blue: { id: "armor_heavy_blue", name: "硬布背心", icon: "甲", rarity: "blue", price: 240, hp: 220, def: 7, desc: "厚布硬衬背心。", dodgeBonus: 0 },
    armor_light_orange: { id: "armor_light_orange", name: "游云轻甲", icon: "衣", rarity: "orange", price: 480, hp: 360, def: 10, desc: "如云轻盈的护甲。速度+0.10。", speedBonus: 0.10 },
    armor_heavy_orange: { id: "armor_heavy_orange", name: "玄铁胸甲", icon: "甲", rarity: "orange", price: 580, hp: 520, def: 14, desc: "厚重玄铁。暴击伤害降低15%。", critReduce: 0.15 },
    armor_guard_orange: { id: "armor_guard_orange", name: "护心鳞甲", icon: "甲", rarity: "orange", price: 520, hp: 440, def: 12, desc: "护心镜鳞甲。低于30%血时直接伤害-20%。", lowHpGuard: 0.2, lowHpThreshold: 0.3 },
    armor_dragon_red: { id: "armor_dragon_red", name: "龙鳞重甲", icon: "甲", rarity: "red", price: 980, hp: 1080, def: 20, desc: "龙鳞所铸重甲。战斗开始获得30%最大血量护体，每场一次。", dragonGuard: 0.3 },
    armor_wuxiang_red: { id: "armor_wuxiang_red", name: "无相秘甲", icon: "衣", rarity: "red", price: 920, hp: 840, def: 18, desc: "无形无相。受到攻击时反弹25%伤害。", reflect: 0.25 },
    armor_tianheng_red: { id: "armor_tianheng_red", name: "天衡御心甲", icon: "甲", rarity: "red", price: 960, hp: 900, def: 22, desc: "御心之力。低于25%血时直接伤害-50%，持续伤害-25%。", lowHpGuard: 0.5, dotReduce: 0.25, lowHpThreshold: 0.25 }
  },
  enemies: [
    { id: "rogue", name: "武盟喽啰·刀手", icon: "贼", portraitImage: "assets/portraits_pixel/rogue_pixel_320.webp", hp: 260, qi: 120, atk: 46, def: 22, combo: 2, hit: 55, dodge: 2, crit: 5, speed: 1.25, rank: 1, taunt: "拒册散人？抓的就是你。" },
    { id: "blade", name: "武盟二流弟子", icon: "刀", portraitImage: "assets/portraits_pixel/blade_pixel_320.webp", hp: 330, qi: 180, atk: 62, def: 30, combo: 3, hit: 65, dodge: 3, crit: 8, speed: 1.55, rank: 2, taunt: "武盟办案，闲人退散！" },
    { id: "highDodgeAssassin", name: "武盟暗哨", icon: "影", portraitImage: "assets/portraits_pixel/highDodgeAssassin_pixel_320.webp", hp: 300, qi: 220, atk: 66, def: 24, combo: 5, hit: 76, dodge: 42, crit: 14, speed: 1.85, rank: 2, trait: "evasive", traitName: "高闪避", traitDesc: "武盟暗哨，身法极快，考验命中和必中招式。", taunt: "你太慢了。" },
    { id: "armorBreakBlade", name: "武盟破防刀手", icon: "破", portraitImage: "assets/portraits_pixel/armorBreakBlade_pixel_320.webp", hp: 390, qi: 210, atk: 74, def: 34, combo: 3, hit: 68, dodge: 2, crit: 9, speed: 1.42, rank: 3, trait: "armorBreak", traitName: "破防刀", traitDesc: "攻击会忽略部分防御，并削弱防御。", taunt: "你这身甲，挡不住我几刀。" },
    { id: "qiSuppressFist", name: "武盟执事", icon: "拳", portraitImage: "assets/portraits_pixel/qiSuppressFist_pixel_320.webp", hp: 420, qi: 280, atk: 68, def: 38, combo: 7, hit: 70, dodge: 4, crit: 8, speed: 1.38, rank: 3, trait: "qiSuppress", traitName: "断脉掌", traitDesc: "前5回合攻击会削减内力，逼迫调息节奏（第6回合起不再削内）。", taunt: "前五个回合，你别想好好运功。" },
    { id: "witch", name: "武盟散人叛徒·毒妇", icon: "毒", portraitImage: "assets/portraits_pixel/witch_pixel_320.webp", hp: 390, qi: 260, atk: 58, def: 32, combo: 4, hit: 66, dodge: 5, crit: 9, speed: 1.45, rank: 3, taunt: "尝尝这毒吧。" },
    { id: "demon", name: "散人叛徒·心魔", icon: "魔", portraitImage: "assets/portraits_pixel/demon_pixel_320.webp", hp: 560, qi: 300, atk: 82, def: 42, combo: 6, hit: 66, dodge: 4, crit: 12, speed: 1.4, rank: 4, taunt: "心魔？不，我就是你的报应。" },
    // 孤云逐浪专属敌人
    { id: "tangkou_enforcer", name: "堂口执事", icon: "官", portraitImage: "assets/portraits_pixel/armorBreakBlade_pixel_320.webp", hp: 320, qi: 180, atk: 52, def: 28, combo: 3, hit: 60, dodge: 3, crit: 6, speed: 1.3, rank: 2, taunt: "拒册者，押解堂口！" },
    { id: "capture_squad", name: "抓捕队员×3", icon: "捕", portraitImage: "assets/portraits_pixel/blade_pixel_320.webp", hp: 380, qi: 160, atk: 58, def: 24, combo: 2, hit: 62, dodge: 2, crit: 6, speed: 1.35, rank: 2, taunt: "奉命抓人，反抗者格杀勿论！" },
    { id: "tangkou_fat_boss", name: "胖执事·赵豹", icon: "官", portraitImage: "assets/portraits_pixel/armorBreakBlade_pixel_320.webp", hp: 450, qi: 200, atk: 64, def: 34, combo: 3, hit: 58, dodge: 2, crit: 7, speed: 1.2, rank: 3, taunt: "人命不值钱。加把劲。" },
    { id: "jail_captain", name: "狱卒头领", icon: "狱", portraitImage: "assets/portraits_pixel/qiSuppressFist_pixel_320.webp", hp: 420, qi: 220, atk: 66, def: 36, combo: 4, hit: 64, dodge: 3, crit: 8, speed: 1.3, rank: 3, taunt: "越狱？先过我这关。" },
    { id: "patrol_squad", name: "巡逻弟子×3", icon: "巡", portraitImage: "assets/portraits_pixel/blade_pixel_320.webp", hp: 350, qi: 170, atk: 54, def: 26, combo: 3, hit: 60, dodge: 3, crit: 6, speed: 1.4, rank: 2, taunt: "宵禁！站住！" },
    { id: "zhou_tong_iron_hand", name: "铁手·周通", icon: "拳", portraitImage: "assets/portraits_pixel/qiSuppressFist_pixel_320.webp", hp: 520, qi: 280, atk: 78, def: 42, combo: 5, hit: 68, dodge: 4, crit: 10, speed: 1.35, rank: 4, trait: "armorBreak", traitName: "铁手", traitDesc: "铁手套开瓢，拳拳破防。", taunt: "奉命'劝导'拒册散人。劝不听的话——我这双手套开过不少瓢。" },
    { id: "vanguard_captain", name: "先锋队长", icon: "刀", portraitImage: "assets/portraits_pixel/armorBreakBlade_pixel_320.webp", hp: 460, qi: 240, atk: 72, def: 38, combo: 4, hit: 66, dodge: 3, crit: 9, speed: 1.4, rank: 3, taunt: "先锋队在此，谁敢造次！" },
    { id: "scout_team", name: "武盟斥候×2", icon: "斥", portraitImage: "assets/portraits_pixel/highDodgeAssassin_pixel_320.webp", hp: 300, qi: 160, atk: 52, def: 22, combo: 4, hit: 62, dodge: 8, crit: 8, speed: 1.6, rank: 2, taunt: "发现目标，速战速决。" },
    { id: "protectorate_deputy", name: "左护法副将", icon: "将", portraitImage: "assets/portraits_pixel/demon_pixel_320.webp", hp: 600, qi: 320, atk: 84, def: 48, combo: 5, hit: 70, dodge: 5, crit: 11, speed: 1.4, rank: 4, trait: "armorBreak", traitName: "精锐", traitDesc: "沈千山麾下精锐，攻防兼备。", taunt: "左护法麾下，不留活口。" },
    { id: "remnant_squad", name: "溃军残部", icon: "溃", portraitImage: "assets/portraits_pixel/blade_pixel_320.webp", hp: 340, qi: 150, atk: 56, def: 24, combo: 2, hit: 58, dodge: 2, crit: 6, speed: 1.3, rank: 2, taunt: "赵堂主虽死，债还没清。" },
    { id: "wumeng_spy_assassin", name: "武盟探子·刺客", icon: "刺", portraitImage: "assets/portraits_pixel/highDodgeAssassin_pixel_320.webp", hp: 360, qi: 200, atk: 70, def: 28, combo: 5, hit: 68, dodge: 36, crit: 12, speed: 1.75, rank: 3, trait: "evasive", traitName: "暗杀者", traitDesc: "身法轻灵，企图突围报信。", taunt: "脑袋值不少钱。" },
    { id: "liu_changqing_retreat", name: "寒剑·柳长卿（退却中）", icon: "剑", portraitImage: "assets/portraits_pixel/highDodgeAssassin_pixel_320.webp", hp: 480, qi: 300, atk: 76, def: 36, combo: 4, hit: 70, dodge: 10, crit: 12, speed: 1.55, rank: 4, trait: "evasive", traitName: "寒剑", traitDesc: "高速诡变剑术，闪避极高。", taunt: "试探到此为止。" },
    { id: "hanjian_liu_changqing", name: "寒剑·柳长卿", icon: "剑", portraitImage: "assets/portraits_pixel/highDodgeAssassin_pixel_320.webp", hp: 520, qi: 340, atk: 82, def: 40, combo: 5, hit: 74, dodge: 12, crit: 14, speed: 1.6, rank: 4, trait: "evasive", traitName: "寒剑", traitDesc: "沈千山副使，剑术诡变，高速闪避。", taunt: "你的剑法，比传闻中弱。" },
    { id: "camp_guard_captain", name: "安置营守卫长", icon: "守", portraitImage: "assets/portraits_pixel/armorBreakBlade_pixel_320.webp", hp: 500, qi: 260, atk: 74, def: 42, combo: 4, hit: 66, dodge: 4, crit: 10, speed: 1.35, rank: 3, taunt: "擅闯安置营者，死。" },
    { id: "traitor_oldzhang_with_aids", name: "老张与同伙×3", icon: "叛", portraitImage: "assets/portraits_pixel/blade_pixel_320.webp", hp: 380, qi: 180, atk: 58, def: 28, combo: 3, hit: 60, dodge: 3, crit: 7, speed: 1.35, rank: 2, taunt: "他们……他们在老家……俺不送信……他们就……" },
    { id: "assault_team_trapped", name: "突击队·中伏", icon: "队", portraitImage: "assets/portraits_pixel/blade_pixel_320.webp", hp: 420, qi: 200, atk: 66, def: 30, combo: 3, hit: 62, dodge: 3, crit: 8, speed: 1.3, rank: 3, taunt: "中伏了！围起来！" },
    { id: "fata_squad", name: "护法堂精锐", icon: "精", portraitImage: "assets/portraits_pixel/armorBreakBlade_pixel_320.webp", hp: 460, qi: 240, atk: 72, def: 36, combo: 4, hit: 66, dodge: 4, crit: 10, speed: 1.4, rank: 3, taunt: "护法堂精锐，岂容你撒野。" },
    // 孤云逐浪主线专属敌人（wandererMonths中引用的enemyId）
    { id: "ye_gu_duel", name: "无影·叶孤", icon: "影", portraitImage: "assets/portraits_pixel/highDodgeAssassin_pixel_320.webp", hp: 2200, qi: 720, atk: 95, def: 40, combo: 7, hit: 88, dodge: 30, crit: 18, speed: 1.80, rank: 3, boss: true, bossTraits: ["bloodBlade", "veinBreak"], bossTraitDesc: "每回合流血+3（血刃）、断脉+3，上限15层", taunt: "我要的不是你的命，是那份名单。交出来，你可以活。" },
    { id: "shadow_killer_yegu", name: "无影·叶孤", icon: "影", portraitImage: "assets/portraits_pixel/highDodgeAssassin_pixel_320.webp", hp: 2200, qi: 720, atk: 95, def: 40, combo: 7, hit: 88, dodge: 30, crit: 18, speed: 1.80, rank: 3, boss: true, bossTraits: ["bloodBlade", "veinBreak"], bossTraitDesc: "每回合流血+3（血刃）、断脉+3，上限15层", taunt: "我要的不是你的命，是那份名单。交出来，你可以活。" },
    { id: "bounty_hunter_squad", name: "赏金猎人团", icon: "猎", portraitImage: "assets/portraits_pixel/mini_coin_dart_pixel_320.webp", hp: 1800, qi: 500, atk: 82, def: 42, combo: 4, hit: 78, dodge: 8, crit: 10, speed: 1.45, rank: 3, taunt: "五千两的人头，我要定了。" },
    { id: "fanatic_qianbiao_with_men", name: "狂刀·钱彪一伙", icon: "刀", portraitImage: "assets/portraits_pixel/mini_bleed_blade_pixel_320.webp", hp: 2800, qi: 680, atk: 115, def: 55, combo: 5, hit: 82, dodge: 10, crit: 14, speed: 1.48, rank: 3, boss: true, bossTraits: ["hamstringStrike"], bossTraitDesc: "每回合断筋+3，上限15层", taunt: "统领建立的新秩序，需要你们这些散人做出点牺牲。" },
    { id: "elite_guard_squad", name: "总坛精英守卫", icon: "精", portraitImage: "assets/portraits_pixel/armorBreakBlade_pixel_320.webp", hp: 2000, qi: 600, atk: 92, def: 52, combo: 4, hit: 76, dodge: 6, crit: 11, speed: 1.42, rank: 4, taunt: "擅闯总坛者，死。" },
    { id: "beacon_scout_captain", name: "斥候队长", icon: "斥", portraitImage: "assets/portraits_pixel/highDodgeAssassin_pixel_320.webp", hp: 420, qi: 220, atk: 62, def: 30, combo: 5, hit: 72, dodge: 18, crit: 10, speed: 1.65, rank: 2, taunt: "发现目标，速战速决。" },
    { id: "right_protector_gongsun", name: "右护法·公孙烈", icon: "枪", portraitImage: "assets/portraits_pixel/armorBreakBlade_pixel_320.webp", hp: 7000, qi: 1800, atk: 185, def: 120, combo: 6, hit: 85, dodge: 10, crit: 16, speed: 1.52, rank: 6, boss: true, bossTraits: ["celestialShield", "bloodBlade"], bossTraitDesc: "开场30%HP天罡护体；每回合流血+6（血刃），上限15层", taunt: "统领说打谁就打谁。我不问为什么。" },
    { id: "dungeon_warden_with_guards", name: "地牢看守长", icon: "牢", portraitImage: "assets/portraits_pixel/demon_pixel_320.webp", hp: 2500, qi: 780, atk: 90, def: 68, combo: 4, hit: 80, dodge: 12, crit: 10, speed: 1.38, rank: 3, boss: true, bossTraits: ["celestialCleanse", "veinBreak"], bossTraitDesc: "≤50%HP天罡净化+回血30%；每回合断脉+3，上限15层", taunt: "换班的间隙只有一炷香。你们来得不是时候。" },
    // --- v5.8 主线18战敌人 ---
    { id: "main_m2_liu_tie", name: "堂口捕头·刘铁", icon: "捕", portraitImage: "assets/portraits_guyun_pixel/main_m2_liu_tie_pixel_320.webp", hp: 500, qi: 180, atk: 40, def: 16, combo: 3, hit: 65, dodge: 5, crit: 6, speed: 1.15, rank: 1, taunt: "堂口有令——拒册散人，押回问话！" },
    { id: "main_m4_qian_hu", name: "缉捕队长·钱虎", icon: "缉", portraitImage: "assets/portraits_guyun_pixel/main_m4_qian_hu_pixel_320.webp", hp: 750, qi: 240, atk: 55, def: 22, combo: 3, hit: 68, dodge: 5, crit: 7, speed: 1.20, rank: 1, boss: true, bossTraits: ["hamstringStrike"], bossTraitDesc: "每回合断筋+1，上限15层（每层削攻2%、减速2%）", taunt: "老子在堂口十年，还没哪个散人跑得掉。" },
    { id: "main_m6_zhou_tong", name: "铁手·周通", icon: "拳", portraitImage: "assets/portraits_guyun_pixel/main_m6_zhou_tong_pixel_320.webp", hp: 1000, qi: 320, atk: 70, def: 28, combo: 5, hit: 70, dodge: 6, crit: 10, speed: 1.25, rank: 2, boss: true, bossTraits: ["armorBreak"], bossTraitDesc: "玩家DEF剩50%；每次命中玩家DEF-5%", taunt: "奉命'劝导'拒册散人。劝不听的话——我这双手套开过不少瓢。" },
    { id: "main_m8_ma_rulong", name: "先锋营统领·马如龙", icon: "将", portraitImage: "assets/portraits_guyun_pixel/main_m8_ma_rulong_pixel_320.webp", hp: 1500, qi: 420, atk: 85, def: 34, combo: 4, hit: 72, dodge: 7, crit: 9, speed: 1.30, rank: 2, boss: true, bossTraits: ["armorBreak", "hamstringStrike"], bossTraitDesc: "破防贯通（玩家DEF×50%）；每回合断筋+2，上限15层", taunt: "先锋营在此！散人还不束手就擒？" },
    { id: "main_m10_yang_zhen", name: "护法副将·杨震", icon: "将", portraitImage: "assets/portraits_guyun_pixel/main_m10_yang_zhen_pixel_320.webp", hp: 2000, qi: 520, atk: 100, def: 40, combo: 4, hit: 75, dodge: 8, crit: 10, speed: 1.35, rank: 3, boss: true, bossTraits: ["armorShield", "armorBreak"], bossTraitDesc: "开场20%HP护体真气；玩家DEF剩50%，每次命中DEF-5%", taunt: "左护法点名要你的人头。自己交出来，免得多受皮肉苦。" },
    { id: "main_m12_zhao_chongyue", name: "杭州堂主·赵崇岳", icon: "刀", portraitImage: "assets/portraits_guyun_pixel/main_m12_zhao_chongyue_pixel_320.webp", hp: 4000, qi: 1200, atk: 120, def: 48, combo: 5, hit: 80, dodge: 10, crit: 14, speed: 1.50, rank: 5, boss: true, weapon: "blade_hamstring_red_zhao", bossTraits: ["armorBreak", "hamstringStrike", "armorShield", "lowHpBerserk"], bossTraitDesc: "破防贯通；每回合断筋+5；开场30%护体；≤30%HP狂暴", taunt: "知不知道因为你一个人，我少赚了多少银子？" },
    { id: "main_m14_du_wei", name: "沈千山帐前哨长·杜威", icon: "哨", portraitImage: "assets/portraits_guyun_pixel/main_m14_du_wei_pixel_320.webp", hp: 2500, qi: 600, atk: 110, def: 44, combo: 4, hit: 74, dodge: 9, crit: 10, speed: 1.40, rank: 3, boss: true, bossTraits: ["veinBreak"], bossTraitDesc: "每回合断脉+3，上限15层（每层减内力2%、减攻2%）", taunt: "左护法的眼睛无处不在。你藏不住的。" },
    { id: "main_m16_liu_changqing", name: "寒剑·柳长卿", icon: "剑", portraitImage: "assets/portraits_guyun_pixel/main_m16_liu_changqing_pixel_320.webp", hp: 3000, qi: 750, atk: 125, def: 50, combo: 5, hit: 76, dodge: 14, crit: 14, speed: 1.50, rank: 5, boss: true, weapon: "blade_frost_red_liu", bossTraits: ["chillAura"], bossTraitDesc: "每回合寒气+5，上限15层（每层减速4%）", taunt: "你的剑法，比传闻中弱。" },
    { id: "main_m18_qin_lie", name: "夜袭队长·秦烈", icon: "袭", portraitImage: "assets/portraits_guyun_pixel/main_m18_qin_lie_pixel_320.webp", hp: 3500, qi: 780, atk: 140, def: 56, combo: 5, hit: 78, dodge: 10, crit: 12, speed: 1.48, rank: 4, boss: true, bossTraits: ["veinBreak", "armorShield"], bossTraitDesc: "开场20%HP护体；每回合断脉+4，上限15层", taunt: "夜长梦多——速战速决，一个不留。" },
    { id: "main_m20_cui_ming", name: "血手·崔命", icon: "血", portraitImage: "assets/portraits_guyun_pixel/main_m20_cui_ming_pixel_320.webp", hp: 4000, qi: 850, atk: 155, def: 62, combo: 4, hit: 80, dodge: 12, crit: 14, speed: 1.52, rank: 4, boss: true, weapon: "blade_bleed_red", bossTraits: ["venomInfuse", "bloodBlade"], bossTraitDesc: "每回合流血+4（淬毒）+4（血刃），上限15层", taunt: "五千两是你的命价——但我不急着收，先玩玩。" },
    { id: "main_m22_ye_gu", name: "无影·叶孤", icon: "影", portraitImage: "assets/portraits_guyun_pixel/main_m22_ye_gu_pixel_320.webp", hp: 4500, qi: 1000, atk: 170, def: 68, combo: 7, hit: 88, dodge: 50, crit: 18, speed: 1.80, rank: 4, boss: true, bossTraits: ["bloodBlade", "veinBreak", "shadowStep"], bossTraitDesc: "每回合流血+4（血刃）、断脉+4；基础闪避75%，≤50%HP闪避×1.5", taunt: "我要的不是你的命，是那份名单。交出来，你可以活。" },
    { id: "main_m24_shen_qianshan", name: "左护法·沈千山", icon: "戟", portraitImage: "assets/portraits_guyun_pixel/main_m24_shen_qianshan_pixel_320.webp", hp: 8000, qi: 2400, atk: 200, def: 80, combo: 6, hit: 88, dodge: 14, crit: 18, speed: 1.65, rank: 7, boss: true, weapon: "blade_blood_frost_red_shen", bossTraits: ["celestialShield", "lowHpBerserk", "bloodBlade", "chillAura"], bossTraitDesc: "开场30%HP天罡护体；≤30%HP狂暴；每回合流血+5（血刃）、寒气+5", taunt: "把所有人当资源配置——包括你我。区别只是价格不同。" },
    { id: "main_m26_qian_biao", name: "狂刀·钱彪", icon: "刀", portraitImage: "assets/portraits_guyun_pixel/main_m26_qian_biao_pixel_320.webp", hp: 5000, qi: 1100, atk: 185, def: 74, combo: 5, hit: 82, dodge: 10, crit: 14, speed: 1.60, rank: 5, boss: true, bossTraits: ["hamstringStrike", "lowHpBerserk"], bossTraitDesc: "每回合断筋+5；≤30%HP ATK×1.5, SPEED×1.5，持续5回合", taunt: "统领建立的新秩序，需要你们这些散人做出点牺牲。" },
    { id: "main_m28_wei_yue", name: "精英卫队长·卫岳", icon: "卫", portraitImage: "assets/portraits_guyun_pixel/main_m28_wei_yue_pixel_320.webp", hp: 5500, qi: 1200, atk: 200, def: 80, combo: 5, hit: 84, dodge: 10, crit: 15, speed: 1.65, rank: 5, boss: true, bossTraits: ["celestialCleanse", "lowHpBerserk"], bossTraitDesc: "≤50%HP天罡净化+回血30%；≤30%HP ATK×1.5, SPEED×1.5，持续5回合", taunt: "总坛禁卫在此。擅入者，踏过我的尸体。" },
    { id: "main_m30_huo_feng", name: "烽火统领·霍烽", icon: "烽", portraitImage: "assets/portraits_guyun_pixel/main_m30_huo_feng_pixel_320.webp", hp: 6000, qi: 1400, atk: 215, def: 86, combo: 5, hit: 85, dodge: 9, crit: 16, speed: 1.70, rank: 6, boss: true, bossTraits: ["celestialShield", "armorBreak"], bossTraitDesc: "开场30%HP天罡护体；玩家DEF剩50%，每次命中DEF-5%", taunt: "太行外围百里之内，没有我的狼烟传不到的信号。" },
    { id: "main_m32_gongsun_lie", name: "右护法·公孙烈", icon: "枪", portraitImage: "assets/portraits_guyun_pixel/main_m32_gongsun_lie_pixel_320.webp", hp: 6500, qi: 1600, atk: 230, def: 92, combo: 6, hit: 85, dodge: 10, crit: 16, speed: 1.75, rank: 6, boss: true, weapon: "blade_bleed_red_gongsun", bossTraits: ["celestialShield", "bloodBlade"], bossTraitDesc: "开场30%HP天罡护体；每回合流血+6（血刃），上限15层", taunt: "统领说打谁就打谁。我不问为什么。" },
    { id: "main_m34_yan_tie", name: "地牢典狱长·阎铁", icon: "狱", portraitImage: "assets/portraits_guyun_pixel/main_m34_yan_tie_pixel_320.webp", hp: 7000, qi: 1800, atk: 245, def: 98, combo: 4, hit: 88, dodge: 12, crit: 14, speed: 1.80, rank: 6, boss: true, bossTraits: ["celestialCleanse", "veinBreak", "hamstringStrike"], bossTraitDesc: "≤50%HP天罡净化+回血30%；每回合断脉+6、断筋+6，上限15层", taunt: "来了就别走了。地牢的铁链还有空位。" },
    { id: "main_m36_chu_zongxuan", name: "武盟统领·楚宗玄", icon: "魔", portraitImage: "assets/portraits_guyun_pixel/main_m36_chu_zongxuan_pixel_320.webp", hp: 15000, qi: 4000, atk: 280, def: 112, combo: 8, hit: 95, dodge: 20, crit: 24, speed: 2.00, rank: 10, boss: true, weapon: "fist_hamstring_vein_red_chu", bossTraits: ["veinBreak", "hamstringStrike", "celestialShield", "celestialCleanse", "celestialBurn"], bossTraitDesc: "每回合断脉+10、断筋+10；开场30%护体；≤50%HP净化回血；≤10%HP燃命", taunt: "维持一个能救千万人的机构需要代价。每年几百个散人变成数字——我觉得值得。" },
    // === 孤云支线 Boss (M38-M48) ===
    { id: "main_m38_lu_baiyan", name: "毒账先生·卢白砚", icon: "毒", portraitImage: "assets/portraits_guyun_pixel/main_m38_lu_baiyan_pixel_320.webp", hp: 9500, qi: 2000, atk: 260, def: 105, combo: 5, hit: 86, dodge: 8, crit: 16, speed: 1.85, rank: 7, boss: true, weapon: "boss_poison_red_lu", bossTraits: ["venomInfuse", "armorBreak"], bossTraitDesc: "每回合淬毒+5，上限15+10(毒玉珠盘)；玩家DEF剩50%，每次命中DEF-5%", taunt: "铁算盘打得精，人命也标了价。" },
    { id: "main_m40_luo_qianmei", name: "迷香鞭·罗千魅", icon: "鞭", portraitImage: "assets/portraits_guyun_pixel/main_m40_luo_qianmei_pixel_320.webp", hp: 10000, qi: 2200, atk: 275, def: 108, combo: 6, hit: 88, dodge: 15, crit: 18, speed: 1.90, rank: 7, boss: true, weapon: "boss_poison_vein_red_luo", bossTraits: ["veinBreak", "venomInfuse"], bossTraitDesc: "每回合断脉+5，上限15+10(迷香鞭)；淬毒+4，上限15+10(迷香鞭)", taunt: "散人既已成帮，便该有帮派的进项。你来评评理？" },
    { id: "main_m42_wen_yulang", name: "断魂琴·温玉郎", icon: "琴", portraitImage: "assets/portraits_guyun_pixel/main_m42_wen_yulang_pixel_320.webp", hp: 11500, qi: 2500, atk: 290, def: 112, combo: 5, hit: 90, dodge: 12, crit: 20, speed: 1.95, rank: 8, boss: true, weapon: "boss_frost_red_wen", bossTraits: ["chillAura", "celestialCleanse", "shadowStep"], bossTraitDesc: "每回合寒气+8，上限15+10(断魂琴)；≤50%HP天罡净化+回血30%；基础闪避70%，≤50%HP闪避×1.75", taunt: "人心有欲，散人有价。前辈何必装得干净？" },
    { id: "main_m44_pei_zhaoxue", name: "铁面判官·裴照雪", icon: "判", portraitImage: "assets/portraits_guyun_pixel/main_m44_pei_zhaoxue_pixel_320.webp", hp: 13000, qi: 2800, atk: 305, def: 118, combo: 6, hit: 92, dodge: 10, crit: 22, speed: 2.00, rank: 9, boss: true, bossTraits: ["armorBreak", "celestialCleanse", "lowHpBerserk", "armorShield"], bossTraitDesc: "开场20%HP护体真气；玩家DEF剩50%，每次命中DEF-5%；≤50%HP天罡净化+回血30%；≤30%HP狂暴", taunt: "罪状已拟，只等画押。你认，或不认，都不重要。" },
    { id: "main_m46_shi_handeng", name: "阴阳幡使·石寒灯", icon: "幡", portraitImage: "assets/portraits_guyun_pixel/main_m46_shi_handeng_pixel_320.webp", hp: 15000, qi: 3200, atk: 320, def: 125, combo: 7, hit: 94, dodge: 18, crit: 24, speed: 2.10, rank: 10, boss: true, weapon: "boss_frost_bleed_red_shi", bossTraits: ["chillAura", "bloodBlade", "lowHpBerserk"], bossTraitDesc: "每回合寒气+10、流血+6，寒气上限15+10(寒血幡)、流血上限15+10(寒血幡)；≤30%HP狂暴", taunt: "无人管时是沙，有人压时才成金。徐堂主才懂散人。" },
    { id: "main_m48_xu_jiasheng", name: "双修毒君·徐迦笙", icon: "毒", portraitImage: "assets/portraits_guyun_pixel/main_m48_xu_jiasheng_pixel_320.webp", hp: 18000, qi: 4000, atk: 350, def: 135, combo: 8, hit: 96, dodge: 22, crit: 28, speed: 2.20, rank: 11, boss: true, weapon: "boss_all_debuff_red_xu", bossTraits: ["venomInfuse", "bloodBlade", "chillAura", "celestialShield", "lowHpBerserk", "celestialCleanse", "shadowStep"], bossTraitDesc: "每回合淬毒+8、流血+8、寒气+8，三上限各+10(万毒阴阳钗)；开场35%天罡护体；≤50%HP天罡净化+回血30%；≤30%HP狂暴；基础闪避75%，≤50%HP闪避×1.75", taunt: "双修大道本就取长补短。散人既散，正该由强者收拢。" }
  ],
  bosses: [
    { id: "boss_y1", name: "青竹寨主", icon: "刀", year: 1, hp: 560, qi: 260, atk: 78, def: 42, combo: 4, hit: 68, dodge: 4, crit: 10, speed: 1.35, boss: true, taunt: "这山头我说了算，你一个散人敢来送死？" },
    { id: "boss_y2", name: "黑风堂主", icon: "魔", year: 2, hp: 820, qi: 360, atk: 98, def: 55, combo: 5, hit: 72, dodge: 5, crit: 12, speed: 1.45, boss: true, taunt: "黑风堂的地盘，进来就别想出去。" },
    { id: "finalBoss", name: "颍川五虎门主", icon: "魔", year: 3, hp: 1120, qi: 480, atk: 122, def: 68, combo: 7, hit: 78, dodge: 7, crit: 16, speed: 1.58, boss: true, taunt: "五虎之下，从无生还。" }
  ]
};

const SKILL_TIER_LABELS = {
  basic: "基础",
  advanced: "进阶",
  ultimate: "终极"
};

export const STYLE_TRAITS = {
  combo: { id: "comboMastery", name: "长江三叠浪", desc: "连击掌触发连击时，其他连击掌冷却-1；若有掌法就绪，可立即继续出掌。每己方回合最多额外出掌2次。" },
  critPalm: { id: "critPalmMastery", name: "碎星连震", desc: "暴击拳掌暴击+10，暴伤+1，破防上限+7。暴击率无上限。" },
  qiBreak: { id: "qiBreakMastery", name: "断脉归元", desc: "断脉拳掌削内力提高，目标内力归零时额外受伤。每己方回合最多削目标最大内力25%。" },
  bleed: { id: "bleedBladeMastery", name: "百创刀势", desc: "流血刀造成流血时额外+1层，流血上限+7。流血不暴击。" },
  frost: { id: "frostBladeMastery", name: "玄冥寒河", desc: "寒冰刀附加更多寒气，并进一步削减内力。速度最低降至60%。" },
  hamstring: { id: "hamstringBladeMastery", name: "天残绝路", desc: "断筋刀额外削攻击，断筋目标速度更低。攻击最低降至65%。" },
  gu: { id: "guMastery", name: "九窍蛊王", desc: "下蛊暗器附加更多蛊，并提高目标招式消耗。每己方回合最多扰乱CD一次。" },
  poison: { id: "poisonMastery", name: "孔雀毒雨", desc: "淬毒暗器造成中毒时额外+1层，中毒上限+7，额外削减内力。毒不暴击。" },
  coin: { id: "coinMastery", name: "漫天金雨", desc: "金钱暗器固定伤害提高，终极金钱暗器花费降低。每己方回合最多1次，不暴击。" },
  evasive: { id: "evasiveLegMastery", name: "凌波回息", desc: "闪避后减冷却与调息效果提高。每回合最多触发1次。" },
  lowKick: { id: "lowKickMastery", name: "地裂无声", desc: "下盘腿法真伤+100，失衡额外+1，失衡上限+7。真伤不暴击。" },
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
  leg_light_blue: ["evasive", "basic", "燕回腿", "高闪避腿法基础式。闪避后减冷却并调息。每回合最多1次。"],
  leg_light_orange: ["evasive", "advanced", "游龙腿", "高闪避腿法进阶式。游身避锋。"],
  leg_light_red: ["evasive", "ultimate", "凌波腿", "高闪避腿法终极式。步生波纹。"],
  leg_kick_blue: ["lowKick", "basic", "扫堂腿", "下盘腿法基础式。忽略闪避和防御造成真伤。真伤不暴击。"],
  leg_kick_orange: ["lowKick", "advanced", "盘龙腿", "下盘腿法进阶式。盘根折势。"],
  leg_kick_red: ["lowKick", "ultimate", "碎岳沉桩腿", "下盘腿法终极式。碎岳真劲。"],
  leg_steal_blue: ["steal", "basic", "探囊腿", "偷盗型腿法基础式。高出手且能获取额外金钱。每回合最多1次。"],
  leg_steal_orange: ["steal", "advanced", "飞檐探云腿", "偷盗型腿法进阶式。出手更快。"],
  leg_steal_red: ["steal", "ultimate", "摘星无影腿", "偷盗型腿法终极式。摘星取利。"]
};

const SKILL_DEBUFF_LABELS = {
  bleed: "流血",
  poison: "中毒",
  inner: "内伤",
  frost: "寒气",
  hamstring: "断筋",
  gu: "蛊",
  coin: "金钱",
  breakDefense: "破防"
};

const SKILL_EFFECT_LABELS = {
  combo: "连击",
  hit: "命中",
  dodge: "闪避",
  crit: "暴击",
  speed: "出手速度",
  critPower: "暴伤"
};

function signedStat(label, value) {
  return `${label}${value > 0 ? "+" : ""}${value}`;
}

function buildSkillDesc(skill, tier, styleDesc) {
  const parts = [`【${SKILL_TIER_LABELS[tier]}】${styleDesc}`];
  const combat = [];
  if (skill.power) combat.push(`威力${skill.power}`);
  if (skill.qi) combat.push(`内力${skill.qi}`);
  if (skill.cd != null) combat.push(`冷却${skill.cd}`);
  if (combat.length) parts.push(`${combat.join("，")}。`);

  if (skill.debuff && skill.debuffStacks) {
    parts.push(`命中时+${skill.debuffStacks}层${SKILL_DEBUFF_LABELS[skill.debuff] || skill.debuff}。`);
  }

  const effects = skill.trait?.effects || {};
  const details = [];
  if (skill.trueDamage) details.push(`真伤+${skill.trueDamage}`);
  if (effects.imbalanceBonus) details.push(`失衡+${effects.imbalanceBonus}`);
  if (effects.poisonBonus) details.push(`中毒额外+${effects.poisonBonus}`);
  if (skill.tags?.includes("surehit")) details.push("必中");
  if (["bleed", "poison", "lowKick", "coin"].includes(skill.style) && !styleDesc.includes("不暴击")) details.push("不暴击");

  const statTexts = Object.entries(SKILL_EFFECT_LABELS)
    .filter(([key]) => effects[key] && !(key === "critPower" && ["bleed", "poison", "lowKick", "coin"].includes(skill.style)))
    .map(([key, label]) => signedStat(label, effects[key]));
  if (statTexts.length) details.push(`修炼：${statTexts.join("，")}`);
  if (details.length) parts.push(`${details.join("，")}。`);
  return parts.join("");
}

for (const [id, [style, tier, name, desc]] of Object.entries(SKILL_STYLES)) {
  if (!DATA.skills[id]) continue;
  DATA.skills[id].style = style;
  DATA.skills[id].tier = tier;
  DATA.skills[id].tierName = SKILL_TIER_LABELS[tier];
  DATA.skills[id].name = name;
  DATA.skills[id].styleName = STYLE_LABELS[style];
  // 保留招式自身的 trait.effects（如 imbalanceBonus、poisonBonus 等），同时用路线特性覆盖名称/描述用于展示
  const originalTrait = DATA.skills[id].trait;
  const styleTrait = STYLE_TRAITS[style];
  if (styleTrait && originalTrait) {
    DATA.skills[id].trait = {
      ...originalTrait,
      ...styleTrait,
      effects: { ...(styleTrait.effects || {}), ...(originalTrait.effects || {}) }
    };
  } else {
    DATA.skills[id].trait = styleTrait || originalTrait;
  }
  DATA.skills[id].debuff = {
    qiBreak: "inner",
    bleed: "bleed",
    frost: "frost",
    hamstring: "hamstring",
    gu: "gu",
    poison: "poison",
    coin: "coin",
    critPalm: "breakDefense"
  }[style] || null;
  if (style === "coin") DATA.skills[id].tags = [...new Set([...(DATA.skills[id].tags || []), "surehit", "coin"])];
  DATA.skills[id].desc = buildSkillDesc(DATA.skills[id], tier, desc);
}

DATA.styleSkillSets = Object.entries(SKILL_STYLES).reduce((sets, [id, [style, tier]]) => {
  sets[style] ||= {};
  sets[style][tier] = id;
  return sets;
}, {});
DATA.styleTraits = STYLE_TRAITS;

DATA.manuals = Object.keys(SKILL_STYLES);

export const INTERNAL_ARTS = {
  art_blue_1: { id: "art_blue_1", name: "紫霄清心诀", rarity: "blue", icon: "清", cultivateCost: 3, desc: "清心寡欲之诀。负面状态持续时间略降。血量+150，内力+50，防御+4。", statGain: { hp: 150, qi: 50, def: 4 }, combatEffect: "debuffReduce", combatDesc: "负面状态持续时间略降" },
  art_blue_2: { id: "art_blue_2", name: "混元真息", rarity: "blue", icon: "混", cultivateCost: 3, desc: "浑元一体，根基扎实。血量+140，内力+50，攻击+2，防御+2。", statGain: { hp: 140, qi: 50, atk: 2, def: 2 } },
  art_blue_3: { id: "art_blue_3", name: "罗汉镇岳功", rarity: "blue", icon: "镇", cultivateCost: 3, desc: "如山如岳，不动不移。血量+180，防御+7，受到直接伤害-10%。", statGain: { hp: 180, def: 7 }, combatEffect: "dmgReduce", combatDesc: "受到直接伤害-10%" },
  art_blue_4: { id: "art_blue_4", name: "回照心经", rarity: "blue", icon: "照", cultivateCost: 3, desc: "心光回照，滋养肉身。血量+150，内力+40，战斗开始时恢复35%血量。", statGain: { hp: 150, qi: 40 }, combatEffect: "healOnStart", combatDesc: "战斗开始时恢复35%血量" },
  art_blue_5: { id: "art_blue_5", name: "太玄入门篇", rarity: "blue", icon: "玄", cultivateCost: 3, desc: "玄门筑基心法。内力+60，暴击+4。", statGain: { qi: 60, crit: 4 } },
  art_blue_6: { id: "art_blue_6", name: "龙象锻骨功", rarity: "blue", icon: "象", cultivateCost: 3, desc: "锻骨炼体，力大无穷。血量+150，攻击+7。", statGain: { hp: 150, atk: 7 } },
  art_blue_7: { id: "art_blue_7", name: "归元功", rarity: "blue", icon: "元", cultivateCost: 3, desc: "归元守一，内息绵绵。内力+70，命中+5，每回合恢复6%最大内力（上限10%）。", statGain: { qi: 70, hit: 5 }, combatEffect: "qiRegen", combatDesc: "每回合恢复6%最大内力" },
  art_blue_8: { id: "art_blue_8", name: "葵影残篇", rarity: "blue", icon: "葵", cultivateCost: 3, desc: "残卷仅有速功心法。闪避+6，出手速度+0.18。", statGain: { dodge: 6, speed: 0.18 } },
  art_orange_1: { id: "art_orange_1", name: "虚玄无相功", rarity: "orange", icon: "相", cultivateCost: 4, desc: "无形无相，气随意转。内力+110，连击+6，每次攻击吸取对方5%内力，自己增加等量内力。", statGain: { qi: 110, combo: 6 }, combatEffect: "stealQi", combatDesc: "攻击吸5%内力+自身增加等量" },
  art_orange_2: { id: "art_orange_2", name: "纯阳正气诀", rarity: "orange", icon: "阳", cultivateCost: 4, desc: "纯阳之体，正气凛然。血量+300，攻击+10，暴击+4，暴击伤害+150%。", statGain: { hp: 300, atk: 10, crit: 4 }, combatEffect: "critUp", combatDesc: "暴击伤害+150%" },
  art_orange_3: { id: "art_orange_3", name: "玄霜真气", rarity: "orange", icon: "冰", cultivateCost: 4, desc: "玄霜入脉，寒意逼人。血量+180，内力+120，命中附加1层寒气（每己方回合最多1次）。", statGain: { hp: 180, qi: 120 }, combatEffect: "frostOnHit", combatDesc: "攻击/招式命中附加1层寒气（每回合最多1次）" },
  art_orange_4: { id: "art_orange_4", name: "摄元秘法", rarity: "orange", icon: "星", cultivateCost: 4, desc: "夺天地之元。血量+240，内力+100，命中吸取目标8%当前内力（上限40）。", statGain: { hp: 240, qi: 100 }, combatEffect: "drainQi", combatDesc: "攻击时汲取目标8%当前内力（上限40）" },
  art_red_1: { id: "art_red_1", name: "九曜真功", rarity: "red", icon: "曜", cultivateCost: 5, desc: "九曜盈体，生生不息。血量+1500，内力+300，每回合恢复5%最大血量与5%最大内力。", statGain: { hp: 1500, qi: 300 }, combatEffect: "healOnTurn", combatDesc: "每回合恢复5%血量+5%内力" },
  art_red_2: { id: "art_red_2", name: "大罗洗髓经", rarity: "red", icon: "髓", cultivateCost: 5, desc: "脱胎换骨，洗尽铅华。血量+520，内力+160，全属性+6，开场净化+前5己方回合免疫负面，每5回合身上所有负面效果减半。", statGain: { hp: 520, qi: 160, atk: 6, def: 6, hit: 6, dodge: 6, crit: 6, speed: 0.06 }, combatEffect: "cleanse", combatDesc: "开场净化+前5己方回合免疫负面+每5回合所有负面减半" },
  art_red_3: { id: "art_red_3", name: "天衡神照经", rarity: "red", icon: "衡", cultivateCost: 5, desc: "天衡运转，神照万象。血量+600，内力+220，战斗开始恢复25%血量和15%内力。", statGain: { hp: 600, qi: 220 }, combatEffect: "bigHealStart", combatDesc: "战斗开始恢复25%血量+15%内力" },
  art_red_4: { id: "art_red_4", name: "玄元龙象功", rarity: "red", icon: "龙", cultivateCost: 5, desc: "龙象之力，转化万钧。血量+480，内力+160，攻击+14，受直接伤害的20%转为内力。", statGain: { hp: 480, qi: 160, atk: 14 }, combatEffect: "dmgToQi", combatDesc: "受直接伤害的20%转为内力" }
};
DATA.internalArts = INTERNAL_ARTS;

// ============================================================
// 三主线叙事数据（v0.34）
// ============================================================
DATA.storylines = {
  wanderer: {
    id: "wanderer",
    resolveName: "散人决心",
    name: "孤云逐浪",
    threatName: "武盟威势",
    threatDesc: "武盟对散人的压迫日增",
    bosses: {
      1: { id: "wanderer_boss_y1", name: "杭州堂主·赵崇岳", icon: "刀", portraitImage: "assets/portraits_guyun_pixel/main_m12_zhao_chongyue_pixel_320.webp", year: 1, hp: 4000, qi: 1200, atk: 120, def: 48, combo: 5, hit: 80, dodge: 10, crit: 14, speed: 1.50, boss: true, bossTraits: ["armorBreak", "hamstringStrike"], bossTraitDesc: "破防贯通；每回合断筋+5，上限15层", taunt: "知不知道因为你一个人，我少赚了多少银子？" },
      2: { id: "wanderer_boss_y2", name: "左护法·沈千山", icon: "戟", portraitImage: "assets/portraits_guyun_pixel/main_m24_shen_qianshan_pixel_320.webp", year: 2, hp: 8000, qi: 2400, atk: 200, def: 80, combo: 6, hit: 88, dodge: 14, crit: 18, speed: 1.65, boss: true, bossTraits: ["celestialShield", "lowHpBerserk"], bossTraitDesc: "开场30%HP天罡护体；≤30%HP ATK×1.5, SPEED×2.1，持续5回合", taunt: "把所有人当资源配置，包括你我，区别只是价格不同。" },
      3: { id: "wanderer_final", name: "武盟统领·楚宗玄", icon: "魔", portraitImage: "assets/portraits_guyun_pixel/main_m36_chu_zongxuan_pixel_320.webp", year: 3, hp: 15000, qi: 4000, atk: 280, def: 112, combo: 8, hit: 95, dodge: 20, crit: 24, speed: 2.00, boss: true, bossTraits: ["veinBreak", "hamstringStrike"], bossTraitDesc: "每回合断脉+10、断筋+10，上限15层", taunt: "维持一个能救千万人的机构需要代价。每年几百个散人变成数字——我觉得值得。" }
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
    resolveName: "朝廷威势",
    name: "铁鹰入局",
    threatName: "内廷疑云",
    threatDesc: "内廷爪牙渗透日深",
    bosses: {
      1: { id: "constable_boss_y1", name: "东厂档头·韩玉阙", icon: "镖", portraitImage: "assets/portraits_pixel/han_yuque_pixel_320.webp", year: 1, hp: 1850, qi: 700, atk: 100, def: 58, combo: 5, hit: 86, dodge: 10, crit: 10, speed: 1.60, boss: true, bossTraits: ["highHitPoison"], bossTraitDesc: "暗器命中高；毒层结算后自然衰减", taunt: "六扇门的鹰犬，也敢查厂公的事？" },
      2: { id: "constable_boss_y2", name: "锦衣指挥使·沈镇岳", icon: "刀", portraitImage: "assets/portraits_pixel/shen_zhenyue_pixel_320.webp", year: 2, hp: 3600, qi: 980, atk: 165, def: 92, combo: 6, hit: 88, dodge: 12, crit: 20, speed: 1.62, boss: true, bossTraits: ["critBreakDef"], bossTraitDesc: "暴击破防；玩家防御最多被压到75%", taunt: "绣春刀下，没有破不了的案子——也没有杀不得的人。" },
      3: { id: "constable_final", name: "司礼监掌印·魏承恩", icon: "魔", portraitImage: "assets/portraits_pixel/wei_chengen_pixel_320.webp", year: 3, hp: 7200, qi: 2300, atk: 210, def: 145, combo: 7, hit: 95, dodge: 20, crit: 18, speed: 1.82, boss: true, bossTraits: ["drainQiImmuneBurst"], bossTraitDesc: "每回合吸内；前3回合免疫负面；内力低时爆发", taunt: "咱家在这宫墙里活了四十年——你一个小捕快，也配来挡咱家的路？" }
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
    resolveName: "正道声望",
    name: "天衡照邪",
    threatName: "鬼教阴影",
    threatDesc: "鬼教势力暗中蔓延",
    bosses: {
      1: { id: "orthodox_boss_y1", name: "鬼教香主·白无咎", icon: "毒", portraitImage: "assets/portraits_pixel/bai_wujiu_pixel_320.webp", year: 1, hp: 1900, qi: 760, atk: 96, def: 60, combo: 5, hit: 78, dodge: 12, crit: 10, speed: 1.52, boss: true, bossTraits: ["poisonGuPerTurn"], bossTraitDesc: "每回合毒+1蛊+1；每回合只衰减一种负面", taunt: "正道的光，照不进黑莲的影。你的命，归我门下。" },
      2: { id: "orthodox_boss_y2", name: "黑莲护法·桑暮雨", icon: "魔", portraitImage: "assets/portraits_pixel/sang_muyu_pixel_320.webp", year: 2, hp: 3900, qi: 1200, atk: 145, def: 95, combo: 6, hit: 84, dodge: 16, crit: 14, speed: 1.65, boss: true, bossTraits: ["drainQiLowShield"], bossTraitDesc: "命中吸内；低血获得15%护体", taunt: "黑莲开处无活口——你的内力，归我。" },
      3: { id: "orthodox_final", name: "鬼教掌门·夜摩罗", icon: "魔", portraitImage: "assets/portraits_pixel/ye_moluo_pixel_320.webp", year: 3, hp: 7800, qi: 2200, atk: 220, def: 150, combo: 8, hit: 90, dodge: 22, crit: 20, speed: 1.78, boss: true, bossTraits: ["poisonGuCapCleanse"], bossTraitDesc: "毒蛊上限+3；50%血时净化并回血20%", taunt: "正道三百年，杀不尽黑莲一朵。今夜之后，再无天衡。" }
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
// 孤云逐浪 36月叙事数据（v5.10）
// ============================================================
// v5.8 重构：奇数月=纯剧情（无按钮），偶数月=单「抗争」按钮+跳过
// v5.9 润色：全文语句金庸风格改写，分段优化
// v5.10 修复：makeRiskEventPool 缺乏孤云线路由→金钱任务(30%)从未触发；MiniBoss名还原（死代码无实际冲突）
DATA.wandererMonths = {
  // === 第一年 ===
  1: { title: "活人变鬼",
    storyImage: "assets/story_guyun/m01_huorenbiangui.png",
    text: "半个月前隔壁老李被武盟带走，说是去杭州“做差事”，一个月二十两银子。他老婆当时还笑。今天老李回来了。是被抬回来的。两条腿没了，胸口一道贯穿伤。临死前只说：“别去登记，那是矿坑。”第二天，烫金帖子飞进院门：三日内入册。你握剑的手在抖，不是怕，是怒。" },
  2: { title: "堂口来人",
    storyImage: "assets/story_guyun/m02_tangkou_lairen.png",
    text: "子时敲门，方平来了，左臂渗血。他带来一卷名单，上面写着矿坑、边关、私邸，许多名字旁打了叉。方平低声说：“打叉的，死了。”话音未落，院外脚步杂乱，火把的光映上窗纸。",
    fightLabel: "挺身迎战", enemyId: "main_m2_liu_tie", hasBattle: true, isBoss: false,
    battleDesc: "堂口捕头刘铁带着手下破门而入，短棍和绳索是专门拿来收人的。方平左臂有伤，你得独自挡住大部。",
    battleReward: { exp:150, money:80, gainItem:"waibian_team_roster", fame:15 } },
  3: { title: "密令与茶",
    storyImage: "assets/story_guyun/m03_miling_yucha.png",
    text: "你在堂口偷翻到密令：拒册者编入敢死队，充作剿匪前驱；每交付外编人员五十名，堂口可获赏银。角落批注是赵崇岳亲笔：“人命不值钱。”离开时廊下遇见灰袍人，他看了看你手中东西，没有告发，只点了点头。" },
  4: { title: "铁窗内外",
    text: "方平被抓了。因为他在茶馆里大声念外编队名单，一个一个念，连死因都念出来。他入狱前笑着说：“老子念的是真话。”你赶到杭州大牢，隔着铁栅栏看见他嘴角淤青，右手两指已被扭得变形。你必须行动了。",
    fightLabel: "劫狱救人", enemyId: "main_m4_qian_hu", hasBattle: true, isBoss: false,
    battleDesc: "缉捕队长钱虎使一柄厚背单刀，在牢门口等你。十年抓人的经验让他不急着出刀——他在等你露出破绽。",
    battleReward: { exp:200, money:60, gainItem:"jail_key_ring", flag:"fangpingSaved", fame:30 } },
  5: { title: "满城金旗",
    text: "金色令旗一夜插遍江南。窝藏拒册者同罪，举报赏银十两，抗拒抓捕者格杀勿论。你在官道上看见武盟弟子拖走一个少年散人，少年哭喊自己没有犯法。领头者拔刀划伤他的腿，不为杀他，只为让他走不了。" },
  6: { title: "梅边二叙",
    text: "灰袍人第二次来找你。他自称姓孟，是武盟中人，却看不下去赵崇岳所为。他说赵崇岳将散人打包出售：富商买护卫，将军要炮灰，角斗场消耗人命。话音未落，赵崇岳麾下铁手周通带人堵住院子。",
    fightLabel: "生死一搏", enemyId: "main_m6_zhou_tong", hasBattle: true, isBoss: true,
    battleDesc: "铁手周通使一对精铁手套，每一拳都带着骨裂之声。他是赵崇岳麾下得力干将——劝导不成便动手，手上不止一条人命。",
    battleReward: { exp:350, fame:80, gainItem:"iron_glove_fragment", atk:2 } },
  7: { title: "清剿令下",
    text: "总坛批复到了，赵崇岳获准武力清剿，批复上四字刺眼：格杀勿论。你终于明白，武盟要的不是散人听话，而是要散人死，或变成他们的财产。你对方平说：“去龙井谷。能救多少救多少。”" },
  8: { title: "山雨欲来",
    text: "距大军抵达还有十天。你在龙井谷外围设防，撞上武盟先锋营。马如龙远远喝道：“散人还不束手就擒？”这一仗不能输，输了龙井谷的位置就会暴露。",
    fightLabel: "血战捍卫", enemyId: "main_m8_ma_rulong", hasBattle: true, isBoss: false,
    battleDesc: "先锋营统领马如龙使一杆长枪，枪法凌厉。他认为散人不过是一群乌合之众——需要被他的铁蹄踏醒。",
    battleReward: { exp:280, gainItem:"vanguard_battle_flag", fame:40, int:1 } },
  9: { title: "血色黎明",
    text: "黎明时分，赵崇岳大军布满山谷。韩铁衣端着一碗素面走到你身边，说：“要不是你提前报信，这谷里的人昨晚就没了。”他低头吃完面，山下号角吹响。进攻开始，这一战避无可避。" },
  10: { title: "龙井谷血战",
    text: "这一日打了整整一天。浓烟里，你找到韩铁衣，他浑身是伤，身边敌人皆一击毙命。他抓住你的手，说散人的旗太沉，你得接着扛。幸存者围上来问怎么办。你站起身，把熏黑的旗插进焦土。",
    fightLabel: "为韩铁衣复仇", enemyId: "main_m10_yang_zhen", hasBattle: true, isBoss: true,
    battleDesc: "杨震使双戟，一身护体真气刀枪不入。他是沈千山调拨给赵崇岳的王牌——龙井谷最惨烈的一战。韩铁衣刚刚牺牲，愤怒的你如同一头出笼猛虎。",
    battleReward: { exp:500, fame:200, gainItem:"tieyi_last_letter", atk:3, def:2 } },
  11: { title: "四面楚歌",
    text: "龙井谷的消息飞遍江湖。武盟搜捕更急，每天都有散人投奔或求救。方平熬红了眼擦剑，说一闭眼便看见韩铁衣。有人开始叫你“扛旗的”。你不知道这是荣誉还是诅咒，但已没有回头路。" },
  12: { title: "赵崇岳",
    text: "黄昏，赵崇岳亲临谷前，九环大刀插地，刀环作响。他笑问你知不知道自己害他少赚多少银子。",
    fightLabel: "斩首之剑", enemyId: "main_m12_zhao_chongyue", hasBattle: true, isBoss: true, onWin: "yearlyWin",
    battleDesc: "杭州堂主赵崇岳，九环大刀，大开大合。低血量时攻速双升——他是你面对的第一个真正的Boss。",
    battleReward: { exp:1000, fame:500, gainItem:"zhao_nine_ring_blade", money:500, atk:5, def:3 } },
  // === 第二年 ===
  13: { title: "风暴再起",
    text: "赵崇岳死讯传到总坛，左护法沈千山亲率大军南下。武盟又发“入册补充条款”，称设安置营保障散人权益。你从截获信中读到真相：那只是集中营。方平问你怕不怕。你说怕。他问还干不干。你说干。" },
  14: { title: "沈千山的眼睛",
    text: "沈千山的探子渗入营地。你故意放出假计划，三日后伏兵果然出现在假目标。那年轻探子想逃，被方平堵住，供出上线：沈千山帐前哨长杜威，在附近镇上设了暗哨。",
    fightLabel: "斩断眼线", enemyId: "main_m14_du_wei", hasBattle: true, isBoss: false,
    battleDesc: "杜威是沈千山麾下最精锐的侦察哨长，身法迅捷，刀法刁钻。不能让他活着回去报告大会的虚实。",
    battleReward: { exp:300, int:1, gainItem:"shen_scout_map", fame:60 } },
  15: { title: "散人初盟",
    text: "首次散人大会在昆仑山召开，各路散人争论不休。有人要正面开战，有人要暂避锋芒。方平摔碎酒壶，满堂安静：“都别吵了，听扛旗的怎么说。”所有目光转向你，你才知道他们已默认你是领袖。" },
  16: { title: "寒剑来袭",
    text: "沈千山副手柳长卿先行试探。此人剑术诡异，剑出带霜寒之气。他临走时说，左护法愿给你优待，不必去外编队。这话本身就是侮辱：不必去外编队，意思是旁人活该送死。",
    fightLabel: "剑下决生死", enemyId: "main_m16_liu_changqing", hasBattle: true, isBoss: true,
    battleDesc: "寒剑柳长卿，寒铁长剑，剑术诡变。寒霜剑气减速削内——他是沈千山麾下最令人胆寒的剑客。",
    battleReward: { exp:500, fame:150, gainItem:"cold_iron_shard", agi:3, flag:"liuChangqingDefeated" } },
  17: { title: "孟天衡的信",
    text: "一只信鸽落在窗台。信上只有八字：“安置营位置图附后。”羊皮纸上红圈密布，标着江南各地安置营与人数。没有署名，但你认得笔迹。孟天衡在用自己的命给你递一把刀。" },
  18: { title: "夜袭营地",
    text: "武盟不给你喘息。秦烈率夜袭队趁夜摸近散人营地，警报响起时他们已在营外百步，火油箭在弦。这不是谈判，是灭口。",
    fightLabel: "杀出重围", enemyId: "main_m18_qin_lie", hasBattle: true, isBoss: false,
    battleDesc: "夜袭队长秦烈使双刀，快如骤雨。他带领的夜袭队已经封锁了灵隐寺所有出口——这一仗是突围战。",
    battleReward: { exp:400, fame:80, atk:2, def:1 } },
  19: { title: "灵寺夜话",
    text: "你决定去见沈千山。灵隐寺深夜，他独坐殿中擦剑。谈及外编队与安置营，他平静说乱世无净土，刀兵一起，总要有人填进去。你问：“所以散人便该去死？”他说：“不是该死，是最容易被牺牲。”" },
  20: { title: "五千两悬赏",
    text: "谈判破裂后，沈千山悬赏五千两捉拿你。赏金猎人和投机者一夜之间都盯上你。第一个找上门的是“血手”崔命，使链子锤，最爱在猎物死前同他们“玩玩”。",
    fightLabel: "灭杀猎犬", enemyId: "main_m20_cui_ming", hasBattle: true, isBoss: true,
    battleDesc: "「血手」崔命使链子锤，每一锤都直奔要害。他的锤上缠着碎骨——那是上一个猎物的遗物。",
    battleReward: { exp:450, money:300, fame:100, atk:2 } },
  21: { title: "分崩离析",
    text: "五千两悬赏开始见效。联盟中有人退出，理由直白：损失太重，撑不住了。方平摔杯怒骂。你沉默良久，说：“让他们走吧。愿意走的本来就不是我们的兄弟，留下的才是。”" },
  22: { title: "刺客之夜",
    text: "深夜黑影入房，快刀剖开枕头。来人是杀手叶孤。三十招后你发现，他不是来杀你，而是要毁你枕下的外编队名单原件。武盟派刺客不是灭口，是销赃。",
    fightLabel: "以命搏刃", enemyId: "main_m22_ye_gu", hasBattle: true, isBoss: true,
    battleDesc: "「无影」叶孤，江湖顶级刺客。蝉翼双刃快如闪电，闪避极高——他的刀比你的眼睛更快。",
    battleReward: { exp:550, fame:200, agi:4, gainItem:"cicada_wing_blade" } },
  23: { title: "反击号角",
    text: "刺客事件后，散人联盟反而稳固。动摇的人重新归队，说连刺客都没杀掉扛旗的，还怕什么。方平笑说咱俩值五千两了。你没笑，因为你知道武盟真正怕的是证据。" },
  24: { title: "沈千山",
    text: "太湖之滨决战。沈千山黑甲持戟，只说你站错了边。战至力竭时，孟天衡浴血赶来。",
    fightLabel: "终结护法", enemyId: "main_m24_shen_qianshan", hasBattle: true, isBoss: true, onWin: "yearlyWin",
    battleDesc: "左护法沈千山，方天画戟，攻守全能。70%血狂暴，30%血召唤护卫——这是他最后的力量。",
    battleReward: { exp:2000, fame:800, gainItem:"shen_halberd_fragment", money:1000, atk:8, def:6 } },
  // === 第三年 ===
  25: { title: "天下震动",
    text: "沈千山之死传到太行总坛，楚宗玄一日未见人。武盟内部分裂，江湖格局已变。你手中的名单、调拨记录、安置营地图开始发酵。散人网络悄悄流传真相。孟天衡战后失踪。" },
  26: { title: "狂刀钱彪",
    text: "武盟主战派暗中袭扰。狂刀钱彪带死忠小队截住你的巡查路线。他们眼中不是贪婪，而是狂热信仰，真信楚宗玄在建立新秩序。这样的信仰比贪婪更可怕，因为不可收买，也不可理喻。",
    fightLabel: "刀碎迷障", enemyId: "main_m26_qian_biao", hasBattle: true, isBoss: true,
    battleDesc: "狂刀钱彪使厚背大砍刀，低血时进入狂暴状态攻速双升。他眼中的狂热比刀更锋利。",
    battleReward: { exp:550, money:250, fame:120, gainItem:"fanatic_oath_token", agi:2 } },
  27: { title: "太行之邀",
    text: "烫金请帖再次出现，落款楚宗玄。帖中夹着小字：有些事，当面说比较清楚，关于你手中那些材料。他知道你有证据。这是最后通牒，也是请君入瓮。方平问去不去。你说：“去。”" },
  28: { title: "总坛禁卫",
    text: "你踏上太行山，见到楚宗玄。他不像恶人，反像隐士。他不谈银钱，只谈江湖若无一只手压着，迟早群雄互噬。你摊出证据，他只平静说：“我知道。”你问他是否仍觉得值得。他看了许久，说：“这便是我背着的东西。”谈判崩了，卫岳拦住去路。",
    fightLabel: "杀出总坛", enemyId: "main_m28_wei_yue", hasBattle: true, isBoss: false,
    battleDesc: "精英卫队长卫岳使雁翎刀，率领禁卫军在总坛大门前层层布阵。他是楚宗玄钦点的最后一道防线。",
    battleReward: { exp:550, fame:200, gainItem:"taihang_guard_uniform", def:3 } },
  29: { title: "最后的集结",
    text: "多方打听后确认，孟天衡被押回总坛，关在地牢深处。楚宗玄没有杀他。方平问要不要救。你说当然。你开始集结所有能调动的力量。这次要去地狱最底层，救那个拿命信任你的人。" },
  30: { title: "烽火狼烟",
    text: "总攻前三天，你在太行外围清理耳目。烽火统领霍烽坐镇防线，一旦狼烟升起，总坛立刻警觉。必须在狼烟升起前拿下他。这是一场与时间的赛跑。",
    fightLabel: "掐灭烽火", enemyId: "main_m30_huo_feng", hasBattle: true, isBoss: true,
    battleDesc: "烽火统领霍烽使狼牙棒，力大无穷。必须在狼烟升起之前击倒他——这是与时间的赛跑。",
    battleReward: { exp:600, gainItem:"taihang_beacon_map", int:2, fame:100 } },
  31: { title: "大军压境",
    text: "散人联军列阵太行山下。方平在左，各路首领在右。你拔剑指天，喊声震动山林。楚宗玄立于高阶，白衣胜雪，说你本是将才，可惜选了死路。你握紧剑柄。这路是自己选的，也要走到底。" },
  32: { title: "突破外层",
    text: "总坛第一道防线由右护法公孙烈镇守。他使浑铁枪，力大无穷，招式狠辣，是楚宗玄麾下第一猛将。亲卫结阵，枪出如龙。这是通往正殿的首道难关。",
    fightLabel: "破阵夺关", enemyId: "main_m32_gongsun_lie", hasBattle: true, isBoss: true,
    battleDesc: "右护法公孙烈使浑铁枪，铁枪破阵，防御贯通——这是通往楚宗玄正殿的第一道也是最后一道铁门。",
    battleReward: { exp:1800, fame:600, atk:6, def:5, gainItem:"gongsun_iron_spear" } },
  33: { title: "地牢深处",
    text: "你带方平和亲信摸进地牢。在最深处找到孟天衡，他被锁链吊在半空，浑身是伤，眼睛仍亮。他沙哑地说：“你来了。”你说：“我来了。”" },
  34: { title: "地牢血战",
    text: "扶着孟天衡往外走时，铁门轰然关闭。典狱长阎铁带守卫从暗处走出，判官笔泛着幽光。他说来了就别走，地牢铁链还有空位。这是通往自由前的最后一道门。",
    fightLabel: "护兄杀出地狱", enemyId: "main_m34_yan_tie", hasBattle: true, isBoss: true,
    battleDesc: "地牢典狱长阎铁使判官笔，概率封行动。守卫层层封锁阴暗甬道——必须杀出血路才能带孟天衡出去。",
    battleReward: { exp:700, fame:250, gainItem:"judge_pen_of_the_dead", def:3, flag:"mengRescued" } },
  35: { title: "正殿门前",
    text: "安顿好孟天衡和方平后，你独自穿过长廊，走向正殿。方平在身后叫你，靠着石壁笑道：“打完这场，回来喝酒。”你点头，转身走向大门。该打的仗都打完了，只剩最后一场。" },
  36: { title: "楚宗玄",
    text: "正殿中，楚宗玄负手而立，茶尚温。他说自己曾为江湖秩序立誓，也确实惩恶调纷无数，最后不得不把人当资源。你若赢了，希望不要成为下一个他。沉默片刻，他说：“来吧。”天罡正气起，大殿砖石龟裂。",
    isEndNode: true, isFinalBoss: true,
    fightLabel: "终结秩序", enemyId: "main_m36_chu_zongxuan", hasBattle: true, isFinalBoss: true, onWin: "m36Win",
    battleDesc: "武盟统领楚宗玄，天罡正气终极Boss。开场25%护体；50%血净化一次；15%血攻翻倍防归零。",
    battleReward: { exp:5000, fame:2000, money:3000, atk:10, def:10, int:10, agi:10 } },

  // === 孤云支线 (M37-M48) ===
  37: { title: "归云不系",
    text: "楚宗玄败后，群雄推你为散人领袖。你整顿旧案，立三不令：不贩人，不欺弱，不借散人之名敛财。半年后诸事渐定，你却厌了案牍与拜帖，只留一封短笺给方平：“云在山中，莫来寻我。”" },
  38: { title: "夜雨叩庐",
    text: "三年后，秋雨打柴扉。方平夜来，衣上泥水未干，鬓边已有白丝。他说散人已成大帮，却也生了毒疮。新贵徐迦笙掌刑堂，武功极高，暗售“销魂散”，还纵徒掳掠民女。山外人人骂散人，你杯中茶冷了。",
    fightLabel: "毒账现形", enemyId: "main_m38_lu_baiyan", hasBattle: true, isBoss: true,
    battleDesc: "毒账先生卢白砚，铁算盘藏毒针，专管销魂散账册。",
    battleReward: { exp:800, fame:300, gainItem:"toxic_ledger", int:3 } },
  39: { title: "旧旗蒙尘",
    text: "你随方平下山，第一站到龙井谷。旧旗还在，却被新堂口改成黑底银纹。少年散人巡街收例钱，百姓见了便闭门。一个卖豆腐的老妪认出你，先是一喜，继而跪下求你别说来过。你这才知，名声也会杀人。" },
  40: { title: "烟馆灯红",
    text: "夜探临安烟馆，楼上笙歌，楼下铁笼关着欠债女子。墙后暗仓堆满销魂散，账册写着“徐堂主亲批”。守仓的罗千魅笑说，散人既已成帮，便该有帮派的进项。她袖中软鞭如蛇，鞭梢淬着迷香。",
    fightLabel: "迷香破阵", enemyId: "main_m40_luo_qianmei", hasBattle: true, isBoss: true,
    battleDesc: "迷香鞭罗千魅，擅媚术、软鞭、迷香控场。",
    battleReward: { exp:900, fame:350, gainItem:"charm_whip", agi:3 } },
  41: { title: "双修邪影",
    text: "救出的女子说，徐迦笙每月挑“炉鼎”入别院，名曰传功，实为采补。有人活着出来，却神智尽失。方平怒得拔刀，你按住他。此事若只杀一二恶徒，救不了散人。要拔，便拔根；要洗，便洗名。" },
  42: { title: "竹坞断魂",
    text: "你潜入徐氏别院，竹影深处传来琴声。琴声一起，同行弟子忽觉内息逆行。守院者温玉郎自称徐迦笙座下“调息使”，专以琴音乱人气脉。他说：“人心有欲，散人有价，前辈何必装得干净？”",
    fightLabel: "断魂琴绝", enemyId: "main_m42_wen_yulang", hasBattle: true, isBoss: true,
    battleDesc: "断魂琴温玉郎，音律扰内、封招、削内力。",
    battleReward: { exp:1000, fame:400, gainItem:"cursed_zither", qi:200 } },
  43: { title: "白骨花田",
    text: "别院后山有片花田，花色艳得近妖。掘开泥土，尽是运毒死士与被灭口的女子骸骨。你在一枚银簪上看见“平安”二字，忽然想起当年老李临死前的眼神。原来人若握权太久，也会学会把人埋进土里。" },
  44: { title: "刑堂惊变",
    text: "你召集旧部，要公审徐迦笙。刑堂却先一步反咬，说你离山三年，不知帮务，乃外人乱政。铁面判官裴照雪持双钺而出，宣读伪造罪状，句句冠冕堂皇。方平冷笑：“这味儿，真像当年的武盟。”",
    fightLabel: "钺斩伪令", enemyId: "main_m44_pei_zhaoxue", hasBattle: true, isBoss: true,
    battleDesc: "铁面判官裴照雪，双钺重击，擅伪令与反击。",
    battleReward: { exp:1200, fame:500, gainItem:"judge_axe_pair", def:5 } },
  45: { title: "方平受困",
    text: "方平为救证人落入陷阱，被吊在旧演武场上。徐迦笙留书一封：孤云前辈若仍念散人旧情，便独身赴会。你看完信，忽然笑了。方平当年闯牢救出，今日仍是这般命硬。只是这一次，换你去闯。" },
  46: { title: "血月演武",
    text: "演武场血月高悬，三百刑堂弟子列阵。阵心立着阴阳幡，幡下是徐迦笙的护法石寒灯，左手寒掌，右手阳刀，一阴一阳逼人气血翻涌。他说徐堂主才懂散人：无人管时是沙，有人压时才成金。",
    fightLabel: "阴阳逆鼎", enemyId: "main_m46_shi_handeng", hasBattle: true, isBoss: true,
    battleDesc: "阴阳幡使石寒灯，阴掌阳刀，切换寒毒与烈伤。",
    battleReward: { exp:1500, fame:600, gainItem:"yin_yang_banner", atk:5 } },
  47: { title: "山门无声",
    text: "你救下方平，旧部终于倒戈。百姓送来被抢女子的血书，散人弟子送来毒账原本。山门前无人喧哗，只有风吹旧旗。你知道这一战不同于太行：那时敌在外，剑可直斩；今日敌在心里，胜了也未必干净。" },
  48: { title: "终战·徐迦笙",
    text: "徐迦笙立于孤云堂上，白衣金带，掌心一阴一阳，笑称双修大道本就取长补短，女子、毒客、帮众皆是鼎炉。你问他可还记得散人二字。他说散人既散，正该由强者收拢。话尽，阴毒入风，灯火尽青。",
    isEndNode: true, isFinalBoss: true,
    fightLabel: "终结毒君", enemyId: "main_m48_xu_jiasheng", hasBattle: true, isFinalBoss: true, onWin: "m48Win", onLose: "m48Lose",

    battleDesc: "双修毒君徐迦笙，阴阳双修、采补邪功、毒雾缠身，低血量转入『阴阳逆鼎』狂暴。",
    battleReward: { exp:6000, fame:2500, money:5000, atk:12, def:12, int:12, agi:12 } }
};

// ============================================================
// 孤云逐浪 成长事件池（22个随机奇遇）
// 权重分布：传功10% | 道具10% | 加属性20% | 打斗30% | 金钱30%
// 传功6个每局各限领一次（collectedHeritages）；道具/打斗/金钱可重复
// ============================================================

// ===========================================================
// 铁鹰入局 48月叙事数据（占位符，待填写）
// ===========================================================
DATA.constableMonths = {
  // === 第一年 ===
  1: { title: "待填写M1",
    text: "待填写" },
  2: { title: "待填写M2",
    text: "待填写",
    fightLabel: "战斗", enemyId: "constable_m2_enemy", hasBattle: true, isBoss: false,
    battleDesc: "待填写",
    battleReward: { exp:100, money:60, fame:20 } },
  3: { title: "待填写M3",
    text: "待填写" },
  4: { title: "待填写M4",
    text: "待填写",
    fightLabel: "战斗", enemyId: "constable_m4_enemy", hasBattle: true, isBoss: false,
    battleDesc: "待填写",
    battleReward: { exp:200, money:120, fame:40 } },
  5: { title: "待填写M5",
    text: "待填写" },
  6: { title: "待填写M6",
    text: "待填写",
    fightLabel: "战斗", enemyId: "constable_m6_enemy", hasBattle: true, isBoss: false,
    battleDesc: "待填写",
    battleReward: { exp:300, money:180, fame:60 } },
  7: { title: "待填写M7",
    text: "待填写" },
  8: { title: "待填写M8",
    text: "待填写",
    fightLabel: "战斗", enemyId: "constable_m8_enemy", hasBattle: true, isBoss: false,
    battleDesc: "待填写",
    battleReward: { exp:400, money:240, fame:80 } },
  9: { title: "待填写M9",
    text: "待填写" },
  10: { title: "待填写M10",
    text: "待填写",
    fightLabel: "战斗", enemyId: "constable_m10_enemy", hasBattle: true, isBoss: false,
    battleDesc: "待填写",
    battleReward: { exp:500, money:300, fame:100 } },
  11: { title: "待填写M11",
    text: "待填写" },
  12: { title: "待填写M12",
    text: "待填写",
    fightLabel: "战斗", enemyId: "constable_m12_enemy", hasBattle: true, isBoss: false,
    battleDesc: "待填写",
    battleReward: { exp:600, money:360, fame:120 } },
  // === 第二年 ===
  13: { title: "待填写M13",
    text: "待填写" },
  14: { title: "待填写M14",
    text: "待填写",
    fightLabel: "战斗", enemyId: "constable_m14_enemy", hasBattle: true, isBoss: false,
    battleDesc: "待填写",
    battleReward: { exp:700, money:420, fame:140 } },
  15: { title: "待填写M15",
    text: "待填写" },
  16: { title: "待填写M16",
    text: "待填写",
    fightLabel: "战斗", enemyId: "constable_m16_enemy", hasBattle: true, isBoss: false,
    battleDesc: "待填写",
    battleReward: { exp:800, money:480, fame:160 } },
  17: { title: "待填写M17",
    text: "待填写" },
  18: { title: "待填写M18",
    text: "待填写",
    fightLabel: "战斗", enemyId: "constable_m18_enemy", hasBattle: true, isBoss: false,
    battleDesc: "待填写",
    battleReward: { exp:900, money:540, fame:180 } },
  19: { title: "待填写M19",
    text: "待填写" },
  20: { title: "待填写M20",
    text: "待填写",
    fightLabel: "战斗", enemyId: "constable_m20_enemy", hasBattle: true, isBoss: false,
    battleDesc: "待填写",
    battleReward: { exp:1000, money:600, fame:200 } },
  21: { title: "待填写M21",
    text: "待填写" },
  22: { title: "待填写M22",
    text: "待填写",
    fightLabel: "战斗", enemyId: "constable_m22_enemy", hasBattle: true, isBoss: false,
    battleDesc: "待填写",
    battleReward: { exp:1100, money:660, fame:220 } },
  23: { title: "待填写M23",
    text: "待填写" },
  24: { title: "待填写M24",
    text: "待填写",
    fightLabel: "战斗", enemyId: "constable_m24_enemy", hasBattle: true, isBoss: false,
    battleDesc: "待填写",
    battleReward: { exp:1200, money:720, fame:240 } },
  // === 第三年 ===
  25: { title: "待填写M25",
    text: "待填写" },
  26: { title: "待填写M26",
    text: "待填写",
    fightLabel: "战斗", enemyId: "constable_m26_enemy", hasBattle: true, isBoss: false,
    battleDesc: "待填写",
    battleReward: { exp:1300, money:780, fame:260 } },
  27: { title: "待填写M27",
    text: "待填写" },
  28: { title: "待填写M28",
    text: "待填写",
    fightLabel: "战斗", enemyId: "constable_m28_enemy", hasBattle: true, isBoss: false,
    battleDesc: "待填写",
    battleReward: { exp:1400, money:840, fame:280 } },
  29: { title: "待填写M29",
    text: "待填写" },
  30: { title: "待填写M30",
    text: "待填写",
    fightLabel: "战斗", enemyId: "constable_m30_enemy", hasBattle: true, isBoss: false,
    battleDesc: "待填写",
    battleReward: { exp:1500, money:900, fame:300 } },
  31: { title: "待填写M31",
    text: "待填写" },
  32: { title: "待填写M32",
    text: "待填写",
    fightLabel: "战斗", enemyId: "constable_m32_enemy", hasBattle: true, isBoss: false,
    battleDesc: "待填写",
    battleReward: { exp:1600, money:960, fame:320 } },
  33: { title: "待填写M33",
    text: "待填写" },
  34: { title: "待填写M34",
    text: "待填写",
    fightLabel: "战斗", enemyId: "constable_m34_enemy", hasBattle: true, isBoss: false,
    battleDesc: "待填写",
    battleReward: { exp:1700, money:1020, fame:340 } },
  35: { title: "待填写M35",
    text: "待填写" },
  36: { title: "待填写M36",
    text: "待填写",
    fightLabel: "战斗", enemyId: "constable_m36_enemy", hasBattle: true, isBoss: false,
    battleDesc: "待填写",
    battleReward: { exp:1800, money:1080, fame:360 } },
  // === 第四年 ===
  37: { title: "待填写M37",
    text: "待填写" },
  38: { title: "待填写M38",
    text: "待填写",
    fightLabel: "战斗", enemyId: "constable_m38_enemy", hasBattle: true, isBoss: false,
    battleDesc: "待填写",
    battleReward: { exp:1900, money:1140, fame:380 } },
  39: { title: "待填写M39",
    text: "待填写" },
  40: { title: "待填写M40",
    text: "待填写",
    fightLabel: "战斗", enemyId: "constable_m40_enemy", hasBattle: true, isBoss: false,
    battleDesc: "待填写",
    battleReward: { exp:2000, money:1200, fame:400 } },
  41: { title: "待填写M41",
    text: "待填写" },
  42: { title: "待填写M42",
    text: "待填写",
    fightLabel: "战斗", enemyId: "constable_m42_enemy", hasBattle: true, isBoss: false,
    battleDesc: "待填写",
    battleReward: { exp:2100, money:1260, fame:420 } },
  43: { title: "待填写M43",
    text: "待填写" },
  44: { title: "待填写M44",
    text: "待填写",
    fightLabel: "战斗", enemyId: "constable_m44_enemy", hasBattle: true, isBoss: false,
    battleDesc: "待填写",
    battleReward: { exp:2200, money:1320, fame:440 } },
  45: { title: "待填写M45",
    text: "待填写" },
  46: { title: "待填写M46",
    text: "待填写",
    fightLabel: "战斗", enemyId: "constable_m46_enemy", hasBattle: true, isBoss: false,
    battleDesc: "待填写",
    battleReward: { exp:2300, money:1380, fame:460 } },
  47: { title: "待填写M47",
    text: "待填写" },
  48: { title: "待填写M48",
    text: "待填写",
    fightLabel: "战斗", enemyId: "constable_m48_enemy", hasBattle: true, isBoss: false,
    battleDesc: "待填写",
    battleReward: { exp:2400, money:1440, fame:480 } },
};

DATA.wandererGrowthEvents = {
  heritage: [
    {
      id: "wanderer_heritage_tieyi",
      name: "铁衣遗训·血偿",
      category: "传功",
      unlockMonth: 10,
      desc: "龙井谷废墟的石壁上刻着韩铁衣最后的手迹。不是招式，而是一个命令：「散人不打花拳——打一刀要让对面流血三天。」你用手掌抚过石壁上的刻痕，每一条都入石三分。这是他死前用最后的力气刻上去的。",
      effect: { traitGain: "tieyi_blood_debt", desc: "获得特性「血偿」：流血招式层数+3，无论武器类型均生效" }
    },
    {
      id: "wanderer_heritage_meng",
      name: "灰袍手札",
      category: "传功",
      unlockMonth: 16,
      desc: "信鸽落在窗台上，腿上绑着一卷薄纸。展开来看是几页手写的修行心得——笔迹你认得，和那份安置营地图一模一样。孟天衡在末尾写了一行小字：「这些东西武盟不让外传。但你用得着。」没有署名，没有问候。他把命押给了你，连一句废话都不多说。",
      effect: { qiUp: 80, traitGain: "clearMind", desc: "内力上限+80，获得特性「明心」：每月开始额外获得1行动力" }
    },
    {
      id: "wanderer_heritage_hp",
      name: "铁衣遗训·锻体",
      category: "传功",
      unlockMonth: 10,
      desc: "深夜在龙井谷废墟独自练功。韩铁衣说过「散人没有师门，身体就是最后的武器。」你一拳一拳打在焦黑的树干上，直到月光偏西。三个月下来，拳骨磨出了茧子，树干也终于被你打断了一棵——那不是树输了，是你的身体终于追上了韩铁衣说的那个标准。",
      effect: { hpUp: 180, traitGain: "tieyi_body_tempering", desc: "血量上限+180，获得特性「铁衣锻体」：每回合调息多回复5%血量" }
    },
    {
      id: "wanderer_heritage_qi",
      name: "龙井废墟·吐纳",
      category: "传功",
      unlockMonth: 10,
      desc: "龙井谷废墟的清晨有股特别的清气。韩铁衣生前每天早上都在这里打坐——他说「谷里的风会教你呼吸」。你盘腿坐在他坐过的石头上，让风吹进丹田。几个月下来你发现自己的内力运转比从前顺畅许多——不是多了什么招式，是底子比以前厚实了。",
      effect: { qiUp: 60, traitGain: "jingxi", desc: "内力上限+60，获得特性「鲸息」：每回合自动回复5%内力" }
    },
    {
      id: "wanderer_heritage_break",
      name: "铁衣破阵诀",
      category: "传功",
      unlockMonth: 10,
      desc: "你在龙井谷的乱石堆里发现了几块刻了字的岩石，拼在一起才看明白——韩铁衣生前最得意的不是单挑，是破阵。石上刻的是他的破阵要诀：「一个人打一群人，不能跟每个都打。先撂倒最弱的，打要害，一拳接一拳别停。别给他们喘气的机会——你喘他们就反扑。」你照着石刻练了几个月，终于明白为什么当年他一个人能拦住一个堂口。",
      effect: { crit: 8, combo: 6, hit: 10, desc: "暴击+8，连击+6，命中+10" }
    },
    {
      id: "wanderer_heritage_step",
      name: "天衡影步",
      category: "传功",
      unlockMonth: 16,
      desc: "孟天衡送来一卷残破的帛书，上面画着诡异的人影——不是招式，是步法。附了一张字条：「楚宗玄的剑太快，硬接必死。我花了十年琢磨怎么从他的剑下活下来。这几步，每一步都踩在对手最难受的位置。学不学得会看你自己。」你试着按帛书上的影子练了几天，发现这不是闪避——这是预判。每一步都走在对手出招之前。",
      effect: { dodge: 12, speed: 0.2, desc: "闪避+12，出手速度+0.2" }
    }
  ],
  item: [
    {
      id: "wanderer_item_relic",
      name: "散人遗物",
      category: "道具",
      unlockMonth: 1,
      desc: "你在歇脚的破庙里发现一个旧的不能再旧的包袱，上面缝着几个歪歪扭扭的字——「有用的留下」。打开一看是个散人传下来的药囊，里面装着几颗丹药。不知道经过多少人的手，也不知道下一个传给谁。你拿了两颗，把剩下的重新包好放回原处。江湖就是这样——今天你拿，明天你放。",
      effect: { desc: "随机获得1~2件消耗品（金疮药/回气酒/提神散/小补丸等，低价值品概率更高）" }
    },
    {
      id: "wanderer_item_merchant",
      name: "游商秘货",
      category: "道具",
      unlockMonth: 1,
      unlockYear: 2,
      desc: "一个背着大包袱的游商拦住你，掀开包袱角露出刀柄：「兄弟，甩货——五折。武盟倒了批人，装备没人收。你看着给。」他说话像连珠炮，不等你开口已经摆了三件出来。",
      effect: { desc: "花五折价购买随机武器或防具一件（品质与当前年份匹配）" }
    }
  ],
  stat: [
    {
      id: "wanderer_stat_crit",
      name: "破绽寻击",
      category: "属性",
      unlockMonth: 1,
      statKey: "crit",
      desc: "对着木桩反复打同一个点。一开始是拳头大的范围，几个月后缩小到铜钱大小，最后连硬币大的疤都能精准命中。散人的招式不花哨——能打死人的就是好招。",
      values: { y1: 2, y2: 3, y3: 5 }
    },
    {
      id: "wanderer_stat_combo",
      name: "连环手法",
      category: "属性",
      unlockMonth: 1,
      statKey: "combo",
      desc: "苦练连招衔接。第一拳没收回来第二拳已经出去了，第三拳不用看就知道打在哪里。快到不需要想——不是招式快，是节奏快，是你没时间犹豫。",
      values: { y1: 2, y2: 3, y3: 5 }
    },
    {
      id: "wanderer_stat_dodge",
      name: "飘萍步",
      category: "属性",
      unlockMonth: 1,
      statKey: "dodge",
      desc: "踩在溪水里的石头上练步法。一开始每步都滑，摔得浑身湿透。练到后来脚下像长了眼睛——不靠力气，不靠速度，靠的是对重心的感觉。身如飘萍，随波逐流，却始终不翻。",
      values: { y1: 2, y2: 3, y3: 4 }
    },
    {
      id: "wanderer_stat_speed",
      name: "疾影式",
      category: "属性",
      unlockMonth: 1,
      statKey: "speed",
      desc: "对着铜镜练出招。一开始看得见自己的手。练到后来镜子里只剩残影。出手快不是手快——是脑子快。脑子比你手快的那一瞬间，你已经赢了。",
      values: { y1: 0.04, y2: 0.06, y3: 0.10 }
    },
    {
      id: "wanderer_stat_hit",
      name: "鹰目诀",
      category: "属性",
      unlockMonth: 1,
      statKey: "hit",
      desc: "山谷里追着飞鸟的轨迹练眼力。从看不清到能数出翅膀上的羽毛。你发现所有的鸟起飞之前翅膀都会先收一下——就像所有对手出招前，肩膀都会先动一下。看见了，就躲得开。",
      values: { y1: 3, y2: 5, y3: 7 }
    }
  ],
  fight: [
    {
      id: "wanderer_fight_ambush",
      name: "林中伏击",
      category: "切磋",
      unlockMonth: 1,
      pool: "ambush",
      count: [2, 3, 3],
      desc: "穿过密林时听到前方树枝折断的声响——不是野兽，是人。你还没来得及退，身后的退路也被人堵住了。领头的喽啰提着刀从树后走出来：「散人？正好——拿你回去交差。」"
    },
    {
      id: "wanderer_fight_bandit",
      name: "悬赏缉拿",
      category: "切磋",
      unlockMonth: 1,
      pool: "bandit",
      count: [1, 2, 2],
      desc: "城门口贴着你的画像，下面的赏金又涨了。几个专门做悬赏生意的狠角色盯上了你——其中一个手里还拿着你上次战斗时掉落的剑穗：「这个是你的吧？找了你三天了。」"
    },
    {
      id: "wanderer_fight_fighter",
      name: "擂台切磋",
      category: "切磋",
      unlockMonth: 1,
      pool: "fighter",
      count: [1, 1, 1],
      desc: "「散人现在不好惹了——敢不敢让我试试？」一个江湖人当街摆下擂台。围观的人越来越多，其中有几张陌生的脸——也许是想投奔的散人，也许是武盟的探子。无论如何，这一场必须赢。"
    }
  ],
  coin: [
    {
      id: "wanderer_coin_escort",
      name: "替散人运镖",
      category: "金钱",
      unlockMonth: 10,
      desc: "韩铁衣生前搭了一条散人自己的物资线——从山里收药材，运到城郊黑市换粮食。武盟封锁之后这条线断了。一个老镖头找到你：「路不好走，但货得送。沿路的散人都指着这批粮食。」他递过来一张皱巴巴的路线图——上面标注的每一个安全点，都是韩铁衣拿血换来的。",
      reward: { y1: 150, y2: 210, y3: 300 },
      autoReward: { type: "item", ids: ["pill", "qiWine"], desc: "金疮药+回气酒各1" }
    },
    {
      id: "wanderer_coin_rebuild",
      name: "龙井谷重建",
      category: "金钱",
      unlockMonth: 10,
      desc: "血战之后的龙井谷需要重建。散人里面老的小的都有，能扛能打的没几个。你卷起袖子搬石头、修棚子、挖水沟——干的都是最重的体力活。天黑收工时一个老妇人端来一碗热汤：「小伙子，我们家男人要是还活着，也是你这把年纪。」",
      reward: { y1: 120, y2: 180, y3: 260 },
      autoReward: { type: "stat", stats: { crit: 2 }, desc: "暴击+2" }
    },
    {
      id: "wanderer_coin_intel",
      name: "孟天衡情报费",
      category: "金钱",
      unlockMonth: 16,
      unlockYear: 2,
      desc: "一个从不露面的人托人送来一封信和十两银子。信上只有几个字：「城西茶楼，申时，留意左手戴铁指环的人。」你去看了——那人和武盟的人接头，说出了三个散人据点的位置。你把他摁在巷子里的时候，他塞过来一包银子：「兄弟别杀我，我知道更多。」五天后，又有人送来一封信，银子里夹了一张纸条：「干得不错。——孟」",
      reward: { y2: 240, y3: 360 },
      autoReward: { type: "stat", stats: { dodge: 2 }, desc: "闪避+2" }
    },
    {
      id: "wanderer_coin_fangping",
      name: "方平的私活",
      category: "金钱",
      unlockMonth: 2,
      desc: "方平在村口朝你招手：「别绷着一张脸了，出来挣点钱。」他接了一单江湖活——给一个退隐的老拳师修院子。活不累，但老拳师看你们手脚麻利，多结了工钱不说还指点了几招：「年轻人，拳头是最后的东西。靠力气吃饭不丢人。」方平把银子分你一半：「下次换个来钱快的，这个老家伙太能唠了。」",
      reward: { y1: 180, y2: 250, y3: 350 },
      autoReward: { type: "stat", stats: { speed: 0.04 }, desc: "出手速度+0.04" }
    },
    {
      id: "wanderer_coin_labor",
      name: "安置营杂工",
      category: "金钱",
      unlockMonth: 13,
      desc: "混进武盟的安置营当临时杂工——搬货、扫地、倒马桶。一天累死累活只挣几个铜板，但你趁着干活把安置营的布局摸了个透：看守换班时间、仓库位置、哪面墙最矮。走的时候领班骂你偷懒，你低着头不吭声——心里已经把救人的路线画好了。",
      reward: { y1: 100, y2: 160, y3: 240 },
      autoReward: { type: "stat", stats: { hit: 3 }, desc: "命中+3" }
    },
    {
      id: "wanderer_coin_market",
      name: "散人集市帮手",
      category: "金钱",
      unlockMonth: 6,
      desc: "散人营地外有个小集市——卖草药的、修兵器的、缝衣服的，全是散人自己。今天人手不够，你帮忙搬货、跑腿送东西、替一个不识字的大娘读账本。一天下来腿都跑细了，但集市的散人们凑了一包碎银子塞给你，一个老裁缝还顺手给你缝好了袖口的破洞。",
      reward: { y1: 130, y2: 190, y3: 280 },
      autoReward: { type: "stat", stats: { combo: 2 }, desc: "连击+2" }
    }
  ]
};

// ============================================================
// 铁鹰入局 成长事件池（待设计）
// ============================================================
DATA.constableGrowthEvents = [];

// ============================================================
// 孤云逐浪 武林商人货品池（精选江湖气质秘籍/兵器/防具/丹药）
// 定价基准：100钱=50血=10内=1攻/防
// ============================================================
DATA.wandererMerchantPool = {
  manuals: [
    { id: "quickSlash", name: "雁门快刀", school: "blade", rarity: "blue", style: "bleed", price: 200, desc: "快刀+流血是绿林散人最实用的打法。雁门快刀据说是边关逃兵带回来的刀法。" },
    { id: "blade_orange_1", name: "燃木刀法", school: "blade", rarity: "orange", style: "bleed", price: 500, desc: "来自一个被武盟追杀了三年的老刀客。刀势焦灼，伤口更深。" },
    { id: "blade_red_1", name: "饮血封喉刀", school: "blade", rarity: "red", style: "bleed", price: 1500, desc: "散人中间口耳相传的终极刀法——对手流血的速度就是你的活命时间。" },
    { id: "fist_blue_3", name: "太祖长拳", school: "fist", rarity: "blue", style: "critPalm", price: 200, desc: "街头斗殴里打出来的拳法，不讲究招式讲究一拳下去对面得趴下。" },
    { id: "fist_orange_2", name: "黯魂掌", school: "fist", rarity: "orange", style: "critPalm", price: 600, desc: "据传是韩铁衣在龙井谷改良的拳路，出招时带着一股子老子跟你拼命的蛮劲。" },
    { id: "fist_red_2", name: "碎星拳", school: "fist", rarity: "red", style: "critPalm", price: 1600, desc: "重拳碎星，暴击倍率提高。散人没有门派——拳头就是最后的尊严。" },
    { id: "springNeedle", name: "青囊毒针", school: "hidden", rarity: "blue", style: "poison", price: 200, desc: "散人没有门派资源，毒是最好的以小博大手段。来自江湖郎中的偏方。" },
    { id: "hidden_orange_1", name: "冰魄毒针", school: "hidden", rarity: "orange", style: "poison", price: 500, desc: "据说是从武盟刑讯室流出来的配方——他们用来对付我们的，我们用来对付他们。" },
    { id: "hidden_red_1", name: "孔雀毒翎", school: "hidden", rarity: "red", style: "poison", price: 1500, desc: "毒雨齐发，淬毒暗器终极式。" },
    { id: "leg_kick_blue", name: "扫堂腿", school: "lightness", rarity: "blue", style: "lowKick", price: 200, desc: "每个散人都会的打架基本功。" },
    { id: "leg_kick_orange", name: "盘龙腿", school: "lightness", rarity: "orange", style: "lowKick", price: 500, desc: "龙井谷一个瘸腿老散人教的——腿断了这辈子跑不了，那就把底盘练稳，谁来踢谁。" },
    { id: "leg_kick_red", name: "碎岳沉桩腿", school: "lightness", rarity: "red", style: "lowKick", price: 1500, desc: "核心是站住了就是赢。" },
    { id: "manual_speed", name: "唯快不破", school: "none", rarity: "blue", style: "buff", price: 500, desc: "天下武功，唯快不破。读条速度提升3倍，持续3回合。" },
    { id: "manual_atk", name: "力大无穷", school: "none", rarity: "blue", style: "buff", price: 500, desc: "一力降十会。攻击力提升2倍，持续3回合。" },
    { id: "manual_crit", name: "屠杀盛宴", school: "none", rarity: "blue", style: "buff", price: 500, desc: "杀意沸腾之时，无坚不摧。暴击/连击概率+100%，暴击倍率+1，持续3回合。" }
  ],
  weapons: [
    { id: "blade_bleed_blue", name: "饮血雁翎刀", school: "blade", rarity: "blue", price: 550 },
    { id: "blade_bleed_orange", name: "裂血长刀", school: "blade", rarity: "orange", price: 1600 },
    { id: "blade_bleed_red", name: "血河断刃", school: "blade", rarity: "red", price: 4500 },
    { id: "fist_crit_blue", name: "炽星拳套", school: "fist", rarity: "blue", price: 500 },
    { id: "fist_crit_orange", name: "纯阳拳甲", school: "fist", rarity: "orange", price: 1500 },
    { id: "fist_crit_red", name: "碎星拳套", school: "fist", rarity: "red", price: 4200 },
    { id: "hidden_poison_blue", name: "淬毒针匣", school: "hidden", rarity: "blue", price: 500 },
    { id: "hidden_poison_orange", name: "淬毒银针", school: "hidden", rarity: "orange", price: 1400 },
    { id: "hidden_poison_red", name: "孔雀毒匣", school: "hidden", rarity: "red", price: 4300 },
    { id: "leg_low_blue", name: "破门靴", school: "lightness", rarity: "blue", price: 500 },
    { id: "leg_low_orange", name: "压山靴", school: "lightness", rarity: "orange", price: 1500 },
    { id: "leg_low_red", name: "断岳沉步靴", school: "lightness", rarity: "red", price: 4500 }
  ],
  armors: [
    { id: "armor_heavy_blue", name: "硬布背心", rarity: "blue", price: 600, desc: "散人的标准防具——粗布层层叠叠缝制，不美观但是实在。" },
    { id: "armor_light_orange", name: "游云轻甲", rarity: "orange", price: 1200, desc: "据说是一个退役的武盟捕快卖给黑市的——穿上跑得快，跑路的时候派大用场。" },
    { id: "armor_wuxiang_red", name: "无相秘甲", rarity: "red", price: 2400, desc: "据传来自楚宗玄的私人武库，被孟天衡暗中调包流出来的。" }
  ],
  internalArts: [
    { id: "art_blue_3", name: "罗汉镇岳功", rarity: "blue", price: 500, desc: "少林叛僧流传出来的站桩功夫，散人没有门派护体，只能靠自己扛。" },
    { id: "art_blue_4", name: "回照心经", rarity: "blue", price: 500, desc: "江湖药店常配的内功入门——不会这个功法你连毒都扛不住。" },
    { id: "art_blue_7", name: "归元功", rarity: "blue", price: 500, desc: "归元守一，内息绵绵。散人没有师门调息，纯靠自己盘坐吐纳。" },
    { id: "art_orange_1", name: "虚玄无相功", rarity: "orange", price: 1500, desc: "传说是一个偷遍江南的老贼头创的，内力运转不浪费一丝，真正的省着用——每次攻击吸取对方内力。" },
    { id: "art_orange_2", name: "纯阳正气诀", rarity: "orange", price: 1600, desc: "名字很正派，实则是散人对抗武盟压迫的底气——心中坦荡，气贯长虹。" },
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
    { id: "statPill" },
    { id: "superPill" }
  ]
};
DATA.constableMerchantPool = {
  manuals: [],
  weapons: [],
  armors: [],
  internalArts: [],
  pills: []
};


// 主线故事事件执行函数映射（在 runSystem.js 中实现，这里只定义数据结构）
// 注意：这些事件的实际 apply 逻辑在 runSystem.js 的 resolveStoryEvent 中



// ============================================================
// 孤云逐浪 专属敌人池（v5.4，数据源：孤云逐浪人物.md）
// ============================================================
DATA.wandererEnemyPool = {
  // --- 普通敌人（奇遇通用战斗，仅三大事件年份变体）---
  grunts: [
    // --- 林中伏击逐年变体 ---
    { id: "wanderer_grunt_ambush_yr1", name: "武盟喽啰", icon: "伏", portraitImage: "assets/portraits_guyun_pixel/enc_ambush_y1_wumeng_luoluo_pixel_320.webp", hp: 350, qi: 120, atk: 32, def: 14, combo: 3, hit: 68, dodge: 5, crit: 6, speed: 1.20, rank: 1, taunt: "嘿，又一个散人！兄弟们，围上！" },
    { id: "wanderer_grunt_ambush_yr2", name: "武盟打手", icon: "伏", portraitImage: "assets/portraits_guyun_pixel/enc_ambush_y2_wumeng_dasher_pixel_320.webp", hp: 700, qi: 200, atk: 48, def: 21, combo: 4, hit: 72, dodge: 7, crit: 8, speed: 1.25, rank: 2, taunt: "武盟的地盘你也敢闯？给我拿下！" },
    { id: "wanderer_grunt_ambush_yr3", name: "武盟精英", icon: "伏", portraitImage: "assets/portraits_guyun_pixel/enc_ambush_y3_wumeng_elite_pixel_320.webp", hp: 1400, qi: 320, atk: 64, def: 28, combo: 5, hit: 76, dodge: 9, crit: 10, speed: 1.30, rank: 3, taunt: "奉统领令——散人抗册者，杀无赦。" },
    // --- 悬赏缉拿逐年变体 ---
    { id: "wanderer_grunt_bandit_yr1", name: "绿林强盗", icon: "赏", portraitImage: "assets/portraits_guyun_pixel/enc_wanted_y1_greenwood_bandit_pixel_320.webp", hp: 380, qi: 100, atk: 34, def: 12, combo: 3, hit: 66, dodge: 4, crit: 7, speed: 1.22, rank: 1, taunt: "此路是我开，此树是我栽——要想从此过，留下买路财！" },
    { id: "wanderer_grunt_bandit_yr2", name: "强盗好手", icon: "赏", portraitImage: "assets/portraits_guyun_pixel/enc_wanted_y2_bandit_veteran_pixel_320.webp", hp: 760, qi: 180, atk: 51, def: 18, combo: 4, hit: 70, dodge: 6, crit: 9, speed: 1.28, rank: 2, taunt: "听说你身上油水不少？乖乖交出来，爷爷饶你一命。" },
    { id: "wanderer_grunt_bandit_yr3", name: "强盗首领", icon: "赏", portraitImage: "assets/portraits_guyun_pixel/enc_wanted_y3_bandit_chief_pixel_320.webp", hp: 1520, qi: 280, atk: 68, def: 24, combo: 5, hit: 74, dodge: 8, crit: 11, speed: 1.35, rank: 3, taunt: "官府管不了这山头，更管不了老子的刀。" },
    // --- 擂台切磋逐年变体 ---
    { id: "wanderer_grunt_fighter_yr1", name: "三流高手", icon: "擂", portraitImage: "assets/portraits_guyun_pixel/enc_duel_y1_third_rate_pixel_320.webp", hp: 400, qi: 130, atk: 36, def: 16, combo: 3, hit: 70, dodge: 6, crit: 7, speed: 1.24, rank: 1, taunt: "来得正好，正缺个练手的。" },
    { id: "wanderer_grunt_fighter_yr2", name: "二流高手", icon: "擂", portraitImage: "assets/portraits_guyun_pixel/enc_duel_y2_second_rate_pixel_320.webp", hp: 800, qi: 220, atk: 54, def: 24, combo: 4, hit: 74, dodge: 8, crit: 9, speed: 1.30, rank: 2, taunt: "报上名来，我的刀下不斩无名之辈。" },
    { id: "wanderer_grunt_fighter_yr3", name: "一流高手", icon: "擂", portraitImage: "assets/portraits_guyun_pixel/enc_duel_y3_first_rate_pixel_320.webp", hp: 1600, qi: 360, atk: 72, def: 32, combo: 5, hit: 78, dodge: 10, crit: 11, speed: 1.36, rank: 3, taunt: "十年未逢对手——希望你不是下一个让我失望的人。" }
  ],
  // --- 小Boss机制已删除（2026-06-15 清理）---
};
DATA.constableEnemyPool = {
  // --- 普通敌人（奇遇通用战斗，仅三大事件年份变体）---
  grunts: [
    // --- 林中伏击逐年变体 ---
    { id: "constable_grunt_ambush_yr1", name: "武盟喽啰", icon: "伏", portraitImage: "assets/portraits_guyun_pixel/enc_ambush_y1_wumeng_luoluo_pixel_320.webp", hp: 350, qi: 120, atk: 32, def: 14, combo: 3, hit: 68, dodge: 5, crit: 6, speed: 1.20, rank: 1, taunt: "嘿，又一个散人！兄弟们，围上！" },
    { id: "constable_grunt_ambush_yr2", name: "武盟打手", icon: "伏", portraitImage: "assets/portraits_guyun_pixel/enc_ambush_y2_wumeng_dasher_pixel_320.webp", hp: 700, qi: 200, atk: 48, def: 21, combo: 4, hit: 72, dodge: 7, crit: 8, speed: 1.25, rank: 2, taunt: "武盟的地盘你也敢闯？给我拿下！" },
    { id: "constable_grunt_ambush_yr3", name: "武盟精英", icon: "伏", portraitImage: "assets/portraits_guyun_pixel/enc_ambush_y3_wumeng_elite_pixel_320.webp", hp: 1400, qi: 320, atk: 64, def: 28, combo: 5, hit: 76, dodge: 9, crit: 10, speed: 1.30, rank: 3, taunt: "奉统领令——散人抗册者，杀无赦。" },
    // --- 悬赏缉拿逐年变体 ---
    { id: "constable_grunt_bandit_yr1", name: "绿林强盗", icon: "赏", portraitImage: "assets/portraits_guyun_pixel/enc_wanted_y1_greenwood_bandit_pixel_320.webp", hp: 380, qi: 100, atk: 34, def: 12, combo: 3, hit: 66, dodge: 4, crit: 7, speed: 1.22, rank: 1, taunt: "此路是我开，此树是我栽——要想从此过，留下买路财！" },
    { id: "constable_grunt_bandit_yr2", name: "强盗好手", icon: "赏", portraitImage: "assets/portraits_guyun_pixel/enc_wanted_y2_bandit_veteran_pixel_320.webp", hp: 760, qi: 180, atk: 51, def: 18, combo: 4, hit: 70, dodge: 6, crit: 9, speed: 1.28, rank: 2, taunt: "听说你身上油水不少？乖乖交出来，爷爷饶你一命。" },
    { id: "constable_grunt_bandit_yr3", name: "强盗首领", icon: "赏", portraitImage: "assets/portraits_guyun_pixel/enc_wanted_y3_bandit_chief_pixel_320.webp", hp: 1520, qi: 280, atk: 68, def: 24, combo: 5, hit: 74, dodge: 8, crit: 11, speed: 1.35, rank: 3, taunt: "官府管不了这山头，更管不了老子的刀。" },
    // --- 擂台切磋逐年变体 ---
    { id: "constable_grunt_fighter_yr1", name: "三流高手", icon: "擂", portraitImage: "assets/portraits_guyun_pixel/enc_duel_y1_third_rate_pixel_320.webp", hp: 400, qi: 130, atk: 36, def: 16, combo: 3, hit: 70, dodge: 6, crit: 7, speed: 1.24, rank: 1, taunt: "来得正好，正缺个练手的。" },
    { id: "constable_grunt_fighter_yr2", name: "二流高手", icon: "擂", portraitImage: "assets/portraits_guyun_pixel/enc_duel_y2_second_rate_pixel_320.webp", hp: 800, qi: 220, atk: 54, def: 24, combo: 4, hit: 74, dodge: 8, crit: 9, speed: 1.30, rank: 2, taunt: "报上名来，我的刀下不斩无名之辈。" },
    { id: "constable_grunt_fighter_yr3", name: "一流高手", icon: "擂", portraitImage: "assets/portraits_guyun_pixel/enc_duel_y3_first_rate_pixel_320.webp", hp: 1600, qi: 360, atk: 72, def: 32, combo: 5, hit: 78, dodge: 10, crit: 11, speed: 1.36, rank: 3, taunt: "十年未逢对手——希望你不是下一个让我失望的人。" }
  ],
  // --- 小Boss机制已删除（2026-06-15 清理）---
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
  allocations: { hp: 0, qi: 0, atk: 0, def: 0, combo: 0, hit: 0, dodge: 0, crit: 0, speed: 0, money: 0 },
  unlockedTreasures: ["inkTally", "goldAbacus", "springGourd"],
  endlessUnlocked: false
};
