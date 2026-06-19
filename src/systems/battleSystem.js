import { DATA } from "../data/content.js";
import { clone, clamp } from "../core/utils.js";
import { createBattleFloater } from "../ui/render.js";

const THREE_WAVES_PALMS = ["fist_blue_1", "fist_orange_1", "fist_red_1"];
const MAX_PALM_CHAIN_ACTIONS = 3; // arm can increase to 4

// Debuff caps
const DEBUFF_CAPS = {
  bleed: 15,
  poison: 15,
  inner: 12,
  frost: 15,
  hamstring: 15,
  veinBreak: 15,
  gu: 6,
  imbalance: 15,
  breakDefense: 15
};
const BLEED_DMG = 15;
const POISON_DMG = 8;
const POISON_QI = 4;
const FROST_SLOW = 0.04;
const HAMSTRING_SLOW = 0.02;
const HAMSTRING_ATK = 1;
const GU_QI_COST = 6;
const SPEED_MIN_FROST = 0.6;
const ATK_MIN_HAMSTRING = 0.65;

export function createBattle(run, enemyTemplate, isBoss = false) {
  if (!run || !run.stats) { console.error("[createBattle] run or run.stats is undefined"); return null; }
  if (!enemyTemplate) { console.error("[createBattle] enemyTemplate is undefined"); return null; }
  const enemyStats = scaleEnemyStats(clone(enemyTemplate));
  const pStats = clone(run.stats);

  // 威视/决心维度缩放
  // 威视每点使武盟全部维度+5%，决心每点使散人全部维度+5%，全部取整
  const threatMult = 1 + (run.mainThreat || 0) * 0.05;
  const resolveMult = 1 + (run.wandererResolve || 0) * 0.05;
  if (threatMult !== 1) {
    for (const k of ["hp", "atk", "def", "hit", "dodge", "crit", "speed"]) {
      if (enemyStats[k] !== undefined) enemyStats[k] = Math.round(enemyStats[k] * threatMult);
    }
  }
  if (resolveMult !== 1) {
    for (const k of ["hp", "atk", "def", "hit", "dodge", "crit", "speed"]) {
      if (pStats[k] !== undefined) pStats[k] = Math.round(pStats[k] * resolveMult);
    }
  }

  // Weapon stat bonus (Player)
  if (run.equippedWeapon) {
    const weapon = DATA.weapons[run.equippedWeapon];
    if (weapon) {
      pStats.atk += weapon.atk || 0;
      if (weapon.dodgeBonus) pStats.dodge += weapon.dodgeBonus;
      if (weapon.speedBonus) pStats.speed = Number((pStats.speed + weapon.speedBonus).toFixed(2));
      if (weapon.critBonus) pStats.crit += weapon.critBonus;
    }
  }

  // Weapon stat bonus (Boss)
  if (enemyTemplate.weapon) {
    const bossWeapon = DATA.weapons[enemyTemplate.weapon];
    if (bossWeapon) {
      enemyStats.atk += bossWeapon.atk || 0;
      if (bossWeapon.dodgeBonus) enemyStats.dodge += bossWeapon.dodgeBonus;
      if (bossWeapon.speedBonus) enemyStats.speed = Number((enemyStats.speed + bossWeapon.speedBonus).toFixed(2));
      if (bossWeapon.critBonus) enemyStats.crit += bossWeapon.critBonus;
    }
  }

  // Armor stat bonus
  if (run.equippedArmor) {
    const armor = DATA.armors[run.equippedArmor];
    if (armor) {
      pStats.hp += armor.hp || 0;
      pStats.def += armor.def || 0;
      if (armor.dodgeBonus) pStats.dodge += armor.dodgeBonus;
      if (armor.speedBonus) pStats.speed = Number((pStats.speed + armor.speedBonus).toFixed(2));
    }
  }

  let items = [...run.items];

  if (run.treasure.effect === "battleDart") items.push("dart");
  if (run.treasure.effect === "moneyAtk") pStats.atk += 10;
  if (run.treasure.effect === "battleSeal") {
    pStats.atk += 18;
    pStats.hit += 8;
    pStats.crit += 5;
  }
  if (run.treasure.effect === "bossPower" && isBoss) {
    pStats.atk += 25;
    pStats.def += 10;
  }
  if (run.treasure.effect === "jadeGuard") pStats.def += 8;
  if (run.traits.includes("swift")) {
    pStats.speed += 0.25;
    pStats.dodge += 4;
  }
  if (run.traits.includes("tough")) {
    pStats.def += 10;
  }
  if (run.traits.includes("hardBone")) pStats.hp += 60;
  if (run.traits.includes("innerRoot")) pStats.qi += 80;
  if (run.traits.includes("critUp")) pStats.crit += 2;
  if (run.traits.includes("nightPoison")) pStats.crit += 8;
  if (run.traits.includes("wanderer")) pStats.speed = Number((pStats.speed + 0.12).toFixed(2));
  if (run.traits.includes("constable")) pStats.hit += 6;

  let pHp = Math.min(run.hp, pStats.hp);
  let pQi = Math.min(run.qi, pStats.qi);
  let dragonGuardHp = 0;

  // 内功效果：战斗开始
  (run.activeInternalArts || []).forEach(id => {
    const art = DATA.internalArts[id];
    if (art?.combatEffect === "healOnStart") {
      pHp = Math.min(pStats.hp, pHp + Math.floor(pStats.hp * 0.35));
    }
    if (art?.combatEffect === "bigHealStart") {
      pHp = Math.min(pStats.hp, pHp + Math.floor(pStats.hp * 0.25));
      pQi = Math.min(pStats.qi, pQi + Math.floor(pStats.qi * 0.15));
    }
  });

  // 防具效果：龙鳞重甲护体
  if (run.equippedArmor) {
    const armor = DATA.armors[run.equippedArmor];
    if (armor?.dragonGuard) {
      dragonGuardHp = Math.floor(pStats.hp * armor.dragonGuard);
    }
  }
  const dragonGuardMax = dragonGuardHp;

  const battle = {
    isBoss,
    bossYear: enemyTemplate.year,
    player: makeUnit(run.character.name, run.character.icon, pStats, pHp, pQi, [...(run.activeSkills || run.skills.slice(0, 4))], items),
    enemy: makeUnit(enemyTemplate.name, enemyTemplate.icon, enemyStats, enemyStats.hp, enemyStats.qi, [], []),
    phase: "running",
    actor: null,
    log: [`${run.character.name}遭遇${enemyTemplate.name}。`],
    floaters: [],
    speed: 1,
    run,
    // 破防系统的原始 DEF 基准（用于破防清零后恢复）
    _defBaseInit: true,
    // Per-turn trackers
    turnTrackers: { comboChains: 0, evasiveTriggers: 0, coinThrows: 0, guDisrupts: 0, frostHits: 0, stealTriggers: 0, playerTurnCount: 0 },
    // 敌人行动计数（用于限制断脉拳师等前N回合特性）
    enemyActionCount: 0,
    // Armor trackers
    dragonGuardHp,
    dragonGuardMax,
    wuxiangTurns: 0,
    immuneNewDebuffs: false,
    // Boss trait tracking (Boss特性)
    bossTraits: [...(enemyTemplate.bossTraits || (enemyTemplate.bossTrait ? [enemyTemplate.bossTrait] : []))],
    bossTrait: (enemyTemplate.bossTraits || [])[0] || enemyTemplate.bossTrait || null,
    bossTurnCounter: 0,
    bossPhaseTriggered: {},
    bossShield: 0,
    bossShieldMax: 0,
    bossImmuneTurns: 0,
    celestialCleanseUsed: false,
    celestialBurnTriggered: false,
    // 角色立绘
    playerPortrait: run.character.portraitImage || null,
    enemyPortrait: enemyTemplate.portraitImage || null
  };
  // v6.x 破防系统：记录双方原始 DEF 基准（用于破防清零后恢复）
  battle.player.defBase = battle.player.stats.def;
  battle.enemy.defBase = battle.enemy.stats.def;
  // v6.0.3 debug: 记录 Boss 特性初始化
  if (battle.bossTraits.length) {
    console.log(`[createBattle] ${enemyTemplate.name} bossTraits=`, battle.bossTraits, `isBoss=${isBoss}`);
  } else if (isBoss) {
    console.warn(`[createBattle] ${enemyTemplate.name} isBoss=true but bossTraits=[]`);
  }

  // 战斗开始回血/回蓝浮字
  (run.activeInternalArts || []).forEach(id => {
    const art = DATA.internalArts[id];
    if (!art) return;
    if (art.combatEffect === "healOnStart") {
      const h = Math.floor(pStats.hp * 0.35);
      addFloater(battle, "player", `+${h}`, "heal");
    }
    if (art.combatEffect === "bigHealStart") {
      const h = Math.floor(pStats.hp * 0.25);
      const q = Math.floor(pStats.qi * 0.15);
      addFloater(battle, "player", `+${h}`, "heal");
      addFloater(battle, "player", `+${q}`, "qi");
    }
  });

  // 战斗开始：初始化 battle 对象完成

  // Boss特性初始化
  if (battle.bossTraits.length) {
    // armorShield（护体真气）：开场20%HP护体
    if (battle.bossTraits.includes("armorShield")) {
      battle.bossShield = Math.floor(enemyStats.hp * 0.20);
      battle.bossShieldMax = battle.bossShield;
      battleLog(battle, `${enemyTemplate.name}真气护体，吸收${battle.bossShield}伤害！`);
    }
    // celestialShield（天罡护体）：开场30%HP护体
    if (battle.bossTraits.includes("celestialShield")) {
      battle.bossShield = Math.floor(enemyStats.hp * 0.30);
      battle.bossShieldMax = battle.bossShield;
      battleLog(battle, `${enemyTemplate.name}天罡护体，吸收${battle.bossShield}伤害！`);
    }
    // drainQiImmuneBurst：前3回合免疫负面（保留向后兼容）
    if (battle.bossTraits.includes("drainQiImmuneBurst")) {
      battle.bossImmuneTurns = 3;
      battleLog(battle, `${enemyTemplate.name}内力护体，前3回合免疫负面！`);
    }
    // shadowStep（影步）：基础DODGE=100
    if (battle.bossTraits.includes("shadowStep")) {
      enemyStats.dodge = 100;
    }
  }

  // Boss武器初始化
  if (enemyTemplate.weapon) {
    battle.enemy.weapon = enemyTemplate.weapon;
  }

  // 大罗洗髓经：开场净化
  (run.activeInternalArts || []).forEach(id => {
    const art = DATA.internalArts[id];
    if (art?.combatEffect === "cleanse") {
      battle.player.bleed = 0;
      battle.player.poison = 0;
      battle.player.inner = 0;
      battle.player.frost = 0;
      battle.player.hamstring = 0;
      battle.player.gu = 0;
      battle.player.cleanseShield = 5; // 前5己方回合免疫负面
      battleLog(battle, `【大罗洗髓经】净化所有负面状态，前5己方回合免疫负面，每5回合所有负面减半。`);
    }
  });

  // 防具开场公告
  if (battle.dragonGuardHp > 0) {
    const armor = DATA.armors[run.equippedArmor];
    battleLog(battle, `【${armor.name}】获得护体，吸收${battle.dragonGuardHp}伤害！`);
  }
  if (run.equippedArmor) {
    const armor = DATA.armors[run.equippedArmor];
    if (armor?.dotReduce) {
      battleLog(battle, `【${armor.name}】持续伤害降低${Math.floor(armor.dotReduce * 100)}%。`);
    }
  }

  if (enemyStats.traitName) battle.log.unshift(`${enemyTemplate.name}特性：${enemyStats.traitName}。${enemyStats.traitDesc || ""}`);
  // 嘴炮：敌人进入战斗的专属台词（存为独立字段，由 renderBattle 一次性展示）
  battle.tauntText = enemyTemplate.taunt || null;
  // 战斗难度
  const ratio = pStats.hp / enemyStats.hp;
  battle.difficulty = ratio >= 1.2 ? "easy" : ratio >= 0.8 ? "normal" : "hard";
  return battle;
}

function scaleEnemyStats(stats) {
  for (const key of ["hp", "qi", "atk", "def", "combo", "hit", "dodge", "crit"]) {
    stats[key] = Math.floor((stats[key] || 0) * 2);
  }
  stats.speed = Number(((stats.speed || 1) * 1.35).toFixed(2));
  return stats;
}

