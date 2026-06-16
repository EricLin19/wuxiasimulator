import { DATA, STAT_LABELS, STAT_KEYS, SCHOOLS, RARITIES } from "../data/content.js";
import { monthAbs } from "../core/utils.js";
import { expNeed, getRankTitle, getInternalArtPrice, getBattleDifficulty, getArmorStats } from "../systems/runSystem.js";

// Boss 特性中文名映射
const BOSS_TRAIT_META = {
  armorBreak:     { name: "破防贯通", desc: "玩家DEF剩50%；每次命中玩家DEF-5%" },
  hamstringStrike: { name: "断筋",     desc: "每回合断筋+n（n为Boss阶级），上限15层（每层攻击-2%，减速2%；25层引爆：筋断力竭）" },
  veinBreak:       { name: "断脉",     desc: "每回合断脉+n，上限15层（每层内力-2%，减速2%；25层引爆：脉路全封）" },
  chillAura:      { name: "寒气逼人", desc: "每回合寒气+n，上限15层（每层减速4%；25层引爆：极度寒冷）" },
  bloodBlade:      { name: "血刃",     desc: "每回合流血+n，上限15层" },
  venomInfuse:    { name: "淬毒",     desc: "每回合流血+n（淬毒），上限15层" },
  lowHpBerserk:   { name: "低血狂暴", desc: "≤30%HP ATK×1.5，SPEED×n×0.3，持续5回合" },
  shadowStep:      { name: "影步",     desc: "基础DODGE=100；≤50%HP DODGE×1.75；每次闪避回血10%最大HP" },
  armorShield:     { name: "护体真气", desc: "开场20%最大HP护体" },
  celestialShield:  { name: "天罡护体", desc: "开场30%HP护体" },
  celestialCleanse: { name: "天罡净化", desc: "≤50%HP自动释放，净化所有负面+回血30%，每场一次" },
  celestialBurn:    { name: "天罡燃命", desc: "≤10%HP自动释放，ATK×2,SPEED×2,DEF×0.5，持续5回合" },
  // 保留向后兼容
  miniBleed:  { name: "流血", desc: "每回合流血+5" },
  miniFrost:  { name: "寒气", desc: "每回合寒气+5" },
  miniPoison: { name: "中毒", desc: "每回合中毒+5" },
  // 旧版兼容（捕快线/正邪线/奇遇mini Boss）
  highDodge:     { name: "高闪避",   desc: "基础闪避大幅提升" },
  highHitPoison: { name: "暗器淬毒", desc: "命中率高；中毒层数结算后自然衰减" },
  critBreakDef:  { name: "暴击破防", desc: "暴击时穿透防御" },
  drainQiImmuneBurst: { name: "吸内免疫爆发", desc: "命中吸内；前3回合免疫负面；低内爆发" },
  poisonGuPerTurn:   { name: "毒蛊每回合",   desc: "每回合毒+1蛊+1；负面单种衰减" },
  drainQiLowShield:  { name: "吸内低血护体", desc: "命中吸内；低血获得15%护体" },
  poisonGuCapCleanse:{ name: "毒蛊上限净化",  desc: "毒蛊上限+3；50%血净化回血20%" },
  miniHamstring: { name: "断筋",     desc: "每回合断筋+2，削攻" },
  miniGu:        { name: "蛊",       desc: "每回合蛊+2，增加内力消耗" },
  miniCoin:      { name: "金钱镖",   desc: "每2回合固定伤害" },
  pointStrike:   { name: "打穴封脉", desc: "判官笔打穴，概率封行动" },
};

// v5.10：战斗角色详情弹窗状态（避免被每帧重新渲染销毁）
let _battleDetailSide = null; // "player" | "enemy" | null

// ── 战斗浮字：独立于 render 循环，CSS 动画驱动 ──
export function createBattleFloater(side, text, type, ox, oy) {
  const el = document.createElement("div");
  if (!type) {
    el.className = `combat-floater ${side}`;
    el.textContent = text;
  } else {
    el.className = `damage-pop ${side} ${type}`;
    el.textContent = text;
  }
  el.style.setProperty("--ox", `${ox}px`);
  el.style.setProperty("--oy", `${oy}px`);
  el.addEventListener("animationend", () => el.remove());
  const layer = document.getElementById("floater-layer");
  if (layer) layer.appendChild(el);
}

// 特性描述弹窗（替代 alert，避免手机横屏旋转）
window.__showTraitDesc = function (el) {
  const name = el.dataset.traitName || "";
  const desc = el.dataset.traitDesc || "";
  const app = document.getElementById("app");
  if (app.querySelector(".trait-desc-backdrop")) return;
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop trait-desc-backdrop";
  backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.remove(); };
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `<div class="modal-head"><h2 class="modal-title">${name}</h2><button class="btn red small">关闭</button></div><div style="padding:16px;color:#000;line-height:1.8">${desc || "暂无描述"}</div>`;
  modal.querySelector("button").onclick = () => backdrop.remove();
  backdrop.appendChild(modal);
  app.appendChild(backdrop);
};

const STAT_HELP = {
  hp: "局外每点：新局血量+90（等价于1次行动点修炼）",
  qi: "局外每点：新局内力+30（等价于1次行动点修炼）",
  atk: "局外每点：新局攻击+3（等价于1次行动点修炼）",
  def: "局外每点：新局防御+3（等价于1次行动点修炼）",
  combo: "局外每点：新局连击+2",
  hit: "局外每点：新局命中+3。实际命中=100+命中-闪避",
  dodge: "局外每点：新局闪避+1",
  crit: "局外每点：新局暴击+2",
  speed: "局外每点：新局出手速度+0.04",
  money: "局外每点：新局额外+100金钱"
};

export function renderApp(state, actions) {
  const app = document.getElementById("app");
  // v6.3.0: JS强制设版本号
  const bv = document.getElementById("build-ver");
  if (bv && bv.textContent !== "v6.3.0") bv.textContent = "v6.3.0";
  let savedScrollTop = 0;
  let allocateScrollTop = 0;
  if (state.modal && state.screen !== "battle") {
    const oldModal = app.querySelector(".modal");
    if (oldModal) savedScrollTop = oldModal.scrollTop;
  }
  // v5.10 fix：在清除DOM之前保存分配页面滚动位置
  if (state.screen === "allocate") {
    const oldList = app.querySelector(".allocate-list");
    if (oldList) allocateScrollTop = oldList.scrollTop;
  }
  app.innerHTML = "";
  if (state.screen === "menu") app.appendChild(renderMenu(state, actions));
  if (state.screen === "select") app.appendChild(renderSelect(state, actions));
  if (state.screen === "allocate") {
    const screen = renderAllocate(state, actions);
    app.appendChild(screen);
    // 恢复分配页面滚动位置
    if (allocateScrollTop > 0) {
      requestAnimationFrame(() => {
        const newList = screen.querySelector(".allocate-list");
        if (newList) newList.scrollTop = allocateScrollTop;
      });
    }
  }
  if (state.screen === "run") app.appendChild(renderRun(state, actions));
  if (state.screen === "battle") app.appendChild(renderBattle(state, actions));
  if (state.screen === "settlement") app.appendChild(renderSettlement(state, actions));
  if (state.modal && (state.screen !== "battle" || state.modal.type === "battleItems")) {
    app.appendChild(renderModal(state, actions));
    const newModal = app.querySelector(".modal");
    if (newModal) newModal.scrollTop = savedScrollTop;
  }
}

function renderMenu(state, actions) {
  const root = el("div", "main-menu");
  root.innerHTML = `
    <div>
      <div class="title">小小侠客</div>
      <div class="subtitle">构筑原型 v0.34</div>
      <div class="menu-panel">
        <button class="btn" data-act="start">开始新局</button>
        <button class="btn secondary" data-act="continue" ${actions.hasSavedRun() ? "" : "disabled"}>继续存档</button>
        <button class="btn secondary" data-act="meta">局外成长</button>
        <div class="desc">通关：${state.meta.wins}/${state.meta.runs}　可分配属性点：${state.meta.metaPoints}</div>
      </div>
    </div>`;
  root.querySelector("[data-act=start]").onclick = actions.gotoSelect;
  root.querySelector("[data-act=continue]").onclick = actions.continueRun;
  root.querySelector("[data-act=meta]").onclick = () => actions.openModal("meta");
  return root;
}

function renderSelect(state, actions) {
  const screen = el("div", "screen select-layout");
  const left = el("div", "panel");
  left.style.padding = "18px";
  left.innerHTML = `<h2 class="section-title">选择你的角色</h2><div class="cards"></div>`;
  DATA.characters.forEach(c => {
    const card = el("div", `card ${state.selectedCharacter === c.id ? "selected" : ""}`);
    card.innerHTML = `<div class="portrait character-portrait">${c.portraitImage ? `<img src="${c.portraitImage}" alt="${c.name}" loading="lazy" decoding="async">` : `<span>${c.icon}</span>`}</div><div class="name">${c.name}</div><div class="desc">${c.faction}<br>${c.desc}</div>`;
    card.onclick = () => actions.selectCharacter(c.id);
    left.querySelector(".cards").appendChild(card);
  });

  const selected = DATA.characters.find(c => c.id === state.selectedCharacter);
  const right = el("div", "panel select-detail");
  right.style.padding = "18px";
  right.innerHTML = `
    <h2 class="section-title">${selected.name}</h2>
    <div class="portrait character-portrait large">${selected.portraitImage ? `<img src="${selected.portraitImage}" alt="${selected.name}" loading="lazy" decoding="async">` : `<span>${selected.icon}</span>`}</div>
    <div class="desc">${selected.traitText}</div>
    <div class="stats-grid">${STAT_KEYS.map(k => statLine(k, selected.stats[k])).join("")}</div>
    <div class="treasure-head">携带宝物</div>
    <div class="treasure-select-area">
      <div class="cards treasure-cards"></div>
      <button class="btn green start-run-btn">确定</button>
    </div>`;
  DATA.treasures.forEach(t => {
    const locked = t.locked && !state.meta.unlockedTreasures.includes(t.id);
    const card = el("div", `card ${state.selectedTreasure === t.id ? "selected" : ""}`);
    card.innerHTML = `<div class="portrait">${locked ? "锁" : t.icon}</div><div class="name">${t.name}</div><div class="desc">${locked ? "通关后解锁。" : t.desc}</div>`;
    if (!locked) card.onclick = () => actions.selectTreasure(t.id);
    right.querySelector(".treasure-cards").appendChild(card);
  });
  right.querySelector(".start-run-btn").onclick = actions.startRun;
  screen.append(left, right);
  return screen;
}

