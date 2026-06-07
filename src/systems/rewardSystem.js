import { DATA } from "../data/content.js";
import { sample } from "../core/utils.js";

export function buildRewardChoices(run) {
  return sample(DATA.traits, 3).map(x => ({ kind: "trait", data: x }));
}

export function takeReward(run, option) {
  if (option.kind === "trait") {
    if (!run.traits.includes(option.data.id)) run.traits.push(option.data.id);
    return `突破奖励：获得特性「${option.data.name}」。`;
  }
  return "突破奖励已领取。";
}
