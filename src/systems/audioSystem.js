// BGM 音轨配置 —— 三线角色 + 主界面
const TRACKS = {
  menu: "assets/audio/主页面_纸灯回响.mp3",
  wanderer_peace: "assets/audio/沈孤云平_Lonely Dust Road.mp3",
  wanderer_battle: "assets/audio/沈孤云战_Dustblade Wushan.mp3",
  constable_peace: "assets/audio/铁鹰平__Chained Edict__.mp3",
  constable_battle: "assets/audio/铁鹰战_Iron Hawk Entry.mp3",
  orthodox_peace: "assets/audio/天衡照邪平_Black Lotus Rain.mp3",
  orthodox_battle: "assets/audio/天衡照邪战_Temple-Bell Duel.mp3"
};

const players = {};
let currentKey = "none";
let _globalVolume = 0.5;

export function getVolume() { return _globalVolume; }
export function setVolume(v) {
  _globalVolume = Math.max(0, Math.min(1, v));
  Object.values(players).forEach(a => {
    if (!a.paused) a.volume = _globalVolume;
  });
}

function getPlayer(key) {
  if (!TRACKS[key]) return null;
  if (!players[key]) {
    const audio = new Audio(TRACKS[key]);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
    players[key] = audio;
  }
  return players[key];
}

function fadeTo(audio, target, ms = 450) {
  const start = audio.volume;
  if (start === target) return;
  const startedAt = performance.now();
  const tick = now => {
    const t = Math.min(1, (now - startedAt) / ms);
    audio.volume = start + (target - start) * t;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export function setMusic(key) {
  if (key === currentKey) {
    // 如果上一次播放被浏览器阻止，用户手势后重试
    const player = getPlayer(key);
    if (player && player.paused) {
      player.currentTime ||= 0;
      player.play().catch(() => {});
    }
    return;
  }
  const previous = getPlayer(currentKey);
  const next = getPlayer(key);
  currentKey = key;

  if (previous) {
    fadeTo(previous, 0, 300);
    setTimeout(() => {
      if (previous !== getPlayer(currentKey)) previous.pause();
    }, 320);
  }

  if (!next) return;
  next.currentTime ||= 0;
  next.play()
    .then(() => fadeTo(next, _globalVolume, 450))
    .catch(() => {
      // 浏览器可能阻止自动播放，下次用户手势会重试
    });
}

// 根据游戏状态选择音轨
export function syncMusicForState(state) {
  if (state.screen === "menu" || state.screen === "select") {
    setMusic("menu");
    return;
  }
  if (state.screen === "battle") {
    const sid = state.run?.storylineId;
    setMusic(sid === "constable" ? "constable_battle" : sid === "orthodox" ? "orthodox_battle" : "wanderer_battle");
    return;
  }
  if (state.screen === "run") {
    const sid = state.run?.storylineId;
    setMusic(sid === "constable" ? "constable_peace" : sid === "orthodox" ? "orthodox_peace" : "wanderer_peace");
    return;
  }
  setMusic("none");
}
