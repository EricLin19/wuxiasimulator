import { DATA } from "../data/content.js";
import { sample } from "../core/utils.js";

export function buildRewardChoices(run) {
  const year = run?.year || 1;
  const allowed = rarity => rarity === "blue" || (rarity === "orange" && year >= 2) || (rarity === "red" && year >= 3);
  const strategyPool = (run?.selectedSchool
    ? DATA.strategies.filter(s => s.school === run.selectedSchool)
    : DATA.strategies).filter(s => allowed(s.rarity));
  return [
    ...sample(DATA.traits, 1).map(x => ({ kind: "trait", data: x })),
    ...sample(strategyPool, 2).map(x => ({ kind: "strategy", data: x }))
  ];
}

export function takeReward(run, option) {
  if (option.kind === "trait") {
    if (!run.traits.includes(option.data.id)) run.traits.push(option.data.id);
    return `突破奖励：获得特性「${option.data.name}」。`;
  }
  run.strategies.push(option.data.id);
  return `突破奖励：获得计略「${option.data.name}」（${option.data.effectsText}）。`;
}
