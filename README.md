# Microstructure + Volatility Adaptive Futures Trading Framework (V2)

Monorepo implementing a production-style public-data futures research and paper trading framework.

## Stack
- Backend: Fastify + TypeScript + Prisma + PostgreSQL + WS streaming
- Frontend: Next.js App Router + Tailwind + Recharts + Framer Motion
- Shared package for deterministic quant math and regime/strategy logic

## Apps
- `apps/backend`: market ingestion (Binance/Bybit public), indicators, regimes, strategy engines, simulator, backtest API.
- `apps/frontend`: premium dark-mode dashboard, symbols, signals, backtest, settings, simulator control pages.
- `packages/shared`: formulas/types reused by live and backtest execution paths.

## Run
1. `docker compose up -d`
2. `pnpm install`
3. `pnpm prisma:generate`
4. `pnpm prisma:migrate --name init`
5. `pnpm seed`
6. `pnpm dev`

## Key formulas
- Returns: `r_t = ln(P_t/P_{t-1})`
- EWMA variance: `σ̂²_t = λσ̂²_{t-1} + (1-λ)r_t²`
- Volatility: `σ_t = sqrt(σ̂²_t)`, `σ%_t = 100*σ_t`
- Leverage mapping: `L_raw = L_base / sqrt(σ_norm,t)`, then clamp by engine band and exchange cap

## Implemented Modules
- Public market data adapters (Binance USD-M + Bybit)
- Indicator warehouse (ATR, EWMA variance, sigma norm, BB width, EMA stack, slope/volume percentiles)
- Regime engine and defensive mode
- Strategy engines and trade governor hooks
- Full simulator abstraction (orders, partial fills, fees, slippage, margin, drawdown throttles)
- Backtest runner sharing live strategy path
- Audit event logging and searchable API

## Endpoints
- `GET /api/symbols`
- `GET /api/market/candles?symbol=&tf=`
- `GET /api/indicators?symbol=&tf=`
- `GET /api/regime/current?symbol=`
- `GET /api/signals`
- `GET /api/positions`
- `GET /api/orders`
- `GET /api/account`
- `POST /api/sim/start|stop|reset`
- `POST /api/settings`
- `POST /api/backtest/run`
- `POST /api/sync` (ingest + compute + regime + strategy tick)
- `WS /ws` realtime account/positions/audit stream
