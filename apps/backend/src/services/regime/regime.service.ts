import { determineRegime } from '@repo/shared';
import { prisma } from '../../db/prisma';

export class RegimeService {
  async compute(symbol: string) {
    const symbolRow = await prisma.symbol.findUnique({ where: { unified: symbol } });
    if (!symbolRow) return;
    const indicators = await prisma.indicator.findMany({ where: { symbolId: symbolRow.id, timeframe: 'M5' as any }, orderBy: { timestamp: 'asc' } });
    for (const i of indicators) {
      const regime = determineRegime({
        symbol,
        timeframe: '5m',
        timestamp: +i.timestamp,
        sigmaNorm: i.sigmaNorm ?? undefined,
        volPercentile: i.volPctile ?? undefined,
        bbWidthPercentile: i.bbPctile ?? undefined,
        ema50: i.ema50 ?? undefined,
        ema200: i.ema200 ?? undefined,
        ema50Slope: i.ema50Slope ?? undefined,
        volumePercentile: i.volumePctile ?? undefined
      });
      await prisma.regime.create({ data: { symbolId: symbolRow.id, timestamp: i.timestamp, label: regime.label as any, inputs: regime as any } });
    }
  }

  async current(symbol: string) {
    const row = await prisma.regime.findFirst({ where: { symbol: { unified: symbol } }, orderBy: { timestamp: 'desc' } });
    return row;
  }
}
