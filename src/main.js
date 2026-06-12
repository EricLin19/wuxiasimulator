import { DATA } from "./data/content.js";
import { state } from "./core/state.js";
import { saveRun, loadRun, saveMeta } from "./core/save.js";
import { renderApp } from "./ui/render.js";
import {
  createRun,
  resolveEvent,
  resolveStoryChoice,
  finishDeferredEvent,
  endMonth,
  trainStat,
  trainSkill,
  trainArt,
  buyManual,
  buyInternalArt,
  equipInternalArt,
  buyShopEntry,
  useBagItem,
  equipWeapon,
  buyArmor,
  equipArmor,
  gainExp,
  scaleMoney,
  log,
  spendAp,
  settleRun,
  toggleActiveSkill,
  getBattleDifficulty,
  refreshWandererMerchantAction
} from "./systems/runSystem.js";
import { buildRewardChoices, takeReward } from "./systems/rewardSystem.js";
import { syncMusicForState, setVolume as audioSetVolume } from "./systems/audioSystem.js";
import {
  createBattle,
  tickBattle,
  useSkill as battleUseSkill,
  useItem as battleUseItem,
  restAction as battleRestAction,
  basicAttack as battleBasicAttack,
  autoPlayerAction,
  enemyAction,
  toggleAuto as battleToggleAuto,
  toggleSpeed as battleToggleSpeed,
  fleeAction as battleFleeAction
} from "./systems/battleSystem.js";

// ── Toast 系统 v5.11：90°旋转 + 屏幕居中 + 队列 + 自适应文本 + 缩放渐消 ──
// 机制：居中堆叠最多3条，每条停留1.2s后缩小渐消（0.5s）
//        同时多个toast时自动排队，防止重叠
let _toastQueue      = [];   // 等待显示的toast文本队列
let _toastActive      = [];   // 当前正在显示的{el,text}，最多3条
let _lastToastText    = "";  // 最近一次toast文本（时间窗口去重）
let _lastToastTime    = 0;   // 最近一次toast时间戳（ms）

const TOAST_GAP = 48;  // 每条toast之间的间距(px) — 从屏幕中央向上堆叠
const TOAST_DEDUP_MS = 2000; // 同一文本去重时间窗口（2秒内不重复）

function showToast(text) {
  if (!text) return;
  const now = Date.now();
  // 2秒内同一文本不重复显示（时间窗口去重，非永久）
  if (text === _lastToastText && now - _lastToastTime < TOAST_DEDUP_MS) return;
  _lastToastText = text;
  _lastToastTime = now;
  _toastQueue.push(text);
  processToastQueue();
}
// 供 runSystem.js 的 log() 调用（避免循环依赖）
if (typeof window !== "undefined") window.__showToast = showToast;

function processToastQueue() {
  // 当前活跃已满3条时等待，不消费队列
  if (_toastActive.length >= 3) return;
  if (_toastQueue.length === 0) return;

  const text = _toastQueue.shift();
  const el = _createToastEl(text, false);
  const idx = _toastActive.length;  // 新toast的索引（0=居中）
  el.style.top = `calc(50% - ${idx * TOAST_GAP}px)`;
  _toastActive.push({ el, text });

  // 1.2秒后开始退出动画（上移+渐消）
  const exitTimer = setTimeout(() => {
    el.classList.add("toast-out");
  }, 1200);

  // 退出动画结束后移除DOM，重新排列剩余toast
  el.addEventListener("animationend", (e) => {
    if (e.animationName === "toastOut") {
      clearTimeout(exitTimer);
      el.remove();
      _toastActive = _toastActive.filter(t => t.el !== el);
      _repositionToasts();
      processToastQueue();   // 消费队列中下一个
    }
  }, { once: true });
}

function _createToastEl(text, isTaunt) {
  const el = document.createElement("div");
  el.className = "toast" + (isTaunt ? " toast-taunt" : "");
  el.textContent = text;
  document.body.appendChild(el);
  return el;
}

