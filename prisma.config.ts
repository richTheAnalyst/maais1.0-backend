import { defineConfig } from 'prisma/config';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as dotenv from 'dotenv';

dotenv.config();

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL!;

export default defineConfig({
  earlyAccess: true,
  schema: 'prisma/schema.prisma',
  datasource: {
    url: connectionString,
  },
  migrations: {
      seed: 'ts-node ./prisma/seed.ts',
    },
  migrate: {
    adapter: async () => {
      return new PrismaNeon({ connectionString });
    },
  },
});