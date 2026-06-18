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
  getArmorStats,
  gainExp,
  scaleMoney,
  log,
  spendAp,
  settleRun,
  toggleActiveSkill,
  getBattleDifficulty,
  refreshWandererMerchantAction,
  applyMonthStart,
  refreshEvents,
  getMonthSnapshot
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

// ── Toast 系统 v5.16：桌面/手机端分离 ──
// 桌面：无旋转，top竖直移动 | 手机：90°旋转，left动画(旋转后=屏幕竖直)
// 机制：每条toast独立生命周期（timer驱动，不依赖animationend事件）
//       停留1.2s → CSS transition上移96px+渐消0.5s → 自动清理
//       最多3条同时显示，超出自动挤掉最旧的；当前可见文本去重
let _toastActive = [];

const TOAST_GAP      = 48;   // 堆叠间距(px)
const TOAST_STAY_MS   = 1200; // 停留时间(ms)
const TOAST_EXIT_MS   = 500;  // 退出动画时长(ms)
const TOAST_EXIT_DY   = 96;   // 退出时位移量(px)
const TOAST_MAX       = 3;    // 最多同时显示条数

function _toastAxis() {
  return document.body.classList.contains("mobile-viewport") ? "left" : "top";
}

function showToast(text, isTaunt) {
  if (!text) return;
  // 去重：当前正在显示的toast中已有相同文本则跳过
  if (_toastActive.some(t => t.text === text)) return;

  const el = document.createElement("div");
  el.className = isTaunt ? "toast toast-taunt" : "toast";
  el.textContent = text;
  document.body.appendChild(el);

  const axis = _toastAxis();
  const idx = _toastActive.length;
  el.style[axis] = `calc(50% - ${idx * TOAST_GAP}px)`;
  const entry = { el, text, axis };

  // 1.2s后：上移 + 渐消（CSS transition驱动）
  entry.stayTimer = setTimeout(() => {
    el.style[axis] = `calc(50% - ${idx * TOAST_GAP + TOAST_EXIT_DY}px)`;
    el.style.opacity = "0";
  }, TOAST_STAY_MS);

  // 保险：总时长后强制清理（防止transitionend不触发）
  entry.deadTimer = setTimeout(() => {
    _cleanupToast(entry);
  }, TOAST_STAY_MS + TOAST_EXIT_MS + 150);

  // transitionend触发时清理（比deadTimer先到）
  el.addEventListener("transitionend", (e) => {
    if (e.propertyName === "opacity") {
      _cleanupToast(entry);
    }
  }, { once: true });

  _toastActive.push(entry);

  // 超过上限：立即挤掉最旧的
  if (_toastActive.length > TOAST_MAX) {
    _cleanupToast(_toastActive[0], true);
  }
}
if (typeof window !== "undefined") window.__showToast = showToast;

function _cleanupToast(entry, immediate) {
  clearTimeout(entry.stayTimer);
  clearTimeout(entry.deadTimer);
  entry.el.remove();
  const idx = _toastActive.indexOf(entry);
  if (idx >= 0) _toastActive.splice(idx, 1);
  // 重排剩余（用各自记录的axis，因为横竖屏可能在运行中切换）
  _toastActive.forEach((t, i) => {
    t.el.style[t.axis] = `calc(50% - ${i * TOAST_GAP}px)`;
  });
}

// ── Battle 嘴炮 ──
let _lastTauntBattle = null;
let _lastTauntTime = 0;

function showBattleTaunt(battle) {
  if (!battle?.tauntText) return;
  const now = Date.now();
  if (battle === _lastTauntBattle && now - _lastTauntTime < 3000) return;
  _lastTauntBattle = battle;
  _lastTauntTime = now;
  showToast(`【${battle.enemy.name}】"${battle.tauntText}"`, true);
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

  // 浮字层跟随 app 一起旋转
  const floaterLayer = document.getElementById("floater-layer");

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
    // 桌面端：浮字层恢复默认
    if (floaterLayer) {
      floaterLayer.style.position = "";
      floaterLayer.style.left = "";
      floaterLayer.style.top = "";
      floaterLayer.style.right = "";
      floaterLayer.style.bottom = "";
      floaterLayer.style.transform = "";
      floaterLayer.style.transformOrigin = "";
      floaterLayer.style.width = "";
      floaterLayer.style.height = "";
    }
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

  // 手机端：浮字层与 app 同位置、同旋转，确保伤害数字出现在正确位置
  if (floaterLayer) {
    floaterLayer.style.position = "absolute";
    floaterLayer.style.width = `${fitW}px`;
    floaterLayer.style.height = `${fitH}px`;
    floaterLayer.style.left = "50%";
    floaterLayer.style.top = "50%";
    floaterLayer.style.right = "auto";
    floaterLayer.style.bottom = "auto";
    floaterLayer.style.transformOrigin = "center center";
    floaterLayer.style.transform = portrait
      ? "translate(-50%, -50%) rotate(90deg)"
      : "translate(-50%, -50%)";
  }
}

