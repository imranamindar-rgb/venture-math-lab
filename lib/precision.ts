const SHARE_SCALE = 1_000_000;
const CENT_SCALE = 100;

export function roundCurrency(value: number) {
  return Math.round(value * CENT_SCALE) / CENT_SCALE;
}

export function roundShares(value: number) {
  return Math.round(value * SHARE_SCALE) / SHARE_SCALE;
}

export function toCents(value: number) {
  return Math.round(value * CENT_SCALE);
}

export function fromCents(value: number) {
  return value / CENT_SCALE;
}

export function clampNearZero(value: number, epsilon = 1e-9) {
  return Math.abs(value) <= epsilon ? 0 : value;
}

export function allocateRoundedCurrency(values: number[], targetTotal?: number) {
  if (values.length === 0) {
    return [];
  }

  const roundedTarget = toCents(
    targetTotal ?? values.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0),
  );
  const sanitized = values.map((value) => (Number.isFinite(value) ? Math.max(0, value) : 0));
  const floors = sanitized.map((value) => Math.floor(value * CENT_SCALE));
  let remainder = roundedTarget - floors.reduce((sum, value) => sum + value, 0);

  const fractions = sanitized
    .map((value, index) => ({
      index,
      fraction: value * CENT_SCALE - floors[index],
    }))
    .sort((a, b) => b.fraction - a.fraction);

  for (let index = 0; index < fractions.length && remainder > 0; index += 1) {
    floors[fractions[index].index] += 1;
    remainder -= 1;
  }

  return floors.map(fromCents);
}
