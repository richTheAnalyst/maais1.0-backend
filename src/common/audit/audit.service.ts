import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    userId: string;
    action: AuditAction;
    entity: string;
    entityId: string;
    payload?: Record<string, any>;
    ipAddress?: string;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          payload: params.payload ?? {},
          ipAddress: params.ipAddress,
        },
      });
    } catch (err) {
      // Never let audit logging crash the main operation
      console.error('[AuditService] Failed to write audit log:', err);
    }
  }
}