function makeUnit(name, icon, stats, hp, qi, skills, items) {
  return { name, icon, stats, hp, qi, gauge: 0, skills, items, cooldowns: {}, auto: false, bleed: 0, poison: 0, inner: 0, frost: 0, hamstring: 0, veinBreak: 0, gu: 0, imbalance: 0, guard: 0, cleanseShield: 0, dodgeHealCount: 0, frozen: 0, atkZero: 0, weakpointExposed: 0, imbalanceMult: 0, breakDefense: 0, breakDefenseShatter: 0, defBase: 0, tempBuffs: {}, weapon: null };
}

export function tickBattle(battle, dt) {
  if (!battle || battle.phase !== "running") return null;
  const p = battle.player;
  const e = battle.enemy;
  p.gauge += effectiveSpeed(p, battle) * dt * 24;
  e.gauge += effectiveSpeed(e, battle) * dt * 24;
  if (p.gauge >= 100) {
    p.gauge = 100;
    // 冰冻：跳过本回合
    if (p.frozen > 0) {
      p.frozen = 0;
      p.gauge = 0;
      applyTurnStart(battle, p);
      if (checkBattleEnd(battle).ended) return "ended";
      battleLog(battle, `${p.name}被冰封，无法行动！`);
      addFloater(battle, "player", "冰封");
      return null;
    }
    battle.actor = "player";
    // Reset per-turn trackers on player turn (保留 playerTurnCount 跨回合累计)
    battle.turnTrackers.comboChains = 0;
    battle.turnTrackers.evasiveTriggers = 0;
    battle.turnTrackers.coinThrows = 0;
    battle.turnTrackers.guDisrupts = 0;
    battle.turnTrackers.frostHits = 0;
    battle.turnTrackers.stealTriggers = 0;
    applyTurnStart(battle, p);
    if (checkBattleEnd(battle).ended) return "ended";
    battle.phase = p.auto ? "autoPlayer" : "waitPlayer";
    return battle.phase;
  }
  if (e.gauge >= 100) {
    e.gauge = 100;
    // 冰冻：跳过本回合
    if (e.frozen > 0) {
      e.frozen = 0;
      e.gauge = 0;
      applyTurnStart(battle, e);
      applyBossTurnMechanics(battle);
      if (checkBattleEnd(battle).ended) return "ended";
      battleLog(battle, `${e.name}被冰封，无法行动！`);
      addFloater(battle, "enemy", "冰封");
      return null;
    }
    battle.actor = "enemy";
    applyTurnStart(battle, e);
    // 三主线Boss：每回合特性
    applyBossTurnMechanics(battle);
    if (checkBattleEnd(battle).ended) return "ended";
    battle.phase = "enemyAction";
    return battle.phase;
  }
  return null;
}

export function useSkill(run, battle, skillId) {
  if (!battle) return { ok: false, message: "战斗已结束" };
  if (battle.phase !== "waitPlayer" && battle.phase !== "autoPlayer") return { ok: false };
  const p = battle.player;
  const skill = DATA.skills[skillId];
  if (!skill) return { ok: false };
  if ((p.cooldowns[skillId] || 0) > 0) return { ok: false, message: "招式冷却中" };
  if (p.qi <= 0 && !skill.tags?.includes("coin")) return { ok: false, message: "内力归零，只能调息或普通攻击" };
  const qiCost = skillQiCost(p, skill, run);
  const moneyCost = skillMoneyCost(battle, skill);
  if (p.qi < qiCost && !skill.tags?.includes("coin")) return { ok: false, message: "内力不足" };
  if (moneyCost && run.money < moneyCost) return { ok: false, message: "金钱不足" };

  p.qi -= qiCost;
  if (moneyCost) run.money -= moneyCost;
  p.cooldowns[skillId] = skill.cd;
  // 自用Buff秘籍：不攻击，给自己上Buff
  if (skill.isSelfBuff) {
    if (!p.tempBuffs) p.tempBuffs = {};
    const b = skill.selfBuff;
    p.tempBuffs[b.type] = { ...b };
    battleLog(battle, `${p.name}施展${skill.name}！效果持续${b.duration}回合。`);
    addFloater(battle, "player", skill.name);
    return endActorTurn(run, battle, p);
  }
  const result = resolveAttack(run, battle, p, battle.enemy, skill);
  if (result.comboTriggered && DATA.skills[skillId]?.tags?.includes("threeWaves") && triggerThreeWaves(run, battle, p, skillId)) {
    return checkBattleEnd(battle);
  }
  return endActorTurn(run, battle, p);
}

export function basicAttack(run, battle) {
  if (!battle) return { ok: false, message: "战斗已结束" };
  if (battle.phase !== "waitPlayer" && battle.phase !== "autoPlayer") return { ok: false };
  const p = battle.player;
  const target = battle.enemy;
  const hit = Math.random() * 100 < hitChance(p, target);
  if (!hit) {
    battleLog(battle, `${p.name}普通攻击，被${target.name}闪开。`);
    addFloater(battle, "enemy", "miss");
    // shadowStep（影步）：每次闪避成功+10%最大HP
    if (battle.bossTraits?.includes("shadowStep")) {
      const healAmt = Math.floor(target.stats.hp * 0.10);
      target.hp = Math.min(target.stats.hp, target.hp + healAmt);
      addFloater(battle, "enemy", `+${healAmt}`, "heal");
      battleLog(battle, `${target.name}影步回气，恢复${healAmt}血量！`);
    }
  } else {
    // 基础攻击只吃武器30-50%效果
    const weapon = battle.run.equippedWeapon ? DATA.weapons[battle.run.equippedWeapon] : null;
    const weaponAtk = weapon ? Math.floor(weapon.atk * 0.4) : 0;
    const dmg = Math.max(1, Math.floor((effectiveAtk(p) - weaponAtk + (weapon ? Math.floor(weapon.atk * 0.4) : 0)) * 0.35 + 10 - effectiveDef(target) * 0.25));
    target.hp = Math.max(0, target.hp - dmg);
    addFloater(battle, "enemy", `-${dmg}`, "normal");
    battleLog(battle, `${p.name}普通攻击，造成${dmg}伤害。`);
  }
  return endActorTurn(run, battle, p);
}

function resolveAttack(run, battle, actor, target, skill) {
  const surehit = skill.tags?.includes("surehit") || skill.style === "lowKick";
  const hit = surehit || Math.random() * 100 < hitChance(actor, target);
  if (!hit) {
    battleLog(battle, `${actor.name}施展${skill.name}，被${target.name}闪开。`);
    addFloater(battle, sideOf(battle, target), "miss");
    // shadowStep（影步）：Boss每次闪避成功+10%最大HP
    if (target === battle.enemy && battle.bossTraits?.includes("shadowStep")) {
      const healAmt = Math.floor(target.stats.hp * 0.10);
      target.hp = Math.min(target.stats.hp, target.hp + healAmt);
      addFloater(battle, sideOf(battle, target), `+${healAmt}`, "heal");
      battleLog(battle, `${target.name}影步回气，恢复${healAmt}血量！`);
    }
    return { comboTriggered: false };
  }
  if (surehit) addFloater(battle, sideOf(battle, actor), "中！");

  // Boss护体盾吸收（shieldCleanseCounter等）
  let dmg = calcDamage(run, battle, actor, target, skill);
  if (target === battle.enemy && battle.bossShield > 0) {
    const absorbed = Math.min(dmg, battle.bossShield);
    const hadShield = battle.bossShield;
    battle.bossShield -= absorbed;
    dmg -= absorbed;
    if (absorbed > 0) {
      battleLog(battle, `${target.name}的护体吸收了${absorbed}伤害！`);
      addFloater(battle, "enemy", "护体");
    }
    if (hadShield > 0 && battle.bossShield <= 0) {
      battleLog(battle, `护体破碎！`);
      addFloater(battle, "enemy", "护体破碎");
    }
  }

  target.hp = Math.max(0, target.hp - dmg);
  const _isCrit = battle._lastCrit;
  const _critMult = battle._lastCritMult || 2;
  battle._lastCrit = false;
  battle._lastCritMult = 0;
  addFloater(battle, sideOf(battle, target), `-${dmg}`, _isCrit ? "crit" : "normal");
  if (_isCrit) addFloater(battle, sideOf(battle, actor), `${_critMult.toFixed(1)}×暴击`);
  applySkillEffects(run, battle, actor, target, skill, dmg);
  battleLog(battle, `${actor.name}施展${skill.name}，造成${dmg}伤害。`);
  if (skill.tags?.includes("heal")) { const h = heal(run, actor, 70); addFloater(battle, sideOf(battle, actor), `+${h}`, "heal"); }
  if (skill.tags?.includes("speed")) actor.stats.speed = Number((actor.stats.speed + 0.05).toFixed(2));

  // 检查Boss阶段触发（玩家攻击Boss后）
  if (target === battle.enemy) checkBossPhaseTriggers(battle);

  let comboTriggered = false;
  let chain = 1;
  let chance = comboChance(run, skill, actor);
  while (target.hp > 0 && Math.random() * 100 < chance) {
    chain++;
    comboTriggered = true;
    const dmgMult = 0.5 / Math.pow(2, chain - 2); // 第2击0.5，第3击0.25
    const comboDmg = Math.max(1, Math.floor(dmg * dmgMult));
    target.hp = Math.max(0, target.hp - comboDmg);
    // 连击额外攻击也触发技能效果，数值减半
    applySkillEffects(run, battle, actor, target, skill, comboDmg, dmgMult);
    battleLog(battle, `连击触发，追加${comboDmg}伤害。`);
    addFloater(battle, sideOf(battle, target), `-${comboDmg}`, "normal");
    chance *= 0.5;
    if (chain >= 3) break; // 最多3次（含初始攻击）
  }
  if (chain > 1) addFloater(battle, sideOf(battle, actor), `${chain}连击`, "combo");
  return { comboTriggered };
}

function triggerThreeWaves(run, battle, actor, usedSkillId) {
  if (!hasThreeWaves(run, actor)) return false;
  for (const id of THREE_WAVES_PALMS) {
    if (id !== usedSkillId) actor.cooldowns[id] = Math.max(0, (actor.cooldowns[id] || 0) - 1);
  }
  battleLog(battle, `${actor.name}掌势未尽，可继续出掌。`);
  addFloater(battle, sideOf(battle, actor), "连击");

  battle.palmChainCount = (battle.palmChainCount || 0) + 1;
  // 每己方回合最多额外出掌2次（红武+1）
  const weapon = run.equippedWeapon ? DATA.weapons[run.equippedWeapon] : null;
  const maxChains = MAX_PALM_CHAIN_ACTIONS + (weapon?.palmChainBonus || 0);
  if (battle.palmChainCount > maxChains) return false;
  if (battle.turnTrackers.comboChains >= 2) return false;
  battle.turnTrackers.comboChains++;

  const hasReadyPalm = THREE_WAVES_PALMS.some(id => {
    const s = DATA.skills[id];
    return actor.skills.includes(id) && id !== usedSkillId && (actor.cooldowns[id] || 0) <= 0 && actor.qi >= s.qi;
  });
  if (!hasReadyPalm) return false;
  battle.phase = actor.auto ? "autoPlayer" : "waitPlayer";
  battle.actor = "player";
  battleLog(battle, `${actor.name}掌势未尽，可继续出掌。`);
  return true;
}

function hasThreeWaves(run, actor) {
  if (!THREE_WAVES_PALMS.every(id => actor.skills.includes(id))) return false;
  return run.skillTraits?.some(t => t.id === "comboMastery") || THREE_WAVES_PALMS.every(id => run.skills.includes(id));
}

export function useItem(run, battle, itemId) {
  if (!battle) return { ok: false, message: "战斗已结束" };
  if (battle.phase !== "waitPlayer" && battle.phase !== "autoPlayer") return { ok: false };
  const p = battle.player;
  const idx = p.items.indexOf(itemId);
  if (idx < 0) return { ok: false };
  p.items.splice(idx, 1);
  const item = DATA.items[itemId];
  if (item?.type === "heal") {
    const amt = Math.floor(p.stats.hp * (item.hpPct || 0.2));
    heal(run, p, amt);
    battleLog(battle, `${p.name}使用${item.name}，恢复${amt}血量。`);
  } else if (item?.type === "qi") {
    const amt = Math.floor(p.stats.qi * (item.qiPct || 0.25));
    p.qi = Math.min(p.stats.qi, p.qi + amt);
    battleLog(battle, `${p.name}使用${item.name}，恢复${amt}内力。`);
  } else if (itemId === "dart") {
    battle.enemy.hp = Math.max(0, battle.enemy.hp - 100);
    battleLog(battle, `${p.name}掷出飞镖，造成100伤害。`);
  }
  return endActorTurn(run, battle, p);
}

