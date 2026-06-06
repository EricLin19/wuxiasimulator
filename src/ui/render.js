import { DATA, STAT_LABELS, STAT_KEYS, SCHOOLS, RARITIES } from "../data/content.js";
import { monthAbs } from "../core/utils.js";
import { expNeed, getRankTitle } from "../systems/runSystem.js";

const STAT_HELP = {
  hp: "局外每点：新局血量+20",
  qi: "局外每点：新局内力+15",
  atk: "局外每点：新局攻击+2",
  def: "局外每点：新局防御+2",
  combo: "局外每点：新局连击+1",
  hit: "局外每点：新局命中+2。实际命中=100+命中-闪避",
  dodge: "局外每点：新局闪避+1",
  crit: "局外每点：新局暴击+1。暴击属性表示2倍暴击概率",
  speed: "局外每点：新局出手速度+0.03"
};

export function renderApp(state, actions) {
  const app = document.getElementById("app");
  app.innerHTML = "";
  if (state.screen === "menu") app.appendChild(renderMenu(state, actions));
  if (state.screen === "select") app.appendChild(renderSelect(state, actions));
  if (state.screen === "run") app.appendChild(renderRun(state, actions));
  if (state.screen === "battle") app.appendChild(renderBattle(state, actions));
  if (state.screen === "settlement") app.appendChild(renderSettlement(state, actions));
  if (state.modal && state.screen !== "battle") app.appendChild(renderModal(state, actions));
  if (state.toast) app.appendChild(el("div", "toast", state.toast));
}

function renderMenu(state, actions) {
  const root = el("div", "main-menu");
  root.innerHTML = `
    <div>
      <div class="title">小小侠客</div>
      <div class="subtitle">构筑原型 v0.21</div>
      <div class="menu-panel">
        <button class="btn" data-act="start">开始新局</button>
        <button class="btn secondary" data-act="continue" ${actions.hasSavedRun() ? "" : "disabled"}>继续存档</button>
        <button class="btn secondary" data-act="meta">局外成长</button>
        <div class="desc">通关：${state.meta.wins}/${state.meta.runs}　可分配属性点：${state.meta.metaPoints}</div>
      </div>
    </div>`;
  root.querySelector("[data-act=start]").onclick = actions.gotoSelect;
  root.querySelector("[data-act=continue]").onclick = actions.continueRun;
  root.querySelector("[data-act=meta]").onclick = () => { state.modal = { type: "meta" }; actions.render(); };
  return root;
}

function renderSelect(state, actions) {
  const screen = el("div", "screen select-layout");
  const left = el("div", "panel");
  left.style.padding = "18px";
  left.innerHTML = `<h2 class="section-title">选择你的角色</h2><div class="cards"></div>`;
  DATA.characters.forEach(c => {
    const card = el("div", `card ${state.selectedCharacter === c.id ? "selected" : ""}`);
    card.innerHTML = `<div class="portrait">${c.icon}</div><div class="name">${c.name}</div><div class="desc">${c.desc}</div>`;
    card.onclick = () => actions.selectCharacter(c.id);
    left.querySelector(".cards").appendChild(card);
  });

  const selected = DATA.characters.find(c => c.id === state.selectedCharacter);
  const right = el("div", "panel");
  right.style.padding = "18px";
  right.innerHTML = `
    <h2 class="section-title">${selected.name}</h2>
    <div class="portrait">${selected.icon}</div>
    <div class="desc">${selected.traitText}</div>
    <div class="stats-grid">${STAT_KEYS.map(k => statLine(k, selected.stats[k])).join("")}</div>
    <h3>携带宝物</h3>
    <div class="cards treasure-cards"></div>
    <button class="btn green" style="width:100%;margin-top:14px">开始</button>`;
  DATA.treasures.forEach(t => {
    const locked = t.locked && !state.meta.unlockedTreasures.includes(t.id);
    const card = el("div", `card ${state.selectedTreasure === t.id ? "selected" : ""}`);
    card.innerHTML = `<div class="portrait">${locked ? "锁" : t.icon}</div><div class="name">${t.name}</div><div class="desc">${locked ? "通关后解锁。" : t.desc}</div>`;
    if (!locked) card.onclick = () => actions.selectTreasure(t.id);
    right.querySelector(".treasure-cards").appendChild(card);
  });
  right.querySelector("button").onclick = actions.startRun;
  screen.append(left, right);
  return screen;
}