function renderAllocate(state, actions) {
  const screen = el("div", "screen allocate-layout");
  const selected = DATA.characters.find(c => c.id === state.selectedCharacter);
  const alloc = state.perRunAllocations || {};
  const points = state.allocPoints || 0;
  const allKeys = [...STAT_KEYS, "money"];
  const ALLOC_BONUS = {
    hp: 90, qi: 30, atk: 3, def: 3, combo: 8, hit: 3, dodge: 1, crit: 2, speed: 0.04,
    money: 100
  };
  const ALLOC_HELP = {
    hp: "每点：血量+90", qi: "每点：内力+30",
    atk: "每点：攻击+3", def: "每点：防御+3",
    combo: "每点：连击+2", hit: "每点：命中+3",
    dodge: "每点：闪避+1", crit: "每点：暴击+2",
    speed: "每点：出手速度+0.04", money: "每点：开局金钱+100"
  };

  // 计算调整后属性（实时反映分配）
  const adjStats = { ...selected.stats };
  for (const key of STAT_KEYS) {
    const pts = alloc[key] || 0;
    if (key === "speed") {
      adjStats[key] = Number((adjStats[key] + pts * 0.04).toFixed(2));
    } else {
      adjStats[key] += pts * (ALLOC_BONUS[key] || 0);
    }
  }

  // === 左侧：角色信息（放大版） ===
  const left = el("div", "panel allocate-left");
  left.innerHTML = `
    <h2 class="section-title">${selected.name}</h2>
    <div class="portrait character-portrait allocate-portrait">${selected.portraitImage ? `<img src="${selected.portraitImage}" alt="${selected.name}" loading="lazy" decoding="async">` : `<span>${selected.icon}</span>`}</div>
    <div class="desc" style="font-size:15px;text-align:center">${selected.traitText}</div>
    <div class="stats-grid allocate-stats">${STAT_KEYS.map(k => {
      const base = selected.stats[k];
      const adj = adjStats[k];
      const changed = adj !== base;
      return `<div class="stat-line${changed ? " stat-changed" : ""}"><span>${STAT_LABELS[k]}</span><b>${changed ? `${base} → <span style="color:#27ae60">${k === "speed" ? adj.toFixed(2) : Math.round(adj)}</span>` : (k === "speed" ? base.toFixed(2) : base)}</b></div>`;
    }).join("")}</div>
    <div style="margin-top:8px;text-align:center;color:#f39c12;font-weight:700;font-size:14px">
      开局金钱：${300 + (alloc.money || 0) * 100}◎ ${(alloc.money || 0) > 0 ? `<span style="color:#27ae60">(+${(alloc.money || 0) * 100})</span>` : ""}
    </div>`;

  // === 右侧：分配面板（可滚动） ===
  const right = el("div", "panel allocate-right");
  right.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <h2 class="section-title" style="margin:0">开局点数分配</h2>
      <div style="display:flex;gap:8px;align-items:center">
        <span style="background:#2c2c1a;color:#f39c12;padding:4px 12px;border-radius:6px;font-weight:700;font-size:15px">剩余：${points} 点</span>
        <button class="btn secondary small" data-act="reset-alloc">重置</button>
      </div>
    </div>
    <div class="allocate-list"></div>
    <button class="btn green" style="width:100%;margin-top:10px;font-size:16px;padding:12px" data-act="confirm-alloc">确定（${points > 0 ? `还有${points}点未分配` : "开始冒险"}）</button>`;

  const list = right.querySelector(".allocate-list");
  allKeys.forEach(key => {
    const pts = alloc[key] || 0;
    const bonus = pts * ALLOC_BONUS[key];
    const bonusText = key === "speed" ? `+${bonus.toFixed(2)}` : `+${Math.round(bonus)}`;
    const row = el("div", "row-card");
    row.innerHTML = `<div class="icon-box">${pts}</div><div><div class="row-title">${STAT_LABELS[key] || "金钱"} ${pts > 0 ? bonusText : ""}</div><div class="row-meta">${ALLOC_HELP[key]}</div></div><div style="display:flex;gap:4px"><button class="btn red small" data-act="decr">-</button><button class="btn green small" data-act="incr">+</button></div>`;
    row.querySelector("[data-act=incr]").onclick = () => actions.allocatePoint(key);
    row.querySelector("[data-act=decr]").onclick = () => actions.deallocatePoint(key);
    if (pts <= 0) row.querySelector("[data-act=decr]").disabled = true;
    if (points <= 0) row.querySelector("[data-act=incr]").disabled = true;
    list.appendChild(row);
  });

  right.querySelector("[data-act=reset-alloc]").onclick = actions.resetAllocations;
  right.querySelector("[data-act=confirm-alloc]").onclick = actions.confirmAllocate;
  screen.append(left, right);

  return screen;
}

function renderTopbar(run, actions) {
  const sl = DATA.storylines?.[run.storylineId];
  const storylineName = sl?.name || "江湖";
  const threatName = sl?.threatName || "";
  const threatColor = (run.mainThreat || 0) >= 6 ? "#e74c3c" : (run.mainThreat || 0) >= 3 ? "#f39c12" : "#888";
  const threatText = run.mainThreat > 0 ? `<span style="color:${threatColor};font-size:13px;margin-left:6px">${threatName}：${run.mainThreat}</span>` : "";
  const top = el("div", "topbar");
  top.innerHTML = `
    <div class="date">第${run.year}年·${run.month}月　${storylineName}${threatText}</div>
    <div class="ap-wrap">行动力 ${run.ap}/${run.maxAp}</div>
    <div class="topbar-right"><span class="money-display">◎${run.money}</span><button class="settings-btn" data-act="settings" title="设置">⚙</button></div>`;
  top.querySelector("[data-act=settings]").onclick = actions.openSettings;
  return top;
}

function renderRun(state, actions) {
  const run = state.run;
  if (run.storylineId === "wanderer") return renderWandererRun(state, actions);
  const root = el("div");
  root.appendChild(renderTopbar(run, actions));
  const screen = el("div", "screen run-layout");
  screen.innerHTML = `
    <div class="left-nav">
      <div class="nav-tile" data-modal="character">角色</div>
      <div class="nav-tile" data-modal="backpack">背包</div>
      <div class="nav-tile" data-modal="goals">目标</div>
    </div>
    <div class="center-stage">
      <div class="hero-status-story">
        ${bar(run.hp, run.stats.hp + getArmorStats(run).hp, `${run.hp}/${run.stats.hp + getArmorStats(run).hp}`)}
        ${bar(run.martialExp, expNeed(run.level), `经验 ${run.martialExp}/${expNeed(run.level)}｜${getRankTitle(run)}`, "exp-fill")}
      </div>
      <div class="bottom-actions">
        <div class="action-card" data-modal="events">奇遇<br>${run.eventRemaining}/3</div>
        <div class="action-card" data-modal="training">修炼</div>
        <div class="action-card" data-modal="hall">武林商人</div>
        <div class="action-card" data-action="next">下回合</div>
        <div class="action-card" data-modal="journal">纪要</div>
      </div>
    </div>`;
  screen.querySelectorAll("[data-modal]").forEach(node => { node.onclick = () => actions.openModal(node.dataset.modal); });
  screen.querySelector("[data-action=next]").onclick = actions.endMonth;
  root.appendChild(screen);
  return root;
}

function renderWandererRun(state, actions) {
  const run = state.run;
  const story = run.currentStory;
  const root = el("div");
  root.appendChild(renderTopbar(run, actions));
  const screen = el("div", "screen wanderer-run-layout");

  // 左侧导航
  const leftNav = el("div", "left-nav");
  leftNav.innerHTML = `<div class="nav-tile" data-modal="character">角色</div><div class="nav-tile" data-modal="backpack">背包</div><div class="nav-tile" data-modal="goals">目标</div>`;
  leftNav.querySelectorAll("[data-modal]").forEach(node => { node.onclick = () => actions.openModal(node.dataset.modal); });

  // 中央画布
  const center = el("div", "center-stage");

  // 主线剧情画布（占满中间）
  const storyCanvas = el("div", "story-canvas");
  if (story) {
    storyCanvas.innerHTML = `
      <div class="story-body">${escapeHtml(story.text || "")}</div>`;

    // 最终Boss：只显示战斗按钮（结局在战后 run.storyEndings 中展示）
    if (story.isFinalBoss && story.fightLabel) {
      const choicesDiv = el("div", "story-choices");
      choicesDiv.innerHTML = `
        <button class="btn red fight-btn" data-story-choice="fight" style="font-size:18px;padding:16px;width:100%">${story.fightLabel}</button>`;
      choicesDiv.querySelector("[data-story-choice=fight]").onclick = () => actions.chooseStoryEvent(story.id || story.month, "fight");
      storyCanvas.appendChild(choicesDiv);
    }
    // 普通战斗月（偶数月）：抗争按钮 + 跳过
    else if (story.fightLabel) {
      const choicesDiv = el("div", "story-choices");
      choicesDiv.innerHTML = `
        <button class="btn red fight-btn" data-story-choice="fight">${story.fightLabel || "抗争"}</button>
        <div class="skip-link" data-story-choice="skip" style="text-align:center;margin-top:12px;color:#777;cursor:pointer;font-size:13px;text-decoration:underline">跳过本月 →</div>`;
      choicesDiv.querySelector("[data-story-choice=fight]").onclick = () => actions.chooseStoryEvent(story.id || story.month, "fight");
      choicesDiv.querySelector("[data-story-choice=skip]").onclick = () => actions.chooseStoryEvent(story.id || story.month, "skip");
      storyCanvas.appendChild(choicesDiv);
    }
    // 纯结局展示（非战斗故事的结局）
  } else if (run.storyEndings) {
    // M36 战后结局选择（从 battle 结算回来）
    storyCanvas.innerHTML = `<div class="story-body">太行之巅，风云变色。楚宗玄倒下后，武盟群龙无首——天下散人的命运，握在你手中。</div>`;
    const endingsDiv = el("div", "story-choices");
    endingsDiv.innerHTML = run.storyEndings.map(e => {
      const condNote = e.condition ? `<span style="font-size:10px;color:#999;display:block">条件：${e.condition}</span>` : "";
      return `<button class="btn ending-btn" data-ending-id="${e.id}" style="background:#d4a056;color:#1a1a2e;margin:6px 0;padding:12px;width:100%;text-align:left;font-size:14px;font-weight:700">${e.label}${condNote}<span style="font-size:12px;font-weight:400;display:block;margin-top:4px">${e.desc}</span></button>`;
    }).join("");
    endingsDiv.querySelectorAll("[data-ending-id]").forEach(btn => {
      btn.onclick = () => actions.chooseStoryEvent("m36_endings", "ending", btn.getAttribute("data-ending-id"));
    });
    storyCanvas.appendChild(endingsDiv);
  } else {
    storyCanvas.innerHTML = `<div class="story-no-event">江湖风平浪静，且待下回分晓……</div>`;
  }

  // 血量和经验条（仅两条）
  const barsDiv = el("div", "story-bars");
  barsDiv.innerHTML = `
    ${bar(run.hp, run.stats.hp + getArmorStats(run).hp, `${run.hp}/${run.stats.hp + getArmorStats(run).hp}`)}
    ${bar(run.martialExp, expNeed(run.level), `经验 ${run.martialExp}/${expNeed(run.level)}｜${getRankTitle(run)}`, "exp-fill")}
  `;

  center.appendChild(storyCanvas);
  center.appendChild(barsDiv);

  // 底部操作：5按钮（奇遇/修炼/武林商人/下回合/纪要）
  const actionsDiv = el("div", "bottom-actions");
  actionsDiv.innerHTML = `
    <div class="action-card" data-modal="events">奇遇<br>${run.eventRemaining}/3</div>
    <div class="action-card" data-modal="training">修炼</div>
    <div class="action-card" data-modal="hall">武林商人</div>
    <div class="action-card" data-action="next">下回合</div>
    <div class="action-card" data-modal="journal">纪要</div>`;
  actionsDiv.querySelectorAll("[data-modal]").forEach(node => { node.onclick = () => actions.openModal(node.dataset.modal); });
  actionsDiv.querySelector("[data-action=next]").onclick = actions.endMonth;
  center.appendChild(actionsDiv);

  screen.append(leftNav, center);
  root.appendChild(screen);
  return root;
}

function renderModal(state, actions) {
  const run = state.run;
  const back = el("div", "modal-backdrop");
  const modal = el("div", "modal");
  const close = `<button class="btn red small" data-close>关闭</button>`;
  const renderers = {
    meta: () => renderMetaModal(modal, state, actions, close),
    events: () => renderEventsModal(modal, run, actions, close),
    training: () => renderTrainingModal(modal, run, actions, close),
    hall: () => renderMerchantModal(modal, run, actions, true),
    reward: () => renderRewardModal(modal, state, actions),
    merchant: () => renderMerchantModal(modal, run, actions, false),
    character: () => renderCharacterModal(modal, run, actions, close),
    backpack: () => renderBackpackModal(modal, run, actions, close),
    goals: () => renderGoalsModal(modal, run, close),
    journal: () => renderJournalModal(modal, run, close),
    battleItems: () => renderBattleItemsModal(modal, run, state.battle, actions),
    settings: () => renderSettingsModal(modal, state, actions, close)
  };
  renderers[state.modal.type]?.();
  const closeBtn = modal.querySelector("[data-close]");
  if (closeBtn) closeBtn.onclick = actions.closeModal;
  back.appendChild(modal);
  return back;
}

const META_BONUS = {
  hp: 90, qi: 30, atk: 3, def: 3, combo: 8, hit: 3, dodge: 1, crit: 2, speed: 0.04,
  money: 100
};

function renderMetaModal(modal, state, actions, close) {
  state.meta.allocations ||= {};
  modal.innerHTML = `<div class="modal-head"><h2 class="modal-title">局外成长</h2>${close}</div><div class="inventory-summary"><div class="inventory-chip">可分配属性点：${state.meta.metaPoints}</div><div class="inventory-chip">通关：${state.meta.wins}/${state.meta.runs}</div><div class="inventory-chip">无尽模式：${state.meta.endlessUnlocked ? "已解锁" : "未解锁"}</div></div><div class="list"></div>`;
  STAT_KEYS.forEach(key => {
    const pts = state.meta.allocations[key] || 0;
    const bonus = pts * META_BONUS[key];
    const bonusText = key === "speed" ? `+${bonus.toFixed(2)}` : `+${Math.round(bonus)}`;
    modal.querySelector(".list").appendChild(rowCard("点", `${STAT_LABELS[key]} ${bonusText}（已分配${pts}点）`, STAT_HELP[key], "分配", () => actions.allocateMeta(key)));
  });
  // 金钱分配
  const moneyPts = state.meta.allocations.money || 0;
  const moneyBonus = moneyPts * 100;
  const moneyText = moneyBonus > 0 ? `金钱 +${moneyBonus}（已分配${moneyPts}点）` : `金钱（已分配${moneyPts}点）`;
  modal.querySelector(".list").appendChild(rowCard("金", moneyText, STAT_HELP.money, "分配", () => actions.allocateMeta("money")));
}

function renderEventsModal(modal, run, actions, close) {
  const CATEGORY_COLORS = { "主线": "#c0392b", "高手传功": "#d4a056", "高手遗物": "#a855f7", "切磋": "#e74c3c", "维度增加": "#2ecc71", "金钱代价": "#f39c12", "金钱": "#f39c12", "道具": "#27ae60", "属性": "#2ecc71", "小Boss": "#8e44ad" };
  // 主线事件威胁值 + 两条路线文案
  const STORY_CHOICES = {
    // wanderer
    "wanderer_notice": { threat: 1, acceptName: "接帖入册", acceptLog: "你假意接受武盟入册，暗中打探情报。", acceptReward: "金钱+120，经验+60", rejectName: "撕帖拒命", rejectLog: "你当众撕毁武盟征帖，引来一场恶战。", rejectType: "battle" },
    "wanderer_rescue": { threat: 2, acceptName: "见义勇为", acceptLog: "你冒着被武盟标记的风险救下几位散人，他们在暗处为你通风报信。", acceptReward: "经验+180，攻击+2", rejectName: "明哲保身", rejectLog: "你选择用金钱打通关节，悄悄放走散人。", rejectType: "pay", rejectCost: 180 },
    "wanderer_order": { threat: 1, acceptName: "研读密令", acceptLog: "你仔细研读武盟的密令，从中窥见了对付他们的策略。", acceptReward: "随机修炼笔记进度+2，经验+80", rejectName: "匿名举报", rejectLog: "你匿名将密令透露给江湖各方，花钱买通传递渠道。", rejectType: "pay", rejectCost: 100 },
    "wanderer_friend": { threat: 2, acceptName: "劫狱救人", acceptLog: "你孤身闯入执法堂，击退守卫救出旧友。武盟对你恨之入骨。", acceptReward: "防御+3，经验+150", rejectName: "买通狱卒", rejectLog: "你花重金买通狱卒，旧友得以脱身。", rejectType: "pay", rejectCost: 280 },
    "wanderer_purge": { threat: 3, acceptName: "正面对抗", acceptLog: "你直面武盟围剿，以战止战。江湖散人视你为旗帜。", acceptReward: "全属性+3，获得强力武器", rejectName: "集结散人", rejectLog: "你策划了一场小型战役，带领散人们击退围剿。", rejectType: "battle_mini" },
    // constable
    "constable_edict": { threat: 1, acceptName: "接旨暗查", acceptLog: "你接下密诏，表面听从内廷调遣，暗中搜集证据。", acceptReward: "金钱+150，经验+80", rejectName: "阳奉阴违", rejectLog: "你表面领旨，实则花钱暗中转移证人。", rejectType: "pay", rejectCost: 120 },
    "constable_file": { threat: 2, acceptName: "深入追查", acceptLog: "你顺着卷宗线索顺藤摸瓜，掌握了厂卫的布局。", acceptReward: "命中+3，经验+140", rejectName: "紧急焚毁", rejectLog: "你赶在厂卫到来前焚毁卷宗，造成一场混乱的遭遇战。", rejectType: "battle" },
    "constable_test": { threat: 1, acceptName: "虚与委蛇", acceptLog: "你故意示弱，让厂卫以为你不足为虑。暗中调查得以继续。", acceptReward: "闪避+2，经验+60", rejectName: "强势还击", rejectLog: "你击退来访厂卫，表明立场。但也暴露了自己。", rejectType: "battle" },
    "constable_oldcase": { threat: 2, acceptName: "彻查真相", acceptLog: "你深入调查宫中旧案，揭开了掌印太监的罪证。", acceptReward: "攻击+3，防御+2，经验+180", rejectName: "花钱封口", rejectLog: "你花重金买通关键证人，暂时压制此事。", rejectType: "pay", rejectCost: 350 },
    "constable_witness": { threat: 3, acceptName: "护送证人", acceptLog: "你亲自护送江湖证人突出重围，与厂卫刺客正面交锋。", acceptReward: "全属性+2，经验+200", rejectName: "设伏反击", rejectLog: "你设下埋伏引追杀者入瓮，一网打尽。", rejectType: "battle_mini" },
    // orthodox
    "orthodox_plague": { threat: 1, acceptName: "救治村民", acceptLog: "你冒着被传染的风险为村民解蛊，获得了村民的感激。", acceptReward: "血量+150，获得金疮药x2", rejectName: "焚烧疫区", rejectLog: "你花钱组织人手隔离焚烧，阻止疫情扩散。", rejectType: "pay", rejectCost: 100 },
    "orthodox_lotus": { threat: 1, acceptName: "暗中调查", acceptLog: "你记下了所有符印的位置，追寻鬼教渗透的线索。", acceptReward: "经验+80，命中+2", rejectName: "当众清除", rejectLog: "你当众抹除符印，引来鬼教信徒的袭击。", rejectType: "battle" },
    "orthodox_missing": { threat: 2, acceptName: "追踪秘道", acceptLog: "你顺着打斗痕迹找到鬼教秘道，救出被困的同门。", acceptReward: "攻击+2，防御+2，经验+120", rejectName: "花钱买消息", rejectLog: "你花钱从江湖情报贩子口中打探出秘道入口。", rejectType: "pay", rejectCost: 220 },
    "orthodox_ruin": { threat: 2, acceptName: "闯入祭坛", acceptLog: "你闯入祭坛打乱仪式，与鬼教教徒正面交锋。", acceptReward: "暴击+3，经验+150", rejectName: "集结同门", rejectLog: "你花钱组织同门力量，围剿祭坛。", rejectType: "pay", rejectCost: 300 },
    "orthodox_bell": { threat: 3, acceptName: "破阵灭鬼", acceptLog: "你独自闯入鬼教总坛，以钟声为号发起最后一战。", acceptReward: "全属性+3，经验+250", rejectName: "天衡剑阵", rejectLog: "你召集天衡剑阵同门联合发动剑阵反击鬼教。", rejectType: "battle_mini" }
  };
  modal.innerHTML = `<div class="modal-head"><h2 class="modal-title">江湖奇遇</h2>${close}</div><div class="event-count">可参与事件数：${run.eventRemaining} / ${run.events.length}（六选三）</div><div class="event-grid"></div>`;
  run.events.forEach(e => {
    const card = el("div", "event-card");
    const catColor = CATEGORY_COLORS[e.category] || "#888";
    const storyTag = e.type === "story" ? ` <span style="font-size:10px;color:#c0392b;margin-left:4px">【主线】</span>` : "";
    const sc = STORY_CHOICES[e.id];
    // 主线威胁值标注
    const threatNote = sc ? `<p style="color:#e74c3c;font-weight:700;margin:6px 0 0 0">武盟威视+${sc.threat}（顺应）</p>` : "";
    // 战斗难度标注（动态计算）
    let diffNote = "";
    const diff = computeEventDifficulty(run, e);
    if (diff) {
      diffNote = `<p style="color:${diff.color};font-weight:700;margin:6px 0 0 0">战斗难度：${diff.label}</p>`;
    } else if (e.category === "小Boss") {
      diffNote = `<p style="color:#e74c3c;font-weight:900;margin:6px 0 0 0">战斗难度：极难</p>`;
    }
    if (e.type === "story") {
      // 主线事件：双按钮
      card.innerHTML = `<span class="event-cat-tag" style="background:${catColor}">${e.category || "事件"}</span><h3>${e.name}${storyTag}</h3><div class="event-art">${e.icon}</div><p>${e.desc}</p>${threatNote}<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px"><button class="btn green small" data-accept>顺应</button><button class="btn red small" data-resist>抗争</button></div>`;
      card.querySelector("[data-accept]").disabled = run.eventRemaining <= 0;
      card.querySelector("[data-resist]").disabled = run.eventRemaining <= 0;
      card.querySelector("[data-accept]").onclick = () => actions.chooseStoryEvent(e.id, "accept");
      card.querySelector("[data-resist]").onclick = () => actions.chooseStoryEvent(e.id, "resist");
    } else {
      card.innerHTML = `<span class="event-cat-tag" style="background:${catColor}">${e.category || "事件"}</span><h3>${e.name}${storyTag}</h3><div class="event-art">${e.icon}</div><p>${e.desc}</p>${threatNote}${diffNote}<button class="btn green">选择</button>`;
      card.querySelector("button").disabled = run.eventRemaining <= 0;
      card.querySelector("button").onclick = () => actions.chooseEvent(e.id);
    }
    modal.querySelector(".event-grid").appendChild(card);
  });
}

