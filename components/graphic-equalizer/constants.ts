const EQ_BANDS = [
  ["31", 31],
  ["62", 62],
  ["125", 125],
  ["250", 250],
  ["500", 500],
  ["1k", 1000],
  ["2k", 2000],
  ["4k", 4000],
  ["8k", 8000],
  ["16k", 16000],
] as const;

export const EQ_FREQUENCIES = EQ_BANDS.map(([label]) => label);
export const EQ_BAND_HZ = EQ_BANDS.map(([, hz]) => hz);
export const EQ_BAND_COUNT = EQ_BANDS.length;
export const EQ_MIN_DB = -12;
export const EQ_MAX_DB = 12;

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function yToDb(y: number, height: number) {
  if (height <= 0) {
    return 0;
  }

  const ratio = 1 - clamp(y / height, 0, 1);
  const db = EQ_MIN_DB + ratio * (EQ_MAX_DB - EQ_MIN_DB);
  return Math.round(db * 100) / 100;
}

export function dbToLevel(db: number) {
  return clamp((db - EQ_MIN_DB) / (EQ_MAX_DB - EQ_MIN_DB), 0, 1);
}

export function xToBandIndex(x: number, width: number) {
  if (width <= 0) {
    return 0;
  }

  return clamp(
    Math.floor((x / width) * EQ_BAND_COUNT),
    0,
    EQ_BAND_COUNT - 1,
  );
}
