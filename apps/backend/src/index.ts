import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { env } from './config/env';
import { registerApi } from './routes/api';
import { registerRealtime } from './services/ws/realtime';

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });
await app.register(websocket);
await registerApi(app);
await registerRealtime(app);

app.listen({ port: env.PORT, host: '0.0.0.0' }).then(() => {
  app.log.info(`Backend on ${env.PORT}`);
});
