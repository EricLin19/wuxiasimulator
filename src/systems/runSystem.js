import { DATA, RARITIES, STAT_LABELS, STAT_KEYS } from "../data/content.js";
import { clone, rand, sample, monthAbs } from "../core/utils.js";
import { saveRun, saveMeta, clearRun } from "../core/save.js";

const COMBAT_SCHOOLS = ["blade", "hidden", "fist", "lightness"];
const ALL_SCHOOLS = ["blade", "hidden", "fist", "lightness"];
export const RANK_TITLES = ["喽啰", "外门弟子", "内门弟子", "精英弟子", "香主", "堂主", "护法", "长老", "副掌门", "代掌门", "掌门"];

export function createRun(characterId, treasureId, meta) {
  const character = DATA.characters.find(x => x.id === characterId);
  const treasure = DATA.treasures.find(x => x.id === treasureId);
  const stats = clone(character.stats);
  let money = 300 + meta.metaPoints * 20;
  let maxAp = 4;

  if (treasure.effect === "jadeGuard") {
    stats.hp += 90;
    stats.qi += 70;
  }
  if (character.traits.includes("orthodox")) {
    stats.hp += 50;
    stats.qi += 40;
  }
  applyMetaAllocations(stats, meta.allocations || {});

  const run = {
    id: Date.now(),
    year: 1,
    month: 1,
    maxAp,
    ap: maxAp,
    money,
    character,
    treasure,
    stats,
    hp: stats.hp,
    qi: stats.qi,
    martialExp: 0,
    level: 1,
    rankStars: 1,
    selectedSchool: null,
    equippedWeapon: null,
    skills: [...character.skills],
    activeSkills: character.skills.filter(id => DATA.skills[id]?.battle !== false).slice(0, 4),
    trainingSkills: [],
    skillProgress: {},
    strategyProgress: 0,
    strategies: [],
    activeStrategies: [],
    traits: [...character.traits],
    skillTraits: [],
    items: ["pill", "pill"],
    weapons: [],
    eventRemaining: 3,
    events: [],
    manuals: [],
    merchantStock: [],
    finalBoss: DATA.bosses.find(b => b.id === "finalBoss"),
    finalBossMonth: 36,
    yearlyBossDefeated: {},
    log: [],
    finished: false
  };

  refreshManuals(run);
  refreshMerchantStock(run);
  applyMonthStart(run);
  refreshEvents(run);
  reconcileStyleMasteries(run);
  log(run, `第${run.year}年${run.month}月，${character.name}携带${treasure.name}踏入江湖。`);
  saveRun(run);
  return run;
}

export function log(run, text) {
  run.log.unshift(`<p>${text}</p>`);
  run.log = run.log.slice(0, 100);
}

export function applyMonthStart(run) {
  run.ap = run.maxAp;
  if (run.traits.includes("clearMind")) run.ap += 1;
  if (run.treasure.effect === "monthRecover" || run.traits.includes("healer")) {
    const amount = run.treasure.effect === "monthRecover" ? 45 : 30;
    run.hp = Math.min(run.stats.hp, run.hp + amount);
    run.qi = Math.min(run.stats.qi, run.qi + amount);
  }
}

export function refreshEvents(run) {
  run.events = sample(makeEventPool(run), 3);
}

export function refreshManuals(run) {
  const available = getAvailableManuals(run).filter(id => !run.skills.includes(id) && !run.trainingSkills.includes(id));
  const manuals = [];
  if (run.selectedSchool) {
    const locked = available.filter(id => DATA.skills[id].school === run.selectedSchool);
    manuals.push(...sample(locked, 2));
    const otherSchools = ALL_SCHOOLS.filter(s => s !== run.selectedSchool);
    for (const school of sample(otherSchools, 2)) {
      const one = sample(available.filter(id => DATA.skills[id].school === school && !manuals.includes(id)), 1)[0];
      if (one) manuals.push(one);
    }
  } else {
    for (const school of ALL_SCHOOLS) {
      const one = sample(available.filter(id => DATA.skills[id].school === school && !manuals.includes(id)), 1)[0];
      if (one) manuals.push(one);
    }
  }
  while (manuals.length < 4) {
    const one = sample(available.filter(id => !manuals.includes(id)), 1)[0];
    if (!one) break;
    manuals.push(one);
  }
  run.manuals = manuals.slice(0, 4);
  refreshMerchantStock(run);
}

