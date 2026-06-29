import { PrismaClient, AuditAction } from '@prisma/client';

export async function seedAudit(prisma: PrismaClient, userId: string) {
  const logs = [];
  const actions = [AuditAction.CREATE, AuditAction.UPDATE, AuditAction.DELETE, AuditAction.PROMOTE, AuditAction.GRADE_CORRECTION];

  for (let i = 0; i < 40; i++) {
    const log = await prisma.auditLog.create({
      data: {
        userId,
        action: actions[i % actions.length],
        entity: 'GradeEntry',
        entityId: 'some-uuid',
        payload: { info: 'Seeded audit log' },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });
    logs.push(log);
  }

  console.log(`✅ ${logs.length} Audit Logs seeded`);
  return logs;
}
