import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: [
      'https://maais-frontend.vercel.app',
      'http://localhost:3000', // optional, for local development
      'http://localhost:5173', // if you use Vite
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // if you need to send cookies or auth headers
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('MAAIS API')
    .setDescription('Mando SHTS Academic Audit & Intervention System')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication & session management')
    .addTag('Users', 'User & profile management')
    .addTag('Academic Architect', 'Years, terms, subjects, classes')
    .addTag('Grading', 'Score entry, audit, smart remarks')
    .addTag('Reports', 'Report cards & transcripts')
    .addTag('Archive', 'The Vault & promotion cycle')
    .addTag('Comms', 'Notifications & communications')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🏫 MAAIS API running on http://localhost:${port}/api/v1`);
  console.log(`📖 Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