function renderTrainingModal(modal, run, actions, close) {
  modal.innerHTML = `<div class="modal-head"><h2 class="modal-title">修炼技能</h2>${close}</div><div class="list"></div>`;
  if (run.trainingSkills.length) {
    const header = el("div", "row-card section-header");
    header.innerHTML = `<div class="row-title" style="grid-column:1/-1;text-align:center;color:#d4a056">— 未修炼秘籍（${run.trainingSkills.length}本）—</div>`;
    modal.querySelector(".list").appendChild(header);
    run.trainingSkills.forEach(id => {
      const s = DATA.skills[id];
      const statText = Object.entries(s.statGain || {}).map(([k, v]) => `${STAT_LABELS[k]}+${v}`).join("，");
      modal.querySelector(".list").appendChild(rowCard(s.icon, skillDisplayName(s), `${schoolName(s.school)}｜${s.styleName || ""}｜${s.desc} 完成：${statText}。进度 ${run.skillProgress[id] || 0}/${s.train}`, "修炼", () => actions.trainSkill(id)));
    });
  }
  // 内功修炼
  const uncultivatedArts = (run.internalArts || []).filter(id => {
    const art = DATA.internalArts[id];
    return art && (run.artProgress?.[id] || 0) < (art.cultivateCost || 0);
  });
  if (uncultivatedArts.length) {
    const artHeader = el("div", "row-card section-header");
    artHeader.innerHTML = `<div class="row-title" style="grid-column:1/-1;text-align:center;color:#8e44ad">— 未修炼内功（${uncultivatedArts.length}本）—</div>`;
    modal.querySelector(".list").appendChild(artHeader);
    uncultivatedArts.forEach(id => {
      const art = DATA.internalArts[id];
      if (!art) return;
      const statText = Object.entries(art.statGain || {}).map(([k, v]) => `${STAT_LABELS[k]}+${v}`).join("，");
      modal.querySelector(".list").appendChild(rowCard(art.icon, `【${art.rarity === "red" ? "绝" : art.rarity === "orange" ? "上" : "中"}】${art.name}`, `${art.desc} 完成：${statText}。进度 ${run.artProgress?.[id] || 0}/${art.cultivateCost}`, "参悟", () => actions.trainArt(id)));
    });
  }
  const rows = [
    { title: "举铁", meta: "攻击+3，经验+35，消耗1行动", icon: "拳", action: () => actions.trainStat("atk") },
    { title: "站桩功", meta: "防御+3，经验+35，消耗1行动", icon: "桩", action: () => actions.trainStat("def") },
    { title: "扎马步", meta: "血量上限+90，经验+35，消耗1行动", icon: "马", action: () => actions.trainStat("hp") }
  ];
  rows.forEach(x => modal.querySelector(".list").appendChild(rowCard(x.icon, x.title, x.meta, "修炼", x.action)));
  modal.querySelector(".list").appendChild(rowCard("气", "内力吐纳", "内力上限+30，经验+35，消耗1行动", "修炼", () => actions.trainStat("qi")));
}