function renderTopbar(run) {
  const top = el("div", "topbar");
  top.innerHTML = `
    <div class="date">第${run.year}年·${run.month}月　行动 ${run.ap}/${run.maxAp}</div>
    <div class="ap-wrap"><div class="bolt">⚡</div>${bar(run.ap, run.maxAp, `${run.ap}/${run.maxAp}`)}</div>
    <div class="resource-row"><span>◎${run.money}</span><span>⚙</span></div>`;
  return top;
}

function renderRun(state, actions) {
  const run = state.run;
  const root = el("div");
  root.appendChild(renderTopbar(run));
  const screen = el("div", "screen run-layout");
  screen.innerHTML = `
    <div class="left-nav">
      <div class="nav-tile" data-modal="character">角色</div>
      <div class="nav-tile" data-modal="backpack">背包</div>
      <div class="nav-tile" data-modal="goals">目标</div>
    </div>
    <div class="center-stage">
      <div class="hero-status">
        <div class="rank-box">${run.character.faction}<br>${getRankTitle(run)}<br>${"★".repeat(Math.min(8, run.rankStars))}</div>
        <div>
          <div class="mini-stats">${STAT_KEYS.map(k => statLine(k, run.stats[k])).join("")}</div>
          ${bar(run.hp, run.stats.hp, `${run.hp}/${run.stats.hp}`)}
          ${bar(run.martialExp, expNeed(run.level), `经验 ${run.martialExp}/${expNeed(run.level)}｜${getRankTitle(run)}`, "exp-fill")}
        </div>
      </div>
      <div class="bottom-actions">
        <div class="action-card" data-modal="events">奇遇<br>${run.eventRemaining}/3</div>
        <div class="action-card" data-modal="training">修炼</div>
        <div class="action-card" data-modal="hall">武林商人</div>
        <div class="action-card" data-modal="strategy">谋划</div>
        <div class="action-card" data-action="next">下回合</div>
      </div>
    </div>
    <div class="panel side-panel"><button class="btn secondary small" data-modal="debug" style="width:100%;margin-bottom:8px">调试</button><div class="log">${run.log.join("")}</div></div>`;
  screen.querySelectorAll("[data-modal]").forEach(node => { node.onclick = () => actions.openModal(node.dataset.modal); });
  screen.querySelector("[data-action=next]").onclick = actions.endMonth;
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
    hall: () => renderHallModal(modal, run, actions, close),
    strategy: () => renderStrategyModal(modal, run, state, actions, close),
    strategyChoice: () => renderStrategyChoiceModal(modal, state, actions),
    reward: () => renderRewardModal(modal, state, actions),
    merchant: () => renderMerchantModal(modal, run, actions),
    character: () => renderCharacterModal(modal, run, actions, close),
    backpack: () => renderBackpackModal(modal, run, actions, close),
    goals: () => renderGoalsModal(modal, run, close),
    debug: () => renderDebugModal(modal, actions, close)
  };
  renderers[state.modal.type]?.();
  const closeBtn = modal.querySelector("[data-close]");
  if (closeBtn) closeBtn.onclick = actions.closeModal;
  back.appendChild(modal);
  return back;
}

