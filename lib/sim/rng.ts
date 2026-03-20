export interface RandomSource {
  next: () => number;
}

export function createRng(seed: number): RandomSource {
  let state = seed >>> 0;
  return {
    next: () => {
      state += 0x6d2b79f5;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

export function randomBetween(rng: RandomSource, min: number, max: number) {
  return min + (max - min) * rng.next();
}

export function randomInt(rng: RandomSource, min: number, max: number) {
  return Math.floor(randomBetween(rng, min, max + 1));
}

export function pickWeighted<T>(rng: RandomSource, entries: Array<{ value: T; weight: number }>) {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  const needle = rng.next() * total;
  let running = 0;
  for (const entry of entries) {
    running += entry.weight;
    if (needle <= running) {
      return entry.value;
    }
  }

  return entries[entries.length - 1]?.value;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function percentile(values: number[], p: number) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) {
    return sorted[lower] ?? 0;
  }

  const weight = index - lower;
  return (sorted[lower] ?? 0) * (1 - weight) + (sorted[upper] ?? 0) * weight;
}

export function median(values: number[]) {
  return percentile(values, 0.5);
}
