import { DATA, RARITIES, STAT_LABELS, STAT_KEYS } from "../data/content.js";
import { clone, rand, sample, monthAbs } from "../core/utils.js";
import { saveRun, saveMeta, clearRun } from "../core/save.js";
import { state } from "../core/state.js";

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
    activeInternalArt: null,
    finalBoss: null,
    finalBossMonth: 36,
    yearlyBossDefeated: {},
    // 三主线新增
    storylineId: characterId,
    mainThreat: 0,
    wandererResolve: 0,
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
  // 自动触发Toast反馈——任何写入武林纪要的操作都会在屏幕中央闪现
  state.toast = text;
}

export function applyMonthStart(run) {
  run.ap = run.maxAp;
  run.apUsedThisMonth = false;
  if (run.traits.includes("clearMind")) run.ap += 1;
  if (run.treasure.effect === "monthRecover" || run.traits.includes("healer")) {
    const amount = run.treasure.effect === "monthRecover" ? 135 : 90;
    run.hp = Math.min(run.stats.hp, run.hp + amount);
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
  // 三槽事件系统（v0.34三主线）
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
      log(run, "破庙藏珍，获得金疮药x2、小还丹x1和金钱。");
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

function makeRiskEventPool(run) {
  const maxRank = Math.min(4, 1 + Math.floor(monthAbs(run) / 8));
  const enemies = DATA.enemies.filter(e => e.rank <= maxRank);
  const moneyGain = scaleMoney(run, 160);
  const duel = [
    { id: "ambush", name: "林中伏击", category: "切磋", icon: "伏", desc: "密林中遭遇埋伏，来者不善。胜利后获得额外金钱。", apply: ({ startBattle }) => startBattle(rand(enemies)) },
    { id: "duelHall", name: "擂台切磋", category: "切磋", icon: "擂", desc: "城中摆下擂台，以武会友。胜利后获得丰厚武学阅历。", apply: ({ startBattle }) => startBattle(rand(enemies)) },
    { id: "roadBlock", name: "拦路强人", category: "切磋", icon: "拦", desc: "官道上撞见拦路强人，唯有手中兵刃说话。", apply: ({ startBattle }) => startBattle(rand(enemies)) },
    { id: "justice", name: "路见不平", category: "切磋", icon: "侠", desc: "见恶霸欺压百姓，拔刀相助。胜利后名利双收。", apply: ({ startBattle }) => startBattle(rand(enemies)) },
    { id: "wanted", name: "悬赏缉拿", category: "切磋", icon: "赏", desc: "官府悬赏通缉悍匪，擒下可得重赏。", apply: ({ startBattle }) => startBattle(rand(enemies)) }
  ];
  const price = [
    { id: "doctor", name: "江湖郎中", category: "金钱代价", icon: "医", desc: `江湖郎中兜售秘药，花费${scaleMoney(run, 80)}金钱永久提升攻击+2、防御+2。`, apply: ({ run }) => {
      const cost = scaleMoney(run, 80);
      if (run.money < cost) { log(run, `江湖郎中见你囊中羞涩，摇头离去。`); return; }
      run.money -= cost;
      run.stats.atk += 2; run.stats.def += 2;
      log(run, `花费${cost}金钱服用秘药，攻击+2，防御+2。`);
    }},
    { id: "blackMarket", name: "黑市秘商", category: "金钱代价", icon: "黑", desc: `黑市商人有货出手，花费${scaleMoney(run, 150)}金钱获得一枚小还丹和200经验。`, apply: ({ run }) => {
      const cost = scaleMoney(run, 150);
      if (run.money < cost) { log(run, "黑市商人见你钱不够，转身便走。"); return; }
      run.money -= cost;
      run.items.push("statPill");
      gainExp(run, 200);
      log(run, `花费${cost}金钱，获得小还丹和200武学阅历。`);
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
  const monthAbs = (run.year - 1) * 12 + run.month;
  const events = [];
  // --- 传功 (heritage, 条件过滤) ---
  for (const h of (g.heritage || [])) {
    if (h.id === "wanderer_heritage_tieyi" && monthAbs < 10) continue;
    if (h.id === "wanderer_heritage_meng" && monthAbs < 16) continue;
    events.push({
      id: h.id, name: h.name, category: "高手传功", icon: "传", desc: h.desc,
      apply: h.id === "wanderer_heritage_tieyi"
        ? (({ run: r }) => {
            if (!r.traits.includes("tieyi_legacy")) r.traits.push("tieyi_legacy");
            r.stats.def += 10;
            log(r, "感悟铁衣遗志！防御+10，获得特性「铁衣遗志」：流血招式层数+3。");
          })
        : (({ run: r }) => {
            r.stats.qi += 80; r.qi += 80;
            if (!r.traits.includes("clearMind")) r.traits.push("clearMind");
            log(r, "研读灰袍手札！内力上限+80，获得特性「明心」：负面状态-20%。");
          })
    });
  }
  // --- 道具 (item, 条件过滤) ---
  for (const it of (g.item || [])) {
    if (it.id === "wanderer_item_relic" && monthAbs < 6) continue;
    if (it.id === "wanderer_item_merchant" && monthAbs < 6) continue;
    events.push({
      id: it.id, name: it.name, category: "道具", icon: "遗", desc: it.desc,
      apply: it.id === "wanderer_item_relic"
        ? (({ run: r }) => {
            r.items.push("pill", "pill", "statPill", "statPill");
            log(r, "发现外编队遗物！获得金疮药×2、小还丹×2。");
          })
        : (({ run: r }) => {
            // 游商秘货：花钱买防具或直接得硬布背心
            const cost = Math.floor((run.year >= 2 ? 0.6 : 0.5) * (600 + (run.year - 1) * 200));
            if (r.money >= 200) {
              r.money -= 200;
              r.armors.push("armor_heavy_blue");
              log(r, `游商秘货！花200金获得硬布背心。`);
            } else {
              r.money += scaleMoney(r, 80);
              log(r, "游商见你钱不够，丢下几枚散碎银两走了。");
            }
          })
    });
  }
  // --- 属性 (stat, 按年份梯度，含月份过滤) ---
  const statYrVals = { 1: [120, 28, 2, 3], 2: [168, 39, 3, 4], 3: [240, 56, 4, 5] };
  const statKeys = ["hp", "qi", "dodge", "hit"];
  const statMonthMin = [10, 10, 10, 25]; // hp=M10, qi=M10, dodge=M10, hit=M25
  (g.stat || []).forEach((s, i) => {
    if (monthAbs < statMonthMin[i]) return;
    events.push({
      id: s.id, name: s.name, category: "属性", icon: "体", desc: s.desc,
      apply: (({ run: r }) => {
        const v = (statYrVals[run.year] || statYrVals[1])[i];
        if (s.statKey === "hp") { r.stats.hp += v; r.hp += v; }
        else if (s.statKey === "qi") { r.stats.qi += v; r.qi += v; }
        else { r.stats[s.statKey] += v; }
        log(r, `${s.name}！${s.statKey === "hp" ? "血量上限" : s.statKey === "qi" ? "内力上限" : STAT_LABELS[s.statKey] || s.statKey}+${v}。`);
      })
    });
  });
  return events;
}

function makeWandererRiskPool(run) {
  const g = DATA.wandererGrowthEvents;
  if (!g) return [];
  const monthAbs = (run.year - 1) * 12 + run.month;
  const events = [];
  // --- 孤云专属敌人池 ---
  const wp = DATA.wandererEnemyPool;
  const wGrunts = wp?.grunts || [];
  const wMinis = wp?.miniBosses || [];
  // 按 fight 事件 ID 映射专属敌人
  const fightEnemyMap = {
    wanderer_fight_remnant:  { enemies: wGrunts.filter(e => e.id === "wanderer_grunt_disciple"), count: run.year >= 2 ? 3 : 2, desc: "堂口弟子" },
    wanderer_fight_bounty:   { enemies: wGrunts.filter(e => e.id === "wanderer_grunt_bounty"), count: run.year >= 2 ? 4 : 3, desc: "赏金猎人团" },
    wanderer_fight_traitor:  { enemies: wGrunts.filter(e => e.id === "wanderer_grunt_traitor" || e.id === "wanderer_grunt_disciple"), count: 2, desc: "叛徒+武盟弟子" },
    wanderer_fight_arena:    { enemies: wGrunts.filter(e => e.id === "wanderer_grunt_challenger"), count: 1, desc: "各路挑战者" },
    wanderer_fight_escort:   { enemies: wGrunts.filter(e => e.id === "wanderer_grunt_patrol"), count: run.year >= 2 ? 4 : 3, desc: "巡逻追兵" },
    wanderer_fight_camp:     { enemies: wMinis.filter(e => e.id === "wanderer_mini_kanzhang").concat(wGrunts.filter(e => e.id === "wanderer_grunt_guard")), count: 1, desc: "看守长+守卫" }
  };
  // --- 打斗 (fight, 按年份+月份过滤，使用孤云专属敌人) ---
  const fightMonthMin = {
    wanderer_fight_remnant: 13, wanderer_fight_bounty: 20,
    wanderer_fight_traitor: 6, wanderer_fight_arena: 6,
    wanderer_fight_escort: 6, wanderer_fight_camp: 16
  };
  (g.fight || []).forEach(f => {
    if (f.years && !f.years.includes(run.year)) return;
    if (fightMonthMin[f.id] && monthAbs < fightMonthMin[f.id]) return;
    const mapping = fightEnemyMap[f.id];
    const enemyList = mapping ? mapping.enemies : wGrunts;
    const numEnemies = mapping ? mapping.count : 1;
    const battleLabel = mapping ? mapping.desc : "敌人";
    if (!enemyList.length) return;
    events.push({
      id: f.id, name: f.name, category: "切磋", icon: "战",
      desc: `${f.desc}（${battleLabel}×${numEnemies}）`,
      apply: (({ run: r, startBattle }) => {
        const template = { ...enemyList[Math.floor(Math.random() * enemyList.length)] };
        template.name = `${template.name}${numEnemies > 1 ? "×" + numEnemies : ""}`;
        startBattle(template);
      })
    });
  });
  // --- 金钱 (coin, 按年份过滤) ---
  const coinYrMap = { 1: 0, 2: 1, 3: 2 };
  (g.coin || []).forEach(c => {
    const yrIdx = coinYrMap[run.year] || 0;
    const reward = c.reward || {};
    const amount = reward[`y${run.year}`] || reward.y1 || 100;
    // 条件过滤
    if (c.id === "wanderer_coin_escort" && monthAbs < 10) return;
    if (c.id === "wanderer_coin_rebuild" && monthAbs < 10) return;
    if (c.id === "wanderer_coin_intel" && (monthAbs < 16 || run.year < 2)) return;
    if (c.id === "wanderer_coin_fangping" && monthAbs < 2) return;
    if (c.id === "wanderer_coin_labor" && monthAbs < 13) return;
    if (c.id === "wanderer_coin_market" && monthAbs < 6) return;
    events.push({
      id: c.id, name: c.name, category: "金钱", icon: "钱", desc: c.desc,
      apply: (({ run: r }) => {
        r.money += amount;
        log(r, `${c.name}！获得${amount}金钱。${c.bonusDesc ? "（" + c.bonusDesc + "）" : ""}`);
      })
    });
  });
  return events;
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

// ============================================================
// 孤云逐浪 专属武林商人
// ============================================================
function refreshWandererMerchant(run) {
  const pool = DATA.wandererMerchantPool;
  if (!pool) return;
  const yr = run.year;
  // 年份质量过滤
  const qualityOk = (q) => {
    if (yr === 1) return q === "blue" || (Math.random() < 0.15 && q === "orange");
    if (yr === 2) return q === "blue" || q === "orange" || (Math.random() < 0.1 && q === "red");
    return q === "orange" || q === "red";
  };
  // 秘籍：1~2本，排除已学会的
  const availManuals = (pool.manuals || []).filter(m => qualityOk(m.rarity) && !run.skills.includes(m.id) && !run.trainingSkills.includes(m.id));
  const manualCount = Math.random() < 0.5 ? 1 : 2;
  const manuals = [];
  for (let i = 0; i < manualCount && availManuals.length; i++) {
    const idx = Math.floor(Math.random() * availManuals.length);
    const m = availManuals.splice(idx, 1)[0];
    manuals.push({ kind: "manual", id: m.id, price: m.price });
  }
  // 武器：1~2把，优先匹配学派
  const availWeapons = (pool.weapons || []).filter(w => qualityOk(w.rarity));
  const matchingWeapons = run.selectedSchool ? availWeapons.filter(w => w.school === run.selectedSchool) : availWeapons;
  const weaponPool = matchingWeapons.length ? matchingWeapons : availWeapons;
  const weaponCount = Math.random() < 0.5 ? 1 : 2;
  const weapons = [];
  for (let i = 0; i < weaponCount && weaponPool.length; i++) {
    const idx = Math.floor(Math.random() * weaponPool.length);
    const w = weaponPool.splice(idx, 1)[0];
    weapons.push({ kind: "weapon", id: w.id, price: w.price });
  }
  // 防具：1件
  const availArmors = (pool.armors || []).filter(a => qualityOk(a.rarity));
  const armorIdx = availArmors.length ? Math.floor(Math.random() * availArmors.length) : -1;
  const armors = armorIdx >= 0 ? [{ kind: "armor", id: availArmors[armorIdx].id, price: availArmors[armorIdx].price }] : [];
  // 内功：1本
  const availArts = (pool.internalArts || []).filter(a => qualityOk(a.rarity) && !run.internalArts.includes(a.id));
  const artIdx = availArts.length ? Math.floor(Math.random() * availArts.length) : -1;
  const arts = artIdx >= 0 ? [{ kind: "internalArt", id: availArts[artIdx].id, price: availArts[artIdx].price }] : [];
  // 丹药：3~5颗
  const pillCount = 3 + Math.floor(Math.random() * 3); // 3-5
  const pills = [];
  const pillPool = [...(pool.pills || [])];
  for (let i = 0; i < pillCount && pillPool.length; i++) {
    const idx = Math.floor(Math.random() * pillPool.length);
    pills.push({ kind: "item", id: pillPool[idx].id });
    pillPool.splice(idx, 1);
  }
  run.merchantStock = [...manuals, ...weapons, ...armors, ...arts, ...pills];
}

export function refreshMerchantStock(run) {
  if (run.storylineId === "wanderer") return refreshWandererMerchant(run);
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
    const schoolWeapons = Object.keys(DATA.weapons).filter(id => { const w = DATA.weapons[id]; return w.school === run.selectedSchool && w.rarity === rarity; });
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
      log(run, "破庙藏珍，获得金疮药x2、小还丹x1和金钱。");
    }}
  ];

  // 切磋 (30%)：与江湖人士战斗
  const duel = [
    { id: "ambush", name: "林中伏击", category: "切磋", icon: "伏", desc: "密林中遭遇埋伏，来者不善。胜利后获得额外金钱。", apply: ({ startBattle }) => startBattle(rand(enemies)) },
    { id: "duelHall", name: "擂台切磋", category: "切磋", icon: "擂", desc: "城中摆下擂台，以武会友。胜利后获得丰厚武学阅历。", apply: ({ startBattle }) => startBattle(rand(enemies)) },
    { id: "roadBlock", name: "拦路强人", category: "切磋", icon: "拦", desc: "官道上撞见拦路强人，唯有手中兵刃说话。", apply: ({ startBattle }) => startBattle(rand(enemies)) },
    { id: "justice", name: "路见不平", category: "切磋", icon: "侠", desc: "见恶霸欺压百姓，拔刀相助。胜利后名利双收。", apply: ({ startBattle }) => startBattle(rand(enemies)) },
    { id: "wanted", name: "悬赏缉拿", category: "切磋", icon: "赏", desc: "官府悬赏通缉悍匪，擒下可得重赏。", apply: ({ startBattle }) => startBattle(rand(enemies)) }
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
    { id: "blackMarket", name: "黑市秘商", category: "金钱代价", icon: "黑", desc: `黑市商人有货出手，花费${scaleMoney(run, 150)}金钱获得一枚小还丹和200经验。`, apply: ({ run }) => {
      const cost = scaleMoney(run, 150);
      if (run.money < cost) { log(run, "黑市商人见你钱不够，转身便走。"); return; }
      run.money -= cost;
      run.items.push("statPill");
      gainExp(run, 200);
      log(run, `花费${cost}金钱，获得小还丹和200武学阅历。`);
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
    if (run.eventRemaining > 0) refillOneEvent(run);
    if (run.eventRemaining === 0) log(run, "本月随机事件已处理完。");
  }
  saveRun(run);
  return true;
}

// 主线事件选择处理：顺应/抗争
export function resolveStoryChoice(run, eventId, choice, actions) {
  // 处理孤云逐浪月度主线剧情选择（不在run.events中，在run.currentStory）
  if (run.currentStory && run.currentStory.id === eventId) {
    const story = run.currentStory;
    const ch = story.choices?.[choice === "accept" ? 0 : 1];
    if (!ch) return false;
    const eff = ch.effect || {};
    if (eff.mainThreat) run.mainThreat = (run.mainThreat || 0) + eff.mainThreat;
    if (eff.money) { run.money += eff.money; if (run.money < 0) run.money = 0; }
    if (eff.exp) gainExp(run, eff.exp);
    if (eff.fame) run.fame = (run.fame || 0) + eff.fame;
    if (eff.flag) run.storyFlags[eff.flag] = true;
    if (eff.flag2) run.storyFlags[eff.flag2] = true;
    if (eff.gainItem) run.items.push(eff.gainItem);
    if (eff.gainItem2) run.items.push(eff.gainItem2);
    if (eff.atk) run.stats.atk += eff.atk;
    if (eff.def) run.stats.def += eff.def;
    if (eff.hp) { run.stats.hp += eff.hp; run.hp += eff.hp; }
    if (eff.qi) { run.stats.qi += eff.qi; run.qi += eff.qi; }
    if (eff.int) run.stats.int = (run.stats.int || 0) + eff.int;
    if (eff.agi) run.stats.agi = (run.stats.agi || 0) + eff.agi;
    if (eff.maxHpBoost) { run.stats.hp += eff.maxHpBoost; run.hp += eff.maxHpBoost; }
    if (eff.qiBoost) { run.stats.qi += eff.qiBoost; run.qi += eff.qiBoost; }
    if (eff.critBonus) run.critBonus = (run.critBonus || 0) + eff.critBonus;
    if (eff.allyLossReduced) run.allyLossReduced = (run.allyLossReduced || 0) + eff.allyLossReduced;
    if (eff.atkBonus) run.atkBonus = (run.atkBonus || 0) + eff.atkBonus;
    if (eff.hpRecovery) run.hp = Math.min(run.stats.hp, run.hp + eff.hpRecovery);
    // 抗争路线：积累散人决心
    if (choice === "resist") {
      const resolveGain = eff.resolveGain || (eff.triggerBattle ? 1 : eff.money && eff.money < 0 ? 1 : 0);
      if (resolveGain > 0) run.wandererResolve = Math.min(10, (run.wandererResolve || 0) + resolveGain);
    }
    const label = choice === "accept" ? "顺应" : "抗争";
    log(run, `【${label}】${ch.label || ""}——${ch.desc || ""}`);
    // 先处理choice级别的战斗（在eff中）
    if (eff.triggerBattle && eff.enemyId && actions.startBattle) {
      const ed = DATA.enemies?.find(e => e.id === eff.enemyId);
      if (ed) {
        const isMini = story.isMiniBoss || false;
        run.currentStory = null;
        saveRun(run);
        actions.startBattle(ed, isMini);
        return true;
      }
    }
    // 然后处理story级别的战斗（在choice之后触发）
    if (story.triggerBattle && story.enemyId) {
      const ed = DATA.enemies?.find(e => e.id === story.enemyId);
      if (ed) {
        const isMini = story.isMiniBoss || story.isClimaxBattle || false;
        run.currentStory = null;
        saveRun(run);
        actions.startBattle(ed, isMini);
        return true;
      }
    }
    // 处理年末Boss
    if (story.triggerFinalBoss) {
      const bossData = DATA.storylines?.[run.storylineId]?.bosses?.[run.year];
      if (bossData && actions.startBattle) {
        run.currentStory = null;
        saveRun(run);
        const boss = buildBossWithThreat(run, bossData);
        actions.startBattle(boss, true);
        return true;
      }
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

  if (run.eventRemaining > 0) refillOneEvent(run);
  if (run.eventRemaining === 0) log(run, "本月随机事件已处理完。");
  saveRun(run);
  return true;
}

export function finishDeferredEvent(run) {
  if (run.eventRemaining > 0) refillOneEvent(run);
  saveRun(run);
}

export function endMonth(run, startBoss) {
  if (run.month === 12 && !run.yearlyBossDefeated[run.year]) {
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
  if ([1, 4, 7, 10].includes(run.month)) {
    refreshManuals(run);
    log(run, "传武堂刷新了4本秘籍。");
  }
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
  // 孤云逐浪使用商人池专属定价
  let price;
  if (run.storylineId === "wanderer") {
    const wpManual = (DATA.wandererMerchantPool?.manuals || []).find(m => m.id === skillId);
    price = wpManual ? wpManual.price : Math.floor((skill.rarity === "red" ? 900 : skill.rarity === "orange" ? 520 : 300) * (run.treasure.effect === "manualMastery" ? 0.82 : 1));
  } else {
    price = Math.floor((skill.rarity === "red" ? 900 : skill.rarity === "orange" ? 520 : 300) * (run.treasure.effect === "manualMastery" ? 0.82 : 1));
  }
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
  return leveled;
}

export function expNeed(level) {
  return Math.floor(120 + level * level * 42 + level * 38);
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
  if (run.money < price) return { ok: false, message: "金钱不足" };
  if (run.internalArts.includes(artId)) return { ok: false, message: "已经拥有" };
  run.money -= price;
  run.internalArts.push(artId);
  // 立即获得属性加成
  for (const [key, value] of Object.entries(art.statGain || {})) {
    run.stats[key] = Number(((run.stats[key] || 0) + value).toFixed(2));
  }
  run.hp = Math.min(run.hp + (art.statGain?.hp || 0), run.stats.hp);
  run.qi = Math.min(run.qi + (art.statGain?.qi || 0), run.stats.qi);
  log(run, `购买内功秘籍：《${art.name}》。${art.desc}`);
  saveRun(run);
  return { ok: true };
}

export function equipInternalArt(run, artId) {
  if (!run.internalArts.includes(artId)) return { ok: false, message: "尚未获得该内功" };
  // 切换装备：先移除旧效果（这里简化，直接换）
  run.activeInternalArt = artId;
  log(run, `装备内功：《${DATA.internalArts[artId].name}》。`);
  saveRun(run);
  return { ok: true };
}

export function useBagItem(run, itemId) {
  const idx = run.items.indexOf(itemId);
  if (idx < 0) return { ok: false, message: "没有该道具" };
  const item = DATA.items[itemId];
  if (!item) { run.items.splice(idx, 1); return { ok: false, message: "道具数据异常，已清除" }; }
  run.items.splice(idx, 1);
  if (item.type === "heal") run.hp = Math.min(run.stats.hp, run.hp + Math.floor(run.stats.hp * (item.hpPct || 0.2)));
  if (item.type === "qi") run.qi = Math.min(run.stats.qi, run.qi + Math.floor(run.stats.qi * (item.qiPct || 0.25)));
  if (item.type === "stat") {
    for (const key of STAT_KEYS) run.stats[key] = Number(((run.stats[key] || 0) + (item[key] || 0)).toFixed(2));
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
    run.hp = Math.min(run.stats.hp, run.hp + Math.floor(run.stats.hp * (item.hpPct || 0.2)));
    run.qi = Math.min(run.stats.qi, run.qi + Math.floor(run.stats.qi * (item.qiPct || 0.2)));
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

export function buyArmor(run, armorId) {
  const armor = DATA.armors[armorId];
  if (!armor) return { ok: false, message: "不存在该防具" };
  if (run.money < armor.price) return { ok: false, message: "金钱不足" };
  if (run.armors.includes(armorId)) return { ok: false, message: "已经拥有" };
  run.money -= armor.price;
  run.armors.push(armorId);
  log(run, `购买防具：${armor.name}。`);
  saveRun(run);
  return { ok: true };
}

export function equipArmor(run, armorId) {
  if (!run.armors.includes(armorId)) return { ok: false, message: "没有该防具" };
  run.equippedArmor = armorId;
  log(run, `装备${DATA.armors[armorId].name}。`);
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
