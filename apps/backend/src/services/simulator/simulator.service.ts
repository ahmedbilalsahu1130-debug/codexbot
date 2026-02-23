import { Direction, EngineType, leverageFromSigmaNorm } from '@repo/shared';
import { prisma } from '../../db/prisma';

type SimOrder = { symbol: string; side: Direction; qty: number; price: number; type: 'LIMIT' | 'MARKET'; leverage: number; engine: EngineType };

export class SimulatorService {
  running = false;
  equity = 100000;
  peak = 100000;
  usedMargin = 0;
  drawdown = 0;
  researchOnly = false;

  async start() { this.running = true; }
  async stop() { this.running = false; }
  async reset() {
    this.running = false;
    this.equity = this.peak = 100000;
    this.usedMargin = this.drawdown = 0;
    await prisma.order.deleteMany();
    await prisma.position.deleteMany();
    await prisma.fill.deleteMany();
  }

  async placeOrder(input: SimOrder) {
    const symbol = await prisma.symbol.findUnique({ where: { unified: input.symbol } });
    if (!symbol) throw new Error('symbol missing');
    const order = await prisma.order.create({ data: { symbolId: symbol.id, side: input.side as any, type: input.type as any, qty: input.qty, price: input.price, status: 'NEW', postOnly: input.type === 'LIMIT', meta: { engine: input.engine } } });

    const fillRatio = input.type === 'MARKET' ? 1 : Math.max(0.2, Math.min(0.9, Math.random()));
    const fillQty = input.qty * fillRatio;
    const slippage = input.type === 'MARKET' ? input.price * 0.0008 : input.price * 0.0001;
    const feeRate = input.type === 'MARKET' ? 0.0005 : 0.0002;
    const fillPrice = input.side === 'LONG' ? input.price + slippage : input.price - slippage;
    const fee = fillPrice * fillQty * feeRate;
    await prisma.fill.create({ data: { orderId: order.id, price: fillPrice, qty: fillQty, fee } });
    await prisma.order.update({ where: { id: order.id }, data: { status: fillRatio >= 0.99 ? 'FILLED' : 'PARTIALLY_FILLED', fee, slippage } });

    const margin = (fillPrice * fillQty) / input.leverage;
    this.usedMargin += margin;
    await prisma.position.create({ data: { symbolId: symbol.id, openTime: new Date(), side: input.side as any, entry: fillPrice, qty: fillQty, leverage: input.leverage, stop: input.side === 'LONG' ? fillPrice * 0.99 : fillPrice * 1.01, status: 'OPEN' } });
    await this.snapshot();
    return order;
  }

  calcLeverage(sigmaNorm: number, engine: EngineType, lowLiq = false) {
    if (engine === 'BREAKOUT') return leverageFromSigmaNorm(sigmaNorm, lowLiq ? 100 : 180, lowLiq ? [60, 140] : [120, 200], 125);
    return leverageFromSigmaNorm(sigmaNorm, lowLiq ? 60 : 90, lowLiq ? [20, 70] : [40, 120], 100);
  }

  async markToMarket(symbol: string, price: number) {
    const open = await prisma.position.findMany({ where: { status: 'OPEN', symbol: { unified: symbol } }, include: { symbol: true } });
    let unrealized = 0;
    for (const p of open) {
      const move = p.side === 'LONG' ? (price - p.entry) / p.entry : (p.entry - price) / p.entry;
      const pnl = move * p.leverage * (p.entry * p.qty / p.leverage);
      unrealized += pnl;
      if ((p.side === 'LONG' && price <= p.stop) || (p.side === 'SHORT' && price >= p.stop)) {
        await prisma.position.update({ where: { id: p.id }, data: { status: 'CLOSED', closeTime: new Date(), realized: pnl } });
        this.equity += pnl;
      }
    }
    this.peak = Math.max(this.peak, this.equity);
    this.drawdown = (this.peak - this.equity) / this.peak;
    if (this.drawdown > 0.2) this.researchOnly = true;
    await this.snapshot(unrealized);
  }

  async snapshot(unrealized = 0) {
    await prisma.accountSnapshot.create({ data: { equity: this.equity, drawdown: this.drawdown, usedMargin: this.usedMargin, unrealized, researchMode: this.researchOnly } });
  }
}