export function restAction(run, battle) {
  if (!battle) return { ok: false, message: "战斗已结束" };
  const p = battle.player;
  let hpAmt = Math.floor(p.stats.hp * 0.08);
  let qiAmt = Math.floor(p.stats.qi * 0.12);
  if (run.traits.includes("breath")) {
    hpAmt = Math.floor(p.stats.hp * 0.12);
    qiAmt = Math.floor(p.stats.qi * 0.18);
  }
  // 铁衣锻体：调息额外回复5%血量
  if (run.traits.includes("tieyi_body_tempering")) {
    const extraHp = Math.floor(p.stats.hp * 0.05);
    hpAmt += extraHp;
    battleLog(battle, `【铁衣锻体】调息额外恢复${extraHp}血量。`);
  }
  // 鲸息特性已改为"每回合自动恢复5%内力"，见 applyTurnStart 中触发
  // （此处不再处理，鲸息在每个回合开始时结算）
  heal(run, p, hpAmt);
  p.qi = Math.min(p.stats.qi, p.qi + qiAmt);
  battleLog(battle, `${p.name}调息，恢复${hpAmt}血量和${qiAmt}内力。`);
  if (hpAmt > 0) addFloater(battle, "player", `+${hpAmt}`, "heal");
  if (qiAmt > 0) addFloater(battle, "player", `+${qiAmt}`, "qi");
  return endActorTurn(run, battle, p);
}

export function autoPlayerAction(run, battle) {
  const p = battle.player;
  if (p.hp / p.stats.hp < 0.35 && p.items.some(id => DATA.items[id]?.type === "heal"))
    return useItem(run, battle, p.items.find(id => DATA.items[id]?.type === "heal"));
  if (p.qi <= 0) return Math.random() < 0.65 ? restAction(run, battle) : basicAttack(run, battle);
  const usable = p.skills.map(id => DATA.skills[id]).filter(s => s && p.qi >= s.qi && (p.cooldowns[s.id] || 0) <= 0);
  if (usable.length) return useSkill(run, battle, usable.sort((a, b) => b.power - a.power)[0].id);
  return restAction(run, battle);
}

export function enemyAction(run, battle) {
  battle.enemyActionCount = (battle.enemyActionCount || 0) + 1;
  const e = battle.enemy;
  const p = battle.player;
  if (e.qi <= 0) {
    if (Math.random() < 0.65) {
      e.qi = Math.min(e.stats.qi, e.qi + Math.floor(e.stats.qi * 0.12));
      e.hp = Math.min(e.stats.hp, e.hp + Math.floor(e.stats.hp * 0.08));
      battleLog(battle, `${e.name}内力枯竭，只能调息。`);
    } else {
      enemyBasicAttack(run, battle, e, p);
    }
    return endActorTurn(run, battle, e);
  }
  e.qi = Math.max(0, e.qi - 35);
  if (Math.random() * 100 > hitChance(e, p)) {
    battleLog(battle, `${e.name}的攻击被闪开了。`);
    addFloater(battle, "player", "miss");
    triggerEvasiveLeg(run, battle, p);
  } else {
    let dmg = enemySkillDamage(battle, e, p);
    // Boss trait: drainQiLowShield - 命中吸内
    if (battle.bossTraits.includes("drainQiLowShield")) {
      const drain = Math.max(1, Math.floor(p.qi * 0.08));
      if (drain > 0 && p.qi > 0) {
        p.qi = Math.max(0, p.qi - drain);
        e.qi = Math.min(e.stats.qi, e.qi + drain);
        battleLog(battle, `${e.name}吸取了你的内力${drain}点！`);
        addFloater(battle, "player", `-${drain}`, "qi");
      }
    }
    // 罗汉镇岳功：受到直接伤害-10%
    (run.activeInternalArts || []).forEach(id => {
      const art = DATA.internalArts[id];
      if (art?.combatEffect === "dmgReduce") dmg = Math.floor(dmg * 0.90);
    });
    // 防具：低血量减伤
    if (run.equippedArmor) {
      const armor = DATA.armors[run.equippedArmor];
      if (armor?.lowHpGuard && p.hp / p.stats.hp <= (armor.lowHpThreshold || 0.3)) {
        const reduced = dmg - Math.floor(dmg * (1 - armor.lowHpGuard));
        dmg = Math.floor(dmg * (1 - armor.lowHpGuard));
        battleLog(battle, `【${armor.name}】低血减伤，伤害降低${Math.floor(armor.lowHpGuard * 100)}%！`);
      }
    }
    if (p.guard) dmg = Math.floor(dmg * 0.55);
    // 龙鳞护体
    if (battle.dragonGuardHp > 0) {
      const absorbed = Math.min(dmg, battle.dragonGuardHp);
      const hadShield = battle.dragonGuardHp;
      battle.dragonGuardHp -= absorbed;
      dmg -= absorbed;
      if (absorbed > 0) {
        battleLog(battle, `【龙鳞重甲】护体吸收${absorbed}伤害！（剩余护体${battle.dragonGuardHp}）`);
        addFloater(battle, "player", "护体");
      }
      if (hadShield > 0 && battle.dragonGuardHp <= 0) {
        battleLog(battle, `【龙鳞重甲】护体破碎！`);
        addFloater(battle, "player", "护体破碎");
      }
      if (dmg <= 0) {
        battleLog(battle, `${e.name}的攻击被护体完全吸收！`);
        addFloater(battle, "player", "护体");
        return endActorTurn(run, battle, e);
      }
    }
    // 防具爆伤降低
    let critMult = 2;
    if (run.equippedArmor) {
      const armor = DATA.armors[run.equippedArmor];
      if (armor?.critReduce) critMult = 2 * (1 - armor.critReduce);
    }
    if (Math.random() * 100 < e.stats.crit) {
      dmg = Math.floor(dmg * critMult);
      battle._enemyLastCrit = true;
      battle._enemyLastCritMult = critMult;  // v6.6：记录暴击倍率
      battleLog(battle, `${e.name}暴击！×${critMult.toFixed(1)}倍`);
      if (run.equippedArmor) {
        const a = DATA.armors[run.equippedArmor];
        if (a?.critReduce) {
          battleLog(battle, `【${a.name}】暴击伤害降低！`);
        }
      }
    }
    p.hp = Math.max(0, p.hp - dmg);
    const _eCrit = battle._enemyLastCrit;
    const _eCritMult = battle._enemyLastCritMult || 2;
    battle._enemyLastCrit = false;
    battle._enemyLastCritMult = 0;
    addFloater(battle, "player", `-${dmg}`, _eCrit ? "crit" : "normal");
    if (_eCrit) addFloater(battle, "enemy", `${_eCritMult.toFixed(1)}×暴击`);
    // 无相秘甲：反弹25%伤害
    if (run.equippedArmor && dmg > 0) {
      const armor = DATA.armors[run.equippedArmor];
      if (armor?.reflect) {
        const reflectDmg = Math.floor(dmg * armor.reflect);
        e.hp = Math.max(0, e.hp - reflectDmg);
        battleLog(battle, `【无相秘甲】反弹${reflectDmg}伤害！`);
        addFloater(battle, "enemy", `-${reflectDmg}`, "reflect");
      }
    }
    applyEnemyTraitHit(battle, e, p);
    // 三主线Boss：命中时特性效果
    applyBossHitEffect(battle, p);
    battleLog(battle, `${e.name}出手，造成${dmg}伤害。`);

    // 玄元龙象功：受伤害转内力
    (run.activeInternalArts || []).forEach(id => {
      const art = DATA.internalArts[id];
      if (art?.combatEffect === "dmgToQi") {
        const qiGain = Math.floor(dmg * 0.2);
        p.qi = Math.min(p.stats.qi, p.qi + qiGain);
      }
    });
  }
  return endActorTurn(run, battle, e);
}

function enemyBasicAttack(run, battle, e, p) {
  if (Math.random() * 100 > hitChance(e, p)) {
    battleLog(battle, `${e.name}勉强挥击，被闪开。`);
    addFloater(battle, "player", "miss");
    triggerEvasiveLeg(run, battle, p);
    return;
  }
  const dmg = Math.max(1, Math.floor(effectiveAtk(e) * 0.3 + 8 - enemyEffectiveDef(battle, e, p) * 0.25));
  p.hp = Math.max(0, p.hp - dmg);
  if (e.stats.trait === "qiSuppress") {
    const artReduce = (battle.run?.activeInternalArts || []).some(id => DATA.internalArts[id]?.combatEffect === "debuffReduce");
    drainPlayerQi(battle, e, p, artReduce ? 9 : 18);
  }
  battleLog(battle, `${e.name}普通攻击，造成${dmg}伤害。`);
}

function enemySkillDamage(battle, e, p) {
  return Math.max(1, Math.floor(effectiveAtk(e) + 35 - enemyEffectiveDef(battle, e, p)));
}

function enemyEffectiveDef(battle, e, p) {
  if (!battle || !e || !p) { console.error("[enemyEffectiveDef] battle/e/p is undefined", {battle:!!battle, e:!!e, p:!!p}); return 0; }
  const armorBreak = battle.bossTraits?.includes("armorBreak") || e.stats?.trait === "armorBreak";
  if (!armorBreak) return effectiveDef(p);
  return Math.floor(effectiveDef(p) * 0.50);
}

function applyEnemyTraitHit(battle, e, p) {
  const run = battle.run;
  const artReduce = (run?.activeInternalArts || []).some(id => DATA.internalArts[id]?.combatEffect === "debuffReduce");
  // bossTraits armorBreak：每次命中玩家DEF -5%（含旧e.stats.trait兼容）
  if (battle.bossTraits?.includes("armorBreak") || e.stats.trait === "armorBreak") {
    const reduction = Math.max(1, Math.round(p.stats.def * 0.05));
    const before = p.stats.def;
    p.stats.def = Math.max(0, p.stats.def - reduction);
    if (p.stats.def !== before) {
      battleLog(battle, `${e.name}裂甲入骨，${p.name}防御-${reduction}（${Math.round(p.stats.def / (run.stats?.def || 1) * 100)}%）。`);
      addFloater(battle, "player", `破防-${reduction}`);
    }
  }
  if (e.stats.trait === "qiSuppress") {
    if (battle.enemyActionCount > 5) {
      // 前5回合后才不再削内（断脉拳师削弱：只在前5回合生效）
    } else {
      const amount = artReduce ? 21 : 42;
      drainPlayerQi(battle, e, p, amount);
    }
  }
}

function drainPlayerQi(battle, e, p, amount) {
  const loss = Math.min(p.qi, amount);
  p.qi = Math.max(0, p.qi - amount);
  battleLog(battle, `${e.name}拳劲断脉，${p.name}内力-${loss}。`);
  addFloater(battle, "player", `-${loss}`, "qi");
}

function triggerEvasiveLeg(run, battle, unit) {
  // 每己方回合最多触发1次
  if (battle.turnTrackers.evasiveTriggers >= 1) return;
  const hasEvasiveLeg = unit.skills.some(id => DATA.skills[id]?.style === "evasive");
  if (!hasEvasiveLeg) return;
  battle.turnTrackers.evasiveTriggers++;

  for (const id of Object.keys(unit.cooldowns)) unit.cooldowns[id] = Math.max(0, unit.cooldowns[id] - 1);
  const mastered = battle.player === unit && hasStyleMastery(run, "evasive");
  const weapon = run.equippedWeapon ? DATA.weapons[run.equippedWeapon] : null;
  const boost = weapon?.evasiveBoost ? 1.3 : 1;
  const hpAmt = Math.floor((mastered ? unit.stats.hp * 0.06 : unit.stats.hp * 0.04) * boost);
  const qiAmt = Math.floor((mastered ? unit.stats.qi * 0.08 : unit.stats.qi * 0.06) * boost);
  unit.hp = Math.min(unit.stats.hp, unit.hp + hpAmt);
  unit.qi = Math.min(unit.stats.qi, unit.qi + qiAmt);
  battleLog(battle, `${unit.name}身法回旋，闪避后冷却-1并调息。`);
  addFloater(battle, "player", `+${hpAmt}`, "heal");
  if (qiAmt > 0) addFloater(battle, "player", `+${qiAmt}`, "qi");
}

