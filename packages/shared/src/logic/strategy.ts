import { EngineType, IndicatorPoint, RegimeDecision } from '../types/core';

export const leverageFromSigmaNorm = (
  sigmaNorm: number,
  base: number,
  band: [number, number],
  exchangeCap = 125
): number => {
  const raw = base / Math.sqrt(Math.max(0.01, sigmaNorm));
  return Math.min(exchangeCap, Math.max(band[0], Math.min(band[1], raw)));
};

export const mapRegimeToEngine = (regime: RegimeDecision): EngineType[] => {
  switch (regime.label) {
    case 'COMPRESSION':
      return ['BREAKOUT'];
    case 'TREND':
      return ['CONTINUATION'];
    case 'RANGE':
      return ['REVERSAL'];
    case 'EXPANSION_CHAOS':
      return [];
  }
};

export const stopPct = (atrPct: number, k: number) => atrPct * k;

export const breakoutEligible = (i: IndicatorPoint, lowLiquidity = false) =>
  (i.volumePercentile ?? 0) >= (lowLiquidity ? 70 : 50) && (i.volPercentile ?? 100) < 85;
