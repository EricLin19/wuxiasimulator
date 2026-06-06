import { META_DEFAULT } from "../data/content.js";
import { clone } from "./utils.js";

const RUN_KEY = "wuxia_rogue_run_v26";
const META_KEY = "wuxia_rogue_meta_v26";

export function loadMeta() {
  try {
    return { ...clone(META_DEFAULT), ...JSON.parse(localStorage.getItem(META_KEY) || "{}") };
  } catch {
    return clone(META_DEFAULT);
  }
}

export function saveMeta(meta) {
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

export function saveRun(run) {
  localStorage.setItem(RUN_KEY, JSON.stringify(run));
}

export function loadRun() {
  try {
    return JSON.parse(localStorage.getItem(RUN_KEY) || "null");
  } catch {
    return null;
  }
}

export function clearRun() {
  localStorage.removeItem(RUN_KEY);
}