function _repositionToasts() {
  _toastActive.forEach((t, i) => {
    t.el.style.top = `calc(50% - ${i * TOAST_GAP}px)`;
  });
}

// ── Battle 嘴炮：复用同一队列系统 ──
let _lastTauntBattle = null;
let _lastTauntTime = 0;

function showBattleTaunt(battle, rotVal) {
  if (!battle?.tauntText) return;
  const now = Date.now();
  // 同一场战斗只显示一次嘴炮（3秒内不重复）
  if (battle === _lastTauntBattle && now - _lastTauntTime < 3000) return;
  _lastTauntBattle = battle;
  _lastTauntTime = now;
  const text = `【${battle.enemy.name}】"${battle.tauntText}"`;
  if (!text) return;
  // 也受全局toast去重窗口约束
  if (text === _lastToastText && now - _lastToastTime < TOAST_DEDUP_MS) return;
  _lastToastText = text;
  _lastToastTime = now;
  _toastQueue.push(text);
  processToastQueue();
}

let _lastRenderTime = 0;
function render() {
  const now = performance.now();
  const elapsed = now - _lastRenderTime;
  // 战斗期间每帧都渲染，加 12ms 节流防止浏览器积压
  if (elapsed < 12 && state.screen === "battle") return;
  _lastRenderTime = now;

  renderApp(state, actions);
  syncMusicForState(state);

  // 动态读取 #app 是否有旋转，用于 toast/taunt 同步旋转
  const app = document.getElementById("app");
  const appHasRot = app?.style.transform?.includes("rotate(90deg)");
  const rotVal = appHasRot ? "90deg" : "0deg";

  // 战斗嘴炮：通过队列系统显示（每场战斗只显示一次）
  if (state.battle?.tauntText && state.battle !== _lastTauntBattle) {
    showBattleTaunt(state.battle, rotVal);
  }
}

function fitMobileViewport() {
  const app = document.getElementById("app");
  const shell = document.getElementById("stage-shell");
  const fit = document.getElementById("stage-fit");
  if (!app) return;
  const viewport = window.visualViewport;
  const widthCandidates = [window.outerWidth, window.innerWidth, document.documentElement.clientWidth, viewport?.width].filter(Boolean);
  const heightCandidates = [window.outerHeight, window.innerHeight, document.documentElement.clientHeight, viewport?.height].filter(Boolean);
  const w = Math.floor(Math.min(...widthCandidates));
  const h = Math.floor(Math.min(...heightCandidates));
  const useMobileStage = w < 980 || h < 560 || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  document.documentElement.classList.toggle("mobile-viewport", useMobileStage);
  document.body.classList.toggle("mobile-viewport", useMobileStage);
  shell?.classList.toggle("mobile-viewport", useMobileStage);
  if (!useMobileStage) {
    if (fit) {
      fit.style.width = "";
      fit.style.height = "";
      fit.style.position = "";
      fit.style.left = "";
      fit.style.top = "";
      fit.style.transform = "";
    }
    app.style.transform = "";
    app.style.left = "";
    app.style.top = "";
    app.style.right = "";
    app.style.bottom = "";
    app.style.position = "relative";
    app.style.transformOrigin = "";
    document.documentElement.style.minWidth = "";
    document.documentElement.style.minHeight = "";
    document.body.style.minWidth = "";
    document.body.style.minHeight = "";
    return;
  }
  const portrait = h > w;
  const marginX = portrait ? 52 : 28;
  const marginY = portrait ? 9 : 8;
  const safeW = Math.max(1, w - marginX);
  const safeH = Math.max(1, h - marginY);
  const scale = portrait ? Math.min(safeW / 560, safeH / 980) : Math.min(safeW / 980, safeH / 560);
  const fitW = portrait ? 560 : 980;
  const fitH = portrait ? 980 : 560;
  const stageW = fitW * scale;
  const stageH = fitH * scale;
  document.documentElement.style.minWidth = "";
  document.documentElement.style.minHeight = "";
  document.body.style.minWidth = "";
  document.body.style.minHeight = "";
  if (fit) {
    fit.style.position = "fixed";
    fit.style.left = `${Math.max(0, (w - stageW) / 2)}px`;
    fit.style.top = `${Math.max(0, (h - stageH) / 2)}px`;
    fit.style.width = `${fitW}px`;
    fit.style.height = `${fitH}px`;
    fit.style.transformOrigin = "top left";
    fit.style.transform = `scale(${scale})`;
  }
  app.style.position = "absolute";
  app.style.left = "50%";
  app.style.top = "50%";
  app.style.right = "auto";
  app.style.bottom = "auto";
  app.style.transformOrigin = "center center";
  app.style.transform = portrait
    ? "translate(-50%, -50%) rotate(90deg)"
    : "translate(-50%, -50%)";
}

