export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h';
export type RegimeLabel = 'COMPRESSION' | 'TREND' | 'RANGE' | 'EXPANSION_CHAOS';
export type EngineType = 'BREAKOUT' | 'CONTINUATION' | 'REVERSAL';
export type Side = 'LONG' | 'SHORT';

export interface Candle {
  symbol: string;
  timeframe: Timeframe;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorPoint {
  symbol: string;
  timeframe: Timeframe;
  timestamp: number;
  atr?: number;
  atrPct?: number;
  ewmaVar?: number;
  sigma?: number;
  sigmaNorm?: number;
  volPercentile?: number;
  bbWidthPct?: number;
  bbWidthPercentile?: number;
  ema20?: number;
  ema50?: number;
  ema200?: number;
  ema50Slope?: number;
  ema50SlopePercentile?: number;
  volumePercentile?: number;
}

export interface RegimeDecision {
  label: RegimeLabel;
  reasons: string[];
  defensive: boolean;
}