export function toggleAuto(battle) {
  battle.player.auto = !battle.player.auto;
}

export function toggleSpeed(battle) {
  // 速度循环：1x → 2x → 3x → 1x
  battle.speed = (battle.speed || 1) >= 3 ? 1 : (battle.speed || 1) + 1;
}

export function fleeAction(run, battle) {
  if (battle.phase !== "waitPlayer") return { fled: false, message: "现在无法逃跑" };
  // Boss战不可逃跑
  if (battle.isBoss) return { fled: false, message: "面对Boss，无处可逃！" };
  // 50%概率成功
  const success = Math.random() < 0.5;
  if (success) {
    // 逃跑消耗行动力
    const hpLoss = Math.floor(battle.player.stats.hp * 0.1);
    battle.player.hp = Math.max(1, battle.player.hp - hpLoss);
    return { fled: true, message: `你狼狈逃出战斗，受到${hpLoss}伤害。` };
  }
  // 逃跑失败，消耗一回合
  endActorTurn(run, battle, battle.player);
  return { fled: false, message: "逃跑失败！消耗一回合。" };
}

function applyTurnStart(battle, unit) {
  // 天衡御心甲：持续伤害降低
  let dotReduceMult = 1;
  if (unit === battle.player && battle.run?.equippedArmor) {
    const armor = DATA.armors[battle.run.equippedArmor];
    if (armor?.dotReduce) dotReduceMult = 1 - armor.dotReduce;
  }
  // 流血结算（每层15伤害，结算后-1）
  if (unit.bleed > 0) {
    const dmg = Math.floor(unit.bleed * BLEED_DMG * dotReduceMult);
    unit.hp = Math.max(0, unit.hp - dmg);
    addFloater(battle, unit === battle.player ? "player" : "enemy", `-${dmg}`, "bleed");
    battleLog(battle, `${unit.name}流血发作，受到${dmg}伤害。`);
    unit.bleed = Math.max(0, unit.bleed - 1);
  }
  // 内伤结算
  if (unit.inner > 0) {
    const loss = unit.inner * 14;
    unit.qi = Math.max(0, unit.qi - loss);
    addFloater(battle, unit === battle.player ? "player" : "enemy", `-${loss}`, "qi");
    battleLog(battle, `${unit.name}内伤牵动，失去${loss}内力。`);
    unit.inner = Math.max(0, unit.inner - 1);
  }
  // 寒气结算（每层减速4%，结算后-1）
  if (unit.frost > 0) {
    unit.frost = Math.max(0, unit.frost - 1);
  }
  // 蛊结算（每层耗内6，目标行动后-1）
  if (unit.gu > 0) {
    const loss = Math.floor(unit.gu * GU_QI_COST * dotReduceMult);
    unit.qi = Math.max(0, unit.qi - loss);
    addFloater(battle, unit === battle.player ? "player" : "enemy", `-${loss}`, "qi");
    battleLog(battle, `${unit.name}蛊息扰动，失去${loss}内力。`);
    unit.gu = Math.max(0, unit.gu - 1);
  }
  // 中毒结算（每层毒伤8，每层削内4，结算后-1）
  if (unit.poison > 0) {
    const dmg = Math.floor(unit.poison * POISON_DMG * dotReduceMult);
    const qiLoss = Math.floor(unit.poison * POISON_QI * dotReduceMult);
    unit.hp = Math.max(0, unit.hp - dmg);
    unit.qi = Math.max(0, unit.qi - qiLoss);
    addFloater(battle, unit === battle.player ? "player" : "enemy", `-${dmg}`, "poison");
    if (qiLoss > 0) addFloater(battle, unit === battle.player ? "player" : "enemy", `-${qiLoss}`, "qi");
    battleLog(battle, `${unit.name}毒发攻心，受到${dmg}伤害并流失${qiLoss}内力。`);
    unit.poison = Math.max(0, unit.poison - 1);
  }
  // 断筋结算（每层削攻1，降低速度，结算后-1）
  if (unit.hamstring > 0) {
    unit.hamstring = Math.max(0, unit.hamstring - 1);
  }
  // 断脉结算（每层内力-1%，减速2%，结算后-1）
  if (unit.veinBreak > 0) {
    const qiLoss = Math.floor(unit.stats.qi * 0.01 * unit.veinBreak * dotReduceMult);
    if (qiLoss > 0) {
      unit.qi = Math.max(0, unit.qi - qiLoss);
      addFloater(battle, unit === battle.player ? "player" : "enemy", `-${qiLoss}`, "qi");
    }
    unit.veinBreak = Math.max(0, unit.veinBreak - 1);
  }
  // 失衡结算：每层 -1% DEF，-1% 速度，结算后-1
  if (unit.imbalance > 0) {
    unit.imbalance = Math.max(0, unit.imbalance - 1);
  }
  // v6.x 破防结算：每层持续 -2% DEF（不递减，破防是 debuff 不自动 -1，引爆时才-25）
  // 破防仅在 25 层引爆时由引爆代码扣 25 层，平时不动
  // 破防引爆计时器
  if (unit.breakDefenseShatter > 0) {
    unit.breakDefenseShatter--;
  }
  // 筋断力竭计时
  if (unit.atkZero > 0) {
    unit.atkZero--;
  }
  // 弱点暴露计时
  if (unit.weakpointExposed > 0) {
    unit.weakpointExposed--;
  }

  // 鲸息特性：每回合自动恢复 5% 内力（无论是否调息）
  if (unit === battle.player && battle.run?.traits?.includes("jingxi")) {
    const extraQi = Math.floor(unit.stats.qi * 0.05);
    unit.qi = Math.min(unit.stats.qi, unit.qi + extraQi);
    battleLog(battle, `【鲸息】${unit.name}恢复${extraQi}内力。`);
    addFloater(battle, "player", `+${extraQi}`, "qi");
  }
  // 内功效果：玩家回合开始（回血上限6%最大血量，回内上限10%最大内力）
  if (unit === battle.player && battle.run?.activeInternalArts?.length) {
    battle.run.activeInternalArts.forEach(id => {
      const art = DATA.internalArts[id];
      if (!art) return;
      if (art.combatEffect === "healOnTurn") {
        const healAmt = Math.floor(unit.stats.hp * 0.05);
        unit.hp = Math.min(unit.stats.hp, unit.hp + healAmt);
        const qiAmt = Math.floor(unit.stats.qi * 0.05);
        unit.qi = Math.min(unit.stats.qi, unit.qi + qiAmt);
        battleLog(battle, `【${art.name}】${unit.name}恢复${healAmt}血量、${qiAmt}内力。`);
        addFloater(battle, sideOf(battle, unit), `+${healAmt}`, "heal");
        addFloater(battle, sideOf(battle, unit), `+${qiAmt}`, "qi");
      }
      if (art.combatEffect === "qiRegen") {
        const qiAmt = Math.floor(unit.stats.qi * 0.06);
        unit.qi = Math.min(unit.stats.qi, unit.qi + qiAmt);
        battleLog(battle, `【${art.name}】${unit.name}恢复${qiAmt}内力。`);
        addFloater(battle, sideOf(battle, unit), `+${qiAmt}`, "qi");
      }
      if (art.combatEffect === "cleanse") {
        if (unit.cleanseShield > 0) unit.cleanseShield--;
        // 大罗洗髓经：每5个己方回合（第5/10/15...回合开始时），身上所有负面效果减半（取整）
        battle.turnTrackers.playerTurnCount++;
        if (battle.turnTrackers.playerTurnCount % 5 === 0) {
          const p = unit;
          const fields = ["bleed", "poison", "inner", "frost", "hamstring", "veinBreak", "gu", "imbalance", "breakDefense"];
          const before = fields.reduce((s, k) => s + (p[k] || 0), 0);
          if (before > 0) {
            fields.forEach(k => { p[k] = Math.floor((p[k] || 0) / 2); });
            battleLog(battle, `【大罗洗髓】第${battle.turnTrackers.playerTurnCount}回合，${unit.name}身上所有负面效果减半！`);
            addFloater(battle, sideOf(battle, unit), "大罗洗髓");
          }
        }
      }
    });
  }

  // 三主线Boss：回合开始结算后检查阶段触发
  if (unit === battle.enemy) checkBossPhaseTriggers(battle);
}

