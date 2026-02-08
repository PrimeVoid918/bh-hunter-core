import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { createHmac } from 'crypto';
import { ConfigService } from 'src/config/config.service';

@Controller('payments')
export class PaymentsController {
  private readonly paymongoSecret;
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService,
  ) {
    this.paymongoSecret = this.configService.PAYMONGO_WEBHOOK_SECRET;
  }

  @Post('webhook/paymongo')
  async handlePaymongoWebhook(
    @Body() payload: any,
    @Headers('paymongo-signature') signature: string,
  ) {
    // Verify signature first
    const verified = this.verifyPaymongoSignature(payload, signature);
    if (!verified) {
      throw new BadRequestException('Invalid PayMongo webhook signature');
    }

    return this.paymentsService.handlePaymongoWebhook(payload);
  }

  private verifyPaymongoSignature(payload: any, signature: string): boolean {
    if (!this.paymongoSecret)
      throw new Error('PAYMONGO_WEBHOOK_SECRET not set in .env');

    const payloadString = JSON.stringify(payload);
    const hmac = createHmac('sha256', this.paymongoSecret as string);
    hmac.update(payloadString, 'utf8');
    const expectedSignature = hmac.digest('hex');

    return expectedSignature === signature;
  }
}