export function getAvailableManuals(run) {
  return DATA.manuals.filter(id => RARITIES[DATA.skills[id].rarity].year <= run.year);
}

export function refreshMerchantStock(run) {
  const rarity = run.year >= 3 ? "red" : run.year >= 2 ? "orange" : "blue";
  run.merchantStock = [
    { kind: "item", id: "qiWine" },
    { kind: "item", id: "pill" },
    { kind: "item", id: "statPill" }
  ];
  if (COMBAT_SCHOOLS.includes(run.selectedSchool)) {
    const weapon = Object.values(DATA.weapons).find(w => w.school === run.selectedSchool && w.rarity === rarity);
    if (weapon) run.merchantStock.unshift({ kind: "weapon", id: weapon.id });
  }
}

export function refillOneEvent(run) {
  const pool = makeEventPool(run).filter(e => !run.events.some(x => x.id === e.id));
  if (pool.length) run.events.push(rand(pool));
}

export function makeEventPool(run) {
  const maxRank = Math.min(4, 1 + Math.floor(monthAbs(run) / 8));
  const enemies = DATA.enemies.filter(e => e.rank <= maxRank);
  const moneyGain = scaleMoney(run, 160);
  const events = [
    eventStat("trainHp", "增强体质", "血量上限提升25。", "hp", 25),
    eventStat("trainQi", "练习吐纳", "内力上限提升25。", "qi", 25),
    eventStat("trainAtk", "木桩苦练", "攻击提升3。", "atk", 3),
    eventStat("trainDef", "扎马步", "防御提升3。", "def", 3),
    eventStat("trainCombo", "连环拆招", "连击提升2。", "combo", 2),
    eventStat("trainHit", "明目辨穴", "命中提升3。", "hit", 3),
    eventStat("trainDodge", "敏捷训练", "闪避提升1。", "dodge", 1),
    eventStat("trainCrit", "破绽观察", "暴击提升2。", "crit", 2),
    eventStat("trainSpeed", "轻身赶路", "出手速度提升0.04。", "speed", 0.04),
    { id: "money", name: "押镖", type: "reward", icon: "镖", desc: `获得${moneyGain}金钱。`, apply: ({ run }) => { run.money += moneyGain; log(run, `完成押镖，获得${moneyGain}金钱。`); } },
    { id: "escort", name: "护送商队", type: "reward", icon: "银", desc: `获得${scaleMoney(run, 240)}金钱。`, apply: ({ run }) => { const got = scaleMoney(run, 240); run.money += got; log(run, `护送商队，获得${got}金钱。`); } },
    { id: "bounty", name: "揭榜缉盗", type: "reward", icon: "榜", desc: `获得${scaleMoney(run, 200)}金钱和40经验。`, apply: ({ run }) => { const got = scaleMoney(run, 200); run.money += got; gainExp(run, 40); log(run, `揭榜缉盗，获得${got}金钱和40经验。`); } },
    { id: "ambush", name: "林中伏击", type: "battle", icon: "伏", desc: "遭遇埋伏，胜利后获得额外金钱。", apply: ({ startBattle }) => startBattle(rand(enemies)) },
    { id: "escortSave", name: "救下镖队", type: "reward", icon: "救", desc: `获得${scaleMoney(run, 260)}金钱和60经验。`, apply: ({ run }) => { const got = scaleMoney(run, 260); run.money += got; gainExp(run, 60); log(run, `救下镖队，获得${got}金钱和60经验。`); } },
    { id: "duelHall", name: "擂台切磋", type: "battle", icon: "擂", desc: "同道切磋，胜利后可获得更高经验。", apply: ({ startBattle }) => startBattle(rand(enemies)) },
    { id: "meditate", name: "吐纳疗伤", type: "reward", icon: "息", desc: "恢复30血量和30内力。", apply: ({ run }) => { run.hp = Math.min(run.stats.hp, run.hp + 30); run.qi = Math.min(run.stats.qi, run.qi + 30); log(run, "吐纳疗伤，恢复少量状态。"); } },
    { id: "duel", name: rand(enemies).name, type: "battle", icon: "战", desc: "遭遇敌人，胜利后获得金钱和武学阅历。", apply: ({ startBattle }) => startBattle(rand(enemies)) }
  ];
  return events;
}

