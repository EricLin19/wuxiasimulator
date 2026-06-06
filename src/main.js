import { DATA } from "./data/content.js";
import { state } from "./core/state.js";
import { saveRun, loadRun, saveMeta } from "./core/save.js";
import { renderApp } from "./ui/render.js";
import {
  createRun,
  resolveEvent,
  finishDeferredEvent,
  endMonth,
  trainStat,
  trainSkill,
  trainStrategy,
  buyManual,
  addStrategy,
  mergeStrategies,
  buyShopEntry,
  useBagItem,
  equipWeapon,
  gainExp,
  log,
  spendAp,
  settleRun,
  buildStrategyChoices,
  toggleActiveSkill,
  toggleActiveStrategy
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
  toggleAuto as battleToggleAuto
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
  if (!app) return;
  const viewport = window.visualViewport;
  const w = Math.floor(viewport?.width || window.innerWidth);
  const h = Math.floor(viewport?.height || window.innerHeight);
  const offsetLeft = Math.floor(viewport?.offsetLeft || 0);
  const offsetTop = Math.floor(viewport?.offsetTop || 0);
  const useMobileStage = w < 980 || h < 560 || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  document.documentElement.classList.toggle("mobile-viewport", useMobileStage);
  document.body.classList.toggle("mobile-viewport", useMobileStage);
  if (!useMobileStage) {
    app.style.transform = "";
    app.style.left = "";
    app.style.top = "";
    app.style.position = "relative";
    document.documentElement.style.minWidth = "";
    document.documentElement.style.minHeight = "";
    document.body.style.minWidth = "";
    document.body.style.minHeight = "";
    return;
  }
  const portrait = h > w;
  const safeW = Math.max(1, w - 32);
  const safeH = Math.max(1, h - 32);
  const scale = portrait ? Math.min(safeW / 560, safeH / 980) : Math.min(safeW / 980, safeH / 560);
  const stageW = portrait ? 560 * scale : 980 * scale;
  const stageH = portrait ? 980 * scale : 560 * scale;
  document.documentElement.style.minWidth = `${Math.ceil(stageW)}px`;
  document.documentElement.style.minHeight = `${Math.ceil(stageH + 24)}px`;
  document.body.style.minWidth = `${Math.ceil(stageW)}px`;
  document.body.style.minHeight = `${Math.ceil(stageH + 24)}px`;
  app.style.position = "absolute";
  app.style.left = `${offsetLeft + Math.max(0, (w - stageW) / 2)}px`;
  app.style.top = `${offsetTop + Math.max(0, (h - stageH) / 2)}px`;
  app.style.transform = portrait
    ? `scale(${scale}) rotate(90deg) translateY(-560px)`
    : `scale(${scale})`;
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
      state.run.money += 180;
      const leveled = gainExp(state.run, 120);
      log(state.run, `击败${battle.enemy.name}，获得180金钱和120武学阅历。`);
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
    state.selectedTreasure = state.meta.unlockedTreasures[0];
    render();
  },
  continueRun: () => {
    const saved = loadRun();
    if (!saved) return showToast("没有存档");
    state.run = saved;
    state.run.activeSkills ||= state.run.skills.filter(id => DATA.skills[id]?.battle !== false).slice(0, 4);
    state.run.activeStrategies ||= [];
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
    if (type === "strategy") state.modal.selectedIndices = [];
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
    render();
  },
  chooseStrategy: () => {
    const result = trainStrategy(state.run);
    if (!result.ok) return showToast(result.message);
    if (result.ready) state.modal = { type: "strategyChoice", options: buildStrategyChoices(state.run) };
    render();
  },
  trainSkill: id => {
    const result = trainSkill(state.run, id);
    if (!result.ok) return showToast(result.message);
    render();
  },
  buyManual: id => {
    const result = buyManual(state.run, id);
    if (!result.ok) return showToast(result.message);
    render();
  },
  takeStrategy: id => {
    addStrategy(state.run, id);
    state.modal = null;
    render();
  },
  mergeStrategies: () => {
    const result = mergeStrategies(state.run, state.modal?.selectedIndices || []);
    if (!result.ok) return showToast(result.message);
    state.modal = { type: "strategy", selectedIndices: [] };
    render();
  },
  toggleStrategySelect: index => {
    state.modal.selectedIndices ||= [];
    if (state.modal.selectedIndices.includes(index)) {
      state.modal.selectedIndices = state.modal.selectedIndices.filter(x => x !== index);
    } else if (state.modal.selectedIndices.length < 2) {
      state.modal.selectedIndices.push(index);
    } else {
      showToast("最多选择两个计略");
    }
    render();
  },
  toggleActiveStrategy: index => {
    const result = toggleActiveStrategy(state.run, index);
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
  backToMenu: () => {
    state.screen = "menu";
    state.settlement = null;
    render();
  },
  debugMoney: () => { state.run.money += 1000; saveRun(state.run); render(); },
  debugSkills: () => {
    state.run.skills = Object.keys(DATA.skills);
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
  debugBoss: () => startBattle(state.run.finalBoss, true)
};

let battleTimer = null;
function ensureBattleTimer() {
  if (battleTimer) return;
  battleTimer = setInterval(() => {
    if (state.screen !== "battle" || !state.battle || state.battle.phase !== "running") return;
    const phase = tickBattle(state.battle, 0.08);
    render();
    if (phase === "ended") resolveBattleResult({ ended: true, winner: state.battle.enemy.hp <= 0 ? "player" : "enemy" });
    if (phase === "enemyAction") setTimeout(() => resolveBattleResult(enemyAction(state.run, state.battle)), 260);
    if (phase === "autoPlayer") setTimeout(() => resolveBattleResult(autoPlayerAction(state.run, state.battle)), 240);
  }, 80);
}

window.__wuxiaDebug = {
  state,
  startBoss: () => startBattle(state.run.finalBoss, true),
  addMoney: value => { state.run.money += value; saveRun(state.run); render(); },
  addStrategy: id => { addStrategy(state.run, id); render(); },
  addSkills: () => {
    state.run.skills = Object.keys(DATA.skills);
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
