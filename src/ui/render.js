import { DATA, STAT_LABELS, STAT_KEYS, SCHOOLS, RARITIES } from "../data/content.js";
import { monthAbs } from "../core/utils.js";
import { expNeed, getRankTitle } from "../systems/runSystem.js";

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
  modal.innerHTML = `<div class="modal-head"><h2 class="modal-title">${name}</h2><button class="btn red small">关闭</button></div><div style="padding:16px;color:#e0d5c0;line-height:1.8">${desc || "暂无描述"}</div>`;
  modal.querySelector("button").onclick = () => backdrop.remove();
  backdrop.appendChild(modal);
  app.appendChild(backdrop);
};

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
  let savedScrollTop = 0;
  if (state.modal && state.screen !== "battle") {
    const oldModal = app.querySelector(".modal");
    if (oldModal) savedScrollTop = oldModal.scrollTop;
  }
  app.innerHTML = "";
  if (state.screen === "menu") app.appendChild(renderMenu(state, actions));
  if (state.screen === "select") app.appendChild(renderSelect(state, actions));
  if (state.screen === "run") app.appendChild(renderRun(state, actions));
  if (state.screen === "battle") app.appendChild(renderBattle(state, actions));
  if (state.screen === "settlement") app.appendChild(renderSettlement(state, actions));
  if (state.modal) {
    app.appendChild(renderModal(state, actions));
    const newModal = app.querySelector(".modal");
    if (newModal) newModal.scrollTop = savedScrollTop;
  }
  if (state.toast) app.appendChild(el("div", "toast", state.toast));
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
        <div class="action-card" data-action="next">下回合</div>
      </div>
    </div>
    <div class="panel side-panel"><button class="btn secondary small" data-modal="journal" style="width:100%;margin-bottom:8px">江湖纪要</button><div class="log">${run.log.join("")}</div></div>`;
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
    hall: () => renderMerchantModal(modal, run, actions, true, close),
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

function renderMetaModal(modal, state, actions, close) {
  state.meta.allocations ||= {};
  modal.innerHTML = `<div class="modal-head"><h2 class="modal-title">局外成长</h2>${close}</div><div class="inventory-summary"><div class="inventory-chip">可分配属性点：${state.meta.metaPoints}</div><div class="inventory-chip">通关：${state.meta.wins}/${state.meta.runs}</div><div class="inventory-chip">无尽模式：${state.meta.endlessUnlocked ? "已解锁" : "未解锁"}</div></div><div class="list"></div>`;
  STAT_KEYS.forEach(key => modal.querySelector(".list").appendChild(rowCard("点", `${STAT_LABELS[key]} +${state.meta.allocations[key] || 0}`, STAT_HELP[key], "分配", () => actions.allocateMeta(key))));
}

function renderEventsModal(modal, run, actions, close) {
  const CATEGORY_COLORS = { "主线": "#c0392b", "高手传功": "#d4a056", "高手遗物": "#a855f7", "切磋": "#e74c3c", "维度增加": "#2ecc71", "金钱代价": "#f39c12", "小Boss": "#8e44ad" };
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
  modal.innerHTML = `<div class="modal-head"><h2 class="modal-title">江湖奇遇</h2>${close}</div><div class="event-count">可参与事件数：${run.eventRemaining}</div><div class="event-grid"></div>`;
  run.events.forEach(e => {
    const card = el("div", "event-card");
    const catColor = CATEGORY_COLORS[e.category] || "#888";
    const storyTag = e.type === "story" ? ` <span style="font-size:10px;color:#c0392b;margin-left:4px">【主线】</span>` : "";
    const sc = STORY_CHOICES[e.id];
    // 主线威胁值标注
    const threatNote = sc ? `<p style="color:#e74c3c;font-weight:700;margin:6px 0 0 0">武盟威视+${sc.threat}（顺应）</p>` : "";
    // 战斗难度标注
    let diffNote = "";
    if (e.category === "小Boss") diffNote = `<p style="color:#e74c3c;font-weight:900;margin:6px 0 0 0">战斗难度：极难</p>`;
    else if (e.category === "切磋" && e.id && e.id.startsWith("mini_")) diffNote = `<p style="color:#e74c3c;font-weight:900;margin:6px 0 0 0">战斗难度：极难</p>`;
    else if (e.category === "切磋") diffNote = `<p style="color:#f39c12;font-weight:700;margin:6px 0 0 0">战斗难度：困难</p>`;
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
  const rows = [
    { title: "举铁", meta: "攻击+3，经验+35，消耗1行动", icon: "拳", action: () => actions.trainStat("atk") },
    { title: "站桩功", meta: "防御+3，经验+35，消耗1行动", icon: "桩", action: () => actions.trainStat("def") },
    { title: "扎马步", meta: "血量上限+90，经验+35，消耗1行动", icon: "马", action: () => actions.trainStat("hp") }
  ];
  rows.forEach(x => modal.querySelector(".list").appendChild(rowCard(x.icon, x.title, x.meta, "修炼", x.action)));
  modal.querySelector(".list").appendChild(rowCard("气", "内力吐纳", "内力上限+30，经验+35，消耗1行动", "修炼", () => actions.trainStat("qi")));
}

// renderHallModal 已合并至 renderMerchantModal

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
      <div class="event-art">${opt.icon}</div>
      <p>${opt.desc}</p>
      <button class="btn green">选择</button>`;
    card.querySelector("button").onclick = () => actions.takeReward(index);
    modal.querySelector(".reward-grid").appendChild(card);
  });
}

