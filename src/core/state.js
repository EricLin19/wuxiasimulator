import { loadMeta } from "./save.js";

export const state = {
  screen: "menu",
  selectedCharacter: null,
  selectedTreasure: null,
  run: null,
  battle: null,
  modal: null,
  toast: "",
  meta: loadMeta(),
  settlement: null,
  musicVolume: 0.5,
  perRunAllocations: null,
  allocPoints: 15
};