function eventStat(id, name, desc, key, value) {
  return {
    id,
    name,
    type: "training",
    icon: STAT_LABELS[key][0],
    desc,
    apply: ({ run }) => {
      run.stats[key] = Number(((run.stats[key] || 0) + value).toFixed(2));
      if (key === "hp") run.hp += value;
      if (key === "qi") run.qi += value;
      log(run, `${name}，${STAT_LABELS[key]}提升${value}。`);
    }
  };
}

export function scaleMoney(run, amount) {
  let value = amount;
  if (run.treasure?.effect === "moneyBoost") value *= 1.18;
  if (run.traits?.includes("wanderer")) value *= 1.08;
  return Math.floor(value);
}

export function resolveEvent(run, eventId, actions) {
  const event = run.events.find(e => e.id === eventId);
  if (!event || run.eventRemaining <= 0) return false;
  run.eventRemaining--;
  run.events = run.events.filter(e => e.id !== eventId);
  event.apply({ run, ...actions });
  if (event.type !== "merchant" && event.type !== "battle") {
    if (run.eventRemaining > 0) refillOneEvent(run);
    if (run.eventRemaining === 0) log(run, "本月随机事件已处理完。");
  }
  saveRun(run);
  return true;
}

export function finishDeferredEvent(run) {
  if (run.eventRemaining > 0) refillOneEvent(run);
  saveRun(run);
}

export function endMonth(run, startBoss) {
  if (run.month === 12 && !run.yearlyBossDefeated[run.year]) {
    const boss = DATA.bosses.find(b => b.year === run.year);
    if (boss) {
      log(run, `第${run.year}年年末，${boss.name}前来挑战。`);
      startBoss(boss, true);
      return;
    }
  }
  run.month++;
  if (run.month > 12) {
    run.month = 1;
    run.year++;
  }
  run.eventRemaining = 3;
  if ([1, 4, 7, 10].includes(run.month)) {
    refreshManuals(run);
    log(run, "传武堂刷新了4本秘籍。");
  }
  applyMonthStart(run);
  refreshEvents(run);
  log(run, `进入第${run.year}年${run.month}月。`);
  saveRun(run);
}

export function spendAp(run, cost) {
  if (run.ap < cost) return false;
  run.ap -= cost;
  saveRun(run);
  return true;
}

export function trainStat(run, kind) {
  if (!spendAp(run, 1)) return { ok: false, message: "行动力不足" };
  const gains = { atk: 3, def: 3, hp: 60, qi: 20 };
  run.stats[kind] += gains[kind] || 0;
  if (kind === "hp") run.hp += gains[kind];
  if (kind === "qi") run.qi += gains[kind];
  log(run, `修炼基础功，${STAT_LABELS[kind]}提升${gains[kind]}。`);
  gainExp(run, 35);
  saveRun(run);
  return { ok: true };
}

export function trainSkill(run, skillId) {
  const skill = DATA.skills[skillId];
  if (!spendAp(run, 1)) return { ok: false, message: "行动力不足" };
  run.skillProgress[skillId] = (run.skillProgress[skillId] || 0) + 1;
  log(run, `修炼${skill.name}，进度 ${run.skillProgress[skillId]}/${skill.train}。`);
  if (run.skillProgress[skillId] >= skill.train && !run.skills.includes(skillId)) {
    run.skills.push(skillId);
    applySkillCompletion(run, skill);
    if (skill.battle !== false) addActiveSkillInOrder(run, skillId);
    run.trainingSkills = run.trainingSkills.filter(id => id !== skillId);
    log(run, `秘籍修成：《${skill.name}》。`);
  }
  gainExp(run, run.treasure.effect === "manualMastery" ? 80 : 50);
  saveRun(run);
  return { ok: true };
}

