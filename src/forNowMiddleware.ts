import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Create timestamp
    const now = new Date();

    // Format: hh:mm:ss
    const time = now.toTimeString().split(' ')[0];

    // Format: yyyy:mm:dd (Manual replacement to match your specific requirement)
    const date = now.toISOString().split('T')[0].replace(/-/g, ':');

    const timestamp = `${time} - ${date}`;

    console.log('----------------------------------------------------');
    console.log('Payload:', req.body);
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
    console.log('----------------------------------------------------');

    res.on('finish', () => {
      console.log(
        `[${timestamp}] ${req.method} ${req.originalUrl} ${res.statusCode}`,
      );
    });

    next();
  }
}