function startBattle(enemy, isBoss = false) {
  state.battle = createBattle(state.run, enemy, isBoss);
  state.modal = null;
  state.screen = "battle";
  ensureBattleTimer(); // 重新确保 timer 正在运行
  render();
}

function resolveBattleResult(result) {
  if (!result?.ended) return;

  // 立即保存 battle 引用并置 null，防止任何重入（包括 timer tick、render 触发的回调）
  const battle = state.battle;
  if (!battle) return;
  state.battle = null;
  _lastTauntBattle = null;

  // 立即停止战斗 timer，防止后续 tick 干扰
  if (battleTimer) {
    clearInterval(battleTimer);
    battleTimer = null;
  }

  console.time("[Battle] 结算耗时");

  // 获取故事战斗上下文（主线抗争触发）
  const storyBattle = state.run.storyBattle;
  if (storyBattle) delete state.run.storyBattle;

  if (result.winner === "player") {
    state.run.hp = Math.max(1, battle.player.hp);
    state.run.qi = Math.max(0, battle.player.qi);
    state.run.items = battle.player.items;

    // === 故事战斗胜利处理 ===
    if (storyBattle) {
      // 应用战斗奖励
      const rew = storyBattle.reward;
      if (rew) {
        if (rew.money) state.run.money += rew.money;
        if (rew.exp) { const leveled = gainExp(state.run, rew.exp); if (leveled) state.modal = { type: "reward", options: buildRewardChoices(state.run) }; }
        if (rew.gainItem) state.run.items.push(rew.gainItem);
        if (rew.fame) state.run.fame = (state.run.fame || 0) + rew.fame;
        if (rew.atk) state.run.stats.atk += rew.atk;
        if (rew.def) state.run.stats.def += rew.def;
        if (rew.int) state.run.stats.int = (state.run.stats.int || 0) + rew.int;
        if (rew.agi) state.run.stats.agi = (state.run.stats.agi || 0) + rew.agi;
      }
      // 动态奖励：按剩余血量比例加钱和经验（沿用普通战斗公式，乘以血量表现系数）
      {
        const enemyHp = battle.enemy.stats.hp;
        const hpRatio = battle.player.hp / Math.max(1, battle.player.stats.hp);
        const perfMult = 0.4 + hpRatio * 0.6; // 血量越低奖励越少（最低 40%）
        const diff = getBattleDifficulty(battle.player.stats.hp, battle.enemy.stats.hp);
        const baseReward = Math.floor(enemyHp * 0.06);
        const dynMoney = scaleMoney(state.run, Math.floor(baseReward * perfMult * diff.moneyMult));
        const dynExp = Math.floor(baseReward * perfMult * diff.expMult);
        state.run.money += dynMoney;
        if (dynExp > 0) {
          const leveled = gainExp(state.run, dynExp);
          log(state.run, `表现加成：+${dynMoney}◎ +${dynExp}武学阅历（剩余血量${Math.round(hpRatio*100)}%，${diff.label}难度）`);
          if (leveled && !state.modal) state.modal = { type: "reward", options: buildRewardChoices(state.run) };
        }
      }
      // 赢：散人决心+1
      state.run.wandererResolve = Math.min(10, (state.run.wandererResolve || 0) + 1);
      log(state.run, `击败${battle.enemy.name}！散人决心 +1（当前：${state.run.wandererResolve}/10）`);

      // M36最终Boss：展示结局选择
      if (storyBattle.isFinalBoss && storyBattle.endings) {
        state.run.storyEndings = storyBattle.endings;
        state.run.storyBattleResult = "win";
      }

      if (battle.isBoss && battle.bossYear) {
        state.run.yearlyBossDefeated[battle.bossYear] = true;
      }
      state.screen = "run";
      finishDeferredEvent(state.run);
    } else if (battle.isBoss) {
      state.run.yearlyBossDefeated[battle.bossYear] = true;
      log(state.run, `击败年末强敌：${battle.enemy.name}。`);
      if (battle.bossYear >= 3) {
        settleRun(state, "win", `你击败了${battle.enemy.name}，江湖传遍你的名号。`);
      } else {
        state.screen = "run";
        state.modal = { type: "reward", options: buildRewardChoices(state.run) };
        console.time("[Battle] saveRun(boss)");
        saveRun(state.run);
        console.timeEnd("[Battle] saveRun(boss)");
      }
    } else {
      const diff = getBattleDifficulty(battle.player.stats.hp, battle.enemy.stats.hp);
      const enemyHp = battle.enemy.stats.hp;
      const baseReward = Math.floor(enemyHp * 0.24);
      const money = scaleMoney(state.run, Math.floor(baseReward * diff.moneyMult));
      const exp = Math.floor(baseReward * diff.expMult);
      state.run.money += money;
      console.time("[Battle] gainExp");
      const leveled = gainExp(state.run, exp);
      console.timeEnd("[Battle] gainExp");
      log(state.run, `击败${battle.enemy.name}，获得${money}金钱和${exp}武学阅历。（难度：${diff.label}）`);
      state.screen = "run";
      // 战斗结束后清理battle相关状态，确保道具栏可正常点击
      // finishDeferredEvent 内部已调 saveRun，无需重复
      finishDeferredEvent(state.run);
      if (leveled) state.modal = { type: "reward", options: buildRewardChoices(state.run) };
      else state.modal = null;
    }
  } else {
    // === 故事战斗失败处理 ===
    if (storyBattle) {
      // 输：武盟威慑+1，不结束游戏
      state.run.mainThreat = (state.run.mainThreat || 0) + 1;
      log(state.run, `败给${battle.enemy.name}。武盟威慑 +1（当前：${state.run.mainThreat}）`);
      state.run.hp = Math.max(1, Math.floor(state.run.stats.hp * 0.3)); // 残血存活
      state.run.qi = 0;

      // M36最终Boss败：展示结局选择（可能有限）
      if (storyBattle.isFinalBoss && storyBattle.endings) {
        state.run.storyEndings = storyBattle.endings;
        state.run.storyBattleResult = "lose";
      }

      state.screen = "run";
      state.modal = null;
      saveRun(state.run);
    } else {
      settleRun(state, "lose", `你败给了${battle.enemy.name}。`);
    }
  }
  console.time("[Battle] render结算");
  render();
  console.timeEnd("[Battle] render结算");
  console.timeEnd("[Battle] 结算耗时");
}