function applySkillEffects(run, battle, actor, target, skill, damage, multiplier = 1) {
  let stacks = skill.debuffStacks || 1;
  const weapon = run.equippedWeapon ? DATA.weapons[run.equippedWeapon] : null;

  // 武器debuff加成（绑路线）
  if (weapon && weapon.school === skill.school && (!weapon.style || weapon.style === skill.style)) {
    if (skill.debuff === "bleed" && skill.style === "bleed") stacks += weapon.debuffBonus || 0;
    if (skill.debuff === "frost" && skill.style === "frost") stacks += weapon.frostBonus || weapon.debuffBonus || 0;
    if (skill.debuff === "hamstring" && skill.style === "hamstring") stacks += weapon.hamstringBonus || weapon.debuffBonus || 0;
    if (skill.debuff === "gu" && skill.style === "gu") stacks += weapon.guBonus || weapon.debuffBonus || 0;
    if (skill.debuff === "poison" && skill.style === "poison") stacks += weapon.poisonBonus || weapon.debuffBonus || 0;
    if (skill.debuff === "breakDefense" && skill.style === "critPalm") stacks += weapon.breakDefenseBonus || 0;
  }

  if (hasStyleMastery(run, skill.style) && ["bleed", "frost", "hamstring", "gu", "poison"].includes(skill.style)) stacks += 1;
  // critPalm 流派大师碎星连震没有大师额外+1（大师只加 cap=+7）
  if (run.traits.includes("nightPoison") && skill.debuff === "poison") stacks += 1;
  if (run.traits.includes("tieyi_blood_debt") && skill.style === "bleed") stacks += 3;
  for (const trait of run.skillTraits || []) {
    if (skill.style === "poison") stacks += trait.effects?.poisonBonus || 0;
  }

  // 连击额外攻击：所有stacks减半（取整）
  if (multiplier < 1) stacks = Math.max(0, Math.round(stacks * multiplier));

  // 三主线Boss特性：免疫新负面（drainQiImmuneBurst）
  if (actor === battle.player && target === battle.enemy && battle.bossTraits.includes("drainQiImmuneBurst")) {
    if (battle.bossImmuneTurns > 0) {
      stacks = 0; // 免疫新负面
    }
  }

  // 大罗洗髓经护盾
  if (target.cleanseShield > 0 && actor === battle.enemy) {
    stacks = 0;
  }

  // 应用debuff（带上限检查）
  if (skill.debuff === "bleed" && skill.style === "bleed") {
    const cap = getDebuffCap(run, weapon, "bleed");
    target.bleed = Math.min(cap, target.bleed + stacks);
    // 25层流血引爆（仅首次命中触发，连击额外攻击不触发）
    if (multiplier >= 1 && target.bleed >= 25) {
      let burstPct = 0.15;
      // 血河断刃+饮血封喉刀 combo：引爆伤害提高至25%
      if (actor === battle.player && run) {
        const w = run.equippedWeapon ? DATA.weapons[run.equippedWeapon] : null;
        if (w?.id === "blade_bleed_red" && skill.id === "blade_red_1") {
          burstPct = 0.25;
        }
      }
      const burstDmg = Math.floor(target.hp * burstPct);
      target.hp = Math.max(0, target.hp - burstDmg);
      addFloater(battle, sideOf(battle, target), "血流如注");
      addFloater(battle, sideOf(battle, target), `-${burstDmg}`, "bleed");
      target.bleed -= 25;
      battleLog(battle, `血流如注！${target.name}流血崩裂，扣除${burstDmg}血量！`);
    }
  }
  if (skill.debuff === "poison" && skill.style === "poison") {
    const cap = getDebuffCap(run, weapon, "poison");
    target.poison = Math.min(cap, target.poison + stacks);
    // 25层中毒引爆（仅首次命中触发，连击额外攻击不触发）
    if (multiplier >= 1 && target.poison >= 25) {
      let hpPct = 0.075;
      let qiPct = 0.075;
      if (actor === battle.player && run) {
        const w = run.equippedWeapon ? DATA.weapons[run.equippedWeapon] : null;
        if (w?.id === "hidden_poison_red" && skill.id === "hidden_red_1") {
          hpPct = 0.15;
          qiPct = 0.15;
        }
      }
      const hpDmg = Math.floor(target.hp * hpPct);
      const qiDmg = Math.floor(target.qi * qiPct);
      target.hp = Math.max(0, target.hp - hpDmg);
      target.qi = Math.max(0, target.qi - qiDmg);
      target.poison -= 25;
      battleLog(battle, `毒素爆发！${target.name}毒发攻心，扣除${hpDmg}血量、${qiDmg}内力！`);
      addFloater(battle, sideOf(battle, target), "毒入骨髓");
      addFloater(battle, sideOf(battle, target), `-${hpDmg}`, "poison");
      if (qiDmg > 0) addFloater(battle, sideOf(battle, target), `-${qiDmg}`, "qi");
    }
  }
  if (skill.debuff === "inner" && skill.style === "qiBreak") {
    const cap = getDebuffCap(run, weapon, "inner");
    target.inner = Math.min(cap, target.inner + stacks);
  }
  if (skill.debuff === "breakDefense" && skill.style === "critPalm") {
    const cap = getDebuffCap(run, weapon, "breakDefense");
    const before = target.breakDefense;
    target.breakDefense = Math.min(cap, target.breakDefense + stacks);
    const actual = target.breakDefense - before;
    if (actual > 0) {
      addFloater(battle, sideOf(battle, target), `破防+${actual}`, "breakDefense");
    }
    // 25层破防引爆（仅首次命中触发，连击额外攻击不触发）
    if (multiplier >= 1 && target.breakDefense >= 25) {
      // 红武器+红武功协同：清零持续3回合，否则2回合
      const isSynergy = (weapon && weapon.school === "fist" && weapon.style === "critPalm"
                         && weapon.rarity === "red" && skill.rarity === "red");
      const shatterTurns = isSynergy ? 3 : 2;
      target.breakDefense -= 25;
      target.breakDefenseShatter = shatterTurns;
      battleLog(battle, `破防一击！${target.name}防御直接归零，持续${shatterTurns}回合！`);
      addFloater(battle, sideOf(battle, target), `破防一击×${shatterTurns}`);
    }
  }
  if (skill.debuff === "frost") {
    const cap = getDebuffCap(run, weapon, "frost");
    target.frost = Math.min(cap, target.frost + stacks);
    drainQiByStyle(run, target, skill, 12 + stacks * 4);
    // 25层寒气引爆：极度寒冷（冰冻1回合）
    if (multiplier >= 1 && target.frost >= 25) {
      target.frozen = 1;
      target.frost -= 25;
      battleLog(battle, `极度寒冷！${target.name}被冰封，下回合无法行动！`);
      addFloater(battle, sideOf(battle, target), "极度寒冷");
    }
  }
  if (skill.debuff === "hamstring") {
    const cap = getDebuffCap(run, weapon, "hamstring");
    target.hamstring = Math.min(cap, target.hamstring + stacks);
    battleLog(battle, `${target.name}筋脉受创！`);
    // 25层断筋引爆：筋断力竭（攻击归零2回合）
    if (multiplier >= 1 && target.hamstring >= 25) {
      target.atkZero = 2;
      target.hamstring -= 25;
      battleLog(battle, `筋断力竭！${target.name}筋脉尽废，攻击归零2回合！`);
      addFloater(battle, sideOf(battle, target), "筋断力竭");
    }
  }
  // 25层失衡引爆：weakpointExposed（真伤受到倍数伤害，持续2回合）
  if (skill.debuff === "imbalance" || skill.style === "lowKick") {
    if (multiplier >= 1 && target.imbalance >= 25) {
      target.imbalance -= 25;
      // v6.9：协同奖励仅限红武器+红武功 → 4.0x；否则3.0x
      const weapon = run.equippedWeapon ? DATA.weapons[run.equippedWeapon] : null;
      const imbMult = (weapon && weapon.school === "lightness" && weapon.style === "lowKick"
                       && weapon.rarity === "red" && skill.rarity === "red") ? 4.0 : 3.0;
      target.weakpointExposed = 2;
      target.imbalanceMult = imbMult;
      battleLog(battle, `弱点暴露！${target.name}防御崩坏，受到真伤时承受${imbMult.toFixed(2)}倍伤害！`);
      addFloater(battle, sideOf(battle, target), `弱点暴露×${imbMult.toFixed(2)}`);
    }
  }
  if (skill.debuff === "gu") {
    // 每己方回合最多扰乱CD一次
    const cap = getDebuffCap(run, weapon, "gu");
    target.gu = Math.min(cap, target.gu + stacks);
    if (battle.turnTrackers.guDisrupts < 1) {
      for (const id of Object.keys(target.cooldowns)) target.cooldowns[id] += 1;
      battle.turnTrackers.guDisrupts++;
    }
  }
  if (skill.style === "qiBreak") {
    const maxDrain = Math.floor(target.stats.qi * 0.25);
    drainQiByStyle(run, target, skill, Math.min(maxDrain, 10 + stacks * 10));
  }
  if (skill.style === "poison") drainQiByStyle(run, target, skill, 8 + stacks * 4);
  if (skill.style === "qiBreak" && hasStyleMastery(run, skill.style) && target.qi <= 0) {
    const w = run.equippedWeapon ? DATA.weapons[run.equippedWeapon] : null;
    const boost = w?.qiBreakCollapseBonus ? 1.3 : 1;
    const collapse = Math.max(18, Math.floor(damage * 0.22 * boost));
    target.hp = Math.max(0, target.hp - collapse);
    battleLog(battle, `${target.name}内息崩散，额外受到${collapse}伤害。`);
  }
  // 虚玄无相功：攻击吸对方5%内力，自身增加等量
  if (actor === battle.player && run?.activeInternalArts?.length) {
    run.activeInternalArts.forEach(id => {
      const art = DATA.internalArts[id];
      if (art?.combatEffect === "stealQi" && target.qi > 0) {
        const drainAmt = Math.max(1, Math.floor(target.qi * 0.05));
        const drained = Math.min(drainAmt, target.qi);
        target.qi -= drained;
        actor.qi = Math.min(actor.stats.qi, actor.qi + drained);
        battleLog(battle, `【虚玄无相功】${actor.name}吸取${target.name}内力${drained}点。`);
      }
    });
  }
  if (skill.style === "steal" && actor === battle.player) {
    // 每己方回合最多1次
    if (battle.turnTrackers.stealTriggers < 1) {
      const got = stealMoneyValue(run, skill);
      run.money += got;
      battleLog(battle, `${actor.name}顺势取利，获得${got}金钱。`);
      addFloater(battle, "player", `+${got}钱`);
      battle.turnTrackers.stealTriggers++;
    }
  }
  // 终极技能即时效果（红武立即触发，仅首次命中触发）
  if (multiplier >= 1 && skill.rarity === "red") {
    if (skill.style === "bleed" && !skill.noImmediateSettle) {
      const bleedDmg = target.bleed * BLEED_DMG;
      if (bleedDmg > 0) {
        target.hp = Math.max(0, target.hp - bleedDmg);
        let burstExtra = 0;
        const w = run.equippedWeapon ? DATA.weapons[run.equippedWeapon] : null;
        if (w?.bleedBurstPct) {
          burstExtra = Math.floor(bleedDmg * w.bleedBurstPct / 100);
          target.hp = Math.max(0, target.hp - burstExtra);
        }
        battleLog(battle, `血刃封喉！${target.name}流血立即结算，受到${bleedDmg}${burstExtra ? `（+${burstExtra}引爆）` : ""}伤害。`);
        addFloater(battle, sideOf(battle, target), "血流如注");
        addFloater(battle, sideOf(battle, target), `-${bleedDmg}`, "bleed");
        if (burstExtra > 0) addFloater(battle, sideOf(battle, target), `-${burstExtra}`, "bleed");
      }
    }
    if (skill.style === "frost") {
      const frostDrain = target.frost * 8;
      if (frostDrain > 0) {
        target.qi = Math.max(0, target.qi - frostDrain);
        battleLog(battle, `寒意彻骨！${target.name}内力立即流失${frostDrain}。`);
        addFloater(battle, sideOf(battle, target), `-${frostDrain}`, "qi");
      }
    }
    if (skill.style === "hamstring") {
      const hamDmg = target.hamstring * 12;
      if (hamDmg > 0) {
        target.hp = Math.max(0, target.hp - hamDmg);
        battleLog(battle, `天残断筋！${target.name}筋脉伤发，受到${hamDmg}伤害。`);
        addFloater(battle, sideOf(battle, target), "筋断");
        addFloater(battle, sideOf(battle, target), `-${hamDmg}`, "bleed");
      }
    }
    if (skill.style === "poison" && !skill.noImmediateSettle) {
      const poisonDmg = target.poison * POISON_DMG;
      const poisonQiLoss = target.poison * POISON_QI;
      if (poisonDmg > 0 || poisonQiLoss > 0) {
        target.hp = Math.max(0, target.hp - poisonDmg);
        target.qi = Math.max(0, target.qi - poisonQiLoss);
        battleLog(battle, `毒发攻心！${target.name}毒伤立即结算，受到${poisonDmg}伤害并流失${poisonQiLoss}内力。`);
        addFloater(battle, sideOf(battle, target), "毒入骨髓");
        addFloater(battle, sideOf(battle, target), `-${poisonDmg}`, "poison");
        if (poisonQiLoss > 0) addFloater(battle, sideOf(battle, target), `-${poisonQiLoss}`, "qi");
      }
    }
    if (skill.style === "gu") {
      let cdAdded = 0;
      for (const id of Object.keys(target.cooldowns)) {
        target.cooldowns[id] += 1;
        cdAdded++;
      }
      if (cdAdded > 0) {
        battleLog(battle, `蛊息爆发！${target.name}所有招式冷却+1。`);
        addFloater(battle, sideOf(battle, target), "蛊乱");
      }
    }
    // 失衡：真伤腿法命中时叠失衡
    if (skill.style === "lowKick") {
      const trait = skill.trait;
      let imbBonus = trait?.effects?.imbalanceBonus || 0;
      // 武器也可带失衡加成
      if (weapon && weapon.school === "lightness" && weapon.style === "lowKick" && weapon.imbalanceBonus) {
        imbBonus += weapon.imbalanceBonus;
      }
      if (hasStyleMastery(run, "lowKick")) imbBonus += 1;  // v6.8：地裂无声失衡额外+1
      // 弹屏：明确告诉玩家代码走到了腿法叠失衡
      addFloater(battle, sideOf(battle, target), `腿法进入 imbalanceBonus=${trait?.effects?.imbalanceBonus}`, "imbalance");
      console.log("[低盘腿法] skill=" + skill.id + " style=" + skill.style + " trait=" + JSON.stringify(trait?.effects) + " weapon=" + (weapon?.id||"none") + " imbBonus=" + imbBonus + " target.imbalance=" + target.imbalance);
      if (imbBonus > 0) {
        const cap = getDebuffCap(run, weapon, "imbalance");
        target.imbalance = Math.min(cap, target.imbalance + imbBonus);
        if (Math.random() < 1) {  // 总是显示
          addFloater(battle, sideOf(battle, target), `失衡+${imbBonus}`, "imbalance");
        }
      } else {
        // imbBonus=0 原因排查
        addFloater(battle, sideOf(battle, target), `imbBonus=0! trait=${JSON.stringify(trait?.effects)}`, "imbalance");
      }
    }
  }

  // 内功效果：命中时
  if (actor === battle.player && battle.run?.activeInternalArts?.length) {
    battle.run.activeInternalArts.forEach(id => {
      const art = DATA.internalArts[id];
      if (!art) return;
      if (art.combatEffect === "frostOnHit" && battle.turnTrackers.frostHits < 1) {
        const cap = getDebuffCap(run, weapon, "frost");
        target.frost = Math.min(cap, target.frost + 1);
        battleLog(battle, `【${art.name}】${target.name}被附加1层寒气！`);
        battle.turnTrackers.frostHits++;
      }
      if (art.combatEffect === "drainQi") {
        const drain = Math.min(target.qi, Math.floor(target.qi * 0.08), 40);
        target.qi -= drain;
        actor.qi = Math.min(actor.stats.qi, actor.qi + drain);
        if (drain > 0) battleLog(battle, `【${art.name}】汲取${target.name}${drain}点内力！`);
      }
    });
  }
}