export function trainStrategy(run) {
  if (!spendAp(run, 1)) return { ok: false, message: "行动力不足" };
  run.strategyProgress = (run.strategyProgress || 0) + 1;
  gainExp(run, 25);
  log(run, `推演计略，进度 ${run.strategyProgress}/3。`);
  if (run.strategyProgress >= 3) {
    run.strategyProgress = 0;
    saveRun(run);
    return { ok: true, ready: true };
  }
  saveRun(run);
  return { ok: true, ready: false };
}

function applySkillCompletion(run, skill) {
  for (const [key, value] of Object.entries(skill.statGain || {})) {
    run.stats[key] = Number(((run.stats[key] || 0) + value).toFixed(2));
  }
  run.skillTraits ||= [];
  reconcileStyleMasteries(run);
  if (!run.selectedSchool) {
    run.selectedSchool = skill.school;
    refreshManuals(run);
    log(run, `流派确定：${DATA.skills[skill.id].school}。武林商人开始出售对应装备。`);
  }
}

function reconcileStyleMasteries(run) {
  run.skillTraits ||= [];
  for (const [style, set] of Object.entries(DATA.styleSkillSets || {})) {
    const trait = DATA.styleTraits?.[style];
    if (!trait) continue;
    const required = ["basic", "advanced", "ultimate"].map(tier => set[tier]).filter(Boolean);
    if (required.length !== 3) continue;
    if (!required.every(id => run.skills.includes(id))) continue;
    if (run.skillTraits.some(t => t.id === trait.id)) continue;
    run.skillTraits.push(trait);
    log(run, `${trait.name}贯通，习得路线特性：${trait.desc}`);
  }
}

export function buyManual(run, skillId) {
  const skill = DATA.skills[skillId];
  const price = Math.floor((skill.rarity === "red" ? 900 : skill.rarity === "orange" ? 520 : 300) * (run.treasure.effect === "manualMastery" ? 0.82 : 1));
  if (run.money < price) return { ok: false, message: "金钱不足" };
  if (run.trainingSkills.includes(skillId) || run.skills.includes(skillId)) return { ok: false, message: "已经拥有" };
  run.money -= price;
  run.trainingSkills.push(skillId);
  log(run, `在传武堂购买秘籍《${skill.name}》。`);
  saveRun(run);
  return { ok: true };
}

export function gainExp(run, amount) {
  let gained = amount;
  if (run.treasure?.effect === "expBoost") gained = Math.floor(gained * 1.12);
  if (run.traits?.includes("orthodox")) gained = Math.floor(gained * 1.08);
  if (run.traits?.includes("constable")) gained += 8;
  run.martialExp += gained;
  let leveled = false;
  while (run.martialExp >= expNeed(run.level)) {
    const need = expNeed(run.level);
    run.martialExp -= need;
    run.level++;
    run.rankStars++;
    run.stats.hp += 90;
    run.stats.qi += 20;
    run.stats.atk += 3;
    run.stats.def += 2;
    run.hp += 90;
    run.qi += 20;
    log(run, `地位提升为${getRankTitle(run)}，血量+90，内力+20，攻击+3，防御+2。`);
    leveled = true;
  }
  return leveled;
}

export function expNeed(level) {
  return Math.floor(120 + level * level * 42 + level * 38);
}

export function getRankTitle(run) {
  return RANK_TITLES[Math.min(RANK_TITLES.length - 1, Math.max(0, run.level - 1))];
}

export function buildStrategyChoices(run) {
  const available = DATA.strategies.filter(s => RARITIES[s.rarity].year <= run.year);
  if (!run.selectedSchool) return sample(available, 3);
  const locked = sample(available.filter(s => s.school === run.selectedSchool), 1);
  const others = sample(available.filter(s => s.school !== run.selectedSchool), 2);
  return [...locked, ...others].slice(0, 3);
}