function renderMerchantModal(modal, run, actions, isHall = false, close = "") {
  const closeBtnHtml = isHall && close ? close : `<button class="btn red small" data-done>离开</button>`;
  modal.innerHTML = `<div class="modal-head"><h2 class="modal-title">武林商人</h2>${closeBtnHtml}</div><div class="merchant-layout"><div class="merchant-col"><h3>外功秘籍</h3><div class="list"></div><h3>内功秘籍</h3><div class="list"></div></div><div class="merchant-col"><h3>丹药</h3><div class="list"></div><h3>装备</h3><div class="list"></div></div></div>`;

  // 外功秘籍
  run.manuals.forEach(id => {
    const s = DATA.skills[id];
    if (!s) return;
    const price = Math.floor((s.rarity === "red" ? 900 : s.rarity === "orange" ? 520 : 300) * (run.treasure.effect === "manualMastery" ? 0.82 : 1));
    modal.querySelectorAll(".merchant-col .list")[0].appendChild(rowCard(s.icon || SCHOOLS[s.school]?.icon || "秘", `【${rarityName(s.rarity)}】《${skillDisplayName(s)}》`, `${schoolName(s.school)}｜${s.styleName || ""}路线｜${s.desc}｜三式学成：${s.trait.name}`, `${price}◎`, () => actions.buyManual(id)));
  });

  // 内功秘籍
  run.merchantStock.filter(e => e.kind === "internalArt").forEach(entry => {
    const art = DATA.internalArts[entry.id];
    if (!art) return;
    const label = !run.internalArts.includes(entry.id) ? `${art.rarity === "red" ? 1200 : art.rarity === "orange" ? 680 : 360}◎` : "已拥有";
    modal.querySelectorAll(".merchant-col .list")[1].appendChild(rowCard(art.icon, `【${rarityName(art.rarity)}】${art.name}`, art.desc, label, () => actions.buyInternalArt(entry.id)));
  });

  // 丹药
  run.merchantStock.filter(e => e.kind === "item").forEach(entry => {
    const obj = DATA.items[entry.id];
    modal.querySelectorAll(".merchant-col .list")[2].appendChild(rowCard(obj.icon, obj.name, obj.desc, `${obj.price}◎`, () => actions.buyShopEntry(entry)));
  });

  // 装备（武器）
  run.merchantStock.filter(e => e.kind === "weapon").forEach(entry => {
    const obj = DATA.weapons[entry.id];
    modal.querySelectorAll(".merchant-col .list")[3].appendChild(rowCard(obj.icon, `【${rarityName(obj.rarity)}】${obj.name}`, obj.desc, `${obj.price}◎`, () => actions.buyShopEntry(entry)));
  });

  // 防具
  const armorSection2 = el("div", "merchant-col");
  armorSection2.innerHTML = `<h3>防具</h3><div class="list"></div>`;
  const armorCol2 = armorSection2.querySelector(".list");
  run.merchantStock.filter(e => e.kind === "armor").forEach(entry => {
    const obj = DATA.armors[entry.id];
    const label = run.armors.includes(entry.id) ? "已拥有" : `${obj.price}◎`;
    armorCol2.appendChild(rowCard(obj.icon, `【${rarityName(obj.rarity)}】${obj.name}`, obj.desc, label, () => actions.buyShopEntry(entry)));
  });
  if (armorCol2.children.length) modal.querySelector(".merchant-layout").appendChild(armorSection2);

  if (!isHall) modal.querySelector("[data-done]").onclick = actions.closeMerchant;
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

  modal.innerHTML = `
    <div class="modal-head"><h2 class="modal-title">角色属性</h2>${close}</div>
    <div class="character-sheet">
      <div><div class="portrait">${run.character.portraitImage ? `<img src="${run.character.portraitImage}" alt="${run.character.name}" loading="lazy" decoding="async">` : run.character.icon}</div><div class="name">${run.character.name}</div><div class="desc">${run.character.faction}｜${"★".repeat(Math.min(8, run.rankStars))}</div></div>
      <div>
        <div class="stats-grid">${STAT_KEYS.map(k => statLine(k, k === "hp" ? `${run.hp}/${run.stats.hp}` : k === "qi" ? `${run.qi}/${run.stats.qi}` : run.stats[k])).join("")}</div>
        <h3>上场招式（最多4个）</h3><div class="list skill-select-list"></div>
        <h3>特性</h3><p>${traitNames}</p>
        <h3>当前流派</h3><p>${run.selectedSchool ? schoolName(run.selectedSchool) : "尚未确定"}</p>
        ${storylineInfo}
        <h3>装备武器</h3><p>${equippedWeaponText}</p>
        <h3>装备防具</h3><p>${equippedArmorText}</p>
        <h3>已装备内功</h3><p>${run.activeInternalArt ? traitChip(DATA.internalArts[run.activeInternalArt].name, DATA.internalArts[run.activeInternalArt].desc) : "未装备"}</p>
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
}

function renderBackpackModal(modal, run, actions, close) {
  const counts = countIds(run.items);
  const weaponCounts = countIds(run.weapons);
  const armorCounts = countIds(run.armors);
  modal.innerHTML = `<div class="modal-head"><h2 class="modal-title">背包</h2>${close}</div><div class="inventory-summary"><div class="inventory-chip">金钱：${run.money}◎</div><div class="inventory-chip">道具：${run.items.length}</div><div class="inventory-chip">武器：${run.weapons.length}</div><div class="inventory-chip">防具：${run.armors.length}</div></div><div class="list"></div>`;
  const list = modal.querySelector(".list");
  if (!run.items.length && !run.weapons.length && !run.armors.length) list.innerHTML = "<p>背包里暂时没有道具。</p>";
  Object.entries(counts).forEach(([id, count]) => {
    const item = DATA.items[id];
    list.appendChild(rowCard(item.icon, `${item.name} x${count}`, item.desc, "使用", () => actions.useBagItem(id)));
  });
  Object.entries(weaponCounts).forEach(([id, count]) => {
    const weapon = DATA.weapons[id];
    list.appendChild(rowCard(weapon.icon, `【${rarityName(weapon.rarity)}】${weapon.name} x${count}`, weaponTitle(weapon), run.equippedWeapon === id ? "已装备" : "装备", () => actions.equipWeapon(id)));
  });
  Object.entries(armorCounts).forEach(([id, count]) => {
    const armor = DATA.armors[id];
    list.appendChild(rowCard(armor.icon, `【${rarityName(armor.rarity)}】${armor.name} x${count}`, armorTitle(armor), run.equippedArmor === id ? "已装备" : "装备", () => actions.equipArmor(id)));
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
  // 威胁值威胁度
  const threatLevel = threatVal >= 9 ? "【威势压人】Boss全面增强" : threatVal >= 6 ? "【暗流涌动】Boss明显变强" : threatVal >= 3 ? "【山雨欲来】Boss略微增强" : "";
  modal.innerHTML = `<div class="modal-head"><h2 class="modal-title">本局目标</h2>${close}</div><div class="goal-panel"><div class="boss-portrait">${bossPortraitImg ? `<img src="${bossPortraitImg}" alt="${bossName}" loading="lazy" decoding="async">` : bossIcon}</div><div>
    <h2>主线：${storylineName}</h2>
    <p style="color:${threatColor};margin:6px 0">${threatName}：${threatVal} ${threatLevel}</p>
    <div style="background:#f5e6d3;padding:8px;margin:8px 0;border-left:3px solid #c0392b;font-size:13px;line-height:1.5">
      <b>威胁值说明：</b>每月主线事件可选择<b>"顺应"</b>（获得奖励但威胁+1~3）或<b>"抗争"</b>（战斗/付钱换取威胁不增）。<br>
      威胁值越高，年末Boss越强：<span style="color:#f39c12">3-5山雨欲来</span>→<span style="color:#e67e22">6-8暗流涌动</span>→<span style="color:#e74c3c">9+威势压人</span>。
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
    <div class="battle-top">${fighterPanel(b.player)}<div class="gauge-lane"><div class="gauge-dot" style="left:${b.player.gauge}%">${b.player.icon}</div><div class="gauge-dot" style="left:${b.enemy.gauge}%">${b.enemy.icon}</div><div class="speed-label speed-toggle" data-speedbtn>速度x${b.speed || 1}</div></div>${fighterPanel(b.enemy)}</div>
    <div class="fighter player">${b.playerPortrait ? `<img src="${b.playerPortrait}" alt="${b.player.name}" loading="lazy" decoding="async">` : b.player.icon}</div><div class="fighter enemy">${b.enemyPortrait ? `<img src="${b.enemyPortrait}" alt="${b.enemy.name}" loading="lazy" decoding="async">` : b.enemy.icon}</div>
    ${b.bossTrait ? `<div class="boss-trait-bar"><span class="debuff-badge enemy-trait" title="${escapeHtml(b.enemy.stats.traitDesc || b.bossTrait)}">Boss特性：${b.bossTrait}</span>${b.bossShield > 0 ? `<span class="debuff-badge" title="护体">护体 ${b.bossShield}</span>` : ""}${b.bossImmuneTurns > 0 ? `<span class="debuff-badge" title="免疫负面">免疫 ${b.bossImmuneTurns}回合</span>` : ""}</div>` : ""}
    ${(b.floaters || []).map(f => `<div class="combat-floater ${f.side}">${f.text}</div>`).join("")}
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
  return root;
}