function renderRewardModal(modal, state, actions) {
  modal.innerHTML = `<h2 class="section-title">请选择突破奖励</h2><div class="reward-grid"></div>`;
  const TYPE_COLORS = {
    "特性": "#b9372e",
    "武学秘籍": "#1e73ad",
    "武器": "#d56a12",
    "防具": "#607d4a",
    "内功心法": "#8e44ad",
    "丹药": "#c0392b"
  };
  state.modal.options.forEach((opt, index) => {
    const card = el("div", "event-card");
    const typeColor = TYPE_COLORS[opt.type] || "#888";
    card.innerHTML = `
      <span class="event-cat-tag" style="background:${typeColor}">${opt.type}</span>
      <h3>${opt.name}</h3>
      <div class="event-art">${opt.icon || "📜"}</div>
      <p>${opt.desc}</p>
      <button class="btn green">选择</button>`;
    card.querySelector("button").onclick = () => actions.takeReward(index);
    modal.querySelector(".reward-grid").appendChild(card);
  });
}

function renderMerchantModal(modal, run, actions, isHall = false) {
  const isWanderer = run.storylineId === "wanderer";
  const refreshes = Math.max(0, 1 + (run.wandererResolve || 0) - (run._merchantRefreshesUsed || 0));

  // 标题栏：标题 + 刷新(孤云线) + 离开
  modal.innerHTML = `<div class="modal-head"><h2 class="modal-title">武林商人</h2>
    <div style="display:flex;gap:8px;align-items:center">
    ${isWanderer ? `<button class="btn small" data-refresh style="background:#d4a056;color:#2c2c1a;font-weight:700" ${refreshes <= 0 ? "disabled" : ""}>刷新 ${refreshes}</button>` : ""}
    <button class="btn red small" data-done>离开</button></div></div>
    <div class="merchant-body">
      <div class="merchant-main">
        <div class="merchant-col">
          <h3>外功秘籍</h3></div>
        <div class="merchant-col">
          <h3>丹药</h3></div>
        <div class="merchant-col">
          <h3>内功秘籍</h3></div>
        <div class="merchant-col">
          <h3>装备</h3></div>
      </div>
    </div>`;

  const cols = modal.querySelectorAll(".merchant-col");

  if (isWanderer) {
    // === 孤云线：恢复rowCard布局，6/2/3/5 ===
    // 外功秘籍 ×6
    run.merchantStock.filter(e => e.kind === "manual").forEach(entry => {
      const s = DATA.skills[entry.id];
      if (!s) return;
      const owned = run.skills.includes(entry.id) || run.trainingSkills.includes(entry.id);
      const btnLabel = owned ? "已拥有" : `${entry.price}◎`;
      const meta = owned ? s.desc : s.desc;
      const row = rowCard(s.icon || "秘", skillDisplayName(s), meta, btnLabel, () => actions.buyManual(entry.id));
      if (owned) row.querySelector("button").disabled = true;
      cols[0].appendChild(row);
    });
    // 装备 ×3（武器+防具）→ cols[3]（右下）
    run.merchantStock.filter(e => (e.kind === "weapon" && !DATA.weapons[e.id]?.bossOnly) || e.kind === "armor").forEach(entry => {
      let obj, icon, name, desc, meta, btnLabel;
      if (entry.kind === "weapon") {
        obj = DATA.weapons[entry.id];
        icon = obj?.icon || "武"; name = obj?.name || entry.id; desc = obj?.desc || "";
        meta = desc; btnLabel = `${entry.price}◎`;
      } else {
        obj = DATA.armors[entry.id];
        icon = obj?.icon || "甲"; name = obj?.name || entry.id; desc = obj?.desc || "";
        const owned = run.armors.includes(entry.id);
        meta = desc;
        btnLabel = owned ? "已拥有" : `${entry.price}◎`;
      }
      const row = rowCard(icon, name, meta, btnLabel, () => actions.buyShopEntry(entry));
      if ((entry.kind === "armor" && run.armors.includes(entry.id))) row.querySelector("button").disabled = true;
      cols[3].appendChild(row);
    });
    // 内功秘籍 ×2 → cols[2]（左下）
    run.merchantStock.filter(e => e.kind === "internalArt").forEach(entry => {
      const art = DATA.internalArts[entry.id];
      if (!art) return;
      const price = getInternalArtPrice(run, entry.id);
      const owned = run.internalArts.includes(entry.id);
      const row = rowCard(art.icon, `【${art.rarity === "red" ? "绝" : art.rarity === "orange" ? "上" : "中"}】${art.name}`, art.desc, owned ? "已拥有" : `${price}◎`, () => actions.buyInternalArt(entry.id));
      if (owned) row.querySelector("button").disabled = true;
      cols[2].appendChild(row);
    });
    // 丹药 ×5 → cols[1]（右上）
    run.merchantStock.filter(e => e.kind === "item").forEach(entry => {
      const obj = DATA.items[entry.id];
      if (!obj) return;
      const row = rowCard(obj.icon, obj.name, obj.desc, `${obj.price}◎`, () => actions.buyShopEntry(entry));
      cols[1].appendChild(row);
    });

    // 刷新按钮事件
    const refreshBtn = modal.querySelector("[data-refresh]");
    if (refreshBtn) refreshBtn.onclick = () => actions.refreshMerchant();
  } else {
    // === 非孤云线：保持兼容 ===
    // 外功秘籍
    run.manuals.forEach(id => {
      const s = DATA.skills[id];
      if (!s) return;
      const price = Math.floor((s.rarity === "red" ? 900 : s.rarity === "orange" ? 520 : 300) * (run.treasure.effect === "manualMastery" ? 0.82 : 1));
      cols[0].appendChild(rowCard(s.icon || "秘", skillDisplayName(s), s.desc, `${price}◎`, () => actions.buyManual(id)));
    });
    // 内功秘籍 → cols[2]（左下）
    run.merchantStock.filter(e => e.kind === "internalArt").forEach(entry => {
      const art = DATA.internalArts[entry.id];
      if (!art) return;
      const price = getInternalArtPrice(run, entry.id);
      const owned = run.internalArts.includes(entry.id);
      const row = rowCard(art.icon, `【${art.rarity === "red" ? "绝" : art.rarity === "orange" ? "上" : "中"}】${art.name}`, art.desc, owned ? "已拥有" : `${price}◎`, () => actions.buyInternalArt(entry.id));
      if (owned) row.querySelector("button").disabled = true;
      cols[2].appendChild(row);
    });
    // 装备 → cols[3]（右下）
    run.merchantStock.filter(e => (e.kind === "weapon" && !DATA.weapons[e.id]?.bossOnly) || e.kind === "armor").forEach(entry => {
      let obj, icon, name, desc;
      if (entry.kind === "weapon") {
        obj = DATA.weapons[entry.id];
        icon = obj?.icon || "武"; name = obj?.name || entry.id; desc = obj?.desc || "";
      } else {
        obj = DATA.armors[entry.id];
        icon = obj?.icon || "甲"; name = obj?.name || entry.id; desc = obj?.desc || "";
      }
      cols[3].appendChild(rowCard(icon, name, desc, `${obj.price}◎`, () => actions.buyShopEntry(entry)));
    });
    // 丹药 → cols[1]（右上）
    run.merchantStock.filter(e => e.kind === "item").forEach(entry => {
      const obj = DATA.items[entry.id];
      if (!obj) return;
      cols[1].appendChild(rowCard(obj.icon, obj.name, obj.desc, `${obj.price}◎`, () => actions.buyShopEntry(entry)));
    });
  }

  modal.querySelector("[data-done]").onclick = actions.closeMerchant;
}

