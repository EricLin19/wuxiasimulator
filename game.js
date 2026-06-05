const DATA = {
  characters: [
    {
      id: "scholar",
      name: "林修涯",
      faction: "潜龙会",
      icon: "📖",
      desc: "悟性出众，擅长通过计略和稳定成长取胜。",
      trait: "鬼谋神算：战斗开始时，威力最高的招式威力提升30%。",
      apt: { 力量: 4.5, 根骨: 4.0, 身法: 5.0, 悟性: 8.0, 定力: 6.5, 魅力: 6.5 },
      stats: { hp: 210, qi: 297, atk: 52, def: 33, hit: 60, dodge: 1, crit: 5, critDmg: 120, speed: 1.4 },
      traits: ["highestPowerBoost"],
      skills: ["mixedFist"]
    },
    {
      id: "swordsman",
      name: "谢扶风",
      faction: "听雪楼",
      icon: "🗡",
      desc: "身法轻快，出手速度快，适合连击和闪避流。",
      trait: "迅影：出手速度+0.25，闪避+4。",
      apt: { 力量: 5.5, 根骨: 4.5, 身法: 8.0, 悟性: 5.0, 定力: 5.5, 魅力: 5.0 },
      stats: { hp: 230, qi: 250, atk: 58, def: 31, hit: 64, dodge: 6, crit: 8, critDmg: 130, speed: 1.75 },
      traits: ["swift"],
      skills: ["quickSlash"]
    },
    {
      id: "boxer",
      name: "铁山",
      faction: "铁掌帮",
      icon: "✊",
      desc: "根骨强横，血量和防御更高，适合硬碰硬。",
      trait: "铜皮铁骨：最大血量+80，防御+10。",
      apt: { 力量: 7.0, 根骨: 8.0, 身法: 3.5, 悟性: 4.5, 定力: 6.0, 魅力: 3.5 },
      stats: { hp: 320, qi: 210, atk: 62, def: 48, hit: 56, dodge: 0, crit: 4, critDmg: 120, speed: 1.1 },
      traits: ["tough"],
      skills: ["ironPalm"]
    }
  ],
  treasures: [
    { id: "goldFeather", name: "黄金羽", icon: "🪶", desc: "初始金钱+300，战斗开始攻击+10。", effect: "moneyAtk" },
    { id: "purpleCup", name: "紫金杯", icon: "🏺", desc: "每月开始恢复30血量和30内力。", effect: "monthRecover" },
    { id: "moonPearl", name: "万象珠", icon: "🔮", desc: "每次获得计略时，有25%概率额外刷新一次候选。", effect: "strategyLuck" },
    { id: "jadeRing", name: "玲珑环", icon: "⭕", desc: "最大行动力+20，传武堂秘籍价格-10%。", effect: "moreAp" },
    { id: "darkBag", name: "暗器袋", icon: "🎒", desc: "每场战斗开始获得1个飞镖道具。", effect: "battleDart" },
    { id: "herbBottle", name: "青岚瓶", icon: "🧪", desc: "治疗效果+20%，商人更容易出现药品。", effect: "healPlus" }
  ],
  skills: {
    mixedFist: { id: "mixedFist", name: "混混拳法", icon: "✊", power: 60, qi: 40, cd: 1, train: 3, desc: "朴实拳法，造成稳定伤害。" },
    quickSlash: { id: "quickSlash", name: "迅剑式", icon: "⚔", power: 50, qi: 45, cd: 1, train: 3, desc: "低消耗剑招，命中后提升少量速度。" },
    ironPalm: { id: "ironPalm", name: "铁掌", icon: "🖐", power: 70, qi: 50, cd: 2, train: 3, desc: "威力较高，附带破防。" },
    windPalm: { id: "windPalm", name: "裂风掌", icon: "🍃", power: 100, qi: 80, cd: 2, train: 4, desc: "使敌人获得风毒。" },
    guard: { id: "guard", name: "守护", icon: "🛡", power: 0, qi: 0, cd: 3, train: 2, desc: "本回合防御提升。" },
    innerSurge: { id: "innerSurge", name: "天罡斗气", icon: "✨", power: 0, qi: 0, cd: 4, train: 4, desc: "恢复内力并提升攻击。" }
  },
  strategies: [
    { id: "healBoost", name: "润泽", rarity: 1, color: "green", desc: "治疗效果提升25%。", tag: "heal" },
    { id: "firstStrike", name: "攻锐", rarity: 1, color: "green", desc: "战斗开始攻击力增加40。", tag: "atk" },
    { id: "fog", name: "凝霜", rarity: 1, color: "green", desc: "战斗开始时双方闪避降低90%。", tag: "control" },
    { id: "poisonBurst", name: "毒爆", rarity: 2, color: "orange", desc: "回合结束时，若敌方毒层数不少于4，造成毒层数x20伤害。", tag: "poison" },
    { id: "vigor", name: "龟息", rarity: 2, color: "orange", desc: "行动调息额外恢复80血量和内力。", tag: "survive" },
    { id: "duelFocus", name: "决心", rarity: 2, color: "orange", desc: "血量低于50%时，伤害增加20%。", tag: "atk" }
  ],
  traits: [
    { id: "critUp", name: "战意", desc: "暴击提升2%。" },
    { id: "breath", name: "龟息", desc: "行动“调息”可以额外恢复80点血量和内力。" },
    { id: "force", name: "刚力", desc: "伤害增加2%。" },
    { id: "clearMind", name: "明心", desc: "每月开始额外获得10行动力。" },
    { id: "merchantFriend", name: "奇智", desc: "商人价格降低15%。" }
  ],
  manuals: ["windPalm", "guard", "innerSurge"],
  items: {
    pill: { id: "pill", name: "金疮药", icon: "🧪", price: 90, desc: "恢复120血量。" },
    qiWine: { id: "qiWine", name: "回气酒", icon: "🍶", price: 80, desc: "恢复120内力。" },
    dart: { id: "dart", name: "飞镖", icon: "✦", price: 70, desc: "造成100点伤害。" }
  },
  enemies: [
    { id: "rogue", name: "二流高手", icon: "🥷", hp: 260, qi: 120, atk: 46, def: 22, hit: 55, dodge: 2, crit: 5, critDmg: 120, speed: 1.25 },
    { id: "blade", name: "快刀手", icon: "🧔", hp: 330, qi: 180, atk: 62, def: 30, hit: 65, dodge: 3, crit: 8, critDmg: 130, speed: 1.55 },
    { id: "demon", name: "心魔", icon: "👹", hp: 520, qi: 260, atk: 76, def: 38, hit: 62, dodge: 4, crit: 10, critDmg: 140, speed: 1.35 }
  ]
};

