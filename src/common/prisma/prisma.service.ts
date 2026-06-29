import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaNeon({
      connectionString: process.env.DATABASE_URL!,
    });
    super({
      adapter,
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('cleanDatabase() cannot be called in production!');
    }
    const tables = [
      'audit_logs', 'grade_corrections', 'grade_entries',
      'attendance_records', 'promotion_records', 'report_cards',
      'transcripts', 'notifications', 'refresh_tokens',
      'teaching_assignments', 'student_parent_links',
      'student_profiles', 'parent_profiles', 'staff_profiles', 'users',
    ];
    for (const t of tables) {
      await this.$executeRawUnsafe(`TRUNCATE TABLE "${t}" CASCADE`);
    }
  }
}