function renderMetaModal(modal, state, actions, close) {
  state.meta.allocations ||= {};
  modal.innerHTML = `<div class="modal-head"><h2 class="modal-title">局外成长</h2>${close}</div><div class="inventory-summary"><div class="inventory-chip">可分配属性点：${state.meta.metaPoints}</div><div class="inventory-chip">通关：${state.meta.wins}/${state.meta.runs}</div><div class="inventory-chip">无尽模式：${state.meta.endlessUnlocked ? "已解锁" : "未解锁"}</div></div><div class="list"></div>`;
  STAT_KEYS.forEach(key => modal.querySelector(".list").appendChild(rowCard("点", `${STAT_LABELS[key]} +${state.meta.allocations[key] || 0}`, STAT_HELP[key], "分配", () => actions.allocateMeta(key))));
}

function renderEventsModal(modal, run, actions, close) {
  modal.innerHTML = `<div class="modal-head"><h2 class="modal-title">每月随机事件</h2>${close}</div><div class="event-count">可参与事件数：${run.eventRemaining}</div><div class="event-grid"></div>`;
  run.events.forEach(e => {
    const card = el("div", "event-card");
    card.innerHTML = `<h3>${e.name}</h3><div class="event-art">${e.icon}</div><p>${e.desc}</p><button class="btn green">选择</button>`;
    card.querySelector("button").disabled = run.eventRemaining <= 0;
    card.querySelector("button").onclick = () => actions.chooseEvent(e.id);
    modal.querySelector(".event-grid").appendChild(card);
  });
}

function renderTrainingModal(modal, run, actions, close) {
  modal.innerHTML = `<div class="modal-head"><h2 class="modal-title">修炼技能</h2>${close}</div><div class="list"></div>`;
  const rows = [
    { title: "俯卧撑", meta: "攻击+3，经验+35，消耗1行动", icon: "拳", action: () => actions.trainStat("atk") },
    { title: "站桩功", meta: "防御+3，经验+35，消耗1行动", icon: "桩", action: () => actions.trainStat("def") },
    { title: "扎马步", meta: "血量上限+20，经验+35，消耗1行动", icon: "马", action: () => actions.trainStat("hp") },
    { title: "运筹", meta: `消耗1行动，进度 ${run.strategyProgress || 0}/3，满3次获得三选一计略`, icon: "策", action: actions.chooseStrategy }
  ];
  rows.forEach(x => modal.querySelector(".list").appendChild(rowCard(x.icon, x.title, x.meta, "修炼", x.action)));
  modal.querySelector(".list").appendChild(rowCard("气", "内力吐纳", "内力上限+20，经验+35，消耗1行动", "修炼", () => actions.trainStat("qi")));
  run.trainingSkills.forEach(id => {
    const s = DATA.skills[id];
    const statText = Object.entries(s.statGain || {}).map(([k, v]) => `${STAT_LABELS[k]}+${v}`).join("，");
    modal.querySelector(".list").appendChild(rowCard(s.icon, s.name, `${schoolName(s.school)}。${s.desc} 完成：${statText}。进度 ${run.skillProgress[id] || 0}/${s.train}`, "修炼", () => actions.trainSkill(id)));
  });
}

function renderHallModal(modal, run, actions, close) {
  modal.innerHTML = `<div class="modal-head"><h2 class="modal-title">武林商人</h2>${close}</div><h3>秘籍</h3><div class="list manual-list"></div><h3>丹药与装备</h3><div class="list shop-list"></div><p class="desc">每三个月刷新秘籍。第一本秘籍学成并确定流派后，商人开始出售对应装备。</p>`;
  run.manuals.forEach(id => {
    const s = DATA.skills[id];
    const price = Math.floor((s.rarity === "red" ? 900 : s.rarity === "orange" ? 520 : 300) * (run.treasure.effect === "moreAp" ? 0.9 : 1));
    modal.querySelector(".manual-list").appendChild(rowCard(s.icon || SCHOOLS[s.school]?.icon || "秘", `【${rarityName(s.rarity)}】《${s.name}》`, `${schoolName(s.school)}｜${s.desc}｜完成特性：${s.trait.name}`, `${price}◎`, () => actions.buyManual(id)));
  });
  run.merchantStock.forEach(entry => {
    const obj = entry.kind === "weapon" ? DATA.weapons[entry.id] : DATA.items[entry.id];
    modal.querySelector(".shop-list").appendChild(rowCard(obj.icon, entry.kind === "weapon" ? `【${rarityName(obj.rarity)}】${obj.name}` : obj.name, obj.desc, `${obj.price}◎`, () => actions.buyShopEntry(entry)));
  });
}

