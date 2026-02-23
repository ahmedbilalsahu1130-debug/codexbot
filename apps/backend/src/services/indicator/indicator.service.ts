import { atr, emaSeries, ewmaVariance, median, percentile, returns, type Candle, type IndicatorPoint } from '@repo/shared';
import { prisma } from '../../db/prisma';

const fromDb = (c: any): Candle => ({
  symbol: c.symbol.unified,
  timeframe: c.timeframe.toLowerCase().replace('m', 'm').replace('h', 'h') as any,
  timestamp: +c.timestamp,
  open: c.open,
  high: c.high,
  low: c.low,
  close: c.close,
  volume: c.volume
});

export class IndicatorService {
  async compute(symbol: string, timeframe: '1m' | '5m' = '5m') {
    const dbTf = timeframe === '1m' ? 'M1' : 'M5';
    const rows = await prisma.candle.findMany({ where: { symbol: { unified: symbol }, timeframe: dbTf as any }, include: { symbol: true }, orderBy: { timestamp: 'asc' }, take: 10000 });
    const candles = rows.map(fromDb);
    if (candles.length < 30) return;

    const closes = candles.map((c) => c.close);
    const vols = candles.map((c) => c.volume);
    const rets = returns(closes);
    const v = ewmaVariance(rets);
    const sigmas = v.map(Math.sqrt);
    const atrs = atr(candles, 14);
    const ema20 = emaSeries(closes, 20);
    const ema50 = emaSeries(closes, 50);
    const ema200 = emaSeries(closes, 200);

    const sigmaMed = median(sigmas.slice(-8640));
    const points: IndicatorPoint[] = candles.map((c, i) => {
      const sigma = sigmas[i - 1] ?? sigmas.at(-1) ?? 0;
      const bbWidth = i >= 19 ? ((Math.max(...closes.slice(i - 19, i + 1)) - Math.min(...closes.slice(i - 19, i + 1))) / closes[i]) * 100 : 0;
      const slope = i > 11 ? ((ema50[i] - ema50[i - 12]) / Math.max(1e-9, ema50[i - 12])) * 100 : 0;
      return {
        symbol,
        timeframe,
        timestamp: c.timestamp,
        atr: atrs[i],
        atrPct: (atrs[i] / c.close) * 100,
        ewmaVar: v[i - 1] ?? v.at(-1),
        sigma,
        sigmaNorm: sigma / Math.max(1e-9, sigmaMed),
        volPercentile: percentile(sigmas.slice(Math.max(0, i - 8640), i + 1), sigma),
        bbWidthPct: bbWidth,
        bbWidthPercentile: percentile(candles.slice(Math.max(0, i - 8640), i + 1).map((_, idx2) => idx2), i),
        ema20: ema20[i],
        ema50: ema50[i],
        ema200: ema200[i],
        ema50Slope: slope,
        ema50SlopePercentile: percentile(ema50.slice(Math.max(0, i - 8640), i + 1), ema50[i]),
        volumePercentile: percentile(vols.slice(Math.max(0, i - 8640), i + 1), vols[i])
      };
    });

    const symbolRow = rows[0].symbol;
    await prisma.$transaction(
      points.map((p) =>
        prisma.indicator.upsert({
          where: { symbolId_timeframe_timestamp: { symbolId: symbolRow.id, timeframe: dbTf as any, timestamp: new Date(p.timestamp) } },
          create: {
            symbolId: symbolRow.id,
            timeframe: dbTf as any,
            timestamp: new Date(p.timestamp),
            atr: p.atr,
            atrPct: p.atrPct,
            ewmaVar: p.ewmaVar,
            sigma: p.sigma,
            sigmaNorm: p.sigmaNorm,
            volPctile: p.volPercentile,
            bbWidthPct: p.bbWidthPct,
            bbPctile: p.bbWidthPercentile,
            ema20: p.ema20,
            ema50: p.ema50,
            ema200: p.ema200,
            ema50Slope: p.ema50Slope,
            slopePctile: p.ema50SlopePercentile,
            volumePctile: p.volumePercentile
          },
          update: {
            atr: p.atr,
            atrPct: p.atrPct,
            ewmaVar: p.ewmaVar,
            sigma: p.sigma,
            sigmaNorm: p.sigmaNorm,
            volPctile: p.volPercentile,
            bbWidthPct: p.bbWidthPct,
            bbPctile: p.bbWidthPercentile,
            ema20: p.ema20,
            ema50: p.ema50,
            ema200: p.ema200,
            ema50Slope: p.ema50Slope,
            slopePctile: p.ema50SlopePercentile,
            volumePctile: p.volumePercentile
          }
        })
      )
    );
  }
}
