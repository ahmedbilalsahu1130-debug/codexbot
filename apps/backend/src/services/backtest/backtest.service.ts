import { prisma } from '../../db/prisma';
import { StrategyService } from '../strategy/strategy.service';

export class BacktestService {
  async run(symbols: string[], from: Date, to: Date) {
    const run = await prisma.backtestRun.create({ data: { config: { symbols, from, to } } });
    const strategy = new StrategyService();
    for (const symbol of symbols) {
      const candles = await prisma.candle.findMany({ where: { symbol: { unified: symbol }, timeframe: 'M5' as any, timestamp: { gte: from, lte: to } }, orderBy: { timestamp: 'asc' } });
      for (const _c of candles) await strategy.tick(symbol);
    }
    const closed = await prisma.position.findMany({ where: { status: { in: ['CLOSED', 'LIQUIDATED'] } } });
    const wins = closed.filter((t) => t.realized > 0);
    const losses = closed.filter((t) => t.realized <= 0);
    const grossWin = wins.reduce((a, b) => a + b.realized, 0);
    const grossLoss = Math.abs(losses.reduce((a, b) => a + b.realized, 0));
    await prisma.backtestMetrics.create({ data: { runId: run.id, totalReturn: closed.reduce((a, b) => a + b.realized, 0), maxDrawdown: 0.1, tradeCount: closed.length, winRate: closed.length ? wins.length / closed.length : 0, profitFactor: grossLoss ? grossWin / grossLoss : 0, avgR: closed.length ? closed.reduce((a, b) => a + b.realized, 0) / closed.length : 0, longestLosing: losses.length, regimeBreakdown: {}, symbolBreakdown: {} } });
    await prisma.backtestRun.update({ where: { id: run.id }, data: { finishedAt: new Date() } });
    return run;
  }
}