function renderStrategyModal(modal, run, state, actions, close) {
  state.modal.selectedIndices ||= [];
  run.activeStrategies ||= [];
  modal.innerHTML = `<div class="modal-head"><h2 class="modal-title">谋划</h2>${close}</div><div class="inventory-summary"><div class="inventory-chip">上场计略：${run.activeStrategies.length}/2</div></div><div class="list"></div><button class="btn green" style="margin-top:14px" data-merge>融合已选两个计略</button>`;
  const list = modal.querySelector(".list");
  if (!run.strategies.length) list.innerHTML = `<p>暂无计略。可通过修炼“运筹”或突破奖励获得。</p>`;
  run.strategies.forEach((id, index) => {
    const s = DATA.strategies.find(x => x.id === id);
    const selected = state.modal.selectedIndices.includes(index);
    const active = run.activeStrategies.includes(index);
    const row = el("div", `row-card strategy-row ${active ? "active" : ""}`);
    row.innerHTML = `<div class="icon-box">策</div><div><div class="row-title">${active ? "✓ " : ""}${selected ? "◆ " : ""}【${rarityName(s.rarity)}】${s.name}</div><div class="row-meta">${schoolName(s.school)}｜${s.effectsText}｜${s.desc}</div></div><div class="row-actions"><button class="btn green small" data-active>${active ? "下场" : "上场"}</button><button class="btn secondary small" data-select>${selected ? "取消" : "选择"}</button></div>`;
    row.querySelector("[data-active]").onclick = () => actions.toggleActiveStrategy(index);
    row.querySelector("[data-select]").onclick = () => actions.toggleStrategySelect(index);
    list.appendChild(row);
  });
  modal.querySelector("[data-merge]").onclick = actions.mergeStrategies;
}

function renderStrategyChoiceModal(modal, state, actions) {
  modal.innerHTML = `<h2 class="section-title">选择你的计略</h2><div class="reward-grid"></div>`;
  state.modal.options.forEach(s => {
    const card = el("div", "event-card");
    card.innerHTML = `<h3>【${rarityName(s.rarity)}】${s.name}</h3><div class="event-art">策</div><p>${schoolName(s.school)}｜${s.effectsText}<br>${s.desc}</p><button class="btn green">选择</button>`;
    card.querySelector("button").onclick = () => actions.takeStrategy(s.id);
    modal.querySelector(".reward-grid").appendChild(card);
  });
}

function renderRewardModal(modal, state, actions) {
  modal.innerHTML = `<h2 class="section-title">请选择突破奖励</h2><div class="reward-grid"></div>`;
  state.modal.options.forEach((opt, index) => {
    const card = el("div", "event-card");
    card.innerHTML = `<h3>${opt.data.name}</h3><div class="event-art">${opt.kind === "trait" ? "特" : "策"}</div><p>${opt.data.desc || opt.data.effectsText}</p><button class="btn green">选择</button>`;
    card.querySelector("button").onclick = () => actions.takeReward(index);
    modal.querySelector(".reward-grid").appendChild(card);
  });
}

