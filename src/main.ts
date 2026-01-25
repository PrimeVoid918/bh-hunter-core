import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';
import ip from 'ip';
import { join } from 'path';
import express from 'express';
import { ConfigService } from './config/config.service';
import { resolve } from 'path';
import { ExpressAdapter } from '@nestjs/platform-express';
import { existsSync } from 'fs';
import { generateDiagram } from './spelunk';

async function bootstrap() {
  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  const configService = app.get(ConfigService);

  const publicPath =
    process.env.NODE_ENV !== 'production'
      ? join(process.cwd(), 'public')
      : join(__dirname, '..', 'public');

  server.use(express.static(publicPath));

  app.use(
    '/media/public', //* actual web url path not the physical one
    express.static(resolve(process.cwd(), configService.mediaPaths.public)),
  );
  app.use(
    // TODO: tirm this into a guarded route
    '/media/private', //* actual web url path not the physical one
    express.static(resolve(process.cwd(), configService.mediaPaths.private)),
  );
  const swagConfig = new DocumentBuilder()
    .setTitle('API')
    .setDescription('BH Api')
    .setVersion('1.0')
    // .addTag('api')
    .build();

  const document = SwaggerModule.createDocument(app, swagConfig);
  const theme = new SwaggerTheme();
  const options = {
    explorer: true,
    customCss: theme.getBuffer(SwaggerThemeNameEnum.DARK),
  };

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  SwaggerModule.setup('docs', app, document, options);

  await generateDiagram();

  app.enableCors({
    origin: [
      'http://10.122.68.117:5173', // your Vite dev frontend IP + port
      process.env.NODE_ENV !== 'production'
        ? 'http://localhost:5173'
        : 'https://bhhph.online',
    ],
    credentials: true, // if you use cookies/auth headers
  });

  // React Fall back
  server.get(/^\/(?!api).*/, (req: express.Request, res: express.Response) => {
    const indexPath = join(publicPath, 'index.html');
    if (existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Not found');
    }
  });

  const port = 3000;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const localIp: string = ip.address(); // uselless kay maka listen ra diay ka sa tanan port using 0.0.0.0
  console.log(`🚀 Server running at http://${localIp}:${port}`);

  await app.listen(port, '0.0.0.0');
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