export function addStrategy(run, strategyId) {
  run.strategies.push(strategyId);
  const strategy = DATA.strategies.find(s => s.id === strategyId);
  log(run, `获得计略：${strategy.name}（${strategy.effectsText}）。`);
  if (run.treasure.effect === "moonPearl" && Math.random() < 0.25) {
    const extra = rand(DATA.strategies.filter(s => s.rarity === "blue"));
    run.strategies.push(extra.id);
    log(run, `万象珠生效，额外获得计略：${extra.name}。`);
  }
  saveRun(run);
}

export function toggleActiveStrategy(run, index) {
  run.activeStrategies ||= [];
  const strategyId = run.strategies[index];
  const strategy = DATA.strategies.find(s => s.id === strategyId);
  if (!strategy) return { ok: false, message: "计略选择无效" };
  if (run.activeStrategies.includes(index)) {
    applyStrategyStats(run, strategy, -1);
    run.activeStrategies = run.activeStrategies.filter(i => i !== index);
  } else {
    if (run.activeStrategies.length >= 2) return { ok: false, message: "最多上场两个计略" };
    run.activeStrategies.push(index);
    applyStrategyStats(run, strategy, 1);
  }
  saveRun(run);
  return { ok: true };
}

export function mergeStrategies(run, indices = []) {
  const selected = [...new Set(indices.map(Number))].sort((a, b) => b - a);
  if (selected.length !== 2) return { ok: false, message: "请选择两个计略合成" };
  const [aIndex, bIndex] = selected;
  const aId = run.strategies[aIndex];
  const bId = run.strategies[bIndex];
  const first = DATA.strategies.find(s => s.id === aId);
  const second = DATA.strategies.find(s => s.id === bId);
  if (!first || !second) return { ok: false, message: "计略选择无效" };
  if (first.rarity !== second.rarity) return { ok: false, message: "需要两个品质相同的计略" };
  if (first.rarity === "red") return { ok: false, message: "红色计略无法继续合成" };
  clearActiveStrategies(run);
  for (const index of selected) run.strategies.splice(index, 1);
  const next = first.rarity === "blue" ? "orange" : "red";
  const pool = DATA.strategies.filter(s => s.rarity === next && (s.school === first.school || s.school === second.school));
  const got = rand(pool.length ? pool : DATA.strategies.filter(s => s.rarity === next));
  run.strategies.push(got.id);
  log(run, `融合计略，获得${got.name}（${got.effectsText}）。`);
  saveRun(run);
  return { ok: true };
}

export function buyShopEntry(run, entry) {
  if (entry.kind === "weapon") return buyWeapon(run, entry.id);
  return buyItem(run, entry.id);
}

export function buyItem(run, itemId) {
  const item = DATA.items[itemId];
  let price = item.price;
  if (run.traits.includes("merchantFriend")) price = Math.floor(price * 0.85);
  if (run.treasure.effect === "healPlus") price = Math.floor(price * 0.95);
  if (run.money < price) return { ok: false, message: "金钱不足" };
  run.money -= price;
  run.items.push(itemId);
  log(run, `购买道具：${item.name}。`);
  saveRun(run);
  return { ok: true };
}

export function buyWeapon(run, weaponId) {
  const weapon = DATA.weapons[weaponId];
  if (run.money < weapon.price) return { ok: false, message: "金钱不足" };
  run.money -= weapon.price;
  run.weapons.push(weaponId);
  log(run, `购买武器：${weapon.name}。`);
  saveRun(run);
  return { ok: true };
}

export function useBagItem(run, itemId) {
  const idx = run.items.indexOf(itemId);
  if (idx < 0) return { ok: false, message: "没有该道具" };
  const item = DATA.items[itemId];
  run.items.splice(idx, 1);
  if (item.type === "heal") run.hp = Math.min(run.stats.hp, run.hp + item.hp);
  if (item.type === "qi") run.qi = Math.min(run.stats.qi, run.qi + item.qi);
  if (item.type === "stat") {
    for (const key of STAT_KEYS) run.stats[key] = Number(((run.stats[key] || 0) + (item[key] || 0)).toFixed(2));
  }
  log(run, `使用${item.name}。`);
  saveRun(run);
  return { ok: true };
}