function getDebuffCap(run, weapon, type, bossWeapon = null) {
  let cap = DEBUFF_CAPS[type] || 12;
  // Player weapon cap bonus
  if (weapon) {
    if (type === "bleed" && weapon.bleedCapBonus) cap += weapon.bleedCapBonus;
    if (type === "frost" && weapon.frostCapBonus) cap += weapon.frostCapBonus;
    if (type === "hamstring" && weapon.hamstringCapBonus) cap += weapon.hamstringCapBonus;
    if (type === "veinBreak" && weapon.veinBreakCapBonus) cap += weapon.veinBreakCapBonus;
    if (type === "gu" && weapon.guCapBonus) cap += weapon.guCapBonus;
    if (type === "poison" && weapon.poisonCapBonus) cap += weapon.poisonCapBonus;
    if (type === "imbalance" && weapon.imbalanceCapBonus) cap += weapon.imbalanceCapBonus;
    if (type === "breakDefense" && weapon.breakDefenseCapBonus) cap += weapon.breakDefenseCapBonus;
  }
  // Boss weapon cap bonus
  if (bossWeapon) {
    if (type === "bleed" && bossWeapon.bleedCapBonus) cap += bossWeapon.bleedCapBonus;
    if (type === "frost" && bossWeapon.frostCapBonus) cap += bossWeapon.frostCapBonus;
    if (type === "hamstring" && bossWeapon.hamstringCapBonus) cap += bossWeapon.hamstringCapBonus;
    if (type === "veinBreak" && bossWeapon.veinBreakCapBonus) cap += bossWeapon.veinBreakCapBonus;
    if (type === "gu" && bossWeapon.guCapBonus) cap += bossWeapon.guCapBonus;
    if (type === "poison" && bossWeapon.poisonCapBonus) cap += bossWeapon.poisonCapBonus;
  }
  if (hasStyleMastery(run, type)) {
    if (type === "bleed") cap += 7;
    if (type === "poison") cap += 7;
    if (type === "imbalance") cap += 7;  // v6.8：地裂无声失衡上限+7
    if (type === "breakDefense") cap += 7;  // v6.x：碎星连震破防上限+7
  }
  return cap;
}

function calcDamage(run, battle, actor, target, skill) {
  let dmg = baseSkillDamage(run, actor, target, skill);
  const weapon = run.equippedWeapon ? DATA.weapons[run.equippedWeapon] : null;

  // 武器伤害加成（绑路线）
  if (weapon && weapon.school === skill.school && (!weapon.style || weapon.style === skill.style)) {
    if (weapon.damagePct) dmg = Math.floor(dmg * (1 + weapon.damagePct / 100));
  }
  if (run.traits.includes("force")) dmg = Math.floor(dmg * 1.02);

  // 暴击（毒/流血/真伤/金钱不暴击）
  const noCrit = skill.style === "poison" || skill.style === "bleed" || skill.style === "lowKick" || skill.style === "coin";
  if (!noCrit && Math.random() * 100 < critChance(run, actor, skill)) {
    let cm = critMultiplier(run, skill, actor);
    (run.activeInternalArts || []).forEach(id => {
      const art = DATA.internalArts[id];
      if (art?.combatEffect === "critUp") cm += 1.5;
    });
    dmg = Math.floor(dmg * cm);
    battle._lastCrit = true;
    battle._lastCritMult = cm;  // v6.6：记录暴击倍率供浮字显示
    battleLog(battle, `暴击！×${cm.toFixed(1)}倍`);
  }
  if (target.guard) dmg = Math.floor(dmg * 0.55);
  // v6.8：真伤腿法命中时，失衡>0 时真伤额外受到 3%/层 伤害
  if (skill.style === "lowKick" && target.imbalance > 0) {
    const imbPct = target.imbalance * 0.03;
    dmg = Math.floor(dmg * (1 + imbPct));
  }
  // v6.9：弱点暴露：25层后真伤受到imbMult倍伤害，持续2回合
  if (target.weakpointExposed > 0 && skill.style === "lowKick") {
    const imbMult = target.imbalanceMult || 3.0;
    dmg = dmg * imbMult;
    battleLog(battle, `【弱点暴露】${target.name}真伤受到${imbMult.toFixed(2)}倍伤害！`);
  }
  return dmg;
}

function heal(run, target, amount) {
  let value = amount;
  if (run.treasure.effect === "healPlus") value = Math.floor(value * 1.2);
  if (run.traits.includes("healer")) value = Math.floor(value * 1.25);
  target.hp = Math.min(target.stats.hp, target.hp + value);
  return value;
}

function hitChance(actor, target) {
  return clamp(100 + effectiveHit(actor) - effectiveDodge(target), 5, 100);
}

function effectiveAtk(unit) {
  if (!unit || !unit.stats) { console.error("[effectiveAtk] unit or unit.stats is undefined"); return 1; }
  // 筋断力竭：攻击归零
  if (unit.atkZero > 0) return 0;
  let atk = unit.stats.atk;
  if (unit.poison > 0) atk -= unit.poison * 2;
  if (unit.hamstring > 0) atk -= Math.floor(unit.stats.atk * 0.02 * unit.hamstring);
  // 临时Buff：攻击力加成
  if (unit.tempBuffs?.atk) atk = Math.floor(atk * unit.tempBuffs.atk.mult);
  // 断筋最低降至65%
  const minAtk = Math.floor(unit.stats.atk * ATK_MIN_HAMSTRING);
  return Math.max(minAtk, Math.max(1, atk));
}

function baseSkillDamage(run, actor, target, skill) {
  if (skill.style === "coin") return coinDamageValue(run, skill);
  if (skill.style === "lowKick") return Math.max(1, Math.floor(skill.power * 0.72 + effectiveAtk(actor) * 0.65 + trueDamageBonus(run, skill)));
  return Math.max(1, Math.floor(skill.power + effectiveAtk(actor) - effectiveDef(target)));
}

function skillQiCost(actor, skill, run) {
  if (skill.tags?.includes("coin")) return 0;
  let cost = skill.qi + (actor.gu || 0) * GU_QI_COST;
  // 虚玄无相功：招式内力消耗-30%（降耗最高40%）
  (run?.activeInternalArts || []).forEach(id => {
    const art = DATA.internalArts[id];
    if (art?.combatEffect === "qiReduce") cost = Math.floor(cost * 0.70);
  });
  return cost;
}

function skillMoneyCost(battle, skill) {
  if (!skill.tags?.includes("coin")) return 0;
  const weapon = battle.run.equippedWeapon ? DATA.weapons[battle.run.equippedWeapon] : null;
  const reduce = weapon?.coinCostReduce ? 0.7 : 1;
  if (hasStyleMastery(battle.run, "coin")) return Math.floor((skill.rarity === "red" ? 180 : skill.rarity === "orange" ? 105 : 55) * reduce * 0.7);
  return Math.floor((skill.rarity === "red" ? 180 : skill.rarity === "orange" ? 105 : 55) * reduce);
}

function coinDamageValue(run, skill) {
  let base = skill.rarity === "red" ? 600 : skill.rarity === "orange" ? 220 : 60;
  const weapon = run.equippedWeapon ? DATA.weapons[run.equippedWeapon] : null;
  if (weapon && weapon.school === "hidden" && weapon.style === "coin") base += weapon.coinDamageBonus || 0;
  if (hasStyleMastery(run, "coin")) base += 40;
  return base;
}

function trueDamageBonus(run, skill) {
  let value = 0;
  const weapon = run.equippedWeapon ? DATA.weapons[run.equippedWeapon] : null;
  if (weapon && weapon.school === "lightness" && weapon.style === "lowKick") value += weapon.trueDamageBonus || 0;
  if (hasStyleMastery(run, skill.style)) value += 100;  // v6.7：地裂无声真伤+30→+100
  if (skill.trueDamage) value += skill.trueDamage;
  return value;
}

function drainQiByStyle(run, target, skill, amount) {
  let value = amount;
  const weapon = run.equippedWeapon ? DATA.weapons[run.equippedWeapon] : null;
  if (weapon && weapon.school === skill.school && (!weapon.style || weapon.style === skill.style)) value += weapon.qiBreakBonus || 0;
  if (hasStyleMastery(run, skill.style)) value += 20;
  target.qi = Math.max(0, target.qi - value);
}

function stealMoneyValue(run, skill) {
  let value = skill.rarity === "red" ? 150 : skill.rarity === "orange" ? 60 : 20;
  const weapon = run.equippedWeapon ? DATA.weapons[run.equippedWeapon] : null;
  if (weapon && weapon.school === "lightness" && weapon.style === "steal") value += weapon.moneyBonus || 0;
  if (hasStyleMastery(run, skill.style)) value += 30;
  return value;
}

function effectiveDef(unit) {
  if (!unit || !unit.stats) { console.error("[effectiveDef] unit or unit.stats is undefined"); return 0; }
  // 破防引爆期间：DEF 直接归零
  if (unit.breakDefenseShatter > 0) return 0;
  // 破防层数累乘：每层 -3% DEF（即保留 0.97）
  const base = unit.defBase > 0 ? unit.defBase : unit.stats.def;
  const n = unit.breakDefense || 0;
  const defMul = Math.pow(0.97, n);
  let def = (base - unit.poison * 2) * defMul;
  return Math.max(0, Math.floor(def));
}

function effectiveHit(unit) {
  if (!unit || !unit.stats) { console.error("[effectiveHit] unit or unit.stats is undefined"); return 1; }
  return Math.max(1, unit.stats.hit - unit.poison * 2);
}

function effectiveDodge(unit) {
  if (!unit || !unit.stats) { console.error("[effectiveDodge] unit or unit.stats is undefined"); return 0; }
  return Math.max(0, unit.stats.dodge - unit.poison * 2);
}

function effectiveSpeed(unit, battle = null) {
  if (!unit || !unit.stats) { console.error("[effectiveSpeed] unit or unit.stats is undefined"); return 1; }
  let spd = unit.stats.speed;
  if (unit.poison > 0) spd -= unit.poison * 0.04;
  if (unit.frost > 0) spd -= unit.frost * FROST_SLOW;
  if (unit.hamstring > 0) spd -= unit.hamstring * HAMSTRING_SLOW;
  if (unit.veinBreak > 0) spd -= unit.veinBreak * 0.02;
  if (unit.gu > 0) spd -= unit.gu * 0.02;
  // 临时Buff：速度加成
  if (unit.tempBuffs?.speed) spd *= unit.tempBuffs.speed.mult;
  // hamstringCap Boss特性：玩家速度最低被压到70%（而非默认的60%）
  if (unit === battle?.player && battle?.bossTraits?.includes("hamstringCap")) {
    const minSpd = unit.stats.speed * 0.7;
    return Math.max(minSpd, Math.max(0.25, spd));
  }
  // 寒气最低60%速度
  const minFromFrost = unit.stats.speed * SPEED_MIN_FROST;
  return Math.max(minFromFrost, Math.max(0.25, spd));
}

function critChance(run, actor, skill) {
  let value = actor.stats.crit + (skill.school === "blade" ? 8 : 0) + (skill.style === "critPalm" ? 12 : 0);
  const weapon = run.equippedWeapon ? DATA.weapons[run.equippedWeapon] : null;
  if (weapon && weapon.school === skill.school && weapon.style === skill.style) value += weapon.critBonus || 0;
  if (hasStyleMastery(run, skill.style) && skill.style === "critPalm") value += 10;  // v6.8：碎星连震 crit+10
  // 临时Buff：暴击概率加成
  if (actor.tempBuffs?.crit) value += actor.tempBuffs.crit.critAdd || 0;
  // v6.8：取消暴击率上限
  return Math.max(0, value);
}

function critMultiplier(run, skill, actor = null) {
  let value = 2;
  for (const trait of run.skillTraits || []) value += trait.effects?.critPower || 0;
  const weapon = run.equippedWeapon ? DATA.weapons[run.equippedWeapon] : null;
  if (weapon && weapon.school === skill.school && weapon.style === skill.style) value += weapon.critPower || 0;
  if (hasStyleMastery(run, skill.style) && skill.style === "critPalm") value += 1;  // v6.8：碎星连震 critPower+1
  if (skill.school === "blade") value += 0.1;
  // 临时Buff：暴击倍率加成
  if (actor?.tempBuffs?.crit) value += actor.tempBuffs.crit.critPowerAdd || 0;
  // v6.6：取消暴击倍率上限（原来 clamp 2~2.8）
  return Math.max(2, value);
}