const actions = {
  render,
  hasSavedRun: () => !!loadRun(),
  gotoSelect: () => {
    state.screen = "select";
    state.selectedCharacter = DATA.characters[0].id;
    state.selectedTreasure = DATA.treasures.find(t => !t.locked || state.meta.unlockedTreasures.includes(t.id))?.id;
    render();
  },
  continueRun: () => {
    const saved = loadRun();
    if (!saved) return showToast("没有存档");
    state.run = saved;
    state.run.activeSkills ||= state.run.skills.filter(id => DATA.skills[id]?.battle !== false).slice(0, 4);
    state.run.internalArts ||= [];
    // 双内功迁移：旧版 activeInternalArt（单ID）→ activeInternalArts（数组）
    if (state.run.activeInternalArt && typeof state.run.activeInternalArt === "string") {
      state.run.activeInternalArts = [state.run.activeInternalArt];
      delete state.run.activeInternalArt;
    }
    state.run.activeInternalArts ||= [];
    // cultivatedArts 从 artProgress 推导（修炼完成的）
    if (!state.run.cultivatedArts) {
      state.run.cultivatedArts = [];
      for (const [id, prog] of Object.entries(state.run.artProgress || {})) {
        const art = DATA.internalArts[id];
        if (art && prog >= (art.cultivateCost || 0)) state.run.cultivatedArts.push(id);
      }
    }
    state.run.armors ||= [];
    state.run.equippedArmor = state.run.equippedArmor || null;
    state.run.apUsedThisMonth = state.run.apUsedThisMonth || false;
    state.run.skillTraits ||= [];
    state.run.wandererResolve = state.run.wandererResolve || 0;
    state.run.mainThreat = state.run.mainThreat || 0;
    state.screen = "run";
    state.modal = null;
    state.toast = "";
    render();
  },
  selectCharacter: id => { state.selectedCharacter = id; render(); },
  selectTreasure: id => { state.selectedTreasure = id; render(); },
  startRun: () => {
    // 选完角色后进入开局点数分配页（保留上次分配记忆）
    state.perRunAllocations ||= {};
    const total = 15 + (state.extraAllocPoints || 0);
    const used = Object.values(state.perRunAllocations).reduce((s, v) => s + (v || 0), 0);
    state.allocPoints = Math.max(0, total - used);
    state.screen = "allocate";
    state.modal = null;
    render();
  },
  allocatePoint: key => {
    if (state.allocPoints <= 0) return showToast("没有可分配点数");
    state.perRunAllocations ||= {};
    state.perRunAllocations[key] = (state.perRunAllocations[key] || 0) + 1;
    state.allocPoints--;
    render();
  },
  deallocatePoint: key => {
    if (!state.perRunAllocations || (state.perRunAllocations[key] || 0) <= 0) return;
    state.perRunAllocations[key]--;
    state.allocPoints++;
    render();
  },
  resetAllocations: () => {
    state.perRunAllocations = {};
    state.allocPoints = 15 + (state.extraAllocPoints || 0);
    render();
  },
  confirmAllocate: () => {
    state.run = createRun(state.selectedCharacter, state.selectedTreasure, state.meta, state.perRunAllocations);
    state.extraAllocPoints = 0; // 消耗累积的额外点数
    state.screen = "run";
    state.modal = null;
    render();
  },
  openModal: type => {
    state.modal = { type };
    render();
  },
  closeModal: () => { state.modal = null; render(); },
  openSettings: () => {
    state.modal = { type: "settings" };
    render();
  },
  setMusicVolume: v => {
    state.musicVolume = v;
    audioSetVolume(v);
  },
  chooseEvent: id => {
    resolveEvent(state.run, id, {
      openMerchant: () => { state.modal = { type: "merchant" }; },
      startBattle: enemy => startBattle(enemy, false)
    });
    render();
  },
  chooseStoryEvent: (eventId, choice, endingId) => {
    resolveStoryChoice(state.run, eventId, choice, {
      startBattle: enemy => startBattle(enemy, false),
      endingId: endingId || null,
      settleEnding: (eff, endingChoice) => {
        log(state.run, `结局降临：${endingChoice.label}`);
        settleRun(state, "win", endingChoice.desc || endingChoice.label);
      }
    });
    state.modal = null;
    render();
  },
  closeMerchant: () => {
    finishDeferredEvent(state.run);
    state.modal = null;
    render();
  },
  refreshMerchant: () => {
    const result = refreshWandererMerchantAction(state.run);
    if (!result.ok) return showToast(result.message);
    render();
  },
  endMonth: () => {
    state.modal = null;
    endMonth(state.run, enemy => startBattle(enemy, true));
    render();
  },
  trainStat: kind => {
    const result = trainStat(state.run, kind);
    if (!result.ok) return showToast(result.message);
    if (result.leveled) {
      state.modal = { type: "reward", options: buildRewardChoices(state.run) };
    }
    render();
  },
  trainSkill: id => {
    const result = trainSkill(state.run, id);
    if (!result.ok) return showToast(result.message);
    if (result.leveled) {
      state.modal = { type: "reward", options: buildRewardChoices(state.run) };
    }
    render();
  },
  trainArt: id => {
    const result = trainArt(state.run, id);
    if (!result.ok) return showToast(result.message);
    if (result.leveled) {
      state.modal = { type: "reward", options: buildRewardChoices(state.run) };
    }
    render();
  },
  buyManual: id => {
    const result = buyManual(state.run, id);
    if (!result.ok) return showToast(result.message);
    render();
  },
  buyShopEntry: entry => {
    const result = buyShopEntry(state.run, entry);
    if (!result.ok) return showToast(result.message);
    render();
  },
  useBagItem: id => {
    const result = useBagItem(state.run, id);
    if (!result.ok) return showToast(result.message);
    render();
  },
  equipWeapon: id => {
    const result = equipWeapon(state.run, id);
    if (!result.ok) return showToast(result.message);
    render();
  },
  buyArmor: id => {
    const result = buyArmor(state.run, id);
    if (!result.ok) return showToast(result.message);
    render();
  },
  equipArmor: id => {
    const result = equipArmor(state.run, id);
    if (!result.ok) return showToast(result.message);
    render();
  },
  buyInternalArt: id => {
    const result = buyInternalArt(state.run, id);
    if (!result.ok) return showToast(result.message);
    render();
  },
  equipInternalArt: id => {
    const result = equipInternalArt(state.run, id);
    if (!result.ok) return showToast(result.message);
    render();
  },
  toggleActiveSkill: id => {
    const result = toggleActiveSkill(state.run, id);
    if (!result.ok) return showToast(result.message);
    render();
  },
  allocateMeta: key => {
    if (state.meta.metaPoints <= 0) return showToast("没有可分配属性点");
    state.meta.allocations ||= {};
    state.meta.allocations[key] = (state.meta.allocations[key] || 0) + 1;
    state.meta.metaPoints--;
    saveMeta(state.meta);
    const statLabel = { hp: "血量", qi: "内力", atk: "攻击", def: "防御", combo: "连击", hit: "命中", dodge: "闪避", crit: "暴击", speed: "出手速度", money: "金钱" };
    state.toast = `分配属性点：${statLabel[key] || key}+1（下次开局生效）`;
    render();
  },
  takeReward: index => {
    const option = state.modal.options[index];
    const logText = takeReward(state.run, option);
    log(state.run, logText);
    state.modal = null;
    saveRun(state.run);
    render();
  },
  useSkill: id => {
    const result = battleUseSkill(state.run, state.battle, id);
    if (result.message) return showToast(result.message);
    if (result.ended) { resolveBattleResult(result); return; }
    render();
  },
  useItem: id => {
    const result = battleUseItem(state.run, state.battle, id);
    if (result.message) return showToast(result.message);
    state.modal = null;
    if (result.ended) { resolveBattleResult(result); return; }
    render();
  },
  basicAttack: () => {
    const result = battleBasicAttack(state.run, state.battle);
    if (result.ended) { resolveBattleResult(result); return; }
    render();
  },
  restAction: () => {
    const result = battleRestAction(state.run, state.battle);
    if (result.ended) { resolveBattleResult(result); return; }
    render();
  },
  toggleAuto: () => { battleToggleAuto(state.battle); render(); },
  toggleSpeed: () => { battleToggleSpeed(state.battle); render(); },
  openItemMenu: () => {
    state.modal = { type: "battleItems" };
    render();
  },
  fleeAction: () => {
    const result = battleFleeAction(state.run, state.battle);
    if (result.fled) {
      state.run.hp = Math.max(1, state.battle.player.hp);
      state.run.qi = Math.max(0, state.battle.player.qi);
      state.run.items = state.battle.player.items;
      state.screen = "run";
      state.battle = null;
      _lastTauntBattle = null;
      state.modal = null;
      log(state.run, result.message);
      finishDeferredEvent(state.run);
      saveRun(state.run);
    } else {
      showToast(result.message || "逃跑失败");
    }
    render();
  },
  backToMenu: () => {
    state.screen = "menu";
    state.settlement = null;
    render();
  },
  debugMoney: () => { state.run.money += 1000; saveRun(state.run); render(); },
  debugSkills: () => {
    state.run.skills = Object.keys(DATA.skills).filter(id => DATA.skills[id]?.style);
    state.run.activeSkills = state.run.skills.filter(id => DATA.skills[id]?.battle !== false).slice(0, 4);
    saveRun(state.run);
    render();
  },
  debugBossMonth: () => {
    state.run.year = 3;
    state.run.month = 12;
    saveRun(state.run);
    render();
  },
  debugBoss: () => {
    // 三主线：使用当前年Boss
    const sl = DATA.storylines?.[state.run.storylineId];
    const bossTemplate = sl?.bosses?.[state.run.year];
    if (bossTemplate) startBattle(bossTemplate, true);
  }
};

