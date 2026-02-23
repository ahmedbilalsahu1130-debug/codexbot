import type { FastifyInstance } from 'fastify';
import { prisma } from '../../db/prisma';

export const registerRealtime = async (app: FastifyInstance) => {
  app.get('/ws', { websocket: true }, (conn) => {
    const timer = setInterval(async () => {
      const [account, events, positions] = await Promise.all([
        prisma.accountSnapshot.findFirst({ orderBy: { timestamp: 'desc' } }),
        prisma.auditEvent.findMany({ orderBy: { timestamp: 'desc' }, take: 10 }),
        prisma.position.findMany({ where: { status: 'OPEN' } })
      ]);
      conn.send(JSON.stringify({ type: 'snapshot', account, events, positions }));
    }, 2000);
    conn.on('close', () => clearInterval(timer));
  });
};