function renderCharacterModal(modal, run, actions, close) {
  run.activeSkills ||= run.skills.filter(id => DATA.skills[id]?.battle !== false).slice(0, 4);
  const traitNames = [
    ...run.traits.map(id => {
      const t = DATA.traits.find(x => x.id === id);
      return traitChip(t?.name || id, t?.desc || "");
    }),
    ...(run.skillTraits || []).map(t => traitChip(t.name, t.desc || ""))
  ].join("") || "无";
  const equippedWeapon = run.equippedWeapon ? DATA.weapons[run.equippedWeapon] : null;
  const equippedWeaponText = equippedWeapon ? traitChip(equippedWeapon.name, weaponTitle(equippedWeapon)) : "未装备";
  const equippedArmor = run.equippedArmor ? DATA.armors[run.equippedArmor] : null;
  const equippedArmorText = equippedArmor ? traitChip(equippedArmor.name, armorTitle(equippedArmor)) : "未装备";

  // 三主线信息
  const sl = DATA.storylines?.[run.storylineId];
  const storylineInfo = sl ? `<h3>主线剧情</h3><p>${sl.name}　<span style="color:#f39c12">${sl.threatName}：${run.mainThreat || 0}</span></p><p style="font-size:12px;color:#999">${sl.threatDesc}</p>` : "";

  // 散人决心（仅孤云线）
  const resolve = run.wandererResolve || 0;
  const resolveLevel = resolve >= 9 ? "齐心" : resolve >= 6 ? "暗助" : resolve >= 3 ? "初聚" : "";
  const resolveInfo = run.storylineId === "wanderer" ? `<h3>散人决心</h3><p style="color:${resolve >= 6 ? '#2ecc71' : resolve >= 3 ? '#27ae60' : '#888'}">${resolve}/10${resolveLevel ? ` 【散人${resolveLevel}】` : ""}${resolve > 0 ? `　我方属性+${resolve * 5}%` : ""}</p><p style="font-size:12px;color:#999">每+1战斗中我方全属性+5%。主线"抗争"胜利增加决心。</p>` : "";

  modal.innerHTML = `
    <div class="modal-head"><h2 class="modal-title">角色属性</h2>${close}</div>
    <div class="character-sheet">
      <div><div class="portrait">${run.character.portraitImage ? `<img src="${run.character.portraitImage}" alt="${run.character.name}" loading="lazy" decoding="async">` : run.character.icon}</div><div class="name">${run.character.name}</div><div class="desc">${run.character.faction}｜${"★".repeat(Math.min(8, run.rankStars))}</div></div>
      <div>
        <div class="stats-grid">${(() => {
          const armor = getArmorStats(run);
          return STAT_KEYS.map(k => statLine(k, k === "hp" ? `${run.hp}/${run.stats.hp + armor.hp}` : k === "qi" ? `${run.qi}/${run.stats.qi}` : k === "def" ? run.stats.def + armor.def : k === "dodge" ? run.stats.dodge + armor.dodge : k === "speed" ? Number((run.stats.speed + armor.speed).toFixed(2)) : run.stats[k])).join("");
        })()}</div>
        ${resolveInfo}
        <h3>上场招式（最多4个）</h3><div class="list skill-select-list"></div>
        <h3>特性</h3><p>${traitNames}</p>
        <h3>当前流派</h3><p>${run.selectedSchool ? schoolName(run.selectedSchool) : "尚未确定"}</p>
        ${storylineInfo}
        <h3>装备武器</h3><p>${equippedWeaponText}</p>
        <h3>装备防具</h3><p>${equippedArmorText}</p>
        <h3>已装备内功</h3><p>${(run.activeInternalArts || []).length ? run.activeInternalArts.map(id => traitChip(DATA.internalArts[id]?.name || id, DATA.internalArts[id]?.desc || "")).join("") : "未装备"}</p>
        <h3>已学内功（${(run.internalArts || []).length}本）</h3>
        <div class="list internal-art-list"></div>
      </div>
    </div>`;
  const list = modal.querySelector(".skill-select-list");
  const orderedSkills = [
    ...(run.activeSkills || []).filter(id => run.skills.includes(id)),
    ...run.skills.filter(id => !(run.activeSkills || []).includes(id))
  ];
  orderedSkills.forEach(id => {
    const skill = DATA.skills[id];
    if (!skill) return;
    const active = run.activeSkills.includes(id);
    list.appendChild(rowCard(skill.icon, `${active ? "✓ " : ""}${skillDisplayName(skill)}`, `${schoolName(skill.school)}｜${skill.styleName || ""}｜${skill.desc}`, active ? "下场" : "上场", () => actions.toggleActiveSkill(id)));
  });
  const artList = modal.querySelector(".internal-art-list");
  if (artList && (run.internalArts || []).length) {
    run.internalArts.forEach(id => {
      const art = DATA.internalArts[id];
      if (!art) return;
      const progress = run.artProgress?.[id] || 0;
      const cultivated = progress >= (art.cultivateCost || 0);
      const equipped = (run.activeInternalArts || []).includes(id);
      const btnLabel = cultivated ? (equipped ? "已装备" : "装备") : `参悟(${progress}/${art.cultivateCost})`;
      const btnAction = cultivated ? () => actions.equipInternalArt(id) : () => actions.trainArt(id);
      artList.appendChild(rowCard(art.icon, `【${rarityName(art.rarity)}】${art.name}${cultivated ? "" : " 未修成"}`, art.desc, btnLabel, btnAction));
    });
  } else if (artList) {
    artList.innerHTML = "<p>尚未获得任何内功秘籍。</p>";
  }
}

