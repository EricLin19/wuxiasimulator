import { DATA } from "../data/content.js";
import { clone, clamp } from "../core/utils.js";

export function createBattle(run, enemyTemplate, isBoss = false) {
  const enemyStats = scaleEnemyStats(clone(enemyTemplate));
  const pStats = clone(run.stats);
  let items = [...run.items];

  if (run.treasure.effect === "battleDart") items.push("dart");
  if (run.treasure.effect === "moneyAtk") pStats.atk += 10;
  if (run.treasure.effect === "bossPower" && isBoss) {
    pStats.atk += 25;
    pStats.def += 10;
  }
  if (run.equippedWeapon) pStats.atk += DATA.weapons[run.equippedWeapon].atk || 0;
  if (run.traits.includes("swift")) {
    pStats.speed += 0.25;
    pStats.dodge += 4;
  }
  if (run.traits.includes("tough")) {
    pStats.hp += 80;
    pStats.def += 10;
  }
  if (run.traits.includes("hardBone")) pStats.hp += 60;
  if (run.traits.includes("innerRoot")) pStats.qi += 80;
  if (run.traits.includes("critUp")) pStats.crit += 2;
  if (run.traits.includes("nightPoison")) pStats.crit += 8;

  return {
    isBoss,
    bossYear: enemyTemplate.year,
    player: makeUnit(run.character.name, run.character.icon, pStats, Math.min(run.hp, pStats.hp), Math.min(run.qi, pStats.qi), [...(run.activeSkills || run.skills.slice(0, 4))], items),
    enemy: makeUnit(enemyTemplate.name, enemyTemplate.icon, enemyStats, enemyStats.hp, enemyStats.qi, [], []),
    phase: "running",
    actor: null,
    log: [`${run.character.name}遭遇${enemyTemplate.name}。`],
    floaters: [],
    speed: 3
  };
}

function scaleEnemyStats(stats) {
  for (const key of ["hp", "qi", "atk", "def", "combo", "hit", "dodge", "crit"]) {
    stats[key] = Math.floor((stats[key] || 0) * 2);
  }
  stats.speed = Number(((stats.speed || 1) * 1.35).toFixed(2));
  return stats;
}

function makeUnit(name, icon, stats, hp, qi, skills, items) {
  return { name, icon, stats, hp, qi, gauge: 0, skills, items, cooldowns: {}, auto: false, bleed: 0, poison: 0, inner: 0, guard: 0 };
}

export function tickBattle(battle, dt) {
  if (!battle || battle.phase !== "running") return null;
  const p = battle.player;
  const e = battle.enemy;
  p.gauge += effectiveSpeed(p) * dt * 24;
  e.gauge += effectiveSpeed(e) * dt * 24;
  if (p.gauge >= 100) {
    p.gauge = 100;
    battle.actor = "player";
    applyTurnStart(battle, p);
    if (checkBattleEnd(battle).ended) return "ended";
    battle.phase = p.auto ? "autoPlayer" : "waitPlayer";
    return battle.phase;
  }
  if (e.gauge >= 100) {
    e.gauge = 100;
    battle.actor = "enemy";
    applyTurnStart(battle, e);
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
  if (p.qi <= 0) return { ok: false, message: "内力归零，只能调息或普通攻击" };
  if (p.qi < skill.qi) return { ok: false, message: "内力不足" };

  p.qi -= skill.qi;
  p.cooldowns[skillId] = skill.cd;
  resolveAttack(run, battle, p, battle.enemy, skill);
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
    const dmg = Math.max(1, Math.floor(effectiveAtk(p) * 0.35 + 10 - effectiveDef(target) * 0.25));
    target.hp = Math.max(0, target.hp - dmg);
    battleLog(battle, `${p.name}普通攻击，造成${dmg}伤害。`);
  }
  return endActorTurn(run, battle, p);
}