function renderMerchantModal(modal, run, actions) {
  modal.innerHTML = `<div class="modal-head"><h2 class="modal-title">武林商人</h2><button class="btn red small" data-done>离开</button></div><div class="list"></div>`;
  run.merchantStock.forEach(entry => {
    const obj = entry.kind === "weapon" ? DATA.weapons[entry.id] : DATA.items[entry.id];
    modal.querySelector(".list").appendChild(rowCard(obj.icon, entry.kind === "weapon" ? `【${rarityName(obj.rarity)}】${obj.name}` : obj.name, obj.desc, `${obj.price}◎`, () => actions.buyShopEntry(entry)));
  });
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
  modal.innerHTML = `
    <div class="modal-head"><h2 class="modal-title">角色属性</h2>${close}</div>
    <div class="character-sheet">
      <div><div class="portrait">${run.character.icon}</div><div class="name">${run.character.name}</div><div class="desc">${run.character.faction}｜${"★".repeat(Math.min(8, run.rankStars))}</div></div>
      <div>
        <div class="stats-grid">${STAT_KEYS.map(k => statLine(k, k === "hp" ? `${run.hp}/${run.stats.hp}` : k === "qi" ? `${run.qi}/${run.stats.qi}` : run.stats[k])).join("")}</div>
        <h3>上场招式（最多4个）</h3><div class="list skill-select-list"></div>
        <h3>特性</h3><p>${traitNames}</p>
        <h3>当前流派</h3><p>${run.selectedSchool ? schoolName(run.selectedSchool) : "尚未确定"}</p>
        <h3>装备武器</h3><p>${equippedWeaponText}</p>
      </div>
    </div>`;
  const list = modal.querySelector(".skill-select-list");
  run.skills.forEach(id => {
    const skill = DATA.skills[id];
    const active = run.activeSkills.includes(id);
    list.appendChild(rowCard(skill.icon, `${active ? "✓ " : ""}${skill.name}`, `${schoolName(skill.school)}｜${skill.battle === false ? "被动轻功，不占上场位" : skill.desc}`, active ? "下场" : "上场", () => actions.toggleActiveSkill(id)));
  });
}

function renderBackpackModal(modal, run, actions, close) {
  const counts = countIds(run.items);
  const weaponCounts = countIds(run.weapons);
  modal.innerHTML = `<div class="modal-head"><h2 class="modal-title">背包</h2>${close}</div><div class="inventory-summary"><div class="inventory-chip">金钱：${run.money}◎</div><div class="inventory-chip">道具：${run.items.length}</div><div class="inventory-chip">武器：${run.weapons.length}</div></div><div class="list"></div>`;
  const list = modal.querySelector(".list");
  if (!run.items.length && !run.weapons.length) list.innerHTML = "<p>背包里暂时没有道具。</p>";
  Object.entries(counts).forEach(([id, count]) => {
    const item = DATA.items[id];
    list.appendChild(rowCard(item.icon, `${item.name} x${count}`, item.desc, "使用", () => actions.useBagItem(id)));
  });
  Object.entries(weaponCounts).forEach(([id, count]) => {
    const weapon = DATA.weapons[id];
    list.appendChild(rowCard(weapon.icon, `【${rarityName(weapon.rarity)}】${weapon.name} x${count}`, `${schoolName(weapon.school)}｜${weapon.desc}`, run.equippedWeapon === id ? "已装备" : "装备", () => actions.equipWeapon(id)));
  });
}

