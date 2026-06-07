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
  toggleActiveSkill
} from "./systems/runSystem.js";
import { buildRewardChoices, takeReward } from "./systems/rewardSystem.js";
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

function showToast(text) {
  state.toast = text;
  render();
  setTimeout(() => {
    if (state.toast === text) {
      state.toast = "";
      render();
    }
  }, 1200);
}

function render() {
  renderApp(state, actions);
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
  render();
}

function resolveBattleResult(result) {
  if (!result?.ended) return;
  const battle = state.battle;
  if (result.winner === "player") {
    state.run.hp = Math.max(1, battle.player.hp);
    state.run.qi = Math.max(0, battle.player.qi);
    state.run.items = battle.player.items;
    if (battle.isBoss) {
      state.run.yearlyBossDefeated[battle.bossYear] = true;
      log(state.run, `击败年末强敌：${battle.enemy.name}。`);
      if (battle.bossYear >= 3) {
        settleRun(state, "win", `你击败了${battle.enemy.name}，江湖传遍你的名号。`);
      } else {
        state.screen = "run";
        state.battle = null;
        state.modal = { type: "reward", options: buildRewardChoices(state.run) };
        saveRun(state.run);
      }
    } else {
      const money = scaleMoney(state.run, 180);
      state.run.money += money;
      const leveled = gainExp(state.run, 120);
      log(state.run, `击败${battle.enemy.name}，获得${money}金钱和120武学阅历。`);
      state.screen = "run";
      state.battle = null;
      finishDeferredEvent(state.run);
      if (leveled) state.modal = { type: "reward", options: buildRewardChoices(state.run) };
      saveRun(state.run);
    }
  } else {
    settleRun(state, "lose", `你败给了${battle.enemy.name}。`);
  }
  render();
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
    state.run.activeInternalArt = state.run.activeInternalArt || null;
    state.run.armors ||= [];
    state.run.equippedArmor = state.run.equippedArmor || null;
    state.run.apUsedThisMonth = state.run.apUsedThisMonth || false;
    state.run.skillTraits ||= [];
    state.screen = "run";
    state.modal = null;
    render();
  },
  selectCharacter: id => { state.selectedCharacter = id; render(); },
  selectTreasure: id => { state.selectedTreasure = id; render(); },
  startRun: () => {
    state.run = createRun(state.selectedCharacter, state.selectedTreasure, state.meta);
    state.screen = "run";
    state.modal = null;
    render();
  },
  openModal: type => {
    state.modal = { type };
    render();
  },
  closeModal: () => { state.modal = null; render(); },
  chooseEvent: id => {
    resolveEvent(state.run, id, {
      openMerchant: () => { state.modal = { type: "merchant" }; },
      startBattle: enemy => startBattle(enemy, false)
    });
    render();
  },
  chooseStoryEvent: (eventId, choice) => {
    resolveStoryChoice(state.run, eventId, choice, {
      startBattle: enemy => startBattle(enemy, false)
    });
    state.modal = null;
    render();
  },
  closeMerchant: () => {
    finishDeferredEvent(state.run);
    state.modal = null;
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
    state.meta.allocations ||= { hp: 0, qi: 0, atk: 0, def: 0, combo: 0, hit: 0, dodge: 0, crit: 0, speed: 0 };
    state.meta.allocations[key] = (state.meta.allocations[key] || 0) + 1;
    state.meta.metaPoints--;
    saveMeta(state.meta);
    render();
  },
  takeReward: index => {
    const option = state.modal.options[index];
    log(state.run, takeReward(state.run, option));
    state.modal = null;
    saveRun(state.run);
    render();
  },
  useSkill: id => {
    const result = battleUseSkill(state.run, state.battle, id);
    if (result.message) return showToast(result.message);
    resolveBattleResult(result);
    render();
  },
  useItem: id => {
    const result = battleUseItem(state.run, state.battle, id);
    if (result.message) return showToast(result.message);
    resolveBattleResult(result);
    render();
  },
  basicAttack: () => {
    resolveBattleResult(battleBasicAttack(state.run, state.battle));
    render();
  },
  restAction: () => {
    resolveBattleResult(battleRestAction(state.run, state.battle));
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
    if (state.screen !== "battle" || !state.battle || state.battle.phase !== "running") return;
    const speedMult = state.battle.speed || 1;
    const phase = tickBattle(state.battle, 0.08 * speedMult);
    render();
    if (phase === "ended") resolveBattleResult({ ended: true, winner: state.battle.enemy.hp <= 0 ? "player" : "enemy" });
    if (phase === "enemyAction") setTimeout(() => resolveBattleResult(enemyAction(state.run, state.battle)), 260 / speedMult);
    if (phase === "autoPlayer") setTimeout(() => resolveBattleResult(autoPlayerAction(state.run, state.battle)), 240 / speedMult);
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
