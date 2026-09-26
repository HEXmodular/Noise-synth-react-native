export const EQ_FREQUENCIES = [
  "31",
  "62",
  "125",
  "250",
  "500",
  "1k",
  "2k",
  "4k",
  "8k",
  "16k",
] as const;

export const EQ_BAND_COUNT = EQ_FREQUENCIES.length;
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