function fighterPanel(unit) {
  return `<div class="fighter-panel"><div class="fighter-name">${unit.name}</div>${bar(unit.hp, unit.stats.hp, `${Math.ceil(unit.hp)}/${unit.stats.hp}`, "hp-fill")}${bar(unit.qi, unit.stats.qi, `${Math.ceil(unit.qi)}/${unit.stats.qi}`, "qi-fill")}<div class="debuff-row">${debuffBadges(unit)}</div></div>`;
}

function debuffBadges(unit) {
  const badges = [];
  if (unit.stats.traitName) badges.push(`<span class="debuff-badge enemy-trait" title="${escapeHtml(unit.stats.traitDesc || "")}">${unit.stats.traitName}</span>`);
  if (unit.bleed) badges.push(`<span class="debuff-badge" title="流血：行动开始时受到层数x12的伤害。">流血 ${unit.bleed}</span>`);
  if (unit.poison) badges.push(`<span class="debuff-badge" title="中毒：降低攻击、防御、命中、闪避、出手速度。">中毒 ${unit.poison}</span>`);
  if (unit.inner) badges.push(`<span class="debuff-badge" title="内伤：行动开始时失去层数x14的内力。内力归零时只能调息或普通攻击。">内伤 ${unit.inner}</span>`);
  if (unit.frost) badges.push(`<span class="debuff-badge" title="寒气：降低速度，行动开始时失去内力。">寒气 ${unit.frost}</span>`);
  if (unit.hamstring) badges.push(`<span class="debuff-badge" title="断筋：降低速度，并在命中时削弱攻击。">断筋 ${unit.hamstring}</span>`);
  if (unit.gu) badges.push(`<span class="debuff-badge" title="蛊：提高招式内力消耗，并扰乱气息。">蛊 ${unit.gu}</span>`);
  return badges.join("");
}

function renderBattleItemsModal(modal, run, battle, actions) {
  console.log("[道具弹窗] renderBattleItemsModal 被调用, battle:", !!battle, "items:", battle?.player?.items);
  if (!battle) {
    modal.innerHTML = `<div class="modal-head"><h2 class="modal-title">使用道具</h2></div><div class="list"><p>战斗数据异常，请重试。</p></div>`;
    return;
  }
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