function comboChance(run, skill, actor) {
  const weapon = run.equippedWeapon ? DATA.weapons[run.equippedWeapon] : null;
  let value = actor.stats.combo;
  if (weapon && weapon.school === "fist" && weapon.style === "combo") value += weapon.comboBonus || 0;
  // 临时Buff：连击概率加成
  if (actor.tempBuffs?.crit) value += actor.tempBuffs.crit.comboAdd || 0;
  return clamp(value, 0, 85);
}

function hasStyleMastery(run, style) {
  const trait = DATA.styleTraits?.[style];
  return !!trait && (run.skillTraits || []).some(t => t.id === trait.id);
}

function battleLog(battle, text) {
  battle.log.unshift(text);
  battle.log = battle.log.slice(0, 40);
}

function addFloater(battle, side, text, type) {
  battle.floaters ||= [];
  // 随机偏移：水平 -50~+50，垂直起始 -25~0，让多个数字散开不重叠
  const ox = Math.round((Math.random() - 0.5) * 100);
  const oy = Math.round(Math.random() * -25);
  battle.floaters.push({ id: Date.now() + Math.random(), side, text, type: type || "", ox, oy, born: Date.now() });
  // 创建持久DOM元素，CSS动画独立驱动（不受render频率影响）
  createBattleFloater(side, text, type, ox, oy);
  // 清理超过 1 秒的旧浮字
  const now = Date.now();
  battle.floaters = battle.floaters.filter(f => now - (f.born || 0) < 1000).slice(-12);
}

function sideOf(battle, unit) {
  return unit === battle.player ? "player" : "enemy";
}

function endActorTurn(run, battle, actor) {
  Object.keys(actor.cooldowns).forEach(id => {
    actor.cooldowns[id] = Math.max(0, actor.cooldowns[id] - 1);
  });
  if (actor.guard) actor.guard = 0;
  if (actor === battle.player) {
    battle.palmChainCount = 0;
  }
  actor.gauge = 0;
  // 临时Buff持续时间递减
  if (actor.tempBuffs) {
    for (const [type, buff] of Object.entries(actor.tempBuffs)) {
      buff.duration--;
      if (buff.duration <= 0) {
        delete actor.tempBuffs[type];
      }
    }
  }
  battle.phase = "running";
  battle.actor = null;
  return checkBattleEnd(battle);
}

function checkBattleEnd(battle) {
  if (battle.enemy.hp <= 0) return { ended: true, winner: "player" };
  if (battle.player.hp <= 0) return { ended: true, winner: "enemy" };
  return { ended: false };
}

// ============================================================
// 三主线Boss特性系统（v0.34）
// ============================================================

// 每回合Boss行动前调用：应用持续特性（v5.18：多trait迭代）
function applyBossTurnMechanics(battle) {
  const e = battle.enemy;
  const p = battle.player;
  const traits = battle.bossTraits;
  if (!traits || !traits.length) return;
  battle.bossTurnCounter = (battle.bossTurnCounter || 0) + 1;
  const turn = battle.bossTurnCounter;
  // Boss武器
  const bossWeaponObj = e.weapon ? DATA.weapons[e.weapon] : null;

  for (const trait of traits) {

  if (trait === "bleedPer3") {
    // 每3回合对玩家叠加2层流血
    if (turn % 3 === 0) {
      const cap = getDebuffCap(battle.run, null, "bleed", bossWeaponObj);
      p.bleed = Math.min(cap, p.bleed + 2);
      battleLog(battle, `${e.name}刀势逼人，你被叠加2层流血！`);
      addFloater(battle, "player", "流血+2");
    }
  }

  if (trait === "poisonGuPerTurn") {
    // 每回合毒+1蛊+1
    const poisonCap = getDebuffCap(battle.run, null, "poison", bossWeaponObj);
    const guCap = getDebuffCap(battle.run, null, "gu", bossWeaponObj);
    p.poison = Math.min(poisonCap, p.poison + 1);
    p.gu = Math.min(guCap, p.gu + 1);
    battleLog(battle, `${e.name}的攻势带来毒和蛊！`);
    addFloater(battle, "player", "毒+1 蛊+1");
  }

  if (trait === "drainQiImmuneBurst") {
    // 每回合吸内
    const drain = Math.max(1, Math.floor(p.qi * 0.12));
    if (drain > 0 && p.qi > 0) {
      p.qi = Math.max(0, p.qi - drain);
      e.qi = Math.min(e.stats.qi, e.qi + drain);
      battleLog(battle, `${e.name}吸取了你的内力${drain}点！`);
      addFloater(battle, "player", `-${drain}内力`);
    }
    // 前3回合免疫负面：递减
    if (battle.bossImmuneTurns > 0) {
      battle.bossImmuneTurns--;
      if (battle.bossImmuneTurns <= 0) {
        battleLog(battle, `${e.name}的护体消失了！`);
      }
    }
    // 内力低时爆发
    if (e.qi < e.stats.qi * 0.3 && !battle.bossPhaseTriggered["lowQi"]) {
      e.stats.atk = Math.floor(e.stats.atk * 1.2);
      battle.bossPhaseTriggered["lowQi"] = true;
      battleLog(battle, `${e.name}内力激荡，攻击大幅提升！`);
      addFloater(battle, "enemy", "内力爆发");
    }
  }

  if (trait === "highHitPoison") {
    // 毒层自然衰减（每回合毒-1）
    if (p.poison > 0) {
      p.poison = Math.max(0, p.poison - 1);
    }
  }

  if (trait === "drainQiLowShield") {
    // 命中吸内（在enemyAction中处理）
    // 低血护体检测在checkBossPhaseTriggers中
  }

  // ======== 小Boss特性（保留向后兼容）========
  if (trait === "miniBleed") {
    // 每回合流血+5（已废弃，孤云线改用bloodBlade/venomInfuse）
    if (p.cleanseShield > 0) continue;
    const cap = getDebuffCap(battle.run, null, "bleed", bossWeaponObj);
    p.bleed = Math.min(cap, p.bleed + 5);
    battleLog(battle, `${e.name}的刀锋带来流血！`);
    addFloater(battle, "player", "流血+5");
  }

  if (trait === "miniFrost") {
    // 每回合寒气+5（已废弃，孤云线改用chillAura）
    if (p.cleanseShield > 0) continue;
    const cap = getDebuffCap(battle.run, null, "frost", bossWeaponObj);
    p.frost = Math.min(cap, p.frost + 5);
    battleLog(battle, `${e.name}的剑锋带来寒气！`);
    addFloater(battle, "player", "寒气+5");
  }

  if (trait === "miniHamstring") {
    // 断筋+2
    const cap = getDebuffCap(battle.run, null, "hamstring", bossWeaponObj);
    p.hamstring = Math.min(cap, p.hamstring + 2);
    battleLog(battle, `${e.name}的刀式断筋削攻！`);
    addFloater(battle, "player", "断筋+2");
    // 25层断筋引爆：筋断力竭
    if (p.hamstring >= 25) {
      p.atkZero = 2;
      p.hamstring -= 25;
      battleLog(battle, `筋断力竭！${p.name}筋脉尽废，攻击归零2回合！`);
      addFloater(battle, "player", "筋断力竭");
    }
  }

  if (trait === "miniGu") {
    // 蛊+2，增加耗内
    const cap = getDebuffCap(battle.run, null, "gu");
    p.gu = Math.min(cap, p.gu + 2);
    battleLog(battle, `${e.name}给你下蛊！`);
    addFloater(battle, "player", "蛊+2");
  }

  if (trait === "miniCoin") {
    // 每2回合一次必中固定伤害
    if (turn % 2 === 0) {
      const coinDmg = 220;
      let actualDmg = coinDmg;
      if (battle.run.equippedArmor) {
        const armor = DATA.armors[battle.run.equippedArmor];
        if (armor?.dragonGuard && battle.dragonGuardHp > 0) {
          const absorbed = Math.min(actualDmg, battle.dragonGuardHp);
          const hadShield = battle.dragonGuardHp;
          battle.dragonGuardHp -= absorbed;
          actualDmg -= absorbed;
          if (absorbed > 0) {
            battleLog(battle, `【龙鳞重甲】护体吸收${absorbed}伤害！（剩余护体${battle.dragonGuardHp}）`);
            addFloater(battle, "player", "护体");
          }
          if (hadShield > 0 && battle.dragonGuardHp <= 0) {
            battleLog(battle, `【龙鳞重甲】护体破碎！`);
            addFloater(battle, "player", "护体破碎");
          }
        }
        if (armor?.lowHpGuard && p.hp / p.stats.hp <= (armor.lowHpThreshold || 0.3)) {
          const reduced = actualDmg - Math.floor(actualDmg * (1 - armor.lowHpGuard));
          actualDmg = Math.floor(actualDmg * (1 - armor.lowHpGuard));
          battleLog(battle, `【${armor.name}】低血减伤，伤害降低${Math.floor(armor.lowHpGuard * 100)}%！`);
        }
      }
      if (p.guard) actualDmg = Math.floor(actualDmg * 0.55);
      p.hp = Math.max(0, p.hp - actualDmg);
      battleLog(battle, `${e.name}掷出金钱镖，造成${actualDmg}必中伤害！`);
      addFloater(battle, "player", `-${actualDmg}必中`);
    }
  }

  // ======== miniPoison（保留向后兼容）========
  if (trait === "miniPoison") {
    if (p.cleanseShield > 0) continue;
    const cap = getDebuffCap(battle.run, null, "poison", bossWeaponObj);
    p.poison = Math.min(cap, p.poison + 5);
    battleLog(battle, `${e.name}的攻势带来毒素！`);
    addFloater(battle, "player", "中毒+5");
  }

  // ======== 孤云线新特性（v6.0）========
  // hamstringStrike（断筋）：每回合断筋+n(n=rank)
  if (trait === "hamstringStrike") {
    if (p.cleanseShield > 0) continue;
    const rank = e.stats.rank || 1;
    let stacks = Math.min(rank, 3);
    // Boss武器debuff加成
    if (bossWeaponObj && bossWeaponObj.hamstringBonus) stacks += bossWeaponObj.hamstringBonus;
    const cap = getDebuffCap(battle.run, null, "hamstring", bossWeaponObj);
    p.hamstring = Math.min(cap, p.hamstring + stacks);
    battleLog(battle, `${e.name}断筋削攻！`);
    addFloater(battle, "player", `断筋+${stacks}`);
    // 25层断筋引爆：筋断力竭（攻击归零2回合）
    if (p.hamstring >= 25) {
      p.atkZero = 2;
      p.hamstring -= 25;
      battleLog(battle, `筋断力竭！${p.name}筋脉尽废，攻击归零2回合！`);
      addFloater(battle, "player", "筋断力竭");
    }
  }

  // veinBreak（断脉）：每回合断脉+n(n=rank)
  if (trait === "veinBreak") {
    if (p.cleanseShield > 0) continue;
    const rank = e.stats.rank || 1;
    let stacks = Math.min(rank, 3);
    // Boss武器debuff加成
    if (bossWeaponObj && bossWeaponObj.veinBreakBonus) stacks += bossWeaponObj.veinBreakBonus;
    const cap = getDebuffCap(battle.run, null, "veinBreak", bossWeaponObj);
    p.veinBreak = Math.min(cap, p.veinBreak + stacks);
    battleLog(battle, `${e.name}断脉削内！`);
    addFloater(battle, "player", `断脉+${stacks}`);
    // 25层断脉引爆：脉路全封（扣除最大内力25%）
    if (p.veinBreak >= 25) {
      const qiLoss = Math.floor(p.stats.qi * 0.25);
      p.qi = Math.max(0, p.qi - qiLoss);
      p.veinBreak -= 25;
      battleLog(battle, `脉路全封！${p.name}经脉崩摧，丧失${qiLoss}内力！`);
      addFloater(battle, "player", "脉路全封");
      if (qiLoss > 0) addFloater(battle, "player", `-${qiLoss}`, "qi");
    }
  }

  // chillAura（寒气逼人）：每回合寒气+rank
  if (trait === "chillAura") {
    if (p.cleanseShield > 0) continue;
    const rank = e.stats.rank || 1;
    let stacks = rank;
    // Boss武器debuff加成
    if (bossWeaponObj && bossWeaponObj.frostBonus) stacks += bossWeaponObj.frostBonus;
    const cap = getDebuffCap(battle.run, null, "frost", bossWeaponObj);
    p.frost = Math.min(cap, p.frost + stacks);
    battleLog(battle, `${e.name}寒气逼人！`);
    addFloater(battle, "player", `寒气+${stacks}`);
    // 25层寒气引爆：极度寒冷（冰冻1回合）
    if (p.frost >= 25) {
      p.frozen = 1;
      p.frost -= 25;
      battleLog(battle, `极度寒冷！${p.name}被冰封，下回合无法行动！`);
      addFloater(battle, "player", "极度寒冷");
    }
  }

  // bloodBlade（血刃）：每回合流血+n(n=rank)，上限由武器决定（基础15+武器bonus）；25层引爆血流如注
  if (trait === "bloodBlade") {
    if (p.cleanseShield > 0) continue;
    const rank = e.stats.rank || 1;
    let stacks = Math.min(rank, 3);
    // Boss武器debuff加成
    if (bossWeaponObj && bossWeaponObj.bleedBonus) stacks += bossWeaponObj.bleedBonus;
    const cap = getDebuffCap(battle.run, null, "bleed", bossWeaponObj);
    p.bleed = Math.min(cap, p.bleed + stacks);
    battleLog(battle, `${e.name}血刃添伤！`);
    addFloater(battle, "player", `流血+${stacks}`);
    // 25层流血引爆：血流如注
    if (p.bleed >= 25) {
      const burstDmg = Math.floor(p.hp * 0.15);
      p.hp = Math.max(0, p.hp - burstDmg);
      p.bleed -= 25;
      battleLog(battle, `血流如注！${p.name}流血崩裂，扣除${burstDmg}血量！`);
      addFloater(battle, "player", "血流如注");
      addFloater(battle, "player", `-${burstDmg}`, "bleed");
    }
  }

  // venomInfuse（淬毒）：每回合毒+n(n=rank)，上限由武器决定（基础15+武器bonus）；25层引爆毒入骨髓
  if (trait === "venomInfuse") {
    if (p.cleanseShield > 0) continue;
    const rank = e.stats.rank || 1;
    let stacks = Math.min(rank, 3);
    // Boss武器debuff加成
    if (bossWeaponObj && bossWeaponObj.poisonBonus) stacks += bossWeaponObj.poisonBonus;
    const cap = getDebuffCap(battle.run, null, "poison", bossWeaponObj);
    p.poison = Math.min(cap, p.poison + stacks);
    battleLog(battle, `${e.name}淬毒弥漫！`);
    addFloater(battle, "player", `中毒+${stacks}`);
    // 25层中毒引爆：毒入骨髓（扣7.5%当前血 + 7.5%当前内）
    if (p.poison >= 25) {
      const hpDmg = Math.floor(p.hp * 0.075);
      const qiDmg = Math.floor(p.qi * 0.075);
      p.hp = Math.max(0, p.hp - hpDmg);
      p.qi = Math.max(0, p.qi - qiDmg);
      p.poison -= 25;
      battleLog(battle, `毒入骨髓！${p.name}毒发攻心，扣除${hpDmg}血量、${qiDmg}内力！`);
      addFloater(battle, "player", "毒入骨髓");
      addFloater(battle, "player", `-${hpDmg}`, "poison");
      if (qiDmg > 0) addFloater(battle, "player", `-${qiDmg}`, "qi");
    }
  }

  } // end for trait loop

  // lowHpBerserk 5回合计时（每回合递减）
  if (battle.bossPhaseTriggered["berserk30"] && traits.includes("lowHpBerserk")) {
    if (!battle._berserkTurn) battle._berserkTurn = 0;
    battle._berserkTurn++;
    if (battle._berserkTurn >= 5) {
      battle.bossPhaseTriggered["berserk30"] = false;
      if (e.stats._origAtk) e.stats.atk = e.stats._origAtk;
      if (e.stats._origSpeed) e.stats.speed = e.stats._origSpeed;
      battle._berserkTurn = 0;
      battleLog(battle, `${e.name}的狂暴渐渐平息。`);
      addFloater(battle, "enemy", "狂暴消失");
    }
  }
  // celestialBurn（天罡燃命）5回合计时（每回合递减）
  if (battle.celestialBurnTriggered && traits.includes("celestialBurn")) {
    if (!battle._celestialBurnTurn) battle._celestialBurnTurn = 0;
    battle._celestialBurnTurn++;
    if (battle._celestialBurnTurn >= 5) {
      battle.celestialBurnTriggered = false;
      if (e.stats._origAtk2) e.stats.atk = e.stats._origAtk2;
      if (e.stats._origSpd2) e.stats.speed = e.stats._origSpd2;
      if (e.stats._origDef2) { e.stats.def = e.stats._origDef2; e.defBase = e.stats.def; }
      battle._celestialBurnTurn = 0;
      battleLog(battle, `${e.name}的天罡燃命效果消失。`);
      addFloater(battle, "enemy", "燃命结束");
    }
  }
}