let battleTimer = null;
function ensureBattleTimer() {
  if (battleTimer) return;
  battleTimer = setInterval(() => {
    const b = state.battle;
    if (state.screen !== "battle" || !b || b.phase !== "running") return;
    const speedMult = b.speed || 1;
    const phase = tickBattle(b, 0.08 * speedMult);
    render();
    if (phase === "ended") {
      // 在 timer 内检测到的结算（debuff 致死等）
      if (!state.battle) return; // 防御：可能在 render 中被消费
      resolveBattleResult({ ended: true, winner: state.battle.enemy.hp <= 0 ? "player" : "enemy" });
    }
    if (phase === "enemyAction") {
      setTimeout(() => {
        if (!state.battle || state.screen !== "battle") return; // 防御：战斗已结束
        resolveBattleResult(enemyAction(state.run, state.battle));
      }, 260 / speedMult);
    }
    if (phase === "autoPlayer") {
      setTimeout(() => {
        if (!state.battle || state.screen !== "battle") return; // 防御：战斗已结束
        resolveBattleResult(autoPlayerAction(state.run, state.battle));
      }, 240 / speedMult);
    }
  }, 80);
}

window.__wuxiaDebug = {
  state,
  startBoss: () => {
    const sl = DATA.storylines?.[state.run.storylineId];
    const bossTemplate = sl?.bosses?.[state.run.year];
    if (bossTemplate) startBattle(bossTemplate, true);
  },
  addMoney: value => { state.run.money += value; saveRun(state.run); render(); },
  addSkills: () => {
    state.run.skills = Object.keys(DATA.skills).filter(id => DATA.skills[id]?.style);
    state.run.activeSkills = state.run.skills.filter(id => DATA.skills[id]?.battle !== false).slice(0, 4);
    saveRun(state.run);
    render();
  },
  jumpToBossMonth: () => { state.run.year = 3; state.run.month = 12; saveRun(state.run); render(); }
};

ensureBattleTimer();
fitMobileViewport();
window.addEventListener("resize", fitMobileViewport);
window.addEventListener("orientationchange", () => setTimeout(fitMobileViewport, 120));
render();