function resolveAttack(run, battle, actor, target, skill) {
  const surehit = skill.tags.includes("surehit");
  const hit = surehit || Math.random() * 100 < hitChance(actor, target);
  if (!hit) {
    battleLog(battle, `${actor.name}施展${skill.name}，被${target.name}闪开。`);
    addFloater(battle, sideOf(battle, target), "miss");
    return;
  }
  if (surehit) addFloater(battle, sideOf(battle, actor), "例无虚发");
  let dmg = calcDamage(run, battle, actor, target, skill);
  target.hp = Math.max(0, target.hp - dmg);
  applySchoolDebuff(run, target, skill);
  battleLog(battle, `${actor.name}施展${skill.name}，造成${dmg}伤害。`);
  if (skill.tags.includes("heal")) heal(run, actor, 70);
  if (skill.tags.includes("speed")) actor.stats.speed = Number((actor.stats.speed + 0.05).toFixed(2));
  if (skill.tags.includes("combo")) {
    let chain = 1;
    let chance = comboChance(run, skill, actor);
    while (target.hp > 0 && Math.random() * 100 < chance) {
      chain++;
      const comboDmg = Math.max(1, Math.floor(dmg * 0.45));
      target.hp = Math.max(0, target.hp - comboDmg);
      battleLog(battle, `连击触发，追加${comboDmg}伤害。`);
      chance *= 0.5;
      if (chain >= 8) break;
    }
    if (chain > 1) addFloater(battle, sideOf(battle, actor), `${chain}连击`);
  }
}

export function useItem(run, battle, itemId) {
  if (battle.phase !== "waitPlayer" && battle.phase !== "autoPlayer") return { ok: false };
  const p = battle.player;
  const idx = p.items.indexOf(itemId);
  if (idx < 0) return { ok: false };
  p.items.splice(idx, 1);
  const item = DATA.items[itemId];
  if (item?.type === "heal") {
    heal(run, p, item.hp);
    battleLog(battle, `${p.name}使用${item.name}。`);
  } else if (item?.type === "qi") {
    p.qi = Math.min(p.stats.qi, p.qi + item.qi);
    battleLog(battle, `${p.name}使用${item.name}。`);
  } else if (itemId === "dart") {
    battle.enemy.hp = Math.max(0, battle.enemy.hp - 100);
    battleLog(battle, `${p.name}掷出飞镖，造成100伤害。`);
  }
  return endActorTurn(run, battle, p);
}

export function restAction(run, battle) {
  const p = battle.player;
  let hp = 40;
  let qi = 60;
  if (run.traits.includes("breath")) {
    hp += 80;
    qi += 80;
  }
  heal(run, p, hp);
  p.qi = Math.min(p.stats.qi, p.qi + qi);
  battleLog(battle, `${p.name}调息，恢复${hp}血量和${qi}内力。`);
  return endActorTurn(run, battle, p);
}

export function autoPlayerAction(run, battle) {
  const p = battle.player;
  if (p.hp / p.stats.hp < 0.35 && p.items.includes("pill")) return useItem(run, battle, "pill");
  if (p.qi <= 0) return Math.random() < 0.65 ? restAction(run, battle) : basicAttack(run, battle);
  const usable = p.skills.map(id => DATA.skills[id]).filter(s => s && p.qi >= s.qi && (p.cooldowns[s.id] || 0) <= 0);
  if (usable.length) return useSkill(run, battle, usable.sort((a, b) => b.power - a.power)[0].id);
  return restAction(run, battle);
}

export function enemyAction(run, battle) {
  const e = battle.enemy;
  const p = battle.player;
  if (e.qi <= 0) {
    if (Math.random() < 0.65) {
      e.qi = Math.min(e.stats.qi, e.qi + 50);
      e.hp = Math.min(e.stats.hp, e.hp + 30);
      battleLog(battle, `${e.name}内力枯竭，只能调息。`);
    } else {
      enemyBasicAttack(battle, e, p);
    }
    return endActorTurn(run, battle, e);
  }
  e.qi = Math.max(0, e.qi - 35);
  if (Math.random() * 100 > hitChance(e, p)) {
    battleLog(battle, `${e.name}的攻击被闪开了。`);
    addFloater(battle, "player", "miss");
  } else {
    let dmg = Math.max(1, effectiveAtk(e) + 35 - effectiveDef(p));
    if (p.guard) dmg = Math.floor(dmg * 0.55);
    if (Math.random() * 100 < e.stats.crit) {
      dmg = Math.floor(dmg * 2);
      battleLog(battle, `${e.name}暴击！`);
      addFloater(battle, "enemy", "会心一击");
    }
    p.hp = Math.max(0, p.hp - dmg);
    battleLog(battle, `${e.name}出手，造成${dmg}伤害。`);
  }
  return endActorTurn(run, battle, e);
}

