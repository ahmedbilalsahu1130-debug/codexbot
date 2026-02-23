import { prisma } from '../../db/prisma';

export class AuditService {
  async log(category: string, code: string, message: string, payload?: unknown, symbol?: string) {
    return prisma.auditEvent.create({ data: { category, code, message, payload: payload as object | undefined, symbol } });
  }
}
