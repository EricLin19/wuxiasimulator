export function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function rand(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function sample(list, count) {
  const pool = [...list];
  const out = [];
  while (pool.length && out.length < count) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function monthAbs(run) {
  return (run.year - 1) * 12 + run.month;
}
