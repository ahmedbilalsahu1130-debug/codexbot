import { IndicatorPoint, RegimeDecision } from '../types/core';

export const determineRegime = (i: IndicatorPoint): RegimeDecision => {
  const reasons: string[] = [];
  const slopeAbs = Math.abs(i.ema50Slope ?? 0);
  if ((i.bbWidthPercentile ?? 100) <= 20 && (i.volPercentile ?? 100) <= 35) {
    reasons.push('compression-band');
    return { label: 'COMPRESSION', reasons, defensive: false };
  }
  if ((i.volPercentile ?? 0) >= 85) {
    reasons.push('vol-shock');
    return { label: 'EXPANSION_CHAOS', reasons, defensive: true };
  }
  if (slopeAbs > 0.05 && ((i.ema50 ?? 0) > (i.ema200 ?? 0) || (i.ema50 ?? 0) < (i.ema200 ?? 0))) {
    reasons.push('trend-slope');
    return { label: 'TREND', reasons, defensive: false };
  }
  reasons.push('range-default');
  return { label: 'RANGE', reasons, defensive: false };
};