function renderBackpackModal(modal, run, actions, close) {
  const counts = countIds(run.items);
  const weaponCounts = countIds(run.weapons);
  const armorCounts = countIds(run.armors);
  const artCounts = countIds(run.internalArts || []);
  modal.innerHTML = `<div class="modal-head"><h2 class="modal-title">背包</h2>${close}</div><div class="inventory-summary"><div class="inventory-chip">金钱：${run.money}◎</div><div class="inventory-chip">道具：${run.items.length}</div><div class="inventory-chip">武器：${run.weapons.length}</div><div class="inventory-chip">防具：${run.armors.length}</div><div class="inventory-chip">内功：${(run.internalArts || []).length}</div></div><div class="list"></div>`;
  const list = modal.querySelector(".list");
  if (!run.items.length && !run.weapons.length && !run.armors.length && !(run.internalArts || []).length) { list.innerHTML = "<p>背包里暂时没有道具。</p>"; return; }
  // 安全渲染：跳过 DATA 中不存在的物品（防止因脏数据导致渲染中断）
  Object.entries(counts).forEach(([id, count]) => {
    const item = DATA.items[id];
    if (!item) return;
    list.appendChild(rowCard(item.icon, `${item.name} x${count}`, item.desc, "使用", () => actions.useBagItem(id)));
  });
  Object.entries(weaponCounts).forEach(([id, count]) => {
    const weapon = DATA.weapons[id];
    if (!weapon) return;
    list.appendChild(rowCard(weapon.icon, `【${rarityName(weapon.rarity)}】${weapon.name} x${count}`, weaponTitle(weapon), run.equippedWeapon === id ? "已装备" : "装备", () => actions.equipWeapon(id)));
  });
  Object.entries(armorCounts).forEach(([id, count]) => {
    const armor = DATA.armors[id];
    if (!armor) return;
    list.appendChild(rowCard(armor.icon, `【${rarityName(armor.rarity)}】${armor.name} x${count}`, armorTitle(armor), run.equippedArmor === id ? "已装备" : "装备", () => actions.equipArmor(id)));
  });
  Object.entries(artCounts).forEach(([id, count]) => {
    const art = DATA.internalArts[id];
    if (!art) return;
    list.appendChild(rowCard(art.icon, `【${rarityName(art.rarity)}】${art.name} x${count}`, art.desc, (run.activeInternalArts || []).includes(id) ? "已装备" : "装备", () => actions.equipInternalArt(id)));
  });
}

function renderGoalsModal(modal, run, close) {
  const currentMonth = monthAbs(run);
  const sl = DATA.storylines?.[run.storylineId];
  const storylineName = sl?.name || "江湖";
  const threatName = sl?.threatName || "";
  const threatVal = run.mainThreat || 0;
  const threatColor = threatVal >= 6 ? "#e74c3c" : threatVal >= 3 ? "#f39c12" : "#888";
  // 获取当前年份Boss
  const yearBoss = sl?.bosses?.[run.year];
  const bossName = yearBoss?.name || "未知强敌";
  const bossPortraitImg = yearBoss?.portraitImage || null;
  const bossIcon = yearBoss?.icon || "魔";
  const bossStats = yearBoss || { hp: 2000, qi: 600, atk: 100, def: 50, hit: 75, dodge: 8, crit: 12, speed: 1.5 };
  const bossTraitDesc = yearBoss?.bossTraitDesc || "";
  const totalMonths = 36; // 3年
  const progress = Math.min(100, Math.floor(currentMonth / totalMonths * 100));
  // 威胁值威胁度（维度缩放 + Boss档位加成）
  const threatLevel = threatVal >= 9 ? "【威势压人】" : threatVal >= 6 ? "【暗流涌动】" : threatVal >= 3 ? "【山雨欲来】" : "";
  const threatDimPct = threatVal > 0 ? ` 敌方属性+${threatVal * 5}%` : "";
  // 散人决心
  const resolve = run.wandererResolve || 0;
  const resolveLevel = resolve >= 9 ? "【散人齐心】" : resolve >= 6 ? "【散人暗助】" : resolve >= 3 ? "【散人初聚】" : "";
  const resolveDimPct = resolve > 0 ? ` 我方属性+${resolve * 5}%` : "";
  const resolveColor = resolve >= 6 ? "#2ecc71" : resolve >= 3 ? "#27ae60" : "#888";
  modal.innerHTML = `<div class="modal-head"><h2 class="modal-title">本局目标</h2>${close}</div><div class="goal-panel"><div class="boss-portrait">${bossPortraitImg ? `<img src="${bossPortraitImg}" alt="${bossName}" loading="lazy" decoding="async">` : bossIcon}</div><div>
    <h2>主线：${storylineName}</h2>
    <p style="color:${threatColor};margin:6px 0">${threatName}：${threatVal} ${threatLevel}<span style="font-size:12px">${threatDimPct}</span></p>
    <p style="color:${resolveColor};margin:6px 0">散人决心：${resolve} ${resolveLevel}<span style="font-size:12px">${resolveDimPct}</span></p>
    <div style="background:#f5e6d3;padding:8px;margin:8px 0;border-left:3px solid #c0392b;font-size:13px;line-height:1.5">
      <b>${threatName}：</b>每+1使战斗中<b>敌方全属性+5%</b>（武盟维度增强）。主线选择"顺应"增加威视。<br>
      <b>散人决心：</b>每+1使战斗中<b>我方全属性+5%</b>（散人维度增强）。主线"抗争"战斗胜利增加决心。<br>
      <span style="font-size:12px;color:#999">属性加成四舍五入取整。威视越高，年底Boss额外获得档位加成；决心越高，年底Boss额外获得档位削弱。</span>
    </div>
    <h3>今年Boss：${bossName}</h3>
    ${bossTraitDesc ? `<p style="color:#e74c3c;font-style:italic">特性：${bossTraitDesc}</p>` : ""}
    <div class="stats-grid">${["hp", "qi", "atk", "def", "hit", "dodge", "crit", "speed"].map(k => statLine(k, k === "speed" ? bossStats[k] : Math.floor(bossStats[k] * 2))).join("")}</div>
    <div class="goal-progress">${bar(currentMonth, totalMonths, `江湖进度 ${progress}%`)}</div>
  </div></div>`;
}

function renderDebugModal(modal, actions, close) {
  modal.innerHTML = `<div class="modal-head"><h2 class="modal-title">调试面板</h2>${close}</div><div class="list">
    ${debugRow("加1000金钱", "测试商店和传武堂。", "debug-money")}
    ${debugRow("学会全部招式", "测试战斗技能组合。", "debug-skills")}
    ${debugRow("跳到最终Boss月份", "测试最终战触发。", "debug-boss-month")}
    ${debugRow("立即挑战最终Boss", "直接进入Boss战。", "debug-boss")}
  </div>`;
  modal.querySelector("[data-debug-money]").onclick = actions.debugMoney;
  modal.querySelector("[data-debug-skills]").onclick = actions.debugSkills;
  modal.querySelector("[data-debug-boss-month]").onclick = actions.debugBossMonth;
  modal.querySelector("[data-debug-boss]").onclick = actions.debugBoss;
}