const state = {
  screen: "menu",
  selectedCharacter: null,
  selectedTreasure: null,
  run: null,
  modal: null,
  battle: null,
  toast: ""
};

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function rand(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function sample(list, count) {
  const pool = [...list];
  const out = [];
  while (pool.length && out.length < count) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
}

function showToast(text) {
  state.toast = text;
  render();
  setTimeout(() => {
    if (state.toast === text) {
      state.toast = "";
      render();
    }
  }, 1200);
}

function startRun() {
  const c = DATA.characters.find(x => x.id === state.selectedCharacter);
  const t = DATA.treasures.find(x => x.id === state.selectedTreasure);
  const stats = clone(c.stats);
  let money = 300;
  let maxAp = 100;
  if (t.effect === "moneyAtk") money += 300;
  if (t.effect === "moreAp") maxAp += 20;

  state.run = {
    year: 1,
    month: 1,
    maxAp,
    ap: maxAp,
    money,
    character: c,
    treasure: t,
    stats,
    hp: stats.hp,
    qi: stats.qi,
    martialExp: 0,
    level: 1,
    rankStars: 1,
    skills: [...c.skills],
    trainingSkills: [],
    skillProgress: {},
    strategies: [],
    traits: [...c.traits],
    items: ["pill", "pill", "dart"],
    eventRemaining: 3,
    events: [],
    manuals: sample(DATA.manuals, 3),
    finalBoss: DATA.enemies[2],
    finalBossMonth: 36,
    log: []
  };
  applyTreasureMonthStart();
  refreshEvents();
  log(`第${state.run.year}年${state.run.month}月，${c.name}携带${t.name}踏入江湖。`);
  state.screen = "run";
  state.modal = null;
  render();
}

function log(text) {
  if (!state.run) return;
  state.run.log.unshift(`<p>${text}</p>`);
  state.run.log = state.run.log.slice(0, 40);
}

function applyTreasureMonthStart() {
  const r = state.run;
  if (r.treasure.effect === "monthRecover") {
    r.hp = Math.min(r.stats.hp, r.hp + 30);
    r.qi = Math.min(r.stats.qi, r.qi + 30);
  }
  if (r.traits.includes("clearMind")) r.ap += 10;
}

function refreshEvents() {
  const pool = makeEventPool();
  state.run.events = sample(pool, 3);
}

function refillOneEvent() {
  const pool = makeEventPool().filter(e => !state.run.events.some(x => x.id === e.id));
  if (pool.length) state.run.events.push(rand(pool));
}

function makeEventPool() {
  const r = state.run;
  const monthAbs = (r.year - 1) * 12 + r.month;
  const enemies = DATA.enemies.filter((_, i) => i <= Math.floor(monthAbs / 8));
  return [
    { id: "trainNei", name: "练习吐纳", type: "training", icon: "🧘", desc: "内力上限提升25。", apply: () => { r.stats.qi += 25; r.qi += 25; log("练习吐纳，内力上限提升25。"); } },
    { id: "body", name: "增强体质", type: "training", icon: "🥋", desc: "最大血量提升25。", apply: () => { r.stats.hp += 25; r.hp += 25; log("锤炼筋骨，最大血量提升25。"); } },
    { id: "agility", name: "敏捷训练", type: "training", icon: "✦", desc: "闪避提升1。", apply: () => { r.stats.dodge += 1; log("身法轻灵，闪避提升1。"); } },
    { id: "money", name: "押镖", type: "reward", icon: "🚚", desc: "获得160金钱。", apply: () => { r.money += 160; log("完成押镖，获得160金钱。"); } },
    { id: "merchant", name: "武林商人", type: "merchant", icon: "🧑‍🌾", desc: "打开商人，购买道具。", apply: () => openMerchant() },
    { id: "duel", name: rand(enemies).name, type: "battle", icon: "⚔", desc: "遭遇敌人，胜利后获得金钱和武学阅历。", apply: () => startBattle(rand(enemies)) }
  ];
}

function chooseEvent(eventId) {
  const r = state.run;
  const event = r.events.find(e => e.id === eventId);
  if (!event || r.eventRemaining <= 0) return;
  r.eventRemaining--;
  r.events = r.events.filter(e => e.id !== eventId);
  event.apply();
  if (event.type !== "merchant" && event.type !== "battle") {
    if (r.eventRemaining > 0) refillOneEvent();
    if (r.eventRemaining === 0) log("本月随机事件已处理完。");
    state.modal = null;
  }
  render();
}

function endMonth() {
  const r = state.run;
  r.month++;
  if (r.month > 12) {
    r.month = 1;
    r.year++;
  }
  r.ap = r.maxAp;
  r.eventRemaining = 3;
  if ([4, 8, 12].includes(r.month)) {
    r.manuals = sample(DATA.manuals, 3);
    log("传武堂刷新了新的秘籍。");
  }
  applyTreasureMonthStart();
  refreshEvents();
  log(`进入第${r.year}年${r.month}月。`);
  state.modal = null;
  render();
}

function spendAp(cost) {
  if (state.run.ap < cost) {
    showToast("行动力不足");
    return false;
  }
  state.run.ap -= cost;
  return true;
}

function trainStat(kind) {
  if (kind === "strategy") {
    chooseStrategy();
    return;
  }
  if (!spendAp(25)) return;
  const r = state.run;
  if (kind === "atk") {
    r.stats.atk += 3;
    log("修炼拳脚，攻击提升3。");
  } else if (kind === "def") {
    r.stats.def += 3;
    log("扎马步，防御提升3。");
  } else if (kind === "hp") {
    r.stats.hp += 20;
    r.hp += 20;
    log("强健体魄，最大血量提升20。");
  }
  gainExp(35);
  render();
}

function trainSkill(skillId) {
  if (!spendAp(25)) return;
  const r = state.run;
  const skill = DATA.skills[skillId];
  r.skillProgress[skillId] = (r.skillProgress[skillId] || 0) + 1;
  log(`修炼${skill.name}，进度 ${r.skillProgress[skillId]}/${skill.train}。`);
  if (r.skillProgress[skillId] >= skill.train && !r.skills.includes(skillId)) {
    r.skills.push(skillId);
    r.trainingSkills = r.trainingSkills.filter(id => id !== skillId);
    log(`习得招式：${skill.name}。`);
  }
  gainExp(50);
  render();
}

function gainExp(amount) {
  const r = state.run;
  r.martialExp += amount;
  const need = r.level * 140;
  if (r.martialExp >= need) {
    r.martialExp -= need;
    r.level++;
    r.rankStars++;
    openReward();
  }
}

function buyManual(skillId) {
  const r = state.run;
  const price = r.treasure.effect === "moreAp" ? 270 : 300;
  if (r.money < price) {
    showToast("金钱不足");
    return;
  }
  if (r.trainingSkills.includes(skillId) || r.skills.includes(skillId)) {
    showToast("已经拥有");
    return;
  }
  r.money -= price;
  r.trainingSkills.push(skillId);
  log(`在传武堂购买秘籍《${DATA.skills[skillId].name}》。`);
  render();
}

function chooseStrategy() {
  if (!spendAp(3)) return;
  state.modal = { type: "strategyChoice", options: sample(DATA.strategies, 3) };
  render();
}

function takeStrategy(id) {
  const strategy = DATA.strategies.find(s => s.id === id);
  state.run.strategies.push(id);
  log(`获得计略：${strategy.name}。`);
  state.modal = null;
  render();
}

function mergeStrategies() {
  const r = state.run;
  if (r.strategies.length < 2) {
    showToast("至少需要两个计略");
    return;
  }
  const a = r.strategies.shift();
  const b = r.strategies.shift();
  const ar = DATA.strategies.find(s => s.id === a).rarity;
  const br = DATA.strategies.find(s => s.id === b).rarity;
  const nextRarity = Math.min(2, Math.max(ar, br) + (ar === br ? 1 : 0));
  const candidates = DATA.strategies.filter(s => s.rarity === nextRarity);
  const got = rand(candidates);
  r.strategies.push(got.id);
  log(`融合计略，获得${got.name}。`);
  render();
}

function openReward() {
  const pool = [
    ...sample(DATA.traits, 1).map(x => ({ kind: "trait", data: x })),
    ...sample(DATA.strategies, 2).map(x => ({ kind: "strategy", data: x }))
  ];
  state.modal = { type: "reward", options: pool };
}

function takeReward(index) {
  const option = state.modal.options[index];
  if (option.kind === "trait") {
    state.run.traits.push(option.data.id);
    log(`突破奖励：获得特性${option.data.name}。`);
  } else {
    state.run.strategies.push(option.data.id);
    log(`突破奖励：获得计略${option.data.name}。`);
  }
  state.modal = null;
  render();
}

function openMerchant() {
  state.modal = { type: "merchant" };
}

function buyItem(id) {
  const r = state.run;
  const item = DATA.items[id];
  let price = item.price;
  if (r.traits.includes("merchantFriend")) price = Math.floor(price * 0.85);
  if (r.money < price) {
    showToast("金钱不足");
    return;
  }
  r.money -= price;
  r.items.push(id);
  log(`购买道具：${item.name}。`);
  render();
}

function closeMerchantAfterEvent() {
  const r = state.run;
  if (r.eventRemaining > 0) refillOneEvent();
  state.modal = null;
  render();
}

function startBattle(enemyTemplate) {
  const r = state.run;
  const enemyStats = clone(enemyTemplate);
  const pStats = clone(r.stats);
  let items = [...r.items];
  if (r.treasure.effect === "battleDart") items.push("dart");
  if (r.treasure.effect === "moneyAtk") pStats.atk += 10;
  if (r.strategies.includes("firstStrike")) pStats.atk += 40;
  if (r.traits.includes("swift")) {
    pStats.speed += 0.25;
    pStats.dodge += 4;
  }
  if (r.traits.includes("tough")) {
    pStats.hp += 80;
    pStats.def += 10;
  }

  state.battle = {
    player: {
      name: r.character.name,
      icon: r.character.icon,
      stats: pStats,
      hp: Math.min(r.hp, pStats.hp),
      qi: Math.min(r.qi, pStats.qi),
      gauge: 0,
      skills: [...r.skills],
      items,
      cooldowns: {},
      auto: false,
      poison: 0,
      guard: 0
    },
    enemy: {
      name: enemyTemplate.name,
      icon: enemyTemplate.icon,
      stats: enemyStats,
      hp: enemyStats.hp,
      qi: enemyStats.qi,
      gauge: 0,
      skills: ["enemyAttack"],
      cooldowns: {},
      poison: 0,
      guard: 0
    },
    phase: "running",
    actor: null,
    log: [`${r.character.name}遭遇${enemyTemplate.name}。`],
    speed: 3
  };
  state.modal = null;
  state.screen = "battle";
  render();
}

let battleTimer = null;
function ensureBattleTimer() {
  if (battleTimer) return;
  battleTimer = setInterval(() => {
    if (state.screen !== "battle" || !state.battle || state.battle.phase !== "running") return;
    tickBattle(0.08);
  }, 80);
}

function tickBattle(dt) {
  const b = state.battle;
  const p = b.player;
  const e = b.enemy;
  p.gauge += p.stats.speed * dt * 24;
  e.gauge += e.stats.speed * dt * 24;
  if (p.gauge >= 100) {
    p.gauge = 100;
    b.actor = "player";
    b.phase = p.auto ? "autoPlayer" : "waitPlayer";
  } else if (e.gauge >= 100) {
    e.gauge = 100;
    b.actor = "enemy";
    b.phase = "enemyAction";
  }
  render();
  if (b.phase === "enemyAction") setTimeout(enemyAction, 300);
  if (b.phase === "autoPlayer") setTimeout(autoPlayerAction, 260);
}

function battleLog(text) {
  state.battle.log.unshift(text);
  state.battle.log = state.battle.log.slice(0, 20);
}

function calcDamage(actor, target, skill) {
  let dmg = Math.max(1, skill.power + actor.stats.atk - target.stats.def);
  if (state.run.strategies.includes("duelFocus") && actor === state.battle.player && actor.hp / actor.stats.hp < 0.5) {
    dmg = Math.floor(dmg * 1.2);
  }
  if (Math.random() * 100 < actor.stats.crit) {
    dmg = Math.floor(dmg * actor.stats.critDmg / 100);
    battleLog("暴击！");
  }
  if (target.guard) dmg = Math.floor(dmg * 0.55);
  return dmg;
}

function useSkill(skillId) {
  const b = state.battle;
  if (b.phase !== "waitPlayer" && b.phase !== "autoPlayer") return;
  const p = b.player;
  const skill = DATA.skills[skillId];
  if (!skill) return;
  if ((p.cooldowns[skillId] || 0) > 0) {
    showToast("招式冷却中");
    return;
  }
  if (p.qi < skill.qi) {
    showToast("内力不足");
    return;
  }
  p.qi -= skill.qi;
  p.cooldowns[skillId] = skill.cd;
  if (skillId === "guard") {
    p.guard = 1;
    battleLog(`${p.name}施展守护，防御提升。`);
  } else if (skillId === "innerSurge") {
    p.qi = Math.min(p.stats.qi, p.qi + 120);
    p.stats.atk += 12;
    battleLog(`${p.name}运起天罡斗气，攻击提升。`);
  } else {
    const dmg = calcDamage(p, b.enemy, skill);
    b.enemy.hp = Math.max(0, b.enemy.hp - dmg);
    if (skillId === "windPalm") b.enemy.poison += 2;
    if (skillId === "quickSlash") p.stats.speed += 0.05;
    battleLog(`${p.name}施展${skill.name}，造成${dmg}伤害。`);
  }
  endActorTurn(p);
}

function useItem(itemId) {
  const b = state.battle;
  if (b.phase !== "waitPlayer" && b.phase !== "autoPlayer") return;
  const p = b.player;
  const idx = p.items.indexOf(itemId);
  if (idx < 0) return;
  p.items.splice(idx, 1);
  if (itemId === "pill") {
    let heal = 120;
    if (state.run.strategies.includes("healBoost")) heal = Math.floor(heal * 1.25);
    if (state.run.treasure.effect === "healPlus") heal = Math.floor(heal * 1.2);
    p.hp = Math.min(p.stats.hp, p.hp + heal);
    battleLog(`${p.name}使用金疮药，恢复${heal}血量。`);
  } else if (itemId === "qiWine") {
    p.qi = Math.min(p.stats.qi, p.qi + 120);
    battleLog(`${p.name}饮下回气酒，恢复120内力。`);
  } else if (itemId === "dart") {
    b.enemy.hp = Math.max(0, b.enemy.hp - 100);
    battleLog(`${p.name}掷出飞镖，造成100伤害。`);
  }
  endActorTurn(p);
}

function restAction() {
  const p = state.battle.player;
  let heal = 40;
  let qi = 60;
  if (state.run.traits.includes("breath") || state.run.strategies.includes("vigor")) {
    heal += 80;
    qi += 80;
  }
  p.hp = Math.min(p.stats.hp, p.hp + heal);
  p.qi = Math.min(p.stats.qi, p.qi + qi);
  battleLog(`${p.name}调息，恢复${heal}血量和${qi}内力。`);
  endActorTurn(p);
}

function autoPlayerAction() {
  const p = state.battle.player;
  if (p.hp / p.stats.hp < 0.35 && p.items.includes("pill")) return useItem("pill");
  const usable = p.skills.map(id => DATA.skills[id]).filter(s => p.qi >= s.qi && (p.cooldowns[s.id] || 0) <= 0);
  if (usable.length) return useSkill(usable.sort((a, b) => b.power - a.power)[0].id);
  restAction();
}

function enemyAction() {
  const b = state.battle;
  const e = b.enemy;
  const p = b.player;
  const hitChance = Math.max(20, 85 + e.stats.hit - p.stats.dodge * 5);
  if (Math.random() * 100 > hitChance) {
    battleLog(`${e.name}的攻击被闪开了。`);
  } else {
    let dmg = Math.max(1, e.stats.atk + 35 - p.stats.def);
    if (p.guard) dmg = Math.floor(dmg * 0.55);
    p.hp = Math.max(0, p.hp - dmg);
    battleLog(`${e.name}出手，造成${dmg}伤害。`);
  }
  endActorTurn(e);
}

function endActorTurn(actor) {
  const b = state.battle;
  Object.keys(actor.cooldowns).forEach(id => {
    actor.cooldowns[id] = Math.max(0, actor.cooldowns[id] - 1);
  });
  if (actor.guard) actor.guard = 0;
  if (actor === b.player && b.enemy.poison > 0) {
    const poisonDmg = b.enemy.poison * 8;
    b.enemy.hp = Math.max(0, b.enemy.hp - poisonDmg);
    battleLog(`风毒发作，${b.enemy.name}受到${poisonDmg}伤害。`);
    if (state.run.strategies.includes("poisonBurst") && b.enemy.poison >= 4) {
      const burst = b.enemy.poison * 20;
      b.enemy.hp = Math.max(0, b.enemy.hp - burst);
      battleLog(`毒爆触发，额外造成${burst}伤害。`);
    }
  }
  actor.gauge = 0;
  b.phase = "running";
  b.actor = null;
  checkBattleEnd();
  render();
}

function checkBattleEnd() {
  const b = state.battle;
  if (b.enemy.hp <= 0) {
    const r = state.run;
    r.hp = Math.max(1, b.player.hp);
    r.qi = Math.max(0, b.player.qi);
    r.items = b.player.items;
    r.money += 180;
    gainExp(120);
    log(`击败${b.enemy.name}，获得180金钱和120武学阅历。`);
    b.phase = "finished";
    state.screen = "run";
    state.battle = null;
    if (r.eventRemaining > 0) refillOneEvent();
  } else if (b.player.hp <= 0) {
    b.phase = "finished";
    state.screen = "gameover";
    state.battle = null;
  }
}

function toggleAuto() {
  state.battle.player.auto = !state.battle.player.auto;
  render();
}

function render() {
  const app = document.getElementById("app");
  app.innerHTML = "";
  if (state.screen === "menu") app.appendChild(renderMenu());
  if (state.screen === "select") app.appendChild(renderSelect());
  if (state.screen === "run") app.appendChild(renderRun());
  if (state.screen === "battle") app.appendChild(renderBattle());
  if (state.screen === "gameover") app.appendChild(renderGameOver());
  if (state.modal && state.screen !== "battle") app.appendChild(renderModal());
  if (state.toast) app.appendChild(el("div", "toast", state.toast));
  ensureBattleTimer();
}

function renderTopbar() {
  const r = state.run;
  const top = el("div", "topbar");
  top.innerHTML = `
    <div class="date">第${r.year}年·${r.month}月</div>
    <div class="ap-wrap"><div class="bolt">⚡</div>${bar(r.ap, r.maxAp, `${r.ap}/${r.maxAp}`)}</div>
    <div class="resource-row"><span>◎${r.money}</span><span>⚙</span></div>
  `;
  return top;
}

function renderMenu() {
  const root = el("div", "main-menu");
  root.innerHTML = `
    <div>
      <div class="title">小小侠客</div>
      <div class="subtitle">网页版原型</div>
      <div class="menu-panel">
        <button class="btn" data-act="start">开始</button>
        <button class="btn secondary">商店</button>
        <button class="btn secondary">设置</button>
      </div>
    </div>
  `;
  root.querySelector("[data-act=start]").onclick = () => {
    state.screen = "select";
    state.selectedCharacter = DATA.characters[0].id;
    state.selectedTreasure = DATA.treasures[0].id;
    render();
  };
  return root;
}

function renderSelect() {
  const screen = el("div", "screen select-layout");
  const left = el("div", "panel");
  left.style.padding = "18px";
  left.innerHTML = `<h2 class="section-title">选择你的角色</h2><div class="cards"></div>`;
  const charCards = left.querySelector(".cards");
  DATA.characters.forEach(c => {
    const card = el("div", `card ${state.selectedCharacter === c.id ? "selected" : ""}`);
    card.innerHTML = `
      <div class="portrait">${c.icon}</div>
      <div class="name">${c.name}</div>
      <div class="desc">${c.desc}</div>
    `;
    card.onclick = () => { state.selectedCharacter = c.id; render(); };
    charCards.appendChild(card);
  });

  const selected = DATA.characters.find(c => c.id === state.selectedCharacter);
  const right = el("div", "panel");
  right.style.padding = "18px";
  right.innerHTML = `
    <h2 class="section-title">${selected.name}</h2>
    <div class="portrait">${selected.icon}</div>
    <div class="desc">${selected.trait}</div>
    <div class="stats-grid">${Object.entries(selected.apt).map(([k,v]) => `<div class="stat-line"><span>${k}</span><b>${v}</b></div>`).join("")}</div>
    <h3>携带宝物</h3>
    <div class="cards treasure-cards"></div>
    <button class="btn green" style="width:100%;margin-top:14px">下一步</button>
  `;
  const treasures = right.querySelector(".treasure-cards");
  DATA.treasures.forEach(t => {
    const card = el("div", `card ${state.selectedTreasure === t.id ? "selected" : ""}`);
    card.innerHTML = `<div class="portrait">${t.icon}</div><div class="name">${t.name}</div><div class="desc">${t.desc}</div>`;
    card.onclick = () => { state.selectedTreasure = t.id; render(); };
    treasures.appendChild(card);
  });
  right.querySelector("button").onclick = startRun;
  screen.append(left, right);
  return screen;
}

function renderRun() {
  const root = el("div");
  root.appendChild(renderTopbar());
  const screen = el("div", "screen run-layout");
  screen.innerHTML = `
    <div class="left-nav">
      <div class="nav-tile" data-modal="character">角色</div>
      <div class="nav-tile" data-modal="backpack">背包</div>
      <div class="nav-tile" data-modal="goals">目标</div>
    </div>
    <div class="center-stage">
      <div class="hero-status">
        <div class="rank-box">${state.run.character.faction}<br>${"★".repeat(Math.min(8, state.run.rankStars))}</div>
        <div>
          <div class="mini-stats">
            <div class="stat-line"><span>攻击</span><b>${state.run.stats.atk}</b></div>
            <div class="stat-line"><span>防御</span><b>${state.run.stats.def}</b></div>
            <div class="stat-line"><span>命中</span><b>${state.run.stats.hit}</b></div>
            <div class="stat-line"><span>闪避</span><b>${state.run.stats.dodge}</b></div>
          </div>
          ${bar(state.run.hp, state.run.stats.hp, `${state.run.hp}/${state.run.stats.hp}`)}
        </div>
      </div>
      <div class="bottom-actions">
        <div class="action-card" data-modal="events">奇遇<br>${state.run.eventRemaining}/3</div>
        <div class="action-card" data-modal="training">修炼</div>
        <div class="action-card" data-modal="hall">传武堂</div>
        <div class="action-card" data-modal="strategy">谋划</div>
        <div class="action-card" data-action="next">下回合</div>
      </div>
    </div>
    <div class="panel side-panel"><div class="log">${state.run.log.join("")}</div></div>
  `;
  screen.querySelectorAll("[data-modal]").forEach(node => {
    node.onclick = () => { state.modal = { type: node.dataset.modal }; render(); };
  });
  screen.querySelector("[data-action=next]").onclick = endMonth;
  root.appendChild(screen);
  return root;
}

function renderModal() {
  const back = el("div", "modal-backdrop");
  const modal = el("div", "modal");
  const close = `<button class="btn red small" data-close>关闭</button>`;
  if (state.modal.type === "events") {
    modal.innerHTML = `<div class="modal-head"><h2 class="modal-title">每月随机事件</h2>${close}</div><div class="event-count">可参与事件数：${state.run.eventRemaining}</div><div class="event-grid"></div>`;
    const grid = modal.querySelector(".event-grid");
    state.run.events.forEach(e => {
      const card = el("div", "event-card");
      card.innerHTML = `<h3>${e.name}</h3><div class="event-art">${e.icon}</div><p>${e.desc}</p><button class="btn green">选择</button>`;
      card.querySelector("button").disabled = state.run.eventRemaining <= 0;
      card.querySelector("button").onclick = () => chooseEvent(e.id);
      grid.appendChild(card);
    });
  }
  if (state.modal.type === "character") {
    const r = state.run;
    const skillNames = r.skills.map(id => DATA.skills[id].name).join("、") || "无";
    const strategyNames = r.strategies.map(id => DATA.strategies.find(s => s.id === id).name).join("、") || "无";
    const traitNames = r.traits.map(id => {
      const trait = DATA.traits.find(t => t.id === id);
      return trait ? trait.name : id;
    }).join("、") || "无";
    modal.innerHTML = `
      <div class="modal-head"><h2 class="modal-title">角色属性</h2>${close}</div>
      <div class="character-sheet">
        <div>
          <div class="portrait">${r.character.icon}</div>
          <div class="name">${r.character.name}</div>
          <div class="desc">${r.character.faction} · ${"★".repeat(Math.min(8, r.rankStars))}</div>
        </div>
        <div>
          <div class="stats-grid">
            <div class="stat-line"><span>血量</span><b>${r.hp}/${r.stats.hp}</b></div>
            <div class="stat-line"><span>内力</span><b>${r.qi}/${r.stats.qi}</b></div>
            <div class="stat-line"><span>攻击</span><b>${r.stats.atk}</b></div>
            <div class="stat-line"><span>防御</span><b>${r.stats.def}</b></div>
            <div class="stat-line"><span>命中</span><b>${r.stats.hit}</b></div>
            <div class="stat-line"><span>闪避</span><b>${r.stats.dodge}</b></div>
            <div class="stat-line"><span>暴击</span><b>${r.stats.crit}%</b></div>
            <div class="stat-line"><span>出手速度</span><b>${r.stats.speed}</b></div>
          </div>
          <h3>招式</h3><p>${skillNames}</p>
          <h3>计略</h3><p>${strategyNames}</p>
          <h3>特性</h3><p>${traitNames}</p>
          <h3>携带宝物</h3><p>${r.treasure.icon} ${r.treasure.name}：${r.treasure.desc}</p>
        </div>
      </div>
    `;
  }
  if (state.modal.type === "backpack") {
    const counts = state.run.items.reduce((map, id) => {
      map[id] = (map[id] || 0) + 1;
      return map;
    }, {});
    modal.innerHTML = `
      <div class="modal-head"><h2 class="modal-title">背包</h2>${close}</div>
      <div class="inventory-summary">
        <div class="inventory-chip">金钱：${state.run.money}◎</div>
        <div class="inventory-chip">道具数量：${state.run.items.length}</div>
      </div>
      <div class="list"></div>
    `;
    const list = modal.querySelector(".list");
    if (!state.run.items.length) list.innerHTML = "<p>背包里暂时没有道具。可在随机事件“武林商人”处购买。</p>";
    Object.entries(counts).forEach(([id, count]) => {
      const item = DATA.items[id];
      list.appendChild(rowCard(item.icon, `${item.name} ×${count}`, item.desc, "战斗中使用", () => {}));
    });
  }
  if (state.modal.type === "goals") {
    const r = state.run;
    const currentMonth = (r.year - 1) * 12 + r.month;
    const progress = Math.min(100, Math.floor(currentMonth / r.finalBossMonth * 100));
    modal.innerHTML = `
      <div class="modal-head"><h2 class="modal-title">本局目标</h2>${close}</div>
      <div class="goal-panel">
        <div class="boss-portrait">${r.finalBoss.icon}</div>
        <div>
          <h2>最终目标：击败${r.finalBoss.name}</h2>
          <p>江湖深处的强敌正在等待。请在第3年12月前完成修炼与构筑，迎接最终决战。</p>
          <div class="stats-grid">
            <div class="stat-line"><span>预计血量</span><b>${r.finalBoss.hp}</b></div>
            <div class="stat-line"><span>预计攻击</span><b>${r.finalBoss.atk}</b></div>
            <div class="stat-line"><span>预计防御</span><b>${r.finalBoss.def}</b></div>
            <div class="stat-line"><span>预计速度</span><b>${r.finalBoss.speed}</b></div>
          </div>
          <div class="goal-progress">${bar(currentMonth, r.finalBossMonth, `江湖进度 ${progress}%`)}</div>
        </div>
      </div>
    `;
  }
  if (state.modal.type === "training") {
    modal.innerHTML = `<div class="modal-head"><h2 class="modal-title">修炼技能</h2>${close}</div><div class="list"></div>`;
    const list = modal.querySelector(".list");
    [
      { id: "atk", title: "傅卧撑", meta: "攻击+3，武学阅历+35", icon: "✊", action: () => trainStat("atk") },
      { id: "def", title: "站桩功", meta: "防御+3，武学阅历+35", icon: "🥋", action: () => trainStat("def") },
      { id: "hp", title: "扎马步", meta: "血量上限+20，武学阅历+35", icon: "🛡", action: () => trainStat("hp") },
      { id: "strategy", title: "运筹", meta: "消耗3行动点，获得三选一计略", icon: "📜", action: () => trainStat("strategy") }
    ].forEach(x => list.appendChild(rowCard(x.icon, x.title, x.meta, "可修炼", x.action)));
    state.run.trainingSkills.forEach(id => {
      const s = DATA.skills[id];
      list.appendChild(rowCard(s.icon, s.name, `${s.desc} 进度 ${state.run.skillProgress[id] || 0}/${s.train}`, "修炼", () => trainSkill(id)));
    });
  }
  if (state.modal.type === "hall") {
    modal.innerHTML = `<div class="modal-head"><h2 class="modal-title">传武堂</h2>${close}</div><div class="list"></div><p class="desc">每年4月/8月/12月刷新传授内容。</p>`;
    const list = modal.querySelector(".list");
    state.run.manuals.forEach(id => {
      const s = DATA.skills[id];
      list.appendChild(rowCard(s.icon, `《${s.name}》`, `${s.desc} 修炼次数：${s.train}`, "300◎", () => buyManual(id)));
    });
  }
  if (state.modal.type === "strategy") {
    modal.innerHTML = `<div class="modal-head"><h2 class="modal-title">谋划</h2>${close}</div><div class="list"></div><button class="btn green" style="margin-top:14px" data-merge>融合前两个计略</button>`;
    const list = modal.querySelector(".list");
    if (!state.run.strategies.length) list.innerHTML = `<p>暂无计略。可通过修炼“运筹”或突破奖励获得。</p>`;
    state.run.strategies.forEach(id => {
      const s = DATA.strategies.find(x => x.id === id);
      list.appendChild(rowCard("📘", s.name, s.desc, `品质${s.rarity}`, () => {}));
    });
    modal.querySelector("[data-merge]").onclick = mergeStrategies;
  }
  if (state.modal.type === "strategyChoice") {
    modal.innerHTML = `<h2 class="section-title">选择你的计略</h2><div class="reward-grid"></div>`;
    const grid = modal.querySelector(".reward-grid");
    state.modal.options.forEach(s => {
      const card = el("div", "event-card");
      card.innerHTML = `<h3>${s.name}</h3><div class="event-art">📘</div><p>${s.desc}</p><button class="btn green">选择</button>`;
      card.querySelector("button").onclick = () => takeStrategy(s.id);
      grid.appendChild(card);
    });
  }
  if (state.modal.type === "reward") {
    modal.innerHTML = `<h2 class="section-title">请选择突破奖励</h2><div class="reward-grid"></div>`;
    const grid = modal.querySelector(".reward-grid");
    state.modal.options.forEach((opt, index) => {
      const card = el("div", "event-card");
      card.innerHTML = `<h3>${opt.data.name}</h3><div class="event-art">${opt.kind === "trait" ? "🔰" : "📘"}</div><p>${opt.data.desc}</p><button class="btn green">选择</button>`;
      card.querySelector("button").onclick = () => takeReward(index);
      grid.appendChild(card);
    });
  }
  if (state.modal.type === "merchant") {
    modal.innerHTML = `<div class="modal-head"><h2 class="modal-title">武林商人</h2><button class="btn red small" data-done>离开</button></div><div class="list"></div>`;
    const list = modal.querySelector(".list");
    Object.values(DATA.items).forEach(item => {
      list.appendChild(rowCard(item.icon, item.name, item.desc, `${item.price}◎`, () => buyItem(item.id)));
    });
    modal.querySelector("[data-done]").onclick = closeMerchantAfterEvent;
  }
  const closeBtn = modal.querySelector("[data-close]");
  if (closeBtn) closeBtn.onclick = () => { state.modal = null; render(); };
  back.appendChild(modal);
  return back;
}

function renderBattle() {
  const b = state.battle;
  const root = el("div", "battle-screen");
  root.innerHTML = `
    <div class="battle-top">
      ${fighterPanel(b.player)}
      <div class="gauge-lane">
        <div class="gauge-dot" style="left:${b.player.gauge}%">${b.player.icon}</div>
        <div class="gauge-dot" style="left:${b.enemy.gauge}%">${b.enemy.icon}</div>
        <div class="speed-label">速度x${b.speed}</div>
      </div>
      ${fighterPanel(b.enemy)}
    </div>
    <div class="fighter player">${b.player.icon}</div>
    <div class="fighter enemy">${b.enemy.icon}</div>
    <div class="battle-bottom">
      <div class="battle-tools">
        <button class="btn ${b.player.auto ? "green" : "secondary"}" data-auto>自动战斗</button>
        <button class="btn secondary" data-rest>调息</button>
      </div>
      <div class="skill-row"></div>
      <div class="battle-log">${b.log.map(x => `<div>${x}</div>`).join("")}</div>
    </div>
  `;
  const skillRow = root.querySelector(".skill-row");
  b.player.skills.forEach(id => {
    const s = DATA.skills[id];
    const btn = el("button", "skill-btn");
    btn.disabled = b.phase !== "waitPlayer" || b.player.qi < s.qi || (b.player.cooldowns[id] || 0) > 0;
    btn.innerHTML = `<strong>${s.name}</strong><span>威力:${s.power} 内力:${s.qi}</span><br><span>CD:${b.player.cooldowns[id] || 0}</span>`;
    btn.onclick = () => useSkill(id);
    skillRow.appendChild(btn);
  });
  b.player.items.slice(0, 4).forEach(id => {
    const item = DATA.items[id];
    const btn = el("button", "skill-btn");
    btn.disabled = b.phase !== "waitPlayer";
    btn.innerHTML = `<strong>${item.name}</strong><span>${item.desc}</span>`;
    btn.onclick = () => useItem(id);
    skillRow.appendChild(btn);
  });
  root.querySelector("[data-auto]").onclick = toggleAuto;
  root.querySelector("[data-rest]").disabled = b.phase !== "waitPlayer";
  root.querySelector("[data-rest]").onclick = restAction;
  return root;
}

function renderGameOver() {
  const root = el("div", "main-menu");
  root.innerHTML = `<div class="menu-panel"><h2>江湖路断</h2><button class="btn" data-back>返回主菜单</button></div>`;
  root.querySelector("[data-back]").onclick = () => {
    state.screen = "menu";
    state.run = null;
    render();
  };
  return root;
}

function fighterPanel(unit) {
  return `
    <div class="fighter-panel">
      <div class="fighter-name">${unit.name}</div>
      ${bar(unit.hp, unit.stats.hp, `${Math.ceil(unit.hp)}/${unit.stats.hp}`, "hp-fill")}
      ${bar(unit.qi, unit.stats.qi, `${Math.ceil(unit.qi)}/${unit.stats.qi}`, "qi-fill")}
    </div>
  `;
}

function rowCard(icon, title, meta, button, action) {
  const row = el("div", "row-card");
  row.innerHTML = `<div class="icon-box">${icon}</div><div><div class="row-title">${title}</div><div class="row-meta">${meta}</div></div><button class="btn green small">${button}</button>`;
  row.querySelector("button").onclick = action;
  return row;
}

function bar(value, max, label, fillClass = "") {
  const pct = Math.max(0, Math.min(100, max ? value / max * 100 : 0));
  return `<div class="bar"><div class="bar-fill ${fillClass}" style="width:${pct}%"></div><div class="bar-label">${label}</div></div>`;
}

function el(tag, cls = "", html = "") {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (html) node.innerHTML = html;
  return node;
}

render();