// 检查Boss阶段触发（HP百分比）
function checkBossPhaseTriggers(battle) {
  const e = battle.enemy;
  const p = battle.player;
  const traits = battle.bossTraits;
  if (!traits || !traits.length) return;

  const hpPct = e.hp / e.stats.hp;
  const rank = e.stats.rank || 1;

  for (const trait of traits) {

  // poisonGuCapCleanse：50%血时净化并回血20%（保留向后兼容）
  if (trait === "poisonGuCapCleanse" && hpPct <= 0.5 && !battle.bossPhaseTriggered["50pct"]) {
    battle.bossPhaseTriggered["50pct"] = true;
    e.bleed = 0; e.poison = 0; e.inner = 0; e.frost = 0; e.hamstring = 0; e.veinBreak = 0; e.gu = 0; e.imbalance = 0; e.frozen = 0; e.atkZero = 0; e.weakpointExposed = 0; e.breakDefense = 0; e.breakDefenseShatter = 0;
    const healAmt = Math.floor(e.stats.hp * 0.2);
    e.hp = Math.min(e.stats.hp, e.hp + healAmt);
    battleLog(battle, `${e.name}净化了所有负面状态，恢复了${healAmt}血量！`);
    addFloater(battle, "enemy", "净化+回血");
  }

  // drainQiLowShield：低血获得15%护体（保留向后兼容）
  if (trait === "drainQiLowShield" && hpPct <= 0.5 && !battle.bossPhaseTriggered["shield50"]) {
    battle.bossPhaseTriggered["shield50"] = true;
    battle.bossShield = Math.floor(e.stats.hp * 0.15);
    battle.bossShieldMax = battle.bossShield;
    battleLog(battle, `${e.name}获得护体，吸收${battle.bossShield}伤害！`);
    addFloater(battle, "enemy", "护体+15%");
  }

  // === 孤云逐浪线 Boss 阶段触发（v6.0重做）===

  // lowHpBerserk（低血狂暴）：≤30%HP ATK×1.5，SPEED=n×0.3，持续5回合
  if (trait === "lowHpBerserk" && hpPct <= 0.3 && !battle.bossPhaseTriggered["berserk30"]) {
    battle.bossPhaseTriggered["berserk30"] = true;
    e.stats._origSpeed = e.stats.speed;
    e.stats._origAtk = e.stats.atk;
    e.stats.atk = Math.round(e.stats.atk * 1.5);
    e.stats.speed = Math.round(e.stats.speed * rank * 0.3 * 100) / 100;
    battle._berserkTurn = 0;
    battleLog(battle, `${e.name}陷入狂暴，攻击暴增！持续5回合。`);
    addFloater(battle, "enemy", "狂暴");
  }
  // lowHpBerserk 5回合后自动衰减（在applyBossTurnMechanics中处理）

  // shadowStep（影步）：≤50%HP DODGE×1.75，每次闪避成功+10%最大HP
  if (trait === "shadowStep" && hpPct <= 0.5 && !battle.bossPhaseTriggered["shadowStep"]) {
    battle.bossPhaseTriggered["shadowStep"] = true;
    e.stats.dodge = Math.round(e.stats.dodge * 1.75);
    battleLog(battle, `${e.name}身法如影，闪避×1.75！每次闪避回复10%最大生命。`);
    addFloater(battle, "enemy", "影步↑");
  }

  // celestialCleanse（天罡净化）：≤50%HP自动释放，净化所有负面+回血30%，每场战斗一次
  if (trait === "celestialCleanse" && hpPct <= 0.5 && !battle.celestialCleanseUsed) {
    battle.celestialCleanseUsed = true;
    e.bleed = 0; e.poison = 0; e.inner = 0; e.frost = 0; e.hamstring = 0; e.veinBreak = 0; e.gu = 0; e.imbalance = 0; e.frozen = 0; e.atkZero = 0; e.weakpointExposed = 0; e.breakDefense = 0; e.breakDefenseShatter = 0;
    const healAmt = Math.floor(e.stats.hp * 0.30);
    e.hp = Math.min(e.stats.hp, e.hp + healAmt);
    battleLog(battle, `${e.name}天罡净化！清除所有负面，恢复${healAmt}血量！`);
    addFloater(battle, "enemy", "天罡净化");
  }

  // celestialBurn（天罡燃命）：≤10%HP自动释放，ATK×2, SPEED×2, DEF×0.5，持续5回合
  if (trait === "celestialBurn" && hpPct <= 0.10 && !battle.celestialBurnTriggered) {
    battle.celestialBurnTriggered = true;
    e.stats._origAtk2 = e.stats.atk;
    e.stats._origSpd2 = e.stats.speed;
    e.stats._origDef2 = e.stats.def;
    e.stats.atk = Math.round(e.stats.atk * 2);
    e.stats.speed = Math.round(e.stats.speed * 2 * 100) / 100;
    e.stats.def = Math.round(e.stats.def * 0.5);
    e.defBase = e.stats.def;  // v6.x 破防系统：同步 defBase
    battle._celestialBurnTurn = 0;
    battleLog(battle, `${e.name}天罡燃命！攻击×2，速度×2，防御×0.5，持续5回合！`);
    addFloater(battle, "enemy", "燃命一击");
  }

  } // end for trait loop
}

// 计算Boss特性造成的防御忽略（v5.18：多trait迭代）
function bossDefIgnore(battle) {
  const traits = battle.bossTraits;
  if (!traits?.length) return 0;
  for (const trait of traits) {
    if (trait === "bleedPer3") return 0.15; // 直接伤害附带轻破防15%
  }
  return 0;
}

// 应用Boss特性：命中时额外效果（v5.18：多trait迭代+数值更新）
function applyBossHitEffect(battle, target) {
  const traits = battle.bossTraits;
  const e = battle.enemy;
  if (!traits?.length || target !== battle.player) return;
  // Boss武器
  const bossWeaponObj = e.weapon ? DATA.weapons[e.weapon] : null;

  for (const trait of traits) {

  if (trait === "critBreakDef") {
    // 暴击破防：玩家防御最多被压到75%原始值
    const minDef = Math.floor(battle.player.stats.def * 0.75);
    const actualDef = battle.player.stats.def;
    if (actualDef > minDef) {
      battle.player.stats.def = Math.max(minDef, battle.player.stats.def - 3);
      if (battle.player.stats.def !== actualDef) {
        battleLog(battle, `${e.name}破防！你的防御-3。`);
        addFloater(battle, "player", "破防");
      }
    }
  }

  if (trait === "hamstringCap") {
    // 断筋上限+2：命中附加断筋效果
    const cap = getDebuffCap(battle.run, null, "hamstring", bossWeaponObj) + 2;
    target.hamstring = Math.min(cap, target.hamstring + 2);
    battleLog(battle, `${e.name}掌劲断筋，你被附加断筋！`);
    addFloater(battle, "player", "断筋+2");
    // 25层断筋引爆：筋断力竭
    if (target.hamstring >= 25) {
      target.atkZero = 2;
      target.hamstring -= 25;
      battleLog(battle, `筋断力竭！${target.name}筋脉尽废，攻击归零2回合！`);
      addFloater(battle, "player", "筋断力竭");
    }
  }

  } // end for trait loop
}

