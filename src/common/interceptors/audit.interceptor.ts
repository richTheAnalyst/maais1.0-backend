import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';
import { Reflector } from '@nestjs/core';

export const AUDIT_KEY = 'audit_meta';
export const Audit =
  (action: AuditAction, entity: string) =>
  (target: any, key: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(AUDIT_KEY, { action, entity }, descriptor.value);
    return descriptor;
  };

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private prisma: PrismaService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const meta = this.reflector.get(AUDIT_KEY, context.getHandler());

    if (!meta || !user) return next.handle();

    return next.handle().pipe(
      tap(async (result) => {
        try {
          await this.prisma.auditLog.create({
            data: {
              userId: user.id,
              action: meta.action,
              entity: meta.entity,
              entityId: result?.id || request.params?.id || 'unknown',
              payload: result ? JSON.parse(JSON.stringify(result)) : null,
              ipAddress: request.ip,
              userAgent: request.headers['user-agent'],
            },
          });
        } catch {
          // Audit failure should never break the request
        }
      }),
    );
  }
}
