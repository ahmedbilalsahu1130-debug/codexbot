import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { BacktestService } from '../services/backtest/backtest.service';
import { IndicatorService } from '../services/indicator/indicator.service';
import { MarketDataService } from '../services/market/market-data.service';
import { RegimeService } from '../services/regime/regime.service';
import { SimulatorService } from '../services/simulator/simulator.service';
import { StrategyService } from '../services/strategy/strategy.service';

const sim = new SimulatorService();
const strat = new StrategyService(sim);
const market = new MarketDataService();
const indicator = new IndicatorService();
const regime = new RegimeService();
const backtest = new BacktestService();

export const registerApi = async (app: FastifyInstance) => {
  app.get('/api/symbols', async () => prisma.symbol.findMany());
  app.get('/api/market/candles', async (req) => {
    const q = z.object({ symbol: z.string(), tf: z.string().default('M5') }).parse((req as any).query);
    return prisma.candle.findMany({ where: { symbol: { unified: q.symbol }, timeframe: q.tf as any }, orderBy: { timestamp: 'asc' }, take: 500 });
  });
  app.get('/api/indicators', async (req) => {
    const q = z.object({ symbol: z.string(), tf: z.string().default('M5') }).parse((req as any).query);
    return prisma.indicator.findMany({ where: { symbol: { unified: q.symbol }, timeframe: q.tf as any }, orderBy: { timestamp: 'asc' }, take: 500 });
  });
  app.get('/api/regime/current', async (req) => regime.current(z.object({ symbol: z.string() }).parse((req as any).query).symbol));
  app.get('/api/signals', async (req) => prisma.signal.findMany({ where: { symbol: { unified: z.object({ symbol: z.string().optional() }).parse((req as any).query).symbol } }, orderBy: { timestamp: 'desc' }, take: 200 }));
  app.get('/api/positions', async () => prisma.position.findMany({ orderBy: { openTime: 'desc' }, take: 100 }));
  app.get('/api/orders', async () => prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }));
  app.get('/api/account', async () => prisma.accountSnapshot.findFirst({ orderBy: { timestamp: 'desc' } }));
  app.post('/api/sim/start', async () => sim.start());
  app.post('/api/sim/stop', async () => sim.stop());
  app.post('/api/sim/reset', async () => sim.reset());
  app.post('/api/settings', async (req) => req.body);
  app.post('/api/backtest/run', async (req) => {
    const b = z.object({ symbols: z.array(z.string()), from: z.string(), to: z.string() }).parse(req.body);
    return backtest.run(b.symbols, new Date(b.from), new Date(b.to));
  });

  app.post('/api/sync', async () => {
    for (const s of ['BTC-USDT', 'ETH-USDT', 'SOL-USDT']) {
      await market.ingest(s, '1m');
      await market.ingest(s, '5m');
      await indicator.compute(s, '1m');
      await indicator.compute(s, '5m');
      await regime.compute(s);
      await strat.tick(s);
    }
    return { ok: true };
  });
};
