import { MarketDataService } from './services/market/market-data.service';
import { IndicatorService } from './services/indicator/indicator.service';
import { RegimeService } from './services/regime/regime.service';

const market = new MarketDataService();
const indicator = new IndicatorService();
const regime = new RegimeService();

for (const s of ['BTC-USDT', 'ETH-USDT', 'SOL-USDT', 'DOGE-USDT']) {
  await market.ingest(s, '1m');
  await market.ingest(s, '5m');
  await indicator.compute(s, '1m');
  await indicator.compute(s, '5m');
  await regime.compute(s);
}
console.log('Seed complete');
process.exit(0);
