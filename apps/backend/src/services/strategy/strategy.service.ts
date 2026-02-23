import { breakoutEligible, mapRegimeToEngine, stopPct } from '@repo/shared';
import { prisma } from '../../db/prisma';
import { AuditService } from '../audit/audit.service';
import { RegimeService } from '../regime/regime.service';
import { SimulatorService } from '../simulator/simulator.service';

export class StrategyService {
  cooldown = new Map<string, number>();
  constructor(private sim = new SimulatorService(), private regime = new RegimeService(), private audit = new AuditService()) {}

  async tick(symbol: string) {
    const ind = await prisma.indicator.findFirst({ where: { symbol: { unified: symbol }, timeframe: 'M5' as any }, orderBy: { timestamp: 'desc' } });
    const price = await prisma.candle.findFirst({ where: { symbol: { unified: symbol }, timeframe: 'M1' as any }, orderBy: { timestamp: 'desc' } });
    if (!ind || !price || this.sim.researchOnly) return;

    const r = await this.regime.current(symbol);
    if (!r) return;
    const engines = mapRegimeToEngine({ label: r.label as any, reasons: [], defensive: r.label === 'EXPANSION_CHAOS' });
    if (!engines.length) {
      await this.audit.log('STRATEGY', 'DEFENSIVE_SKIP', 'No engine enabled in defensive regime', { regime: r.label }, symbol);
      return;
    }

    const cd = this.cooldown.get(symbol) ?? 0;
    if (Date.now() < cd) return;

    for (const engine of engines) {
      const sigmaNorm = ind.sigmaNorm ?? 1;
      const lev = this.sim.calcLeverage(sigmaNorm, engine as any, false);
      const accepted = engine !== 'BREAKOUT' || breakoutEligible({ symbol, timeframe: '5m', timestamp: +ind.timestamp, volumePercentile: ind.volumePctile ?? undefined, volPercentile: ind.volPctile ?? undefined }, false);
      await prisma.signal.create({ data: { symbolId: (await prisma.symbol.findUniqueOrThrow({ where: { unified: symbol } })).id, timestamp: new Date(), engine: engine as any, direction: (ind.ema50 ?? 0) > (ind.ema200 ?? 0) ? 'LONG' : 'SHORT', accepted, regime: r.label as any, params: { lev, sigmaNorm }, decisionPath: { cooldown: cd } } });
      if (!accepted) {
        await this.audit.log('STRATEGY', 'REJECT_FILTER', 'Signal rejected by eligibility', { engine }, symbol);
        continue;
      }
      const side = (ind.ema50 ?? 0) > (ind.ema200 ?? 0) ? 'LONG' : 'SHORT';
      await this.sim.placeOrder({ symbol, side, qty: 0.01, price: price.close, type: 'LIMIT', leverage: lev, engine: engine as any });
      const sp = stopPct(ind.atrPct ?? 0.2, engine === 'BREAKOUT' ? 1.2 : 1.8);
      await this.audit.log('STRATEGY', 'ORDER_PLACED', 'Order placed', { engine, side, leverage: lev, stopPct: sp }, symbol);
      this.cooldown.set(symbol, Date.now() + (engine === 'BREAKOUT' ? 30 : 120) * 60_000);
    }
  }
}
