import { Candle } from '../types/core';

export const returns = (closes: number[]): number[] => closes.slice(1).map((c, i) => Math.log(c / closes[i]));
export const ewmaVariance = (rets: number[], lambda = 0.94): number[] => {
  if (!rets.length) return [];
  const out: number[] = [rets[0] ** 2];
  for (let i = 1; i < rets.length; i++) out.push(lambda * out[i - 1] + (1 - lambda) * rets[i] ** 2);
  return out;
};
export const atr = (candles: Candle[], period = 14): number[] => {
  const tr = candles.map((c, i) => {
    if (i === 0) return c.high - c.low;
    const pc = candles[i - 1].close;
    return Math.max(c.high - c.low, Math.abs(c.high - pc), Math.abs(c.low - pc));
  });
  return tr.map((_, i) => {
    const s = Math.max(0, i - period + 1);
    const chunk = tr.slice(s, i + 1);
    return chunk.reduce((a, b) => a + b, 0) / chunk.length;
  });
};
export const emaSeries = (arr: number[], period: number): number[] => {
  const k = 2 / (period + 1);
  return arr.reduce<number[]>((acc, v, i) => {
    if (!i) return [v];
    acc.push(v * k + acc[i - 1] * (1 - k));
    return acc;
  }, []);
};
export const percentile = (arr: number[], value: number): number => {
  if (!arr.length) return 50;
  const below = arr.filter((x) => x <= value).length;
  return (below / arr.length) * 100;
};
export const median = (arr: number[]): number => {
  if (!arr.length) return 1;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
