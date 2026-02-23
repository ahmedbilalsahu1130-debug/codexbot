import type { Candle, Timeframe } from '@repo/shared';

export interface ExchangeAdapter {
  name: string;
  fetchCandles(symbol: string, timeframe: Timeframe, limit?: number): Promise<Candle[]>;
}

const tf = (t: Timeframe) => ({ '1m': '1', '5m': '5', '15m': '15', '30m': '30', '1h': '60', '4h': '240' }[t]);

export class BinanceFuturesAdapter implements ExchangeAdapter {
  name = 'binance';
  async fetchCandles(symbol: string, timeframe: Timeframe, limit = 500): Promise<Candle[]> {
    const native = symbol.replace('-', '');
    const r = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${native}&interval=${timeframe}&limit=${limit}`);
    const d = (await r.json()) as any[];
    return d.map((k) => ({ symbol, timeframe, timestamp: Number(k[0]), open: +k[1], high: +k[2], low: +k[3], close: +k[4], volume: +k[5] }));
  }
}

export class BybitAdapter implements ExchangeAdapter {
  name = 'bybit';
  async fetchCandles(symbol: string, timeframe: Timeframe, limit = 200): Promise<Candle[]> {
    const native = symbol.replace('-', '');
    const r = await fetch(`https://api.bybit.com/v5/market/kline?category=linear&symbol=${native}&interval=${tf(timeframe)}&limit=${limit}`);
    const d = (await r.json()) as any;
    return (d.result?.list ?? []).map((k: any[]) => ({
      symbol,
      timeframe,
      timestamp: Number(k[0]),
      open: +k[1],
      high: +k[2],
      low: +k[3],
      close: +k[4],
      volume: +k[5]
    })).reverse();
  }
}
