import { DATA, RARITIES, STAT_LABELS, STAT_KEYS } from "../data/content.js";
import { clone, rand, sample, monthAbs } from "../core/utils.js";
import { saveRun, saveMeta, clearRun } from "../core/save.js";
import { state } from "../core/state.js";

const COMBAT_SCHOOLS = ["blade", "hidden", "fist", "lightness"];
const ALL_SCHOOLS = ["blade", "hidden", "fist", "lightness"];
export const RANK_TITLES = ["初窥门径", "驾轻就熟", "略有小成", "融会贯通", "炉火纯青", "所向披靡", "傲视群雄", "一代宗师", "天人合一", "天人之上"];

export function createRun(characterId, treasureId, meta, perRunAllocations) {
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
  const moneyBonus = (meta.allocations.money || 0) * 100;
  // 局外点数分配（开局15点）
  if (perRunAllocations) {
    applyMetaAllocations(stats, perRunAllocations);
    money += (perRunAllocations.money || 0) * 100;
  }

  const run = {
    id: Date.now(),
    year: 1,
    month: 1,
    maxAp,
    ap: maxAp,
    money: money + moneyBonus,
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
    equippedArmor: null,
    armors: [],
    apUsedThisMonth: false,
    skills: [...character.skills],
    activeSkills: character.skills.filter(id => DATA.skills[id]?.battle !== false).slice(0, 4),
    trainingSkills: [],
    skillProgress: {},
    traits: [...character.traits],
    skillTraits: [],
    items: ["pill", "pill"],
    weapons: [],
    eventRemaining: 3,
    events: [],
    manuals: [],
    merchantStock: [],
    internalArts: [],
    activeInternalArts: [],
    cultivatedArts: [],
    artProgress: {},
    trainingArts: [],
    finalBoss: null,
    finalBossMonth: 36,
    yearlyBossDefeated: {},
    // 三主线新增
    storylineId: characterId,
    mainThreat: 0,
    wandererResolve: 0,
    bossWinCount: 0,
    collectedHeritages: [],
    storyFlags: {},
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
  // 通过全局回调触发Toast队列（新v5.9机制，替代 state.toast）
  if (typeof window !== "undefined" && window.__showToast) {
    window.__showToast(text);
  }
}

export function applyMonthStart(run) {
  run.ap = run.maxAp;
  run.apUsedThisMonth = false;
  if (run.traits.includes("clearMind")) run.ap += 1;
  if (run.treasure.effect === "monthRecover" || run.traits.includes("healer")) {
    const amount = run.treasure.effect === "monthRecover" ? 135 : 90;
    run.hp = Math.min(run.stats.hp + getArmorStats(run).hp, run.hp + amount);
    run.qi = Math.min(run.stats.qi, run.qi + amount);
  }
  // 加载当前月份剧情（孤云逐浪线）
  if (run.storylineId === "wanderer") {
    loadWandererStory(run);
  }
}

export function loadWandererStory(run) {
  const monthAbsVal = (run.year - 1) * 12 + run.month;
  const months = DATA.wandererMonths;
  if (months && months[monthAbsVal]) {
    run.currentStory = { ...months[monthAbsVal], id: months[monthAbsVal].id || `wanderer_m${monthAbsVal}` };
  } else {
    run.currentStory = null;
  }
}

export function refreshEvents(run) {
  // 孤云逐浪线：每月生成6个奇遇，玩家六选三
  if (run.storylineId === "wanderer") {
    const growthEvents = makeWandererGrowthPool(run);
    const riskEvents = makeWandererRiskPool(run);
    const allEvents = [...growthEvents, ...riskEvents];
    run.events = weightedPickMultiple(allEvents, 6);
    run.eventRemaining = 3;
    return;
  }

  // 三槽事件系统（v0.34三主线）：非孤云线维持不变
  const storyPool = makeStoryEventPool(run);
  const growthPool = makeGrowthEventPool(run);
  const riskPool = makeRiskEventPool(run);
  const events = [];

  // 槽位1：主线奇遇（每月固定1次）
  if (storyPool.length) {
    events.push(sample(storyPool, 1)[0]);
  }
  // 槽位2：成长奇遇
  if (growthPool.length) {
    events.push(sample(growthPool, 1)[0]);
  }
  // 槽位3：风险奇遇
  if (riskPool.length) {
    events.push(sample(riskPool, 1)[0]);
  }

  // 去重（仅在槽位冲突时从成长+风险池补充，不引入额外主线事件）
  const seen = new Set(events.map(e => e.id));
  while (events.length < 3 && seen.size < growthPool.length + riskPool.length) {
    const fillPools = [...growthPool, ...riskPool].filter(e => !seen.has(e.id));
    if (!fillPools.length) break;
    const extra = sample(fillPools, 1)[0];
    seen.add(extra.id);
    events.push(extra);
  }

  run.events = events.slice(0, 3);
}

function makeStoryEventPool(run) {
  // 孤云逐浪主线由36月叙事驱动，不参与随机故事池
  if (run.storylineId === "wanderer") return [];
  const sl = DATA.storylines?.[run.storylineId];
  if (!sl) return [];
  return (sl.events || []).filter(e => run.year >= (e.yearMin || 1) && run.year <= (e.yearMax || 3));
}

function makeGrowthEventPool(run) {
  if (run.storylineId === "wanderer") return makeWandererGrowthPool(run);
  const moneyGain = scaleMoney(run, 160);
  const heritage = [
    { id: "masterTeach", name: "隐世高手传功", category: "高手传功", icon: "传", desc: "路遇隐世高人，见你资质不凡，传你一套吐纳心法。内力上限+60，血量上限+200。", apply: ({ run }) => {
      run.stats.qi += 60; run.stats.hp += 200; run.qi += 60; run.hp += 200;
      log(run, "隐世高手传功！内力上限+60，血量上限+200。");
    }},
    { id: "zenMaster", name: "禅师灌顶", category: "高手传功", icon: "禅", desc: "古刹老禅师以毕生修为为你灌顶，打通奇经八脉。获得一个随机特性。", apply: ({ run }) => {
      const pool = DATA.traits.filter(t => !run.traits.includes(t.id) && !run.skillTraits.some(st => st.id === t.id));
      if (pool.length) {
        const t = pool[Math.floor(Math.random() * pool.length)];
        run.traits.push(t.id);
        log(run, `禅师灌顶，领悟特性「${t.name}」：${t.desc}。`);
      } else {
        gainExp(run, 200);
        log(run, "禅师灌顶，武学阅历+200。");
      }
    }},
    { id: "hermitPoint", name: "山间奇人点拨", category: "高手传功", icon: "点", desc: "采药时遇山间奇人，点拨你武功关窍。所有未修秘籍进度+1，经验+100。", apply: ({ run }) => {
      for (const id of run.trainingSkills) run.skillProgress[id] = (run.skillProgress[id] || 0) + 1;
      gainExp(run, 100);
      log(run, "山间奇人点拨，所有修炼中秘籍进度+1，经验+100。");
    }}
  ];
  const relic = [
    { id: "caveManual", name: "洞府遗刻", category: "高手遗物", icon: "刻", desc: "悬崖下发现前辈洞府，石壁上刻有一套完整秘籍。获得一本本流派秘籍。", apply: ({ run }) => {
      const pool = Object.keys(DATA.skills).filter(id => {
        const s = DATA.skills[id];
        return s && s.school === (run.selectedSchool || "fist") && RARITIES[s.rarity].year <= run.year && !run.skills.includes(id) && !run.trainingSkills.includes(id);
      });
      if (pool.length) {
        const id = pool[Math.floor(Math.random() * pool.length)];
        run.trainingSkills.push(id);
        log(run, `发现洞府遗刻，获得秘籍《${DATA.skills[id].name}》。`);
      } else {
        run.money += scaleMoney(run, 300);
        log(run, "洞府中只有些散碎银两，获得金钱。");
      }
    }},
    { id: "ancientWeapon", name: "古战场遗兵", category: "高手遗物", icon: "兵", desc: "途经古战场，发现一柄埋藏多年的神兵利器。获得当前流派对应武器。", apply: ({ run }) => {
      if (run.selectedSchool) {
        const weapon = Object.values(DATA.weapons).find(w => w.school === run.selectedSchool);
        if (weapon) { run.weapons.push(weapon.id); log(run, `古战场中寻得${weapon.name}！`); return; }
      }
      const w = Object.values(DATA.weapons)[Math.floor(Math.random() * Object.values(DATA.weapons).length)];
      run.weapons.push(w.id);
      log(run, `古战场中寻得${w.name}！`);
    }},
    { id: "templeTreasure", name: "破庙藏珍", category: "高手遗物", icon: "藏", desc: "破庙神像后藏有前人的包裹。获得3枚丹药和200金钱。", apply: ({ run }) => {
      run.items.push("pill", "pill", "statPill");
      run.money += scaleMoney(run, 200);
      log(run, "破庙藏珍，获得金疮药x2、小补丸x1和金钱。");
    }}
  ];
  const training = [
    eventStat("trainHp", "铁布衫苦修", "维度增加", "hp", 120),
    eventStat("trainQi", "吐纳天地", "维度增加", "qi", 20),
    eventStat("trainAtk", "击石碎碑", "维度增加", "atk", 3),
    eventStat("trainDef", "金钟罩初成", "维度增加", "def", 3),
    eventStat("trainCombo", "连打木人桩", "维度增加", "combo", 2),
    eventStat("trainHit", "针眼穿线", "维度增加", "hit", 3),
    eventStat("trainDodge", "凌波步法", "维度增加", "dodge", 1),
    eventStat("trainCrit", "观敌破绽", "维度增加", "crit", 2),
    eventStat("trainSpeed", "踏雪无痕", "维度增加", "speed", 0.04)
  ];
  return [...heritage, ...relic, ...training];
}

function pickYearEnemy(run, eventId, fallbackEnemies) {
  const yr = Math.min(run.year, 3);
  const prefixMap = { ambush: "ambush", duelHall: "fighter", wanted: "bandit" };
  const prefix = prefixMap[eventId];
  if (!prefix) return rand(fallbackEnemies);
  const lookupId = `wanderer_grunt_${prefix}_yr${yr}`;
  const pool = DATA.wandererEnemyPool?.grunts || [];
  const enemy = pool.find(e => e.id === lookupId);
  return enemy || rand(fallbackEnemies);
}

function makeRiskEventPool(run) {
  // 孤云逐浪线：使用专属风险事件池（含金钱任务和孤云敌人）
  if (run.storylineId === "wanderer") return makeWandererRiskPool(run);
  const maxRank = Math.min(4, 1 + Math.floor(monthAbs(run) / 8));
  const enemies = DATA.enemies.filter(e => e.rank <= maxRank);
  const moneyGain = scaleMoney(run, 160);
  const duel = [
    { id: "ambush", name: "林中伏击", category: "切磋", icon: "伏", desc: "密林中遭遇埋伏，来者不善。胜利后获得额外金钱。", apply: ({ run, startBattle }) => startBattle(pickYearEnemy(run, "ambush", enemies)) },
    { id: "duelHall", name: "擂台切磋", category: "切磋", icon: "擂", desc: "城中摆下擂台，以武会友。胜利后获得丰厚武学阅历。", apply: ({ run, startBattle }) => startBattle(pickYearEnemy(run, "duelHall", enemies)) },
    { id: "roadBlock", name: "拦路强人", category: "切磋", icon: "拦", desc: "官道上撞见拦路强人，唯有手中兵刃说话。", apply: ({ startBattle }) => startBattle(rand(enemies)) },
    { id: "justice", name: "路见不平", category: "切磋", icon: "侠", desc: "见恶霸欺压百姓，拔刀相助。胜利后名利双收。", apply: ({ startBattle }) => startBattle(rand(enemies)) },
    { id: "wanted", name: "悬赏缉拿", category: "切磋", icon: "赏", desc: "官府悬赏通缉悍匪，擒下可得重赏。", apply: ({ run, startBattle }) => startBattle(pickYearEnemy(run, "wanted", enemies)) }
  ];
  const price = [
    { id: "doctor", name: "江湖郎中", category: "金钱代价", icon: "医", desc: `江湖郎中兜售秘药，花费${scaleMoney(run, 80)}金钱永久提升攻击+2、防御+2。`, apply: ({ run }) => {
      const cost = scaleMoney(run, 80);
      if (run.money < cost) { log(run, `江湖郎中见你囊中羞涩，摇头离去。`); return; }
      run.money -= cost;
      run.stats.atk += 2; run.stats.def += 2;
      log(run, `花费${cost}金钱服用秘药，攻击+2，防御+2。`);
    }},
    { id: "blackMarket", name: "黑市秘商", category: "金钱代价", icon: "黑", desc: `黑市商人有货出手，花费${scaleMoney(run, 150)}金钱获得一枚小补丸和200经验。`, apply: ({ run }) => {
      const cost = scaleMoney(run, 150);
      if (run.money < cost) { log(run, "黑市商人见你钱不够，转身便走。"); return; }
      run.money -= cost;
      run.items.push("statPill");
      gainExp(run, 200);
      log(run, `花费${cost}金钱，获得小补丸和200武学阅历。`);
    }},
    { id: "bribeGuard", name: "贿赂守卫", category: "金钱代价", icon: "贿", desc: `守卫禁地的老兵见钱眼开，花费${scaleMoney(run, 60)}金钱偷偷放你入内修炼。血量+80，内力+30，经验+60。`, apply: ({ run }) => {
      const cost = scaleMoney(run, 60);
      if (run.money < cost) { log(run, "守卫冷哼一声，不予理睬。"); return; }
      run.money -= cost;
      run.stats.hp += 80; run.stats.qi += 30;
      run.hp += 80; run.qi += 30;
      gainExp(run, 60);
      log(run, `花费${cost}金钱进入禁地修炼，血量+80，内力+30，经验+60。`);
    }},
    { id: "infoBroker", name: "情报贩子", category: "金钱代价", icon: "情", desc: `一位情报贩子愿出售武学心得，花费${scaleMoney(run, 120)}金钱随机秘籍进度+2且经验+80。`, apply: ({ run }) => {
      const cost = scaleMoney(run, 120);
      if (run.money < cost) { log(run, "情报贩子耸耸肩，不做赔本买卖。"); return; }
      run.money -= cost;
      if (run.trainingSkills.length) {
        const id = run.trainingSkills[Math.floor(Math.random() * run.trainingSkills.length)];
        run.skillProgress[id] = (run.skillProgress[id] || 0) + 2;
        log(run, `花费${cost}金钱，${DATA.skills[id].name}修炼进度+2，经验+80。`);
      } else {
        log(run, `花费${cost}金钱，经验+80（暂无修炼中的秘籍）。`);
      }
      gainExp(run, 80);
    }}
  ];
  // 小Boss事件（较低概率单独出现，这里并入风险池）
  const miniBossEvents = (DATA.miniBosses || []).filter(b => run.year >= (b.yearMin || 1)).map(b => ({
    id: "mini_" + b.id,
    name: b.name,
    category: "小Boss",
    icon: b.icon,
    desc: `遭遇${b.name}，胜利可获得丰厚奖励。`,
    apply: ({ run, startBattle }) => {
      const template = { ...b, id: b.id };
      startBattle(template);
    }
  }));
  return [...duel, ...price, ...miniBossEvents];
}

// ============================================================
// 孤云逐浪 专属成长/风险事件池
// ============================================================
function makeWandererGrowthPool(run) {
  const g = DATA.wandererGrowthEvents;
  if (!g) return [];
  const monthAbsVal = (run.year - 1) * 12 + run.month;
  const events = [];

  // --- 传功 (heritage): 按月解锁 + 每局限领一次 ---
  const availableHeritage = (g.heritage || []).filter(h => {
    if (monthAbsVal < h.unlockMonth) return false;
    if (run.collectedHeritages.includes(h.id)) return false;
    return true;
  });
  availableHeritage.forEach(h => {
    const eff = h.effect || {};
    // 构建 apply 函数（统一处理效果字段）
    const applyFn = ({ run: r }) => {
      if (eff.traitGain && !r.traits.includes(eff.traitGain)) r.traits.push(eff.traitGain);
      if (eff.defUp) r.stats.def += eff.defUp;
      if (eff.qiUp) { r.stats.qi += eff.qiUp; r.qi += eff.qiUp; }
      if (eff.hpUp) { r.stats.hp += eff.hpUp; r.hp += eff.hpUp; }
      if (eff.crit) r.stats.crit += eff.crit;
      if (eff.combo) r.stats.combo += eff.combo;
      if (eff.hit) r.stats.hit += eff.hit;
      if (eff.dodge) r.stats.dodge += eff.dodge;
      if (eff.speed) r.stats.speed += eff.speed;
      r.collectedHeritages.push(h.id);
      log(r, `${h.name}！${eff.desc || ""}`);
    };
    events.push({
      id: h.id, name: h.name, category: "高手传功", icon: "传", desc: h.desc, weight: 10,
      apply: applyFn
    });
  });

  // --- 道具 (item): 按月/年解锁 ---
  const availableItem = (g.item || []).filter(it => {
    if (monthAbsVal < it.unlockMonth) return false;
    if (it.unlockYear && run.year < it.unlockYear) return false;
    return true;
  });
  availableItem.forEach(it => {
    if (it.id === "wanderer_item_relic") {
      events.push({
        id: it.id, name: it.name, category: "道具", icon: "遗", desc: it.desc, weight: 10,
        apply: (({ run: r }) => {
          // 随机1~2件消耗品，低价值品概率更高
          const lowPool = ["pill", "pill", "qiWine", "qiWine", "apPowder"];
          const highPool = ["statPill", "bigPill", "qiPill"];
          const pool = Math.random() < 0.75 ? lowPool : highPool;
          const item = pool[Math.floor(Math.random() * pool.length)];
          r.items.push(item);
          const itemName = (DATA.items[item] || {}).name || "丹药";
          if (Math.random() < 0.4) {
            const pool2 = Math.random() < 0.75 ? lowPool : highPool;
            const item2 = pool2[Math.floor(Math.random() * pool2.length)];
            r.items.push(item2);
            const itemName2 = (DATA.items[item2] || {}).name || "丹药";
            log(r, `散人遗物！获得${itemName}、${itemName2}。`);
          } else {
            log(r, `散人遗物！获得${itemName}。`);
          }
        })
      });
    } else if (it.id === "wanderer_item_merchant") {
      events.push({
        id: it.id, name: it.name, category: "道具", icon: "商", desc: it.desc, weight: 10,
        apply: (({ run: r }) => {
          // 五折买随机武器或防具
          const yrRarity = ["blue", "orange", "red"][Math.min(run.year - 1, 2)];
          const isWeapon = Math.random() < 0.5;
          let pool, item;
          if (isWeapon) {
            pool = Object.values(DATA.weapons).filter(w => w.rarity === yrRarity && !w.bossOnly);
          } else {
            pool = Object.values(DATA.armors).filter(a => a.rarity === yrRarity);
          }
          if (pool.length) {
            item = pool[Math.floor(Math.random() * pool.length)];
            const price = Math.floor(item.price * 0.5);
            if (r.money >= price) {
              r.money -= price;
              if (isWeapon) { r.weapons.push(item.id); }
              else { r.armors.push(item.id); }
              log(r, `游商秘货！花${price}金（五折）购得${item.name}。`);
            } else {
              r.money += scaleMoney(r, 40);
              log(r, `游商见你钱不够，丢下几枚碎银走了。获得${scaleMoney(r, 40)}金钱。`);
            }
          } else {
            r.money += scaleMoney(r, 60);
            log(r, `游商今日无货，给你介绍了一单生意。获得${scaleMoney(r, 60)}金钱。`);
          }
        })
      });
    }
  });

  // --- 加属性 (stat): 按月解锁（全从M1起）---
  const statYrIdx = Math.min(run.year, 3) - 1;
  (g.stat || []).forEach(s => {
    if (monthAbsVal < s.unlockMonth) return;
    const v = s.values ? (s.values[`y${run.year}`] || s.values.y1 || 0) : 0;
    events.push({
      id: s.id, name: s.name, category: "属性", icon: "体", desc: s.desc, weight: 20,
      apply: (({ run: r }) => {
        if (s.statKey === "hp") { r.stats.hp += v; r.hp += v; }
        else if (s.statKey === "qi") { r.stats.qi += v; r.qi += v; }
        else { r.stats[s.statKey] += v; }
        log(r, `${s.name}！${STAT_LABELS[s.statKey] || s.statKey}+${v}。`);
      })
    });
  });

  // 应用权重调整并返回全部事件（六选三系统将在上层统一抽取）
  return applyEventWeights(events, availableHeritage.length, availableItem.length);
}

function makeWandererRiskPool(run) {
  const g = DATA.wandererGrowthEvents;
  if (!g) return [];
  const monthAbsVal = (run.year - 1) * 12 + run.month;
  const events = [];
  const yrIdx = Math.min(run.year, 3) - 1;

  // --- 切磋打斗 (fight): 三个通用池 ---
  (g.fight || []).forEach(f => {
    if (monthAbsVal < f.unlockMonth) return;
    const wp = DATA.wandererEnemyPool;
    if (!wp) return;
    const lookupId = `wanderer_grunt_${f.pool}_yr${run.year}`;
    const enemy = wp.grunts.find(e => e.id === lookupId);
    if (!enemy) return;
    const num = (f.count || [2,2,2])[yrIdx] || 2;
    events.push({
      id: f.id, name: f.name, category: "切磋", icon: "战", weight: 30,
      desc: `${f.desc}（${f.name}×${num}）`,
      apply: (({ run: r, startBattle }) => {
        const template = { ...enemy };
        template.name = `${template.name}${num > 1 ? "×" + num : ""}`;
        startBattle(template);
      })
    });
  });

  // --- 金钱 (coin): 按月/年解锁 ---
  (g.coin || []).forEach(c => {
    if (c.unlockMonth && monthAbsVal < c.unlockMonth) return;
    if (c.unlockYear && run.year < c.unlockYear) return;
    const reward = c.reward || {};
    const amount = reward[`y${run.year}`] || reward.y1 || 100;
    events.push({
      id: c.id, name: c.name, category: "金钱", icon: "钱", weight: 30,
      desc: c.desc,
      apply: (({ run: r }) => {
        r.money += amount;
        // 固定额外奖励
        const ar = c.autoReward;
        let bonusLog = "";
        if (ar) {
          if (ar.type === "item" && ar.ids) {
            ar.ids.forEach(iid => { r.items.push(iid); });
            bonusLog = ar.desc || "";
          } else if (ar.type === "stat" && ar.stats) {
            for (const [k, v] of Object.entries(ar.stats)) {
              if (k === "hp") { r.stats.hp += v; r.hp += v; }
              else if (k === "qi") { r.stats.qi += v; r.qi += v; }
              else { r.stats[k] += v; }
            }
            bonusLog = ar.desc || "";
          }
        }
        log(r, `${c.name}！获得${amount}金钱。${bonusLog ? "额外：" + bonusLog : ""}`);
      })
    });
  });

  // 应用权重调整并返回全部事件（六选三系统将在上层统一抽取）
  return applyEventWeights(events);
}

// 对事件应用权重调整（传功/道具不可用时并入加属性），返回带 _w 的全部事件
function applyEventWeights(events, heritageAvail, itemAvail) {
  if (!events.length) return [];
  const _ha = (heritageAvail !== undefined) ? heritageAvail : 99;
  const _ia = (itemAvail !== undefined) ? itemAvail : 99;
  const adjusted = events.map(e => {
    let w = e.weight || 10;
    if (e.category === "高手传功" && _ha === 0) w = 0;
    if (e.category === "道具" && _ia === 0) w = 0;
    return { ...e, _w: w };
  }).filter(e => e._w > 0);
  const lostHeritage = (_ha === 0) ? 10 : 0;
  const lostItem = (_ia === 0) ? 10 : 0;
  const totalLost = lostHeritage + lostItem;
  if (totalLost > 0) {
    const statEvents = adjusted.filter(e => e.category === "属性");
    if (statEvents.length) {
      const bonusPerStat = totalLost / statEvents.length;
      statEvents.forEach(e => { e._w += bonusPerStat; });
    }
  }
  return adjusted;
}

// 加权抽取单个事件（旧接口兼容，非孤云线仍用）
function pickByWeight(events, monthAbsVal, heritageAvail, itemAvail) {
  const adjusted = applyEventWeights(events, heritageAvail, itemAvail);
  if (!adjusted.length) return [];
  const totalW = adjusted.reduce((s, e) => s + e._w, 0);
  if (totalW <= 0) return [events[0]];
  const roll = Math.random() * totalW;
  let acc = 0;
  for (const e of adjusted) {
    acc += e._w;
    if (roll < acc) return [e];
  }
  return [adjusted[adjusted.length - 1]];
}

// 加权无放回抽取 n 个事件（六选三用）
function weightedPickMultiple(events, n) {
  if (!events.length) return [];
  if (events.length <= n) return [...events];
  const result = [];
  const remaining = events.map(e => ({ ...e }));
  for (let i = 0; i < n && remaining.length > 0; i++) {
    const totalW = remaining.reduce((s, e) => s + (e._w || e.weight || 10), 0);
    if (totalW <= 0) {
      result.push(remaining.shift());
      continue;
    }
    const roll = Math.random() * totalW;
    let acc = 0;
    let pickIdx = remaining.length - 1;
    for (let j = 0; j < remaining.length; j++) {
      acc += remaining[j]._w || remaining[j].weight || 10;
      if (roll < acc) { pickIdx = j; break; }
    }
    result.push(remaining[pickIdx]);
    remaining.splice(pickIdx, 1);
  }
  return result;
}

export function refreshManuals(run) {
  let available = getAvailableManuals(run).filter(id => !run.skills.includes(id) && !run.trainingSkills.includes(id));
  // 孤云线：仅限专属秘籍池
  if (run.storylineId === "wanderer") {
    const wpSkillIds = (DATA.wandererMerchantPool?.manuals || []).map(m => m.id);
    available = available.filter(id => wpSkillIds.includes(id));
  }
  const manuals = [];
  if (run.selectedSchool) {
    const locked = available.filter(id => DATA.skills[id]?.school === run.selectedSchool);
    manuals.push(...sample(locked, 2));
    const otherSchools = ALL_SCHOOLS.filter(s => s !== run.selectedSchool);
    for (const school of sample(otherSchools, 2)) {
      const one = sample(available.filter(id => DATA.skills[id]?.school === school && !manuals.includes(id)), 1)[0];
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
  // 孤云线武林商人由刷新按钮手动控制，不在此处触发
  if (run.storylineId !== "wanderer") refreshMerchantStock(run);
}

export function getAvailableManuals(run) {
  return DATA.manuals.filter(id => {
    const skill = DATA.skills[id];
    if (!skill) return false;
    const rInfo = RARITIES[skill.rarity];
    return rInfo && rInfo.year <= run.year;
  });
}

// ============================================================
// 孤云逐浪 专属武林商人（四象限栏位系统）
// 左边上：外功秘籍×6 | 左边下：内功秘籍×2
// 右边上：装备×3(武器+防具) | 右边下：丹药×5
// 全部等概率，不分年份。刷新次数=1+散人决心，动态计算（散人决心+1自动获得+1刷新）。
// ============================================================

// 工具函数：等概率无放回抽取 n 个
function pickRandom(arr, n, filterFn) {
  let avail = filterFn ? [...arr].filter(filterFn) : [...arr];
  const result = [];
  for (let i = 0; i < n && avail.length > 0; i++) {
    const idx = Math.floor(Math.random() * avail.length);
    result.push(avail[idx]);
    avail.splice(idx, 1);
  }
  return result;
}

function generateWandererMerchantStock(run) {
  const pool = DATA.wandererMerchantPool;
  if (!pool) return;

  // 外功秘籍 ×6（排除已学会的，等概率）
  const manuals = pickRandom(pool.manuals || [], 6,
    m => !run.skills.includes(m.id) && !run.trainingSkills.includes(m.id)
  ).map(m => ({ kind: "manual", id: m.id, price: m.price }));

  // 内功秘籍 ×2（排除已拥有的，等概率）
  const arts = pickRandom(pool.internalArts || [], 2,
    a => !run.internalArts.includes(a.id)
  ).map(a => ({ kind: "internalArt", id: a.id, price: a.price }));

  // 装备 ×3（武器+防具合并池，等概率）
  const allEquip = [
    ...(pool.weapons || []).filter(w => !DATA.weapons[w.id]?.bossOnly).map(w => ({ kind: "weapon", ...w })),
    ...(pool.armors || []).map(a => ({ kind: "armor", ...a }))
  ];
  const equipment = pickRandom(allEquip, 3).map(e =>
    ({ kind: e.kind, id: e.id, price: e.price }));

  // 丹药 ×5（等概率）
  const pills = pickRandom([...(pool.pills || [])], 5).map(p =>
    ({ kind: "item", id: p.id }));

  run.merchantStock = [...manuals, ...arts, ...equipment, ...pills];
}

function initWandererMerchant(run) {
  generateWandererMerchantStock(run);
  // 向后兼容：旧存档的 _merchantRefreshes（绝对值）→ _merchantRefreshesUsed（已用次数）
  if (run._merchantRefreshesUsed === undefined && run._merchantRefreshes !== undefined) {
    const maxRef = 1 + (run.wandererResolve || 0);
    run._merchantRefreshesUsed = Math.max(0, maxRef - run._merchantRefreshes);
    delete run._merchantRefreshes;
  } else {
    run._merchantRefreshesUsed = run._merchantRefreshesUsed || 0;
  }
}

export function refreshWandererMerchantAction(run) {
  const maxRefreshes = 1 + (run.wandererResolve || 0);
  const used = run._merchantRefreshesUsed || 0;
  if (used >= maxRefreshes) return { ok: false, message: "本月刷新次数已用完" };
  run._merchantRefreshesUsed = used + 1;
  generateWandererMerchantStock(run);
  saveRun(run);
  return { ok: true };
}

export function refreshMerchantStock(run) {
  if (run.storylineId === "wanderer") return initWandererMerchant(run);
  const rarity = run.year >= 3 ? "red" : run.year >= 2 ? "orange" : "blue";
  // 内功：随机2本同稀有度
  const artPool = Object.values(DATA.internalArts).filter(a => a.rarity === rarity && !run.internalArts.includes(a.id));
  const arts = [];
  for (let i = 0; i < 2 && artPool.length; i++) {
    const idx = Math.floor(Math.random() * artPool.length);
    arts.push({ kind: "internalArt", id: artPool.splice(idx, 1)[0].id });
  }
  // 武器：选当前流派对应路线的同品质武器
  const weapons = [];
  if (run.selectedSchool && COMBAT_SCHOOLS.includes(run.selectedSchool)) {
    const schoolWeapons = Object.keys(DATA.weapons).filter(id => { const w = DATA.weapons[id]; return w.school === run.selectedSchool && w.rarity === rarity && !w.bossOnly; });
    // 最多2把
    for (let i = 0; i < 2 && schoolWeapons.length; i++) {
      const idx = Math.floor(Math.random() * schoolWeapons.length);
      weapons.push({ kind: "weapon", id: schoolWeapons.splice(idx, 1)[0] });
    }
  }
  // 防具：随机2件同品质
  const armorPool = Object.values(DATA.armors).filter(a => a.rarity === rarity);
  const armors = [];
  for (let i = 0; i < 2 && armorPool.length; i++) {
    const idx = Math.floor(Math.random() * armorPool.length);
    armors.push({ kind: "armor", id: armorPool.splice(idx, 1)[0].id });
  }
  // 丹药：按年份解锁
  const items = [
    { kind: "item", id: "pill" },
    { kind: "item", id: "qiWine" },
    { kind: "item", id: "statPill" }
  ];
  if (run.year >= 1) items.push({ kind: "item", id: "bigPill" }, { kind: "item", id: "qiPill" });
  if (run.year >= 2) items.push({ kind: "item", id: "springPaste" }, { kind: "item", id: "yuanPowder" }, { kind: "item", id: "apPowder" });
  if (run.year >= 3) items.push({ kind: "item", id: "apPill" }, { kind: "item", id: "yuanDew" });

  run.merchantStock = [
    ...arts,
    ...weapons,
    ...armors,
    ...items
  ];
}

export function refillOneEvent(run) {
  // 三槽系统：从成长+风险池补充，不引入额外主线事件（主线每月固定1次）
  const growthPool = makeGrowthEventPool(run);
  const riskPool = makeRiskEventPool(run);
  const allPools = [...growthPool, ...riskPool];
  const existingIds = new Set(run.events.map(e => e.id));
  for (let i = 0; i < 15; i++) {
    const newEvent = allPools[Math.floor(Math.random() * allPools.length)];
    if (newEvent && !existingIds.has(newEvent.id)) {
      run.events.push(newEvent);
      return;
    }
  }
  // fallback: 就算重复也加入
  const fallback = allPools[Math.floor(Math.random() * allPools.length)];
  if (fallback) run.events.push(fallback);
}

export function makeEventPool(run) {
  const maxRank = Math.min(4, 1 + Math.floor(monthAbs(run) / 8));
  const enemies = DATA.enemies.filter(e => e.rank <= maxRank);
  const moneyGain = scaleMoney(run, 160);

  // 高手传功 (5%)：江湖高人指点，属性/特性大幅提升
  const heritage = [
    { id: "masterTeach", name: "隐世高手传功", category: "高手传功", icon: "传", desc: "路遇隐世高人，见你资质不凡，传你一套吐纳心法。内力上限+60，血量上限+200。", apply: ({ run }) => {
      run.stats.qi += 60; run.stats.hp += 200; run.qi += 60; run.hp += 200;
      log(run, "隐世高手传功！内力上限+60，血量上限+200。");
    }},
    { id: "zenMaster", name: "禅师灌顶", category: "高手传功", icon: "禅", desc: "古刹老禅师以毕生修为为你灌顶，打通奇经八脉。获得一个随机特性。", apply: ({ run }) => {
      const pool = DATA.traits.filter(t => !run.traits.includes(t.id) && !run.skillTraits.some(st => st.id === t.id));
      if (pool.length) {
        const t = pool[Math.floor(Math.random() * pool.length)];
        run.traits.push(t.id);
        log(run, `禅师灌顶，领悟特性「${t.name}」：${t.desc}。`);
      } else {
        gainExp(run, 200);
        log(run, "禅师灌顶，武学阅历+200。");
      }
    }},
    { id: "hermitPoint", name: "山间奇人点拨", category: "高手传功", icon: "点", desc: "采药时遇山间奇人，点拨你武功关窍。所有未修秘籍进度+1，经验+100。", apply: ({ run }) => {
      for (const id of run.trainingSkills) run.skillProgress[id] = (run.skillProgress[id] || 0) + 1;
      gainExp(run, 100);
      log(run, "山间奇人点拨，所有修炼中秘籍进度+1，经验+100。");
    }}
  ];

  // 高手遗物 (5%)：发现前人遗宝，获得秘籍/武器/财物
  const relic = [
    { id: "caveManual", name: "洞府遗刻", category: "高手遗物", icon: "刻", desc: "悬崖下发现前辈洞府，石壁上刻有一套完整秘籍。获得一本本流派秘籍。", apply: ({ run }) => {
      const pool = Object.keys(DATA.skills).filter(id => {
        const s = DATA.skills[id];
        return s && s.school === (run.selectedSchool || "fist") && RARITIES[s.rarity].year <= run.year && !run.skills.includes(id) && !run.trainingSkills.includes(id);
      });
      if (pool.length) {
        const id = pool[Math.floor(Math.random() * pool.length)];
        run.trainingSkills.push(id);
        log(run, `发现洞府遗刻，获得秘籍《${DATA.skills[id].name}》。`);
      } else {
        run.money += scaleMoney(run, 300);
        log(run, "洞府中只有些散碎银两，获得金钱。");
      }
    }},
    { id: "ancientWeapon", name: "古战场遗兵", category: "高手遗物", icon: "兵", desc: "途经古战场，发现一柄埋藏多年的神兵利器。获得当前流派对应武器。", apply: ({ run }) => {
      if (run.selectedSchool) {
        const weapon = Object.values(DATA.weapons).find(w => w.school === run.selectedSchool);
        if (weapon) {
          run.weapons.push(weapon.id);
          log(run, `古战场中寻得${weapon.name}！`);
          return;
        }
      }
      const w = Object.values(DATA.weapons)[Math.floor(Math.random() * Object.values(DATA.weapons).length)];
      run.weapons.push(w.id);
      log(run, `古战场中寻得${w.name}！`);
    }},
    { id: "templeTreasure", name: "破庙藏珍", category: "高手遗物", icon: "藏", desc: "破庙神像后藏有前人的包裹。获得3枚丹药和200金钱。", apply: ({ run }) => {
      run.items.push("pill", "pill", "statPill");
      run.money += scaleMoney(run, 200);
      log(run, "破庙藏珍，获得金疮药x2、小补丸x1和金钱。");
    }}
  ];

  // 切磋 (30%)：与江湖人士战斗
  const duel = [
    { id: "ambush", name: "林中伏击", category: "切磋", icon: "伏", desc: "密林中遭遇埋伏，来者不善。胜利后获得额外金钱。", apply: ({ run, startBattle }) => startBattle(pickYearEnemy(run, "ambush", enemies)) },
    { id: "duelHall", name: "擂台切磋", category: "切磋", icon: "擂", desc: "城中摆下擂台，以武会友。胜利后获得丰厚武学阅历。", apply: ({ run, startBattle }) => startBattle(pickYearEnemy(run, "duelHall", enemies)) },
    { id: "roadBlock", name: "拦路强人", category: "切磋", icon: "拦", desc: "官道上撞见拦路强人，唯有手中兵刃说话。", apply: ({ startBattle }) => startBattle(rand(enemies)) },
    { id: "justice", name: "路见不平", category: "切磋", icon: "侠", desc: "见恶霸欺压百姓，拔刀相助。胜利后名利双收。", apply: ({ startBattle }) => startBattle(rand(enemies)) },
    { id: "wanted", name: "悬赏缉拿", category: "切磋", icon: "赏", desc: "官府悬赏通缉悍匪，擒下可得重赏。", apply: ({ run, startBattle }) => startBattle(pickYearEnemy(run, "wanted", enemies)) }
  ];

  // 维度增加 (30%)：修炼提升属性
  const training = [
    eventStat("trainHp", "铁布衫苦修", "维度增加", "hp", 120),
    eventStat("trainQi", "吐纳天地", "维度增加", "qi", 20),
    eventStat("trainAtk", "击石碎碑", "维度增加", "atk", 3),
    eventStat("trainDef", "金钟罩初成", "维度增加", "def", 3),
    eventStat("trainCombo", "连打木人桩", "维度增加", "combo", 2),
    eventStat("trainHit", "针眼穿线", "维度增加", "hit", 3),
    eventStat("trainDodge", "凌波步法", "维度增加", "dodge", 1),
    eventStat("trainCrit", "观敌破绽", "维度增加", "crit", 2),
    eventStat("trainSpeed", "踏雪无痕", "维度增加", "speed", 0.04)
  ];

  // 金钱代价 (30%)：花费金钱换取好处
  const price = [
    { id: "doctor", name: "江湖郎中", category: "金钱代价", icon: "医", desc: `江湖郎中兜售秘药，花费${scaleMoney(run, 80)}金钱永久提升攻击+2、防御+2。`, apply: ({ run }) => {
      const cost = scaleMoney(run, 80);
      if (run.money < cost) { log(run, `江湖郎中见你囊中羞涩，摇头离去。`); return; }
      run.money -= cost;
      run.stats.atk += 2; run.stats.def += 2;
      log(run, `花费${cost}金钱服用秘药，攻击+2，防御+2。`);
    }},
    { id: "blackMarket", name: "黑市秘商", category: "金钱代价", icon: "黑", desc: `黑市商人有货出手，花费${scaleMoney(run, 150)}金钱获得一枚小补丸和200经验。`, apply: ({ run }) => {
      const cost = scaleMoney(run, 150);
      if (run.money < cost) { log(run, "黑市商人见你钱不够，转身便走。"); return; }
      run.money -= cost;
      run.items.push("statPill");
      gainExp(run, 200);
      log(run, `花费${cost}金钱，获得小补丸和200武学阅历。`);
    }},
    { id: "bribeGuard", name: "贿赂守卫", category: "金钱代价", icon: "贿", desc: `守卫禁地的老兵见钱眼开，花费${scaleMoney(run, 60)}金钱偷偷放你入内修炼。血量+80，内力+30，经验+60。`, apply: ({ run }) => {
      const cost = scaleMoney(run, 60);
      if (run.money < cost) { log(run, "守卫冷哼一声，不予理睬。"); return; }
      run.money -= cost;
      run.stats.hp += 80; run.stats.qi += 30;
      run.hp += 80; run.qi += 30;
      gainExp(run, 60);
      log(run, `花费${cost}金钱进入禁地修炼，血量+80，内力+30，经验+60。`);
    }},
    { id: "infoBroker", name: "情报贩子", category: "金钱代价", icon: "情", desc: `一位情报贩子愿出售武学心得，花费${scaleMoney(run, 120)}金钱随机秘籍进度+2且经验+80。`, apply: ({ run }) => {
      const cost = scaleMoney(run, 120);
      if (run.money < cost) { log(run, "情报贩子耸耸肩，不做赔本买卖。"); return; }
      run.money -= cost;
      if (run.trainingSkills.length) {
        const id = run.trainingSkills[Math.floor(Math.random() * run.trainingSkills.length)];
        run.skillProgress[id] = (run.skillProgress[id] || 0) + 2;
        log(run, `花费${cost}金钱，${DATA.skills[id].name}修炼进度+2，经验+80。`);
      } else {
        log(run, `花费${cost}金钱，经验+80（暂无修炼中的秘籍）。`);
      }
      gainExp(run, 80);
    }}
  ];

  // 加权随机生成事件
  const categories = [
    { weight: 5, pool: heritage },
    { weight: 5, pool: relic },
    { weight: 30, pool: duel },
    { weight: 30, pool: training },
    { weight: 30, pool: price }
  ];
  const totalWeight = categories.reduce((s, c) => s + c.weight, 0);

  function weightedPick() {
    let r = Math.random() * totalWeight;
    for (const cat of categories) {
      r -= cat.weight;
      if (r <= 0) return rand(cat.pool);
    }
    return rand(categories[categories.length - 1].pool);
  }

  // 生成3个不重复的事件
  const events = [];
  const usedIds = new Set();
  for (let i = 0; i < 3 && events.length < 3; i++) {
    const maxAttempts = 20;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const evt = weightedPick();
      if (!usedIds.has(evt.id)) {
        usedIds.add(evt.id);
        events.push(evt);
        break;
      }
    }
    // 如果实在找不到不重复的，也加入
    if (events.length <= i) {
      const evt = weightedPick();
      events.push(evt);
    }
  }
  return events;
}

function eventStat(id, name, category, key, value) {
  return {
    id,
    name,
    category,
    type: "training",
    icon: STAT_LABELS[key][0],
    desc: `${STAT_LABELS[key]}提升${value}。`,
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
  // 有 apply 函数则调用，否则为纯故事事件（不应走这里，走 resolveStoryChoice）
  if (event.apply) {
    event.apply({ run, ...actions });
  }
    if (event.type !== "merchant" && event.type !== "battle") {
      // 孤云线六选三无需补充，非孤云线维持旧 refill 机制
      if (run.storylineId !== "wanderer" && run.eventRemaining > 0) refillOneEvent(run);
      // 延迟1.5秒输出"已处理完"，避免与第3个奇遇结果toast重叠
      if (run.eventRemaining === 0) {
        setTimeout(() => log(run, "本月奇遇已处理完。"), 1500);
      }
    }
  saveRun(run);
  return true;
}

// 主线事件选择处理：抗争/跳过
// choice: "fight" 触发战斗 | "skip" 跳过本月 | "ending" 选择结局
export function resolveStoryChoice(run, eventId, choice, actions) {
  // 处理孤云逐浪月度主线剧情选择（不在run.events中，在run.currentStory）
  if (run.currentStory && run.currentStory.id === eventId) {
    const story = run.currentStory;

    // === 结局选择（M36战后） ===
    if (choice === "ending" && story.endings && actions.endingId) {
      const endingChoice = story.endings.find(e => e.id === actions.endingId);
      if (!endingChoice) return false;
      // 检查条件
      if (endingChoice.condition) {
        const cond = endingChoice.condition;
        const m = cond.match(/^(\w+)\s*(>=|<=|==|!=|>|<)\s*(.+)$/);
        if (m) {
          const [, key, op, rawVal] = m;
          const runVal = key.startsWith("flag_") ? (run.storyFlags?.[key] || false) : (run[key] ?? 0);
          const cmpVal = key.startsWith("flag_") ? true : Number(rawVal);
          let met = false;
          if (op === ">=") met = runVal >= cmpVal;
          else if (op === "<=") met = runVal <= cmpVal;
          else if (op === "==") met = runVal == cmpVal;
          else if (op === "!=") met = runVal != cmpVal;
          else if (op === ">") met = runVal > cmpVal;
          else if (op === "<") met = runVal < cmpVal;
          if (!met) { run.currentStory = null; saveRun(run); return false; }
        }
      }
      const eff = endingChoice.effect || {};
      log(run, `结局：${endingChoice.label} — ${endingChoice.desc}`);
      run.storyEndings = null;
      run.currentStory = null;
      saveRun(run);
      if (actions.settleEnding) {
        actions.settleEnding(eff, endingChoice);
      }
      return true;
    }

    // === 抗争：触发战斗 ===
    if (choice === "fight") {
      if (!story.enemyId) { run.currentStory = null; saveRun(run); return false; }
      const ed = DATA.enemies?.find(e => e.id === story.enemyId);
      if (!ed) { run.currentStory = null; saveRun(run); return false; }
      // 在run上存储故事战斗上下文，供main.js的resolveBattleResult使用
      run.storyBattle = {
        month: story.month != null ? story.month : monthAbs(run),
        reward: story.battleReward || null,
        isFinalBoss: story.isFinalBoss || false,
        endings: story.endings || null,
        battleDesc: story.battleDesc || ""
      };
      run.currentStory = null;
      saveRun(run);
      const isBoss = story.isBoss || story.isFinalBoss || false;
      actions.startBattle(ed, isBoss);
      return true;
    }

    // === 跳过：直接推进到下个月 ===
    if (choice === "skip") {
      log(run, "你选择暂避锋芒，静观其变。");
      run.currentStory = null;
      run.month++;
      if (run.month > 12) { run.month = 1; run.year++; }
      run.eventRemaining = 3;
      applyMonthStart(run);
      refreshEvents(run);
      saveRun(run);
      return true;
    }

    run.currentStory = null;
    saveRun(run);
    return true;
  }
  const event = run.events.find(e => e.id === eventId);
  if (!event || run.eventRemaining <= 0) return false;
  run.eventRemaining--;
  run.events = run.events.filter(e => e.id !== eventId);

  const handlers = {
    // wanderer
    "wanderer_notice": {
      accept: { threat: 1, log: "你假意接受武盟入册，暗中打探情报。", reward: (r) => { r.money += scaleMoney(r, 120); gainExp(r, 60); }, rewardText: "金钱+120，经验+60" },
      resist: { threat: 0, log: "你当众撕毁武盟征帖，引来一场恶战。", type: "battle" }
    },
    "wanderer_rescue": {
      accept: { threat: 2, log: "你冒着被武盟标记的风险救下几位散人，他们在暗处为你通风报信。", reward: (r) => { r.stats.atk += 2; gainExp(r, 180); }, rewardText: "经验+180，攻击+2" },
      resist: { threat: 0, log: "你花重金打通关节，悄悄放走了散人。", type: "pay", cost: 180 }
    },
    "wanderer_order": {
      accept: { threat: 1, log: "你仔细研读武盟的密令，从中窥见了对付他们的策略。", reward: (r) => {
        if (r.trainingSkills.length) { const id = r.trainingSkills[Math.floor(Math.random() * r.trainingSkills.length)]; r.skillProgress[id] = (r.skillProgress[id] || 0) + 2; }
        gainExp(r, 80);
      }, rewardText: "随机秘籍进度+2，经验+80" },
      resist: { threat: 0, log: "你匿名将密令透露给江湖各方，花钱买通传递渠道。", type: "pay", cost: 100 }
    },
    "wanderer_friend": {
      accept: { threat: 2, log: "你孤身闯入执法堂，击退守卫救出旧友。武盟对你恨之入骨。", reward: (r) => { r.stats.def += 3; gainExp(r, 150); }, rewardText: "防御+3，经验+150" },
      resist: { threat: 0, log: "你花重金买通狱卒，旧友得以脱身。", type: "pay", cost: 280 }
    },
    "wanderer_purge": {
      accept: { threat: 3, log: "你直面武盟围剿，以战止战。江湖散人视你为旗帜。", reward: (r) => {
        r.stats.hp += 200; r.stats.qi += 100; r.stats.atk += 3; r.stats.def += 3;
        r.hp += 200; r.qi += 100;
        gainExp(r, 300);
      }, rewardText: "全属性+3，血量+200，内力+100" },
      resist: { threat: 0, log: "你策划了一场小型战役，带领散人们击退围剿。", type: "battle_mini" }
    },
    // constable
    "constable_edict": {
      accept: { threat: 1, log: "你接下密诏，表面听从内廷调遣，暗中搜集证据。", reward: (r) => { r.money += scaleMoney(r, 150); gainExp(r, 80); }, rewardText: "金钱+150，经验+80" },
      resist: { threat: 0, log: "你表面领旨，实则花钱暗中转移证人。", type: "pay", cost: 120 }
    },
    "constable_file": {
      accept: { threat: 2, log: "你顺着卷宗线索顺藤摸瓜，掌握了厂卫的布局。", reward: (r) => { r.stats.hit += 3; gainExp(r, 140); }, rewardText: "命中+3，经验+140" },
      resist: { threat: 0, log: "你赶在厂卫到来前焚毁卷宗，造成混乱。", type: "battle" }
    },
    "constable_test": {
      accept: { threat: 1, log: "你故意示弱，让厂卫以为你不足为虑。暗中调查得以继续。", reward: (r) => { r.stats.dodge += 2; gainExp(r, 60); }, rewardText: "闪避+2，经验+60" },
      resist: { threat: 0, log: "你强势击退来访厂卫，表明立场。但也暴露了自己。", type: "battle" }
    },
    "constable_oldcase": {
      accept: { threat: 2, log: "你深入调查宫中旧案，揭开了掌印太监的罪证。", reward: (r) => { r.stats.atk += 3; r.stats.def += 2; gainExp(r, 180); }, rewardText: "攻击+3，防御+2，经验+180" },
      resist: { threat: 0, log: "你花重金买通关键证人，暂时压制此事。", type: "pay", cost: 350 }
    },
    "constable_witness": {
      accept: { threat: 3, log: "你亲自护送江湖证人突出重围，与厂卫刺客正面交锋。", reward: (r) => {
        r.stats.atk += 2; r.stats.def += 2; r.stats.hp += 150; r.stats.qi += 80;
        r.hp += 150; r.qi += 80;
        gainExp(r, 200);
      }, rewardText: "全属性+2，经验+200" },
      resist: { threat: 0, log: "你设下埋伏引追杀者入瓮，一网打尽。", type: "battle_mini" }
    },
    // orthodox
    "orthodox_plague": {
      accept: { threat: 1, log: "你冒着被传染的风险为村民解蛊，获得了村民的感激。", reward: (r) => { r.stats.hp += 150; r.hp += 150; r.items.push("pill", "pill"); }, rewardText: "血量+150，金疮药x2" },
      resist: { threat: 0, log: "你花钱组织人手隔离焚烧，阻止疫情扩散。", type: "pay", cost: 100 }
    },
    "orthodox_lotus": {
      accept: { threat: 1, log: "你记下了所有符印的位置，追寻鬼教渗透的线索。", reward: (r) => { r.stats.hit += 2; gainExp(r, 80); }, rewardText: "经验+80，命中+2" },
      resist: { threat: 0, log: "你当众抹除符印，引来鬼教信徒的袭击。", type: "battle" }
    },
    "orthodox_missing": {
      accept: { threat: 2, log: "你顺着打斗痕迹找到鬼教秘道，救出被困的同门。", reward: (r) => { r.stats.atk += 2; r.stats.def += 2; gainExp(r, 120); }, rewardText: "攻击+2，防御+2，经验+120" },
      resist: { threat: 0, log: "你花钱从江湖情报贩子口中打探出秘道入口。", type: "pay", cost: 220 }
    },
    "orthodox_ruin": {
      accept: { threat: 2, log: "你闯入祭坛打乱仪式，与鬼教教徒正面交锋。", reward: (r) => { r.stats.crit += 3; gainExp(r, 150); }, rewardText: "暴击+3，经验+150" },
      resist: { threat: 0, log: "你花钱组织同门力量，围剿祭坛。", type: "pay", cost: 300 }
    },
    "orthodox_bell": {
      accept: { threat: 3, log: "你独自闯入鬼教总坛，以钟声为号发起最后一战。", reward: (r) => {
        r.stats.atk += 3; r.stats.def += 3; r.stats.hp += 200; r.stats.qi += 100;
        r.hp += 200; r.qi += 100;
        gainExp(r, 250);
      }, rewardText: "全属性+3，经验+250" },
      resist: { threat: 0, log: "你召集天衡剑阵同门联合发动剑阵反击鬼教。", type: "battle_mini" }
    }
  };
  const h = handlers[eventId];
  if (!h) {
    log(run, `${event.name}——江湖的故事翻开了新的一页。`);
  } else {
    const result = choice === "accept" ? h.accept : h.resist;
    if (choice === "accept") {
      run.mainThreat = (run.mainThreat || 0) + result.threat;
      if (result.reward) result.reward(run);
      log(run, `【顺应】${result.log}（${result.rewardText || ""}）。威胁值+${result.threat}。`);
    } else {
      // 抗争
      if (result.type === "battle") {
        // 触发普通战斗
        const enemies = (DATA.enemies || []).filter(e => e.rank <= 2 + run.year);
        const enemy = enemies[Math.floor(Math.random() * enemies.length)];
        if (enemy && actions.startBattle) {
          log(run, `【抗争】${result.log}你选择了正面交锋。散人决心+1。`);
          run.wandererResolve = Math.min(10, (run.wandererResolve || 0) + 1);
          run.storyFlags[eventId + "_resist"] = true;
          actions.startBattle(enemy);
          saveRun(run);
          return true; // 战斗触发，不继续处理
        }
        log(run, `【抗争】${result.log}但并无敌手可战。`);
      } else if (result.type === "battle_mini") {
        // 触发小Boss级别战斗
        const miniPool = (DATA.miniBosses || []).filter(b => run.year >= (b.yearMin || 1));
        const boss = miniPool[Math.floor(Math.random() * miniPool.length)];
        if (boss && actions.startBattle) {
          log(run, `【抗争】${result.log}你迎战强敌。散人决心+2。`);
          run.wandererResolve = Math.min(10, (run.wandererResolve || 0) + 2);
          run.storyFlags[eventId + "_resist"] = true;
          const template = { ...boss, id: "mini_" + boss.id };
          actions.startBattle(template);
          saveRun(run);
          return true; // 战斗触发
        }
        log(run, `【抗争】${result.log}但并无强敌可战。`);
      } else if (result.type === "pay") {
        const cost = result.cost || 100;
        if (run.money >= cost) {
          run.money -= cost;
          run.wandererResolve = Math.min(10, (run.wandererResolve || 0) + 1);
          log(run, `【抗争】${result.log}花费${cost}金钱。威胁值不变。散人决心+1。`);
        } else {
          // 钱不够，只能接受一半效果
          run.mainThreat = (run.mainThreat || 0) + Math.ceil(h.accept.threat / 2);
          log(run, `【抗争】钱财不足，只能部分周旋。威胁值+${Math.ceil(h.accept.threat / 2)}。`);
        }
      }
    }
    run.storyFlags[eventId] = true;
  }

  if (run.storylineId !== "wanderer" && run.eventRemaining > 0) refillOneEvent(run);
  if (run.eventRemaining === 0) log(run, "本月奇遇已处理完。");
  saveRun(run);
  return true;
}

export function finishDeferredEvent(run) {
  if (run.storylineId !== "wanderer" && run.eventRemaining > 0) refillOneEvent(run);
  saveRun(run);
}

export function endMonth(run, startBoss) {
  // 孤云逐浪线Boss通过主线抗争触发，不在此自动触发
  if (run.month === 12 && !run.yearlyBossDefeated[run.year] && run.storylineId !== "wanderer") {
    // 从当前主线获取对应年份Boss
    const sl = DATA.storylines?.[run.storylineId];
    const bossTemplate = sl?.bosses?.[run.year];
    if (bossTemplate) {
      const boss = buildBossWithThreat(run, bossTemplate);
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
  applyMonthStart(run);
  refreshEvents(run);
  log(run, `进入第${run.year}年${run.month}月。`);
  saveRun(run);
}

function buildBossWithThreat(run, bossTemplate) {
  const boss = { ...bossTemplate };
  const threat = run.mainThreat || 0;

  // 1. 武盟威视对Boss的增强buff
  if (threat >= 9) {
    boss.hp = Math.floor(boss.hp * 1.3);
    boss.atk = Math.floor(boss.atk * 1.15);
    boss.def = Math.floor((boss.def || 0) * 1.1);
    boss.bossTraitDesc = (boss.bossTraitDesc || "") + "【威势压人：HP+30%, 攻击+15%, 防御+10%】";
  } else if (threat >= 6) {
    boss.hp = Math.floor(boss.hp * 1.2);
    boss.atk = Math.floor(boss.atk * 1.1);
    boss.def = Math.floor((boss.def || 0) * 1.05);
    boss.bossTraitDesc = (boss.bossTraitDesc || "") + "【暗流涌动：HP+20%, 攻击+10%, 防御+5%】";
  } else if (threat >= 3) {
    boss.hp = Math.floor(boss.hp * 1.1);
    boss.atk = Math.floor(boss.atk * 1.05);
    boss.bossTraitDesc = (boss.bossTraitDesc || "") + "【山雨欲来：HP+10%, 攻击+5%】";
  }

  // 2. 散人决心对玩家的增强buff（mainThreat为负时积累，抵消Boss增强）
  const resolve = run.wandererResolve || 0;
  if (resolve > 0) {
    if (resolve >= 9) {
      boss.hp = Math.floor(boss.hp * 0.85);
      boss.atk = Math.floor(boss.atk * 0.9);
      boss.bossTraitDesc = (boss.bossTraitDesc || "") + "【散人齐心：Boss HP-15%, 攻击-10%】";
    } else if (resolve >= 6) {
      boss.hp = Math.floor(boss.hp * 0.9);
      boss.atk = Math.floor(boss.atk * 0.95);
      boss.bossTraitDesc = (boss.bossTraitDesc || "") + "【散人暗助：Boss HP-10%, 攻击-5%】";
    } else if (resolve >= 3) {
      boss.atk = Math.floor(boss.atk * 0.95);
      boss.bossTraitDesc = (boss.bossTraitDesc || "") + "【散人初聚：Boss 攻击-5%】";
    }
  }

  return boss;
}

export function spendAp(run, cost) {
  if (run.ap < cost) return false;
  run.ap -= cost;
  saveRun(run);
  return true;
}

export function trainStat(run, kind) {
  if (!spendAp(run, 1)) return { ok: false, message: "行动力不足" };
  const gains = { atk: 3, def: 3, hp: 90, qi: 30 };
  run.stats[kind] += gains[kind] || 0;
  if (kind === "hp") run.hp += gains[kind];
  if (kind === "qi") run.qi += gains[kind];
  log(run, `修炼基础功，${STAT_LABELS[kind]}提升${gains[kind]}。`);
  const leveled = gainExp(run, 35);
  saveRun(run);
  return { ok: true, leveled };
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
  const leveled = gainExp(run, run.treasure.effect === "manualMastery" ? 80 : 50);
  saveRun(run);
  return { ok: true, leveled };
}

function applySkillCompletion(run, skill) {
  for (const [key, value] of Object.entries(skill.statGain || {})) {
    if (value == null) continue;
    run.stats[key] = Number(((run.stats[key] || 0) + value).toFixed(2));
  }
  run.skillTraits ||= [];
  reconcileStyleMasteries(run);
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
  // 孤云逐浪使用商人池专属定价
  let price;
  if (run.storylineId === "wanderer") {
    const wpManual = (DATA.wandererMerchantPool?.manuals || []).find(m => m.id === skillId);
    price = wpManual ? wpManual.price : Math.floor((skill.rarity === "red" ? 900 : skill.rarity === "orange" ? 520 : 300) * (run.treasure.effect === "manualMastery" ? 0.82 : 1));
  } else {
    price = Math.floor((skill.rarity === "red" ? 900 : skill.rarity === "orange" ? 520 : 300) * (run.treasure.effect === "manualMastery" ? 0.82 : 1));
  }
  if (run.traits.includes("merchantFriend")) price = Math.floor(price * 0.85);
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
    // 升级收益随等级递增
    if (run.level === 2) {
      run.stats.hp += 180; run.stats.qi += 60; run.stats.atk += 3; run.stats.def += 2;
      run.hp += 180; run.qi += 60;
    } else if (run.level <= 4) {
      run.stats.hp += 210; run.stats.qi += 70; run.stats.atk += 4; run.stats.def += 3;
      run.hp += 210; run.qi += 70;
    } else if (run.level <= 7) {
      run.stats.hp += 240; run.stats.qi += 80; run.stats.atk += 4; run.stats.def += 3;
      run.hp += 240; run.qi += 80;
    } else if (run.level <= 10) {
      run.stats.hp += 270; run.stats.qi += 90; run.stats.atk += 5; run.stats.def += 4;
      run.hp += 270; run.qi += 90;
    } else {
      run.stats.hp += 300; run.stats.qi += 100; run.stats.atk += 5; run.stats.def += 5;
      run.hp += 300; run.qi += 100;
    }
    log(run, `地位提升为${getRankTitle(run)}，四项属性提升。`);
    leveled = true;
  }
  // 防止升级后当前血量/内力超过上限（连续多级时累计溢出）
  const armorHp = getArmorStats(run).hp;
  if (run.hp > run.stats.hp + armorHp) run.hp = run.stats.hp + armorHp;
  if (run.qi > run.stats.qi) run.qi = run.stats.qi;
  return leveled;
}

export function expNeed(level) {
  return Math.floor(800 + level * level * 180);
}

/**
 * 计算战斗难度
 * ratio = 玩家血量 / 敌人血量（已按scaleEnemyStats缩放后的实际战斗值）
 * >=1.2: easy, >=0.8: normal, <0.8: hard
 */
export function getBattleDifficulty(playerHp, enemyHp) {
  const ratio = playerHp / enemyHp;
  if (ratio >= 1.2) return { level: "easy", label: "简单", color: "#2ecc71", expMult: 0.7, moneyMult: 0.7 };
  if (ratio >= 0.8) return { level: "normal", label: "一般", color: "#f39c12", expMult: 1.0, moneyMult: 1.0 };
  return { level: "hard", label: "困难", color: "#e74c3c", expMult: 1.3, moneyMult: 1.3 };
}

export function getRankTitle(run) {
  return RANK_TITLES[Math.min(RANK_TITLES.length - 1, Math.max(0, run.level - 1))];
}

export function buyShopEntry(run, entry) {
  if (entry.kind === "weapon") return buyWeapon(run, entry.id);
  if (entry.kind === "armor") return buyArmor(run, entry.id);
  if (entry.kind === "internalArt") return buyInternalArt(run, entry.id);
  if (entry.kind === "manual") return buyManual(run, entry.id);
  return buyItem(run, entry.id);
}

export function buyItem(run, itemId) {
  const item = DATA.items[itemId];
  if (!item) return { ok: false, message: "道具不存在" };
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
  if (!weapon) return { ok: false, message: "武器不存在" };
  // 孤云逐浪使用商人池专属定价（与 buyManual / buyInternalArt 一致）
  let price;
  if (run.storylineId === "wanderer") {
    const wpWeapon = (DATA.wandererMerchantPool?.weapons || []).find(w => w.id === weaponId);
    price = wpWeapon ? wpWeapon.price : weapon.price;
  } else {
    price = weapon.price;
  }
  if (run.traits.includes("merchantFriend")) price = Math.floor(price * 0.85);
  if (run.money < price) return { ok: false, message: "金钱不足" };
  run.money -= price;
  run.weapons.push(weaponId);
  log(run, `购买武器：${weapon.name}。`);
  saveRun(run);
  return { ok: true };
}

export function getInternalArtPrice(run, artId) {
  const art = DATA.internalArts[artId];
  if (!art) return 0;
  if (run.storylineId === "wanderer") {
    const wpArt = (DATA.wandererMerchantPool?.internalArts || []).find(a => a.id === artId);
    return wpArt ? wpArt.price : (art.rarity === "red" ? 1200 : art.rarity === "orange" ? 680 : 360);
  }
  return art.rarity === "red" ? 1200 : art.rarity === "orange" ? 680 : 360;
}

export function buyInternalArt(run, artId) {
  const art = DATA.internalArts[artId];
  if (!art) return { ok: false, message: "不存在该内功" };
  const price = getInternalArtPrice(run, artId);
  let finalPrice = run.traits.includes("merchantFriend") ? Math.floor(price * 0.85) : price;
  if (run.money < finalPrice) return { ok: false, message: "金钱不足" };
  if (run.internalArts.includes(artId)) return { ok: false, message: "已经拥有" };
  run.money -= finalPrice;
  run.internalArts.push(artId);
  // 购买秘籍后需要消耗行动力修炼才能获得属性加成
  log(run, `购买内功秘籍：《${art.name}》。需要在修炼面板花费行动力参悟。`);
  saveRun(run);
  return { ok: true };
}

export function equipInternalArt(run, artId) {
  if (!run.internalArts.includes(artId)) return { ok: false, message: "尚未获得该内功" };
  const art = DATA.internalArts[artId];
  // 检查是否已修炼完成
  const cultivated = (run.cultivatedArts || []).includes(artId) || (run.artProgress?.[artId] || 0) >= (art.cultivateCost || 0);
  if (!cultivated) {
    return { ok: false, message: `尚未修成《${art.name}》（进度${run.artProgress?.[artId] || 0}/${art.cultivateCost}）` };
  }
  if (!run.activeInternalArts) run.activeInternalArts = [];
  if (!run.cultivatedArts) run.cultivatedArts = [];
  if (!run.cultivatedArts.includes(artId)) run.cultivatedArts.push(artId);

  const idx = run.activeInternalArts.indexOf(artId);
  if (idx >= 0) {
    // 已装备 → 卸下
    run.activeInternalArts.splice(idx, 1);
    applyArtStats(run, art, false);
    log(run, `卸下内功：《${art.name}》。`);
  } else {
    // 未装备 → 装备
    if (run.activeInternalArts.length >= 2) {
      // 槽位已满，替换第一个
      const oldId = run.activeInternalArts.shift();
      const oldArt = DATA.internalArts[oldId];
      if (oldArt) applyArtStats(run, oldArt, false);
    }
    run.activeInternalArts.push(artId);
    applyArtStats(run, art, true);
    log(run, `装备内功：《${art.name}》。`);
  }
  saveRun(run);
  return { ok: true };
}

// 应用/移除内功属性加成
function applyArtStats(run, art, add) {
  if (!art?.statGain) return;
  const sign = add ? 1 : -1;
  for (const [key, value] of Object.entries(art.statGain)) {
    run.stats[key] = Number(((run.stats[key] || 0) + value * sign).toFixed(2));
  }
  if (art.statGain.hp) {
    const maxHp = run.stats.hp + getArmorStats(run).hp;
    if (add) run.hp = Math.min(run.hp + art.statGain.hp, maxHp);
    else run.hp = Math.min(run.hp, maxHp);
  }
  if (art.statGain.qi) {
    if (add) run.qi = Math.min(run.qi + art.statGain.qi, run.stats.qi);
    else run.qi = Math.min(run.qi, run.stats.qi);
  }
}

export function trainArt(run, artId) {
  const art = DATA.internalArts[artId];
  if (!art) return { ok: false, message: "不存在该内功" };
  if (!run.internalArts.includes(artId)) return { ok: false, message: "尚未获得该秘籍" };
  const progress = run.artProgress?.[artId] || 0;
  if (progress >= (art.cultivateCost || 0)) return { ok: false, message: "已修炼完成" };
  if (!spendAp(run, 1)) return { ok: false, message: "行动力不足" };
  if (!run.artProgress) run.artProgress = {};
  run.artProgress[artId] = progress + 1;
  if (!run.trainingArts) run.trainingArts = [];
  if (!run.trainingArts.includes(artId)) run.trainingArts.push(artId);
  log(run, `参悟内功《${art.name}》，进度 ${run.artProgress[artId]}/${art.cultivateCost}。`);
  if (run.artProgress[artId] >= (art.cultivateCost || 0)) {
    // 修炼完成：标记为已修炼，属性在装备时生效
    if (!run.cultivatedArts) run.cultivatedArts = [];
    if (!run.cultivatedArts.includes(artId)) run.cultivatedArts.push(artId);
    run.trainingArts = run.trainingArts.filter(id => id !== artId);
    // 自动装备（如有空位）
    if (!run.activeInternalArts) run.activeInternalArts = [];
    if (run.activeInternalArts.length < 2 && !run.activeInternalArts.includes(artId)) {
      run.activeInternalArts.push(artId);
      applyArtStats(run, art, true);
    }
    log(run, `内功修成：《${art.name}》！${run.activeInternalArts.includes(artId) ? "已自动装备。" : "可在人物面板装备。"}`);
  }
  const leveled = gainExp(run, 30);
  saveRun(run);
  return { ok: true, leveled };
}

export function useBagItem(run, itemId) {
  const idx = run.items.indexOf(itemId);
  if (idx < 0) return { ok: false, message: "没有该道具" };
  const item = DATA.items[itemId];
  if (!item) { run.items.splice(idx, 1); return { ok: false, message: "道具数据异常，已清除" }; }
  run.items.splice(idx, 1);
  if (item.type === "heal") run.hp = Math.min(run.stats.hp + getArmorStats(run).hp, run.hp + Math.floor(run.stats.hp * (item.hpPct || 0.2)));
  if (item.type === "qi") run.qi = Math.min(run.stats.qi, run.qi + Math.floor(run.stats.qi * (item.qiPct || 0.25)));
  if (item.type === "stat") {
    for (const key of STAT_KEYS) run.stats[key] = Number(((run.stats[key] || 0) + (item[key] || 0)).toFixed(2));
    if (item.hp) run.hp += item.hp;
    if (item.qi) run.qi += item.qi;
  }
  if (item.type === "ap") {
    if (run.apUsedThisMonth) return { ok: false, message: "本月已使用过行动点丹药" };
    run.ap += item.ap || 1;
    run.apUsedThisMonth = true;
  }
  if (item.type === "apHeal") {
    if (run.apUsedThisMonth) return { ok: false, message: "本月已使用过行动点丹药" };
    run.ap += item.ap || 3;
    run.apUsedThisMonth = true;
    run.hp = Math.min(run.stats.hp + getArmorStats(run).hp, run.hp + Math.floor(run.stats.hp * (item.hpPct || 0.2)));
    run.qi = Math.min(run.stats.qi, run.qi + Math.floor(run.stats.qi * (item.qiPct || 0.2)));
  }
  log(run, `使用${item.name}。`);
  saveRun(run);
  return { ok: true };
}

export function equipWeapon(run, weaponId) {
  if (!run.weapons.includes(weaponId)) return { ok: false, message: "没有该武器" };
  run.equippedWeapon = weaponId;
  log(run, `装备${DATA.weapons[weaponId]?.name || "???"}。`);
  saveRun(run);
  return { ok: true };
}

/** 获取当前装备防具提供的属性加成 */
export function getArmorStats(run) {
  const armor = run.equippedArmor ? DATA.armors[run.equippedArmor] : null;
  if (!armor) return { hp: 0, def: 0, dodge: 0, speed: 0 };
  return {
    hp: armor.hp || 0,
    def: armor.def || 0,
    dodge: armor.dodgeBonus || 0,
    speed: armor.speedBonus || 0
  };
}

export function buyArmor(run, armorId) {
  const armor = DATA.armors[armorId];
  if (!armor) return { ok: false, message: "不存在该防具" };
  if (run.armors.includes(armorId)) return { ok: false, message: "已经拥有" };
  // 孤云逐浪使用商人池专属定价
  let price;
  if (run.storylineId === "wanderer") {
    const wpArmor = (DATA.wandererMerchantPool?.armors || []).find(a => a.id === armorId);
    price = wpArmor ? wpArmor.price : armor.price;
  } else {
    price = armor.price;
  }
  if (run.traits.includes("merchantFriend")) price = Math.floor(price * 0.85);
  if (run.money < price) return { ok: false, message: "金钱不足" };
  run.money -= price;
  run.armors.push(armorId);
  log(run, `购买防具：${armor.name}。`);
  saveRun(run);
  return { ok: true };
}

export function equipArmor(run, armorId) {
  if (!run.armors.includes(armorId)) return { ok: false, message: "没有该防具" };
  run.equippedArmor = armorId;
  log(run, `装备${DATA.armors[armorId]?.name || "???"}。`);
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
  log(run, run.activeSkills.includes(skillId) ? `${skill.name} 上场。` : `${skill.name} 下场。`);
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
  // 失败时额外累积1点开局点数（下次可在分配页使用）
  if (result !== "win") {
    state.extraAllocPoints = (state.extraAllocPoints || 0) + 1;
  }
  saveMeta(meta);
  clearRun();
  state.settlement = { result, reason, points };
  state.run = null;
  state.battle = null;
  state.modal = null;
  state.screen = "settlement";
}

function applyMetaAllocations(stats, allocations) {
  stats.hp += (allocations.hp || 0) * 90;
  stats.qi += (allocations.qi || 0) * 30;
  stats.atk += (allocations.atk || 0) * 3;
  stats.def += (allocations.def || 0) * 3;
  stats.combo += (allocations.combo || 0) * 4;
  stats.hit += (allocations.hit || 0) * 3;
  stats.dodge += allocations.dodge || 0;
  stats.crit += (allocations.crit || 0) * 2;
  stats.speed = Number((stats.speed + (allocations.speed || 0) * 0.04).toFixed(2));
}
