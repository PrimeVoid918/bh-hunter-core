import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';
import ip from 'ip';
import { join, resolve } from 'path';
import express from 'express';
import { ConfigService } from './config/config.service';
import { existsSync } from 'fs';
import { ExpressAdapter } from '@nestjs/platform-express';
import { generateDiagram } from './spelunk';
import bodyParser from 'body-parser';

async function bootstrap() {
  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  const configService = app.get(ConfigService);

  const publicPath =
    process.env.NODE_ENV !== 'production'
      ? join(process.cwd(), 'public')
      : join(__dirname, '..', 'public');

  // 1️⃣ Global JSON parser for all endpoints

  // 2️⃣ Webhook-specific JSON parser to capture rawBody
  server.use(
    '/api/payments/webhook/paymongo',
    bodyParser.raw({
      type: 'application/json',
      verify: (req, res, buf) => {
        (req as any).rawBody = buf; // attach raw buffer to req.rawBody
      },
    }),
  );

  server.use(express.json());

  // Static file serving
  server.use(express.static(publicPath));
  server.use(
    '/media/public',
    express.static(resolve(process.cwd(), configService.mediaPaths.public)),
  );
  server.use(
    '/media/private',
    express.static(resolve(process.cwd(), configService.mediaPaths.private)),
  );

  // Swagger setup
  const swagConfig = new DocumentBuilder()
    .setTitle('API')
    .setDescription('BH Api')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, swagConfig);
  const theme = new SwaggerTheme();
  const options = {
    explorer: true,
    customCss: theme.getBuffer(SwaggerThemeNameEnum.DARK),
  };
  SwaggerModule.setup('docs', app, document, options);

  // Global prefix & validation
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  await generateDiagram();

  // CORS
  app.enableCors({
    origin: [
      'http://10.122.68.117:5173',
      process.env.NODE_ENV !== 'production'
        ? 'http://localhost:5173'
        : 'https://bhhph.online',
    ],
    credentials: true,
  });

  // React SPA fallback
  server.get(/^\/(?!api).*/, (req: express.Request, res: express.Response) => {
    const indexPath = join(publicPath, 'index.html');
    if (existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Not found');
    }
  });

  const port = 3000;
  const localIp: string = ip.address();
  console.log(`🚀 Server running at http://${localIp}:${port}`);

  await app.listen(port, '0.0.0.0');
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
