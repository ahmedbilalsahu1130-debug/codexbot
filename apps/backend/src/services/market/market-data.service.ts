import type { Candle, Timeframe } from '@repo/shared';
import { prisma } from '../../db/prisma';
import { AuditService } from '../audit/audit.service';
import { BinanceFuturesAdapter, BybitAdapter, ExchangeAdapter } from './adapters';

export class MarketDataService {
  adapters: ExchangeAdapter[] = [new BinanceFuturesAdapter(), new BybitAdapter()];
  constructor(private audit = new AuditService()) {}

  async ingest(symbol: string, timeframe: Timeframe) {
    for (const adapter of this.adapters) {
      try {
        const candles = await adapter.fetchCandles(symbol, timeframe, 300);
        await this.persist(candles, adapter.name);
      } catch (e) {
        await this.audit.log('MARKET', 'INGEST_FAIL', `Ingest failed ${adapter.name}`, { error: String(e), symbol, timeframe }, symbol);
      }
    }
  }

  async persist(candles: Candle[], exchange: string) {
    if (!candles.length) return;
    const symbol = await prisma.symbol.upsert({
      where: { unified: candles[0].symbol },
      update: {},
      create: { unified: candles[0].symbol, native: candles[0].symbol.replace('-', ''), exchange }
    });
    await prisma.$transaction(
      candles.map((c) =>
        prisma.candle.upsert({
          where: {
            symbolId_timeframe_timestamp: {
              symbolId: symbol.id,
              timeframe: toDbTf(c.timeframe),
              timestamp: new Date(c.timestamp)
            }
          },
          create: {
            symbolId: symbol.id,
            timeframe: toDbTf(c.timeframe),
            timestamp: new Date(c.timestamp),
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
            volume: c.volume
          },
          update: { open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume }
        })
      )
    );
  }
}

const toDbTf = (t: Timeframe) => ({ '1m': 'M1', '5m': 'M5', '15m': 'M15', '30m': 'M30', '1h': 'H1', '4h': 'H4' }[t] as any);
