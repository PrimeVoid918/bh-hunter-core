import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { ConfigService as ConfigurationService } from '@nestjs/config';
import ip from 'ip';

@Injectable()
export class ConfigService {
  constructor(private readonly configService: ConfigurationService) {}

  get DATABASE_URL() {
    return this.configService.get<string>('DATABASE_URL');
  }

  get ENVIRONMENT() {
    return this.configService.get<string>('ENVIRONMENT');
  }

  get DOMAIN_URL() {
    const domainUrl =
      this.ENVIRONMENT === 'PRODUCTION'
        ? 'https://bhhph.online/'
        : 'http://' + ip.address() + ':3000/';
    return domainUrl;
  }

  get SECRET_KEY() {
    return this.configService.get<string>('SECRET_KEY');
  }

  get JWT_SECRET_KEY() {
    return this.configService.get<string>('JWT_SECRET_KEY');
  }

  get ALLOW_NO_JWT_SOCKET() {
    return this.configService.get<string>('ALLOW_NO_JWT_SOCKET');
  }

  get mediaPaths(): {
    public: string;
    private: string;
  } {
    const baseDir = this.configService.get<string>('MEDIA_DIR_PATH') || 'media';

    const cleanBaseDir = baseDir.startsWith('/')
      ? baseDir.slice(1) // remove leading slash
      : baseDir;

    return {
      public: join(cleanBaseDir, 'public'),
      private: join(cleanBaseDir, 'private'),
    };
  }
}