export function equipWeapon(run, weaponId) {
  if (!run.weapons.includes(weaponId)) return { ok: false, message: "没有该武器" };
  run.equippedWeapon = weaponId;
  log(run, `装备${DATA.weapons[weaponId].name}。`);
  saveRun(run);
  return { ok: true };
}

export function toggleActiveSkill(run, skillId) {
  const skill = DATA.skills[skillId];
  if (!run.skills.includes(skillId)) return { ok: false, message: "尚未习得该招式" };
  if (skill.battle === false) return { ok: false, message: "轻功为被动，不上场" };
  run.activeSkills ||= run.skills.filter(id => DATA.skills[id]?.battle !== false).slice(0, 4);
  if (run.activeSkills.includes(skillId)) {
    if (run.activeSkills.length <= 1) return { ok: false, message: "至少保留一个上场招式" };
    run.activeSkills = run.activeSkills.filter(id => id !== skillId);
  } else {
    const result = addActiveSkillInOrder(run, skillId);
    if (!result.ok) return result;
  }
  reconcileStyleMasteries(run);
  saveRun(run);
  return { ok: true };
}

function addActiveSkillInOrder(run, skillId) {
  run.activeSkills ||= run.skills.filter(id => DATA.skills[id]?.battle !== false).slice(0, 4);
  if (run.activeSkills.includes(skillId)) return { ok: true };
  if (run.activeSkills.length >= 4) return { ok: false, message: "最多上场4个招式" };
  run.activeSkills.push(skillId);
  return { ok: true };
}

function clearActiveStrategies(run) {
  run.activeStrategies ||= [];
  for (const index of run.activeStrategies) {
    const strategy = DATA.strategies.find(s => s.id === run.strategies[index]);
    if (strategy) applyStrategyStats(run, strategy, -1);
  }
  run.activeStrategies = [];
}

function applyStrategyStats(run, strategy, direction) {
  for (const [key, value] of Object.entries(strategy.effects || {})) {
    if (!STAT_KEYS.includes(key)) continue;
    run.stats[key] = Number(((run.stats[key] || 0) + value * direction).toFixed(2));
  }
  run.hp = Math.min(run.hp, run.stats.hp);
  run.qi = Math.min(run.qi, run.stats.qi);
}

export function settleRun(state, result, reason) {
  const run = state.run;
  const meta = state.meta;
  meta.runs++;
  if (result === "win") {
    meta.wins++;
    meta.endlessUnlocked = true;
    for (const id of ["dragonSeal", "starManual", "jadeArmor"]) {
      if (!meta.unlockedTreasures.includes(id)) meta.unlockedTreasures.push(id);
    }
  }
  const reached = monthAbs(run);
  const best = (meta.bestYear - 1) * 12 + meta.bestMonth;
  if (reached > best) {
    meta.bestYear = run.year;
    meta.bestMonth = run.month;
  }
  const points = result === "win" ? 5 : Math.max(1, Math.floor(reached / 8));
  meta.metaPoints += points;
  saveMeta(meta);
  clearRun();
  state.settlement = { result, reason, points };
  state.run = null;
  state.battle = null;
  state.modal = null;
  state.screen = "settlement";
}

function applyMetaAllocations(stats, allocations) {
  stats.hp += (allocations.hp || 0) * 60;
  stats.qi += (allocations.qi || 0) * 15;
  stats.atk += (allocations.atk || 0) * 2;
  stats.def += (allocations.def || 0) * 2;
  stats.combo += (allocations.combo || 0) * 1;
  stats.hit += (allocations.hit || 0) * 2;
  stats.dodge += allocations.dodge || 0;
  stats.crit += allocations.crit || 0;
  stats.speed = Number((stats.speed + (allocations.speed || 0) * 0.03).toFixed(2));
}