function renderBattle(state, actions) {
  const b = state.battle;
  const root = el("div", "battle-screen");
  root.innerHTML = `
    <div class="battle-top"><div class="battle-col battle-col-left">${fighterPanel(state.run, b.player, b)}</div><div class="battle-col battle-col-mid"><div class="gauge-lane"><div class="gauge-dot" style="left:${b.player.gauge}%">${b.player.name.charAt(0)}</div><div class="gauge-dot" style="left:${b.enemy.gauge}%">${b.enemy.name.charAt(0)}</div><div class="speed-label speed-toggle" data-speedbtn>速度x${b.speed || 1}</div></div></div><div class="battle-col battle-col-right">${fighterPanel(null, b.enemy, b)}</div></div>
    <div class="fighter player">${b.playerPortrait ? `<img src="${b.playerPortrait}" alt="${b.player.name}" loading="lazy" decoding="async">` : b.player.icon}</div><div class="fighter enemy">${b.enemyPortrait ? `<img src="${b.enemyPortrait}" alt="${b.enemy.name}" loading="lazy" decoding="async">` : b.enemy.icon}</div>
    ${b.bossImmuneTurns > 0 ? `<div class="boss-trait-bar"><span class="debuff-badge" title="免疫负面">免疫 ${b.bossImmuneTurns}回合</span></div>` : ""}
    <div class="battle-bottom"><div class="battle-tools"><button class="btn secondary" data-basic>普攻</button><button class="btn secondary" data-rest>调息</button><button class="btn secondary" data-itemmenu>道具</button><button class="btn red" data-flee>逃跑</button></div><div class="skill-row"></div><div class="battle-log">${b.log.map(x => `<div>${x}</div>`).join("")}</div></div>`;
  const skillRow = root.querySelector(".skill-row");
  b.player.skills.forEach(id => {
    const s = DATA.skills[id];
    const btn = el("button", "skill-btn");
    const moneyCost = s.tags?.includes("coin") ? (s.rarity === "red" ? 180 : s.rarity === "orange" ? 105 : 55) : 0;
    const qiCost = s.tags?.includes("coin") ? 0 : s.qi + (b.player.gu || 0) * 8;
    btn.disabled = b.phase !== "waitPlayer" || b.player.qi <= 0 && qiCost > 0 || b.player.qi < qiCost || state.run.money < moneyCost || (b.player.cooldowns[id] || 0) > 0;
    const comboHint = s.tags?.includes("threeWaves") && b.player.skills.includes("fist_blue_1") && b.player.skills.includes("fist_orange_1") && b.player.skills.includes("fist_red_1")
      ? "｜三叠浪"
      : "";
    const costText = moneyCost ? `金钱:${moneyCost}` : `内力:${qiCost}`;
    btn.innerHTML = `<strong>${s.name}</strong><span>${s.styleName || ""} 威力:${s.power || "固定"} ${costText}</span><br><span>CD:${b.player.cooldowns[id] || 0}${comboHint}</span>`;
    btn.onclick = () => actions.useSkill(id);
    skillRow.appendChild(btn);
  });
  // 药品不再在招式栏出现
  root.querySelector("[data-speedbtn]").onclick = actions.toggleSpeed;
  root.querySelector("[data-basic]").disabled = b.phase !== "waitPlayer";
  root.querySelector("[data-basic]").onclick = actions.basicAttack;
  root.querySelector("[data-rest]").disabled = b.phase !== "waitPlayer";
  root.querySelector("[data-rest]").onclick = actions.restAction;
  root.querySelector("[data-itemmenu]").disabled = b.phase !== "waitPlayer";
  root.querySelector("[data-itemmenu]").onclick = actions.openItemMenu;
  root.querySelector("[data-flee]").disabled = b.phase !== "waitPlayer";
  root.querySelector("[data-flee]").onclick = actions.fleeAction;
  // 点击角色框显示详细buff/debuff状态（v5.10：通过模块变量持久化，避免被每帧重新渲染销毁）
  root.querySelectorAll(".fighter-panel").forEach(panel => {
    panel.style.cursor = "pointer";
    panel.onclick = () => {
      const side = panel.dataset.side;
      // toggle：再次点击同一角色则关闭
      _battleDetailSide = _battleDetailSide === side ? null : side;
      renderApp(state, actions); // 重新渲染以显示/隐藏弹窗
    };
  });

  // 如果当前需要显示角色详情弹窗，渲染它
  if (_battleDetailSide) {
    const unit = _battleDetailSide === "player" ? b.player : b.enemy;
    root.appendChild(buildUnitDetailPopup(unit, _battleDetailSide, state, actions));
  }

  return root;
}

function fighterPanel(run, unit, battle = null) {
  const side = run ? "player" : "enemy";
  const isPlayer = !!run;
  // 主角特性+内功
  const traitHtml = isPlayer ? (run.traits || []).map(tid => {
    const t = DATA.traits.find(x => x.id === tid);
    return t ? `<span class="buff-badge" title="${escapeHtml(t.desc || "")}">${t.name}</span>` : "";
  }).filter(Boolean).join("") : "";
  const artHtml = isPlayer ? (run.activeInternalArts || []).map(aid => {
    const a = DATA.internalArts[aid];
    return a ? `<span class="buff-badge art-badge" title="${escapeHtml(a.desc || "")}">${a.icon}</span>` : "";
  }).filter(Boolean).join("") : "";
  // Boss 特性（显示在头像下方，类似主角特性）
  let bossTraitHtml = "";
  if (!isPlayer && battle && battle.bossTraits?.length) {
    bossTraitHtml = battle.bossTraits.map(tid => {
      const meta = BOSS_TRAIT_META[tid];
      const name = meta ? meta.name : tid;
      const desc = meta ? meta.desc : "";
      return `<span class="buff-badge enemy-trait-badge" title="${escapeHtml(desc)}">${name}</span>`;
    }).join("");
  }
  // Boss 武器（显示在特性旁边，红色标识）
  let bossWeaponHtml = "";
  if (!isPlayer && battle && battle.enemy?.weapon) {
    const weapon = DATA.weapons[battle.enemy.weapon];
    if (weapon) {
      bossWeaponHtml = `<span class="buff-badge enemy-weapon-badge" title="${escapeHtml(weapon.desc || "")}" style="background:#c0392b;color:#fff;border-color:#e74c3c">${weapon.icon} ${weapon.name}</span>`;
    }
  }
  // 护体盾值
  let shieldHp = 0;
  let shieldMax = 1;
  if (isPlayer && battle && battle.dragonGuardHp > 0) { shieldHp = battle.dragonGuardHp; shieldMax = battle.dragonGuardMax || shieldHp; }
  if (!isPlayer && battle && battle.bossShield > 0) { shieldHp = battle.bossShield; shieldMax = battle.bossShieldMax || shieldHp; }
  const hpLabel = `${Math.ceil(unit.hp)}/${unit.stats.hp}${shieldHp > 0 ? "+" + shieldHp : ""}`;
  // 盾条：独立细线，放在HP条上方，比例 = 当前盾 / 最大盾（初始=100%）
  const shieldBarHtml = shieldHp > 0
    ? `<div class="shield-indicator"><div class="shield-fill" style="width:${(shieldHp / shieldMax * 100).toFixed(1)}%"></div></div>`
    : "";
  const infoRow = (traitHtml || artHtml || bossTraitHtml || bossWeaponHtml) ? `<div class="debuff-row trait-art-row">${traitHtml}${artHtml}${bossTraitHtml}${bossWeaponHtml}</div>` : "";
  return `<div class="fighter-panel" data-side="${side}"><div class="fighter-name">${unit.name}</div>${shieldBarHtml}${bar(unit.hp, unit.stats.hp, hpLabel, "hp-fill")}${bar(unit.qi, unit.stats.qi, `${Math.ceil(unit.qi)}/${unit.stats.qi}`, "qi-fill")}${infoRow}<div class="debuff-row">${debuffBadges(unit)}</div></div>`;
}

function debuffBadges(unit) {
  const badges = [];
  if (unit.bleed) badges.push(`<span class="debuff-badge" title="流血：行动开始时受到层数x12的伤害。">流血 ${unit.bleed}</span>`);
  if (unit.poison) badges.push(`<span class="debuff-badge" title="中毒：降低攻击、防御、命中、闪避、出手速度。">中毒 ${unit.poison}</span>`);
  if (unit.inner) badges.push(`<span class="debuff-badge" title="内伤：行动开始时失去层数x14的内力。内力归零时只能调息或普通攻击。">内伤 ${unit.inner}</span>`);
  if (unit.frost) badges.push(`<span class="debuff-badge" title="寒气：每层减速4%，回合后-1层。">寒气 ${unit.frost}</span>`);
  if (unit.hamstring) badges.push(`<span class="debuff-badge" title="断筋：每层攻击-2%+减速2%，回合后-1层。">断筋 ${unit.hamstring}</span>`);
  if (unit.veinBreak) badges.push(`<span class="debuff-badge" title="断脉：每层内力-2%+减速2%，回合后-1层。">断脉 ${unit.veinBreak}</span>`);
  if (unit.gu) badges.push(`<span class="debuff-badge" title="蛊：提高招式内力消耗，并扰乱气息。">蛊 ${unit.gu}</span>`);
  // 临时Buff显示（快/力/杀）
  if (unit.tempBuffs) {
    if (unit.tempBuffs.speed) badges.push(`<span class="buff-badge" title="唯快不破：读条速度${unit.tempBuffs.speed.mult}倍，剩余${unit.tempBuffs.speed.duration}回合">快${unit.tempBuffs.speed.duration}</span>`);
    if (unit.tempBuffs.atk) badges.push(`<span class="buff-badge" title="力大无穷：攻击力${unit.tempBuffs.atk.mult}倍，剩余${unit.tempBuffs.atk.duration}回合">力${unit.tempBuffs.atk.duration}</span>`);
    if (unit.tempBuffs.crit) badges.push(`<span class="buff-badge" title="屠杀盛宴：暴击+${unit.tempBuffs.crit.critAdd}%，连击+${unit.tempBuffs.crit.comboAdd}%，暴击倍率+${unit.tempBuffs.crit.critPowerAdd}，剩余${unit.tempBuffs.crit.duration}回合">杀${unit.tempBuffs.crit.duration}</span>`);
  }
  return badges.join("");
}

