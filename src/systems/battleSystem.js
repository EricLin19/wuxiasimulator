import { DATA } from "../data/content.js";
import { clone, clamp } from "../core/utils.js";

const THREE_WAVES_PALMS = ["fist_blue_1", "fist_orange_1", "fist_red_1"];
const MAX_PALM_CHAIN_ACTIONS = 3; // arm can increase to 4

// Debuff caps
const DEBUFF_CAPS = {
  bleed: 12,
  poison: 12,
  inner: 12,
  frost: 10,
  hamstring: 10,
  gu: 6
};
const BLEED_DMG = 10;
const POISON_DMG = 8;
const POISON_QI = 4;
const FROST_SLOW = 0.02;
const FROST_QI = 6;
const HAMSTRING_SLOW = 0.02;
const HAMSTRING_ATK = 1;
const GU_QI_COST = 6;
const SPEED_MIN_FROST = 0.6;
const ATK_MIN_HAMSTRING = 0.65;

export function createBattle(run, enemyTemplate, isBoss = false) {
  const enemyStats = scaleEnemyStats(clone(enemyTemplate));
  const pStats = clone(run.stats);

  // Weapon stat bonus
  if (run.equippedWeapon) {
    const weapon = DATA.weapons[run.equippedWeapon];
    if (weapon) {
      pStats.atk += weapon.atk || 0;
      if (weapon.dodgeBonus) pStats.dodge += weapon.dodgeBonus;
      if (weapon.speedBonus) pStats.speed = Number((pStats.speed + weapon.speedBonus).toFixed(2));
      if (weapon.critBonus) pStats.crit += weapon.critBonus;
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
  if (run.activeInternalArt) {
    const art = DATA.internalArts[run.activeInternalArt];
    if (art?.combatEffect === "healOnStart") {
      pHp = Math.min(pStats.hp, pHp + Math.floor(pStats.hp * 0.15));
    }
    if (art?.combatEffect === "bigHealStart") {
      pHp = Math.min(pStats.hp, pHp + Math.floor(pStats.hp * 0.25));
      pQi = Math.min(pStats.qi, pQi + Math.floor(pStats.qi * 0.15));
    }
  }

  // 防具效果：龙鳞重甲护体
  if (run.equippedArmor) {
    const armor = DATA.armors[run.equippedArmor];
    if (armor?.dragonGuard) {
      dragonGuardHp = Math.floor(pStats.hp * armor.dragonGuard);
    }
  }

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
    // Per-turn trackers
    turnTrackers: { comboChains: 0, evasiveTriggers: 0, coinThrows: 0, guDisrupts: 0, frostHits: 0, stealTriggers: 0 },
    // 敌人行动计数（用于限制断脉拳师等前N回合特性）
    enemyActionCount: 0,
    // Armor trackers
    dragonGuardHp,
    wuxiangTurns: 0,
    immuneNewDebuffs: false,
    // Boss trait tracking (三主线Boss特性)
    bossTrait: enemyTemplate.bossTrait || null,
    bossTurnCounter: 0,
    bossPhaseTriggered: {},
    bossShield: 0,
    bossImmuneTurns: 0,
    // 角色立绘
    playerPortrait: run.character.portraitImage || null,
    enemyPortrait: enemyTemplate.portraitImage || null
  };

  // 无相秘甲：前3己方回合免疫新负面
  if (run.equippedArmor) {
    const armor = DATA.armors[run.equippedArmor];
    if (armor?.immuneTurns) {
      battle.wuxiangTurns = armor.immuneTurns;
      battle.immuneNewDebuffs = true;
    }
  }

  // 三主线Boss特性初始化
  if (battle.bossTrait) {
    // shieldCleanseCounter：开场25%护体
    if (battle.bossTrait === "shieldCleanseCounter") {
      battle.bossShield = Math.floor(enemyStats.hp * 0.25);
      battleLog(battle, `${enemyTemplate.name}获得护体，吸收${battle.bossShield}伤害！`);
    }
    // miniArmor：开场20%护体
    if (battle.bossTrait === "miniArmor") {
      battle.bossShield = Math.floor(enemyStats.hp * 0.2);
      battleLog(battle, `${enemyTemplate.name}获得护体，吸收${battle.bossShield}伤害！`);
    }
    // drainQiImmuneBurst：前3回合免疫负面
    if (battle.bossTrait === "drainQiImmuneBurst") {
      battle.bossImmuneTurns = 3;
      battleLog(battle, `${enemyTemplate.name}内力护体，前3回合免疫负面！`);
    }
  }

  // 大罗洗髓经：开场净化
  if (run.activeInternalArt) {
    const art = DATA.internalArts[run.activeInternalArt];
    if (art?.combatEffect === "cleanse") {
      battle.player.bleed = 0;
      battle.player.poison = 0;
      battle.player.inner = 0;
      battle.player.frost = 0;
      battle.player.hamstring = 0;
      battle.player.gu = 0;
      battle.player.cleanseShield = 2; // 前2回合负面抵抗
      battleLog(battle, `【大罗洗髓经】净化所有负面状态，前2己方回合负面抵抗。`);
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
  return { name, icon, stats, hp, qi, gauge: 0, skills, items, cooldowns: {}, auto: false, bleed: 0, poison: 0, inner: 0, frost: 0, hamstring: 0, gu: 0, guard: 0, cleanseShield: 0 };
}

export function tickBattle(battle, dt) {
  if (!battle || battle.phase !== "running") return null;
  const p = battle.player;
  const e = battle.enemy;
  p.gauge += effectiveSpeed(p, battle) * dt * 24;
  e.gauge += effectiveSpeed(e, battle) * dt * 24;
  if (p.gauge >= 100) {
    p.gauge = 100;
    battle.actor = "player";
    // Reset per-turn trackers on player turn
    battle.turnTrackers = { comboChains: 0, evasiveTriggers: 0, coinThrows: 0, guDisrupts: 0, frostHits: 0, stealTriggers: 0 };
    applyTurnStart(battle, p);
    if (checkBattleEnd(battle).ended) return "ended";
    battle.phase = p.auto ? "autoPlayer" : "waitPlayer";
    return battle.phase;
  }
  if (e.gauge >= 100) {
    e.gauge = 100;
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
  const result = resolveAttack(run, battle, p, battle.enemy, skill);
  if (result.comboTriggered && triggerThreeWaves(run, battle, p, skillId)) {
    return checkBattleEnd(battle);
  }
  return endActorTurn(run, battle, p);
}

export function basicAttack(run, battle) {
  if (battle.phase !== "waitPlayer" && battle.phase !== "autoPlayer") return { ok: false };
  const p = battle.player;
  const target = battle.enemy;
  const hit = Math.random() * 100 < hitChance(p, target);
  if (!hit) {
    battleLog(battle, `${p.name}普通攻击，被${target.name}闪开。`);
    addFloater(battle, "enemy", "miss");
  } else {
    // 基础攻击只吃武器30-50%效果
    const weapon = battle.run.equippedWeapon ? DATA.weapons[battle.run.equippedWeapon] : null;
    const weaponAtk = weapon ? Math.floor(weapon.atk * 0.4) : 0;
    const dmg = Math.max(1, Math.floor((effectiveAtk(p) - weaponAtk + (weapon ? Math.floor(weapon.atk * 0.4) : 0)) * 0.35 + 10 - effectiveDef(target) * 0.25));
    target.hp = Math.max(0, target.hp - dmg);
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
    return { comboTriggered: false };
  }
  if (surehit) addFloater(battle, sideOf(battle, actor), "例无虚发");

  // Boss护体盾吸收（shieldCleanseCounter等）
  let dmg = calcDamage(run, battle, actor, target, skill);
  if (target === battle.enemy && battle.bossShield > 0) {
    const absorbed = Math.min(dmg, battle.bossShield);
    battle.bossShield -= absorbed;
    dmg -= absorbed;
    if (absorbed > 0) {
      battleLog(battle, `${target.name}的护体吸收了${absorbed}伤害！`);
      addFloater(battle, "enemy", "护体");
    }
  }

  target.hp = Math.max(0, target.hp - dmg);
  applySkillEffects(run, battle, actor, target, skill, dmg);
  battleLog(battle, `${actor.name}施展${skill.name}，造成${dmg}伤害。`);
  if (skill.tags?.includes("heal")) heal(run, actor, 70);
  if (skill.tags?.includes("speed")) actor.stats.speed = Number((actor.stats.speed + 0.05).toFixed(2));

  // 检查Boss阶段触发（玩家攻击Boss后）
  if (target === battle.enemy) checkBossPhaseTriggers(battle);

  let comboTriggered = false;
  if (skill.tags?.includes("combo")) {
    let chain = 1;
    let chance = comboChance(run, skill, actor);
    while (target.hp > 0 && Math.random() * 100 < chance) {
      chain++;
      comboTriggered = true;
      const comboDmg = Math.max(1, Math.floor(dmg * 0.45));
      target.hp = Math.max(0, target.hp - comboDmg);
      battleLog(battle, `连击触发，追加${comboDmg}伤害。`);
      addFloater(battle, sideOf(battle, actor), "连击");
      chance *= 0.5;
      if (chain >= 5) break; // 单次最多5连
    }
    if (chain > 1) addFloater(battle, sideOf(battle, actor), `${chain}连击`);
  }
  return { comboTriggered };
}

function triggerThreeWaves(run, battle, actor, usedSkillId) {
  if (!hasThreeWaves(run, actor)) return false;
  for (const id of THREE_WAVES_PALMS) {
    if (id !== usedSkillId) actor.cooldowns[id] = Math.max(0, (actor.cooldowns[id] || 0) - 1);
  }
  battleLog(battle, "长江三叠浪触发，另外两掌冷却-1。");
  addFloater(battle, sideOf(battle, actor), "三叠浪");

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
  const p = battle.player;
  let hpAmt = Math.floor(p.stats.hp * 0.08);
  let qiAmt = Math.floor(p.stats.qi * 0.12);
  if (run.traits.includes("breath")) {
    hpAmt = Math.floor(p.stats.hp * 0.12);
    qiAmt = Math.floor(p.stats.qi * 0.18);
  }
  heal(run, p, hpAmt);
  p.qi = Math.min(p.stats.qi, p.qi + qiAmt);
  battleLog(battle, `${p.name}调息，恢复${hpAmt}血量和${qiAmt}内力。`);
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
    let dmg = enemySkillDamage(e, p);
    // Boss trait: drainQiLowShield - 命中吸内
    if (battle.bossTrait === "drainQiLowShield") {
      const drain = Math.max(1, Math.floor(p.qi * 0.08));
      if (drain > 0 && p.qi > 0) {
        p.qi = Math.max(0, p.qi - drain);
        e.qi = Math.min(e.stats.qi, e.qi + drain);
        battleLog(battle, `${e.name}吸取了你的内力${drain}点！`);
        addFloater(battle, "player", `-${drain}内力`);
      }
    }
    // 罗汉镇岳功：受到直接伤害-3%
    if (run.activeInternalArt) {
      const art = DATA.internalArts[run.activeInternalArt];
      if (art?.combatEffect === "dmgReduce") dmg = Math.floor(dmg * 0.97);
    }
    // 防具：低血量减伤
    if (run.equippedArmor) {
      const armor = DATA.armors[run.equippedArmor];
      if (armor?.lowHpGuard && p.hp / p.stats.hp <= (armor.lowHpThreshold || 0.3)) {
        dmg = Math.floor(dmg * (1 - armor.lowHpGuard));
      }
    }
    if (p.guard) dmg = Math.floor(dmg * 0.55);
    // 龙鳞护体
    if (battle.dragonGuardHp > 0) {
      const absorbed = Math.min(dmg, battle.dragonGuardHp);
      battle.dragonGuardHp -= absorbed;
      dmg -= absorbed;
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
      battleLog(battle, `${e.name}暴击！`);
      addFloater(battle, "enemy", "会心一击");
    }
    p.hp = Math.max(0, p.hp - dmg);
    applyEnemyTraitHit(battle, e, p);
    // 三主线Boss：命中时特性效果
    applyBossHitEffect(battle, p);
    battleLog(battle, `${e.name}出手，造成${dmg}伤害。`);

    // 玄元龙象功：受伤害转内力
    if (run.activeInternalArt) {
      const art = DATA.internalArts[run.activeInternalArt];
      if (art?.combatEffect === "dmgToQi") {
        const qiGain = Math.floor(dmg * 0.2);
        p.qi = Math.min(p.stats.qi, p.qi + qiGain);
      }
    }
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
  const dmg = Math.max(1, Math.floor(effectiveAtk(e) * 0.3 + 8 - enemyEffectiveDef(e, p) * 0.25));
  p.hp = Math.max(0, p.hp - dmg);
  if (e.stats.trait === "qiSuppress") {
    const artReduce = battle.run?.activeInternalArt && DATA.internalArts[battle.run.activeInternalArt]?.combatEffect === "debuffReduce";
    drainPlayerQi(battle, e, p, artReduce ? 9 : 18);
  }
  battleLog(battle, `${e.name}普通攻击，造成${dmg}伤害。`);
}

function enemySkillDamage(e, p) {
  return Math.max(1, effectiveAtk(e) + 35 - enemyEffectiveDef(e, p));
}

function enemyEffectiveDef(e, p) {
  if (e.stats.trait !== "armorBreak") return effectiveDef(p);
  return Math.floor(effectiveDef(p) * 0.55);
}

function applyEnemyTraitHit(battle, e, p) {
  const run = battle.run;
  const artReduce = run?.activeInternalArt && DATA.internalArts[run.activeInternalArt]?.combatEffect === "debuffReduce";
  if (e.stats.trait === "armorBreak") {
    const reduction = artReduce ? 1 : 2;
    p.stats.def = Math.max(0, p.stats.def - reduction);
    battleLog(battle, `${e.name}裂甲入骨，${p.name}防御-${reduction}。${artReduce ? "【紫霄清心诀】减轻负面。" : ""}`);
    addFloater(battle, "player", "破防");
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
  addFloater(battle, "player", "内力压制");
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
  addFloater(battle, "player", "回身调息");
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
  // 流血结算（每层10伤害，结算后-1）
  if (unit.bleed > 0) {
    const dmg = unit.bleed * BLEED_DMG;
    unit.hp = Math.max(0, unit.hp - dmg);
    battleLog(battle, `${unit.name}流血发作，受到${dmg}伤害。`);
    unit.bleed = Math.max(0, unit.bleed - 1);
  }
  // 内伤结算
  if (unit.inner > 0) {
    const loss = unit.inner * 14;
    unit.qi = Math.max(0, unit.qi - loss);
    battleLog(battle, `${unit.name}内伤牵动，失去${loss}内力。`);
    unit.inner = Math.max(0, unit.inner - 1);
  }
  // 寒气结算（每层削内6，结算后-1）
  if (unit.frost > 0) {
    const loss = unit.frost * FROST_QI;
    unit.qi = Math.max(0, unit.qi - loss);
    battleLog(battle, `${unit.name}寒气侵脉，失去${loss}内力。`);
    unit.frost = Math.max(0, unit.frost - 1);
  }
  // 蛊结算（每层耗内6，目标行动后-1）
  if (unit.gu > 0) {
    const loss = unit.gu * GU_QI_COST;
    unit.qi = Math.max(0, unit.qi - loss);
    battleLog(battle, `${unit.name}蛊息扰动，失去${loss}内力。`);
    unit.gu = Math.max(0, unit.gu - 1);
  }
  // 中毒不每回合结算，只在被命中时生效（降低攻防命闪速）
  // 断筋结算（每层削攻1，降低速度，结算后-1）
  if (unit.hamstring > 0) {
    unit.hamstring = Math.max(0, unit.hamstring - 1);
  }

  // 内功效果：玩家回合开始（回血上限6%最大血量，回内上限10%最大内力）
  if (unit === battle.player && battle.run?.activeInternalArt) {
    const art = DATA.internalArts[battle.run.activeInternalArt];
    if (art?.combatEffect === "healOnTurn") {
      const healAmt = Math.floor(unit.stats.hp * 0.05);
      unit.hp = Math.min(unit.stats.hp, unit.hp + healAmt);
      battleLog(battle, `【${art.name}】${unit.name}恢复${healAmt}血量。`);
    }
    if (art?.combatEffect === "qiRegen") {
      const qiAmt = Math.floor(unit.stats.qi * 0.06);
      unit.qi = Math.min(unit.stats.qi, unit.qi + qiAmt);
      battleLog(battle, `【${art.name}】${unit.name}恢复${qiAmt}内力。`);
    }
    if (art?.combatEffect === "cleanse" && unit.cleanseShield > 0) {
      unit.cleanseShield--;
    }
  }

  // 三主线Boss：回合开始结算后检查阶段触发
  if (unit === battle.enemy) checkBossPhaseTriggers(battle);
}

function applySkillEffects(run, battle, actor, target, skill, damage) {
  let stacks = skill.debuffStacks || 1;
  const weapon = run.equippedWeapon ? DATA.weapons[run.equippedWeapon] : null;

  // 武器debuff加成（绑路线）
  if (weapon && weapon.school === skill.school && (!weapon.style || weapon.style === skill.style)) {
    if (skill.debuff === "bleed" && skill.style === "bleed") stacks += weapon.debuffBonus || 0;
    if (skill.debuff === "frost" && skill.style === "frost") stacks += weapon.frostBonus || weapon.debuffBonus || 0;
    if (skill.debuff === "hamstring" && skill.style === "hamstring") stacks += weapon.hamstringBonus || weapon.debuffBonus || 0;
    if (skill.debuff === "gu" && skill.style === "gu") stacks += weapon.guBonus || weapon.debuffBonus || 0;
    if (skill.debuff === "poison" && skill.style === "poison") stacks += weapon.poisonBonus || weapon.debuffBonus || 0;
  }

  if (hasStyleMastery(run, skill.style) && ["bleed", "frost", "hamstring", "gu", "poison"].includes(skill.style)) stacks += 1;
  if (run.traits.includes("nightPoison") && skill.debuff === "poison") stacks += 1;
  for (const trait of run.skillTraits || []) {
    if (skill.style === "poison") stacks += trait.effects?.poisonBonus || 0;
  }

  // 无相秘甲：免疫新负面
  if (battle.immuneNewDebuffs) {
    if (battle.wuxiangTurns > 0) {
      // 仍然造成伤害和属性效果，但不叠加debuff
      stacks = 0;
    }
  }

  // 三主线Boss特性：免疫新负面（drainQiImmuneBurst）
  if (actor === battle.player && target === battle.enemy && battle.bossTrait === "drainQiImmuneBurst") {
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
  }
  if (skill.debuff === "poison" && skill.style === "poison") {
    const cap = getDebuffCap(run, weapon, "poison");
    target.poison = Math.min(cap, target.poison + stacks);
  }
  if (skill.debuff === "inner" && skill.style === "qiBreak") {
    const cap = getDebuffCap(run, weapon, "inner");
    target.inner = Math.min(cap, target.inner + stacks);
  }
  if (skill.debuff === "frost") {
    const cap = getDebuffCap(run, weapon, "frost");
    target.frost = Math.min(cap, target.frost + stacks);
    drainQiByStyle(run, target, skill, 12 + stacks * 4);
  }
  if (skill.debuff === "hamstring") {
    const cap = getDebuffCap(run, weapon, "hamstring");
    target.hamstring = Math.min(cap, target.hamstring + stacks);
    const w = run.equippedWeapon ? DATA.weapons[run.equippedWeapon] : null;
    const atkLoss = stacks * HAMSTRING_ATK + (w?.atkBreakBonus || 0);
    target.stats.atk = Math.max(Math.floor(target.stats.atk * ATK_MIN_HAMSTRING), target.stats.atk - atkLoss);
    battleLog(battle, `${target.name}筋脉受创，攻击-${atkLoss}。`);
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
  // 终极技能即时效果（红武立即触发）
  if (skill.rarity === "red") {
    if (skill.style === "bleed") {
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
        addFloater(battle, sideOf(battle, target), "血崩");
      }
    }
    if (skill.style === "frost") {
      const frostDrain = target.frost * 8;
      if (frostDrain > 0) {
        target.qi = Math.max(0, target.qi - frostDrain);
        battleLog(battle, `寒意彻骨！${target.name}内力立即流失${frostDrain}。`);
        addFloater(battle, sideOf(battle, target), "寒噬");
      }
    }
    if (skill.style === "hamstring") {
      const immediateAtkLoss = target.hamstring * HAMSTRING_ATK;
      if (immediateAtkLoss > 0) {
        target.stats.atk = Math.max(Math.floor(target.stats.atk * ATK_MIN_HAMSTRING), target.stats.atk - immediateAtkLoss);
        battleLog(battle, `天残断筋！${target.name}攻击立即-${immediateAtkLoss}。`);
        addFloater(battle, sideOf(battle, target), "筋断");
      }
    }
    if (skill.style === "poison") {
      const poisonDmg = target.poison * POISON_DMG;
      const poisonQiLoss = target.poison * POISON_QI;
      if (poisonDmg > 0 || poisonQiLoss > 0) {
        target.hp = Math.max(0, target.hp - poisonDmg);
        target.qi = Math.max(0, target.qi - poisonQiLoss);
        battleLog(battle, `毒发攻心！${target.name}毒伤立即结算，受到${poisonDmg}伤害并流失${poisonQiLoss}内力。`);
        addFloater(battle, sideOf(battle, target), "毒爆");
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
  }

  // 内功效果：命中时
  if (actor === battle.player && battle.run?.activeInternalArt) {
    const art = DATA.internalArts[battle.run.activeInternalArt];
    if (art?.combatEffect === "frostOnHit" && battle.turnTrackers.frostHits < 1) {
      const cap = getDebuffCap(run, weapon, "frost");
      target.frost = Math.min(cap, target.frost + 1);
      battleLog(battle, `【${art.name}】${target.name}被附加1层寒气！`);
      battle.turnTrackers.frostHits++;
    }
    if (art?.combatEffect === "drainQi") {
      const drain = Math.min(target.qi, Math.floor(target.qi * 0.08), 40);
      target.qi -= drain;
      actor.qi = Math.min(actor.stats.qi, actor.qi + drain);
      if (drain > 0) battleLog(battle, `【${art.name}】汲取${target.name}${drain}点内力！`);
    }
  }
}

function getDebuffCap(run, weapon, type) {
  let cap = DEBUFF_CAPS[type] || 12;
  if (weapon) {
    if (type === "bleed" && weapon.bleedCapBonus) cap += weapon.bleedCapBonus;
    if (type === "frost" && weapon.frostCapBonus) cap += weapon.frostCapBonus;
    if (type === "hamstring" && weapon.hamstringCapBonus) cap += weapon.hamstringCapBonus;
    if (type === "gu" && weapon.guCapBonus) cap += weapon.guCapBonus;
    if (type === "poison" && weapon.poisonCapBonus) cap += weapon.poisonCapBonus;
  }
  if (hasStyleMastery(run, type)) {
    if (type === "bleed") cap += 3;
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

  // 暴击（毒/真伤/金钱不暴击）
  const noCrit = skill.style === "poison" || skill.style === "lowKick" || skill.style === "coin";
  if (!noCrit && Math.random() * 100 < critChance(run, actor, skill)) {
    let cm = critMultiplier(run, skill);
    if (run.activeInternalArt) {
      const art = DATA.internalArts[run.activeInternalArt];
      if (art?.combatEffect === "critUp") cm += 0.2;
    }
    dmg = Math.floor(dmg * cm);
    battleLog(battle, "暴击！");
    addFloater(battle, sideOf(battle, actor), "会心一击");
  }
  if (target.guard) dmg = Math.floor(dmg * 0.55);
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
  let atk = unit.stats.atk;
  if (unit.poison > 0) atk -= unit.poison * 2;
  if (unit.hamstring > 0) atk -= unit.hamstring * HAMSTRING_ATK;
  // 断筋最低降至65%
  const minAtk = Math.floor(unit.stats.atk * ATK_MIN_HAMSTRING);
  return Math.max(minAtk, Math.max(1, atk));
}

function baseSkillDamage(run, actor, target, skill) {
  if (skill.style === "coin") return coinDamageValue(run, skill);
  if (skill.style === "lowKick") return Math.max(1, Math.floor(skill.power * 0.72 + effectiveAtk(actor) * 0.65 + trueDamageBonus(run, skill)));
  return Math.max(1, skill.power + effectiveAtk(actor) - effectiveDef(target));
}

function skillQiCost(actor, skill, run) {
  if (skill.tags?.includes("coin")) return 0;
  let cost = skill.qi + (actor.gu || 0) * GU_QI_COST;
  // 虚玄无相功：招式内力消耗-12%（降耗最高22%）
  if (run?.activeInternalArt) {
    const art = DATA.internalArts[run.activeInternalArt];
    if (art?.combatEffect === "qiReduce") cost = Math.floor(cost * 0.88);
  }
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
  if (hasStyleMastery(run, skill.style)) value += 30;
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
  return Math.max(0, unit.stats.def - unit.poison * 2);
}

function effectiveHit(unit) {
  return Math.max(1, unit.stats.hit - unit.poison * 2);
}

function effectiveDodge(unit) {
  return Math.max(0, unit.stats.dodge - unit.poison * 2);
}

function effectiveSpeed(unit, battle = null) {
  let spd = unit.stats.speed;
  if (unit.poison > 0) spd -= unit.poison * 0.04;
  if (unit.frost > 0) spd -= unit.frost * FROST_SLOW;
  if (unit.hamstring > 0) spd -= unit.hamstring * HAMSTRING_SLOW;
  if (unit.gu > 0) spd -= unit.gu * 0.02;
  // hamstringCap Boss特性：玩家速度最低被压到70%（而非默认的60%）
  if (unit === battle?.player && battle?.bossTrait === "hamstringCap") {
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
  if (hasStyleMastery(run, skill.style) && skill.style === "critPalm") value += 8;
  // 暴击率软上限65%
  return clamp(value, 0, 65);
}

function critMultiplier(run, skill) {
  let value = 2;
  for (const trait of run.skillTraits || []) value += trait.effects?.critPower || 0;
  const weapon = run.equippedWeapon ? DATA.weapons[run.equippedWeapon] : null;
  if (weapon && weapon.school === skill.school && weapon.style === skill.style) value += weapon.critPower || 0;
  if (hasStyleMastery(run, skill.style) && skill.style === "critPalm") value += 0.2;
  if (skill.school === "blade") value += 0.1;
  return clamp(value, 2, 2.8);
}

function comboChance(run, skill, actor) {
  if (skill.style !== "combo") return 0;
  const weapon = run.equippedWeapon ? DATA.weapons[run.equippedWeapon] : null;
  let value = actor.stats.combo;
  if (weapon && weapon.school === "fist" && weapon.style === "combo") value += weapon.comboBonus || 0;
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

function addFloater(battle, side, text) {
  battle.floaters ||= [];
  battle.floaters.push({ id: Date.now() + Math.random(), side, text });
  battle.floaters = battle.floaters.slice(-8);
  setTimeout(() => {
    battle.floaters = (battle.floaters || []).filter(f => f.text !== text || f.side !== side);
  }, 900);
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
    // 无相秘甲回合递减
    if (battle.wuxiangTurns > 0) {
      battle.wuxiangTurns--;
      if (battle.wuxiangTurns <= 0) battle.immuneNewDebuffs = false;
    }
    actor.cleanseShield = Math.max(0, (actor.cleanseShield || 0) - 0.5);
  }
  actor.gauge = 0;
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

// 每回合Boss行动前调用：应用持续特性
function applyBossTurnMechanics(battle) {
  const e = battle.enemy;
  const p = battle.player;
  const trait = battle.bossTrait;
  if (!trait) return;
  battle.bossTurnCounter = (battle.bossTurnCounter || 0) + 1;
  const turn = battle.bossTurnCounter;

  if (trait === "bleedPer3") {
    // 每3回合对玩家叠加2层流血
    if (turn % 3 === 0) {
      const cap = getDebuffCap(battle.run, null, "bleed");
      p.bleed = Math.min(cap, p.bleed + 2);
      battleLog(battle, `${e.name}刀势逼人，你被叠加2层流血！`);
      addFloater(battle, "player", "流血+2");
    }
  }

  if (trait === "poisonGuPerTurn") {
    // 每回合毒+1蛊+1
    const poisonCap = getDebuffCap(battle.run, null, "poison");
    const guCap = getDebuffCap(battle.run, null, "gu");
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
    // 这里只处理低血护体检测（在checkBossPhaseTriggers中处理）
  }

  // ======== 小Boss特性 ========
  if (trait === "miniBleed") {
    // 流血+2，上限10
    p.bleed = Math.min(10, p.bleed + 2);
    battleLog(battle, `${e.name}的刀锋带来流血！`);
    addFloater(battle, "player", "流血+2");
  }

  if (trait === "miniFrost") {
    // 高闪避（已在stats中），寒气+1
    const cap = getDebuffCap(battle.run, null, "frost");
    p.frost = Math.min(cap, p.frost + 1);
    battleLog(battle, `${e.name}的剑锋带来寒气！`);
    addFloater(battle, "player", "寒气+1");
  }

  if (trait === "miniHamstring") {
    // 断筋+2，削攻
    const cap = getDebuffCap(battle.run, null, "hamstring");
    p.hamstring = Math.min(cap, p.hamstring + 2);
    p.stats.atk = Math.max(Math.floor(p.stats.atk * ATK_MIN_HAMSTRING), p.stats.atk - 2);
    battleLog(battle, `${e.name}的刀式断筋削攻！`);
    addFloater(battle, "player", "断筋+2");
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
      const coinDmg = 220; // 固定必中伤害
      // 伤害可能被减伤装备削弱
      let actualDmg = coinDmg;
      if (battle.run.equippedArmor) {
        const armor = DATA.armors[battle.run.equippedArmor];
        if (armor?.dragonGuard && battle.dragonGuardHp > 0) {
          const absorbed = Math.min(actualDmg, battle.dragonGuardHp);
          battle.dragonGuardHp -= absorbed;
          actualDmg -= absorbed;
          if (absorbed > 0) addFloater(battle, "player", "护体");
        }
        if (armor?.lowHpGuard && p.hp / p.stats.hp <= (armor.lowHpThreshold || 0.3)) {
          actualDmg = Math.floor(actualDmg * (1 - armor.lowHpGuard));
        }
      }
      if (p.guard) actualDmg = Math.floor(actualDmg * 0.55);
      p.hp = Math.max(0, p.hp - actualDmg);
      battleLog(battle, `${e.name}掷出金钱镖，造成${actualDmg}必中伤害！`);
      addFloater(battle, "player", `-${actualDmg}必中`);
    }
  }
}

// 检查Boss阶段触发（HP百分比）
function checkBossPhaseTriggers(battle) {
  const e = battle.enemy;
  const p = battle.player;
  const trait = battle.bossTrait;
  if (!trait) return;

  const hpPct = e.hp / e.stats.hp;

  // shieldCleanseCounter：50%血净化一次并回血
  if (trait === "shieldCleanseCounter" && hpPct <= 0.5 && !battle.bossPhaseTriggered["50pct"]) {
    battle.bossPhaseTriggered["50pct"] = true;
    // 净化
    e.bleed = 0;
    e.poison = 0;
    e.inner = 0;
    e.frost = 0;
    e.hamstring = 0;
    e.gu = 0;
    // 回血20%
    const healAmt = Math.floor(e.stats.hp * 0.2);
    e.hp = Math.min(e.stats.hp, e.hp + healAmt);
    battleLog(battle, `${e.name}净化了所有负面状态，恢复了${healAmt}血量！`);
    addFloater(battle, "enemy", "净化+回血");
  }

  // poisonGuCapCleanse：50%血时净化并回血20%
  if (trait === "poisonGuCapCleanse" && hpPct <= 0.5 && !battle.bossPhaseTriggered["50pct"]) {
    battle.bossPhaseTriggered["50pct"] = true;
    e.bleed = 0;
    e.poison = 0;
    e.inner = 0;
    e.frost = 0;
    e.hamstring = 0;
    e.gu = 0;
    const healAmt = Math.floor(e.stats.hp * 0.2);
    e.hp = Math.min(e.stats.hp, e.hp + healAmt);
    battleLog(battle, `${e.name}净化了所有负面状态，恢复了${healAmt}血量！`);
    addFloater(battle, "enemy", "净化+回血");
  }

  // drainQiLowShield：低血获得15%护体
  if (trait === "drainQiLowShield" && hpPct <= 0.5 && !battle.bossPhaseTriggered["shield50"]) {
    battle.bossPhaseTriggered["shield50"] = true;
    battle.bossShield = Math.floor(e.stats.hp * 0.15);
    battleLog(battle, `${e.name}获得护体，吸收${battle.bossShield}伤害！`);
    addFloater(battle, "enemy", "护体+15%");
  }

  // 低血反击（shieldCleanseCounter）
  if (trait === "shieldCleanseCounter" && hpPct <= 0.3 && !battle.bossPhaseTriggered["lowHp"]) {
    battle.bossPhaseTriggered["lowHp"] = true;
    e.stats.atk = Math.floor(e.stats.atk * 1.15);
    battleLog(battle, `${e.name}陷入狂暴，攻击提升！`);
    addFloater(battle, "enemy", "狂暴");
  }
}

// 计算Boss特性造成的防御忽略（bleedPer3等）
function bossDefIgnore(battle) {
  const trait = battle.bossTrait;
  if (trait === "bleedPer3") return 0.15; // 直接伤害附带轻破防15%
  return 0;
}

// 应用Boss特性：命中时额外效果
function applyBossHitEffect(battle, target) {
  const trait = battle.bossTrait;
  const e = battle.enemy;
  if (!trait || target !== battle.player) return;

  if (trait === "critBreakDef") {
    // 暴击破防：玩家防御最多被压到75%原始值
    const minDef = Math.floor(battle.player.stats.def * 0.75);
    // 每次命中降低2点防御
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
    const cap = getDebuffCap(battle.run, null, "hamstring") + 2;
    target.hamstring = Math.min(cap, target.hamstring + 2);
    // 同时削攻
    target.stats.atk = Math.max(
      Math.floor(target.stats.atk * ATK_MIN_HAMSTRING),
      target.stats.atk - HAMSTRING_ATK * 2
    );
    battleLog(battle, `${e.name}掌劲断筋，你被附加断筋！`);
    addFloater(battle, "player", "断筋+2");
  }
}