// 清理战斗浮字
function clearFloaterLayer() {
  const layer = document.getElementById("floater-layer");
  if (layer) layer.innerHTML = "";
}

function startBattle(enemy, isBoss = false) {
  clearFloaterLayer();
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
  clearFloaterLayer();

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
      // 赢：boss战胜利计数，每3场散人决心+1
      state.run.bossWinCount = (state.run.bossWinCount || 0) + 1;
      if (state.run.bossWinCount >= 3) {
        state.run.bossWinCount = 0;
        state.run.wandererResolve = Math.min(10, (state.run.wandererResolve || 0) + 1);
        log(state.run, `连胜3场Boss战！散人决心+1（当前：${state.run.wandererResolve}/10）`);
      } else {
        log(state.run, `击败${battle.enemy.name}！Boss连胜（${state.run.bossWinCount}/3）。`);
      }

      // M36最终Boss：展示结局选择
      if (storyBattle.isFinalBoss && storyBattle.endings) {
        state.run.storyEndings = storyBattle.endings;
        state.run.storyBattleResult = "win";
      }

      if (battle.isBoss && battle.bossYear) {
        state.run.yearlyBossDefeated[battle.bossYear] = true;
      }

      // Boss战结果页面（M12/M24战胜弹窗，M48战胜弹窗，其余boss战胜走原逻辑）
      const bm = storyBattle.month;
      const isConstable = run.storylineId === "constable";
      const showBossResult = bm === 12 || bm === 24 || bm === 36 || (isConstable ? bm === 48 : bm === 48);
      if (showBossResult) {
        state.bossResult = { mode: bm === 48 ? "m48Win" : bm === 36 ? "m36Win" : "yearlyWin", type: "win", bossName: battle.enemy.name, month: bm };
      } else {
        state.screen = "run";
        finishDeferredEvent(state.run);
      }
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
    // === 故事战斗失败 → Boss战结果页面 ===
    if (storyBattle) {
      const bm = storyBattle.month;
      state.bossResult = {
        mode: bm === 48 ? "m48Lose" : "normal",
        type: "lose",
        bossName: battle.enemy.name,
        month: bm
      };
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
      startBattle: (enemy, isBoss) => startBattle(enemy, isBoss || false)
    });
    render();
  },
  chooseStoryEvent: (eventId, choice, endingId) => {
    resolveStoryChoice(state.run, eventId, choice, {
      startBattle: (enemy, isBoss) => startBattle(enemy, isBoss || false),
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
      clearFloaterLayer();
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
  },
  handleBossResult: action => {
    const br = state.bossResult;
    if (!br) return;
    const run = state.run;

    if (action === "rewind") {
      // 回到本月初：快照恢复
      const snap = getMonthSnapshot();
      if (snap) {
        state.run = snap;
        state.run.activeSkills ||= state.run.skills.filter(id => DATA.skills[id]?.battle !== false).slice(0, 4);
        state.run.internalArts ||= [];
        state.run.activeInternalArts ||= [];
        state.run.armors ||= [];
        state.run.skillTraits ||= [];
        state.run.wandererResolve = state.run.wandererResolve || 0;
        state.run.mainThreat = state.run.mainThreat || 0;
        state.screen = "run";
        state.bossResult = null;
        render();
      }
      return;
    }

    if (action === "nextMonth" || action === "continue") {
      // 继续游戏 → 到下一个月（跨年自动）
      state.bossResult = null;
      run.month++;
      if (run.month > 12) { run.month = 1; run.year++; }
      run.eventRemaining = 3;
      const maxHp = run.stats.hp + getArmorStats(run).hp;
      run.hp = Math.min(maxHp, run.hp + 100);
      run.qi = Math.min(run.stats.qi, run.qi + 50);
      applyMonthStart(run);
      refreshEvents(run);
      log(run, action === "continue"
        ? `击败${br.bossName}！继续前行——进入第${run.year}年${run.month}月。`
        : `败给${br.bossName}。重整旗鼓——进入第${run.year}年${run.month}月。`);
      state.screen = "run";
      state.modal = null;
      saveRun(run);
      render();
      return;
    }

    if (action === "retire") {
      // M36 战胜 → 退隐江湖
      state.bossResult = null;
      settleRun(state, "win", `你击败了${br.bossName}，归隐山林，江湖只余你的传说。`);
      return;
    }

    if (action === "mainMenu") {
      // 结束游戏 → 回到主页面
      state.bossResult = null;
      if (br.mode === "m48Win") {
        // M48 战胜：孤云逐浪结束，直接回主页（不 settle）
        saveMeta(state.meta);
        state.screen = "menu";
        state.run = null;
        state.modal = null;
      } else if (br.type === "win") {
        settleRun(state, "win", `你击败了${br.bossName}，江湖传遍你的名号。`);
      } else {
        settleRun(state, "lose", `你败给了${br.bossName}。`);
      }
      render();
    }
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