// 战斗中角色详情弹窗（v5.10：返回DOM元素，避免被每帧重新渲染销毁）
function buildUnitDetailPopup(unit, side, state, actions) {
  const isPlayer = side === "player";
  const popup = el("div", "unit-detail-popup");
  popup.innerHTML = `<span class="close-btn">✕</span><h4>${unit.name}（${side === "player" ? "主角" : "敌人"}）</h4>`;
  popup.querySelector(".close-btn").onclick = () => {
    _battleDetailSide = null;
    renderApp(state, actions);
  };

  // 特性
  if (isPlayer && state.run.traits) {
    const traitArr = state.run.traits.map(tid => DATA.traits.find(t => t.id === tid)).filter(Boolean);
    if (traitArr.length) {
      const row = el("div", "detail-row");
      row.innerHTML = `<b>特性</b>：` + traitArr.map(t => `<span class="buff-badge" title="${escapeHtml(t.desc || "")}">${t.name}</span>`).join(" ");
      popup.appendChild(row);
    }
  }
  // Boss 特性（v6.0 bossTraits 数组，不显示旧版不正确数据）
  if (!isPlayer) {
    const battle = state.battle;
    if (battle && battle.bossTraits?.length) {
      const traitBadges = battle.bossTraits.map(tid => {
        const meta = BOSS_TRAIT_META[tid];
        const name = meta ? meta.name : tid;
        const desc = meta ? meta.desc : "";
        return `<span class="buff-badge enemy-trait-badge" title="${escapeHtml(desc)}">${name}</span>`;
      }).join(" ");
      const row = el("div", "detail-row");
      row.innerHTML = `<b>Boss特性</b>：${traitBadges}`;
      popup.appendChild(row);
    }
    // Boss 武器
    if (battle && battle.enemy?.weapon) {
      const weapon = DATA.weapons[battle.enemy.weapon];
      if (weapon) {
        const row = el("div", "detail-row");
        row.innerHTML = `<b>Boss武器</b>：<span class="buff-badge enemy-weapon-badge" title="${escapeHtml(weapon.desc || "")}" style="background:#c0392b;color:#fff;border-color:#e74c3c">${weapon.icon} ${weapon.name}</span>`;
        popup.appendChild(row);
      }
    }
  }

  // 内功
  if (isPlayer && state.run.activeInternalArts) {
    const arts = state.run.activeInternalArts.map(aid => DATA.internalArts[aid]).filter(Boolean);
    if (arts.length) {
      const row = el("div", "detail-row");
      row.innerHTML = `<b>内功</b>：` + arts.map(a => `<span class="buff-badge art-badge" title="${escapeHtml(a.desc || "")}">${a.icon} ${a.name}</span>`).join(" ");
      popup.appendChild(row);
    }
  }

  // 临时Buff
  if (unit.tempBuffs) {
    const buffNames = { speed: "唯快不破（快）", atk: "力大无穷（力）", crit: "屠杀盛宴（杀）" };
    for (const [type, buff] of Object.entries(unit.tempBuffs)) {
      const label = buffNames[type] || type;
      let effect = "";
      if (type === "speed") effect = `速度×${buff.mult}，剩余${buff.duration}回合`;
      if (type === "atk") effect = `攻击×${buff.mult}，剩余${buff.duration}回合`;
      if (type === "crit") effect = `暴击+${buff.critAdd}% 连击+${buff.comboAdd}% 暴击倍率+${buff.critPowerAdd}，剩余${buff.duration}回合`;
      const row = el("div", "detail-row");
      row.innerHTML = `<b>${label}</b>：${effect}`;
      popup.appendChild(row);
    }
  }

  // Debuff
  const debuffLabels = { bleed: "流血", poison: "中毒", inner: "内伤", frost: "寒气", hamstring: "断筋", gu: "蛊" };
  for (const [type, label] of Object.entries(debuffLabels)) {
    if (unit[type]) {
      const row = el("div", "detail-row");
      const detail = type === "bleed" ? `行动开始受到${unit[type]*12}伤害` : type === "poison" ? "降攻/防/命/闪/速" : type === "inner" ? "行动开始失去内力" : type === "frost" ? "降速+失去内力" : type === "hamstring" ? "降速+削攻" : "提高招式消耗+扰乱";
      row.innerHTML = `<span class="debuff-badge">${label} ${unit[type]}</span>：${detail}`;
      popup.appendChild(row);
    }
  }

  return popup;
}

function renderBattleItemsModal(modal, run, battle, actions) {
  if (!battle) { modal.innerHTML = "<p>战斗已结束。</p>"; return; }
  const close = `<button class="btn red small" data-close>关闭</button>`;
  const items = battle.player.items.filter(id => {
    const item = DATA.items[id];
    return item && (item.type === "heal" || item.type === "qi");
  });
  modal.innerHTML = `<div class="modal-head"><h2 class="modal-title">使用道具</h2>${close}</div><div class="list"></div>`;
  const list = modal.querySelector(".list");
  if (!items.length) {
    list.innerHTML = "<p>没有可用的战斗道具。恢复类丹药请在背包中使用。</p>";
  } else {
    items.forEach(id => {
      const item = DATA.items[id];
      list.appendChild(rowCard(item.icon, item.name, item.desc, "使用", () => actions.useItem(id)));
    });
  }
  const closeBtn = modal.querySelector("[data-close]");
  if (closeBtn) closeBtn.onclick = actions.closeModal;
}

function renderJournalModal(modal, run, close) {
  modal.innerHTML = `<div class="modal-head"><h2 class="modal-title">江湖纪要</h2>${close}</div><div class="journal-scroll">${run.log.join("")}</div>`;
}

function renderSettingsModal(modal, state, actions, close) {
  modal.innerHTML = `<div class="modal-head"><h2 class="modal-title">设置</h2>${close}</div><div class="settings-body"><div class="setting-row"><span>音乐音量</span><input type="range" min="0" max="100" value="${Math.round((state.musicVolume ?? 0.5) * 100)}" data-vol-slider class="vol-slider"><span data-vol-label>${Math.round((state.musicVolume ?? 0.5) * 100)}%</span></div></div>`;
  const slider = modal.querySelector("[data-vol-slider]");
  const label = modal.querySelector("[data-vol-label]");
  slider.oninput = () => {
    const v = parseInt(slider.value) / 100;
    label.textContent = slider.value + "%";
    actions.setMusicVolume(v);
  };
}

function renderSettlement(state, actions) {
  const s = state.settlement;
  const root = el("div", "main-menu");
  root.innerHTML = `<div class="menu-panel"><h2>${s.result === "win" ? "通关成功" : "江湖路断"}</h2><p>${s.reason}</p><p>获得局外属性点：${s.points}</p><button class="btn" data-back>返回主菜单</button></div>`;
  root.querySelector("[data-back]").onclick = actions.backToMenu;
  return root;
}

function rowCard(icon, title, meta, button, action) {
  const row = el("div", "row-card");
  row.innerHTML = `<div class="icon-box">${icon}</div><div><div class="row-title">${title}</div><div class="row-meta">${meta}</div></div><button class="btn green small">${button}</button>`;
  row.querySelector("button").onclick = action;
  return row;
}

function statLine(key, value) {
  return `<div class="stat-line"><span>${STAT_LABELS[key]}</span><b>${value}</b></div>`;
}

function traitChip(name, title, desc) {
  const d = escapeHtml(desc || title || "");
  return `<span class="trait-chip" title="${escapeHtml(title || "")}" data-trait-name="${escapeHtml(name)}" data-trait-desc="${d}" onclick="if(window.__showTraitDesc)window.__showTraitDesc(this)">${name}</span>`;
}

function weaponTitle(weapon) {
  return `攻击+${weapon.atk || 0}，${weapon.desc || ""}`;
}

function armorTitle(armor) {
  return `血量+${armor.hp || 0}，防御+${armor.def || 0}。${armor.desc || ""}`;
}

function effectText(effects) {
  return Object.entries(effects).map(([key, value]) => `${STAT_LABELS[key] || key}+${value}`).join("，");
}

function escapeHtml(text) {
  return String(text).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function rarityName(id) {
  return RARITIES[id]?.name || id;
}

function schoolName(id) {
  return SCHOOLS[id]?.name || id;
}

function skillDisplayName(skill) {
  return `${skill.tierName ? `${skill.tierName}·` : ""}${skill.name}`;
}

function countIds(ids) {
  return ids.reduce((map, id) => ({ ...map, [id]: (map[id] || 0) + 1 }), {});
}

function computeEventDifficulty(run, event) {
  if (event.category !== "切磋" && event.category !== "小Boss") return null;
  let enemyHp = 0;
  // 孤云逐浪专属打斗事件：映射到三大通用年份池
  const wandererFightPool = {
    wanderer_fight_ambush: "ambush",
    wanderer_fight_bandit: "bandit",
    wanderer_fight_fighter: "fighter"
  };
  const wp = DATA.wandererEnemyPool;
  if (wandererFightPool[event.id] && wp?.grunts) {
    const pool = wandererFightPool[event.id];
    const yr = Math.min(run.year, 3);
    const enemy = wp.grunts.find(e => e.id === `wanderer_grunt_${pool}_yr${yr}`);
    enemyHp = enemy ? enemy.hp * 2 : 0;
  } else if (event.id && event.id.startsWith("mini_")) {
    // 通用小Boss
    const miniId = event.id.replace("mini_", "");
    const mini = (DATA.miniBosses || []).find(b => b.id === miniId);
    enemyHp = mini ? mini.hp * 2 : 0;
  } else if (event.category === "切磋") {
    // 通用切磋：按当前rank上限取平均敌人血量
    const maxRank = Math.min(4, 1 + Math.floor(monthAbs(run) / 8));
    const pool = (DATA.enemies || []).filter(e => (e.rank || 1) <= maxRank);
    enemyHp = pool.length ? pool.reduce((s, e) => s + (e.hp || 0), 0) / pool.length * 2 : 600;
  }
  if (!enemyHp) return null;
  return getBattleDifficulty(run.stats.hp + getArmorStats(run).hp, enemyHp);
}

function debugRow(title, meta, id) {
  return `<div class="row-card"><div class="icon-box">调</div><div><div class="row-title">${title}</div><div class="row-meta">${meta}</div></div><button class="btn green small" data-${id}>执行</button></div>`;
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