function renderGoalsModal(modal, run, close) {
  const currentMonth = monthAbs(run);
  const progress = Math.min(100, Math.floor(currentMonth / run.finalBossMonth * 100));
  modal.innerHTML = `<div class="modal-head"><h2 class="modal-title">本局目标</h2>${close}</div><div class="goal-panel"><div class="boss-portrait">${run.finalBoss.icon}</div><div><h2>最终目标：击败${run.finalBoss.name}</h2><p>每年12月会遭遇一次强力Boss。第3年Boss为最终决战。</p><div class="stats-grid">${["hp", "qi", "atk", "def", "hit", "dodge", "crit", "speed"].map(k => statLine(k, k === "speed" ? (run.finalBoss[k] * 2).toFixed(2) : run.finalBoss[k] * 2)).join("")}</div><div class="goal-progress">${bar(currentMonth, run.finalBossMonth, `江湖进度 ${progress}%`)}</div></div></div>`;
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
    <div class="battle-top">${fighterPanel(b.player)}<div class="gauge-lane"><div class="gauge-dot" style="left:${b.player.gauge}%">${b.player.icon}</div><div class="gauge-dot" style="left:${b.enemy.gauge}%">${b.enemy.icon}</div><div class="speed-label">速度x${b.speed}</div></div>${fighterPanel(b.enemy)}</div>
    <div class="fighter player">${b.player.icon}</div><div class="fighter enemy">${b.enemy.icon}</div>
    ${(b.floaters || []).map(f => `<div class="combat-floater ${f.side}">${f.text}</div>`).join("")}
    <div class="battle-bottom"><div class="battle-tools"><button class="btn ${b.player.auto ? "green" : "secondary"}" data-auto>自动战斗</button><button class="btn secondary" data-basic>普攻</button><button class="btn secondary" data-rest>调息</button></div><div class="skill-row"></div><div class="battle-log">${b.log.map(x => `<div>${x}</div>`).join("")}</div></div>`;
  const skillRow = root.querySelector(".skill-row");
  b.player.skills.forEach(id => {
    const s = DATA.skills[id];
    const btn = el("button", "skill-btn");
    btn.disabled = b.phase !== "waitPlayer" || b.player.qi <= 0 || b.player.qi < s.qi || (b.player.cooldowns[id] || 0) > 0;
    btn.innerHTML = `<strong>${s.name}</strong><span>威力:${s.power} 内力:${s.qi}</span><br><span>CD:${b.player.cooldowns[id] || 0}</span>`;
    btn.onclick = () => actions.useSkill(id);
    skillRow.appendChild(btn);
  });
  b.player.items.slice(0, 5).forEach(id => {
    const item = DATA.items[id];
    if (!item || item.type === "stat") return;
    const btn = el("button", "skill-btn");
    btn.disabled = b.phase !== "waitPlayer";
    btn.innerHTML = `<strong>${item.name}</strong><span>${item.desc}</span>`;
    btn.onclick = () => actions.useItem(id);
    skillRow.appendChild(btn);
  });
  root.querySelector("[data-auto]").onclick = actions.toggleAuto;
  root.querySelector("[data-basic]").disabled = b.phase !== "waitPlayer";
  root.querySelector("[data-basic]").onclick = actions.basicAttack;
  root.querySelector("[data-rest]").disabled = b.phase !== "waitPlayer";
  root.querySelector("[data-rest]").onclick = actions.restAction;
  return root;
}

function fighterPanel(unit) {
  return `<div class="fighter-panel"><div class="fighter-name">${unit.name}</div>${bar(unit.hp, unit.stats.hp, `${Math.ceil(unit.hp)}/${unit.stats.hp}`, "hp-fill")}${bar(unit.qi, unit.stats.qi, `${Math.ceil(unit.qi)}/${unit.stats.qi}`, "qi-fill")}<div class="debuff-row">${debuffBadges(unit)}</div></div>`;
}

function debuffBadges(unit) {
  const badges = [];
  if (unit.bleed) badges.push(`<span class="debuff-badge" title="流血：行动开始时受到层数x12的伤害。">流血 ${unit.bleed}</span>`);
  if (unit.poison) badges.push(`<span class="debuff-badge" title="中毒：降低攻击、防御、命中、闪避、出手速度。">中毒 ${unit.poison}</span>`);
  if (unit.inner) badges.push(`<span class="debuff-badge" title="内伤：行动开始时失去层数x14的内力。内力归零时只能调息或普通攻击。">内伤 ${unit.inner}</span>`);
  return badges.join("");
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

function traitChip(name, title) {
  return `<span class="trait-chip" title="${escapeHtml(title)}">${name}</span>`;
}

function weaponTitle(weapon) {
  return `${schoolName(weapon.school)}｜攻击+${weapon.atk || 0}，流派伤害+${weapon.damagePct || 0}%，debuff层数+${weapon.debuffBonus || 0}。${weapon.desc}`;
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

function countIds(ids) {
  return ids.reduce((map, id) => ({ ...map, [id]: (map[id] || 0) + 1 }), {});
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