function enemyBasicAttack(battle, e, p) {
  if (Math.random() * 100 > hitChance(e, p)) {
    battleLog(battle, `${e.name}勉强挥击，被闪开。`);
    addFloater(battle, "player", "miss");
    return;
  }
  const dmg = Math.max(1, Math.floor(effectiveAtk(e) * 0.3 + 8 - effectiveDef(p) * 0.25));
  p.hp = Math.max(0, p.hp - dmg);
  battleLog(battle, `${e.name}普通攻击，造成${dmg}伤害。`);
}

export function toggleAuto(battle) {
  battle.player.auto = !battle.player.auto;
}

function applyTurnStart(battle, unit) {
  if (unit.bleed > 0) {
    const dmg = unit.bleed * 12;
    unit.hp = Math.max(0, unit.hp - dmg);
    battleLog(battle, `${unit.name}流血发作，受到${dmg}伤害。`);
  }
  if (unit.inner > 0) {
    const loss = unit.inner * 14;
    unit.qi = Math.max(0, unit.qi - loss);
    battleLog(battle, `${unit.name}内伤牵动，失去${loss}内力。`);
  }
}

function applySchoolDebuff(run, target, skill) {
  let stacks = skill.debuffStacks || 1;
  const weapon = run.equippedWeapon ? DATA.weapons[run.equippedWeapon] : null;
  if (weapon && weapon.school === skill.school) stacks += weapon.debuffBonus || 0;
  for (const strategy of getStrategies(run, skill.school)) {
    stacks += strategy.effects.bleedBonus || strategy.effects.poisonBonus || strategy.effects.innerBonus || 0;
  }
  if (run.traits.includes("nightPoison") && skill.debuff === "poison") stacks += 1;
  for (const trait of run.skillTraits || []) {
    if (skill.debuff === "poison") stacks += trait.effects?.poisonBonus || 0;
  }
  if (skill.debuff === "bleed") target.bleed += stacks;
  if (skill.debuff === "poison") target.poison += stacks;
  if (skill.debuff === "inner") target.inner += stacks;
}

function calcDamage(run, battle, actor, target, skill) {
  let dmg = Math.max(1, skill.power + effectiveAtk(actor) - effectiveDef(target));
  const weapon = run.equippedWeapon ? DATA.weapons[run.equippedWeapon] : null;
  if (weapon && weapon.school === skill.school) dmg = Math.floor(dmg * (1 + weapon.damagePct / 100));
  if (run.traits.includes("force")) dmg = Math.floor(dmg * 1.02);
  if (Math.random() * 100 < critChance(run, actor, skill)) {
    dmg = Math.floor(dmg * critMultiplier(run, skill));
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
  return Math.max(1, unit.stats.atk - unit.poison * 2);
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

function effectiveSpeed(unit) {
  return Math.max(0.25, unit.stats.speed - unit.poison * 0.04);
}

function critChance(run, actor, skill) {
  let value = actor.stats.crit + (skill.school === "blade" ? 8 : 0);
  for (const strategy of getStrategies(run, skill.school)) value += strategy.effects.crit || 0;
  return clamp(value, 0, 95);
}

function critMultiplier(run, skill) {
  let value = 2;
  for (const trait of run.skillTraits || []) value += trait.effects?.critPower || 0;
  if (skill.school === "blade") value += 0.1;
  return value;
}

function comboChance(run, skill, actor) {
  if (skill.school !== "fist") return 0;
  let value = actor.stats.combo + (skill.rarity === "red" ? 18 : skill.rarity === "orange" ? 10 : 5);
  for (const strategy of getStrategies(run, skill.school)) value += strategy.effects.combo || 0;
  return clamp(value, 0, 85);
}

function getStrategies(run, school) {
  return run.strategies.map(id => DATA.strategies.find(s => s.id === id)).filter(s => s?.school === school);
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
