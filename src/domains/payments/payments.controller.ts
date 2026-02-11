import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { createHmac } from 'crypto';
import { ConfigService } from 'src/config/config.service';
import { Request } from 'express';
import { PaymongoWebhookPayload } from './dto/types';

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
    @Req() req: Request,
    @Headers('paymongo-signature') signature: string,
  ) {
    // Use the attached rawBody
    const rawBody = (req as any).rawBody as Buffer;

    if (!rawBody || !Buffer.isBuffer(rawBody)) {
      console.error('Webhook did not receive raw Buffer', req.body);
      return { ignored: true };
    }

    const verified = this.verifyPaymongoSignature(rawBody, signature);
    if (!verified) {
      console.error('Webhook signature invalid!', { signature });
      return { ignored: true };
    }

    const payload = JSON.parse(
      rawBody.toString('utf8'),
    ) as PaymongoWebhookPayload;
    return this.paymentsService.handlePaymongoWebhook(payload);
  }

  private verifyPaymongoSignature(
    rawBody: Buffer,
    signatureHeader: string,
  ): boolean {
    if (!this.paymongoSecret)
      throw new Error('PAYMONGO_WEBHOOK_SECRET not set');

    // Split header: t=...,te=...
    const signatureParts = signatureHeader.split(',');
    const timestampPart = signatureParts.find((s) => s.startsWith('t='));
    const hashPart = signatureParts.find((s) => s.startsWith('te='));
    if (!timestampPart || !hashPart) return false;

    const timestamp = timestampPart.replace('t=', '');
    const expectedHash = hashPart.replace('te=', '');

    // Construct the payload for HMAC
    // PayMongo uses: `${timestamp}.${rawBody as string}`
    const payloadToHash = Buffer.concat([
      Buffer.from(`${timestamp}.`),
      rawBody,
    ]);

    const hmac = createHmac('sha256', this.paymongoSecret);
    hmac.update(payloadToHash);
    const computedHash = hmac.digest('hex');

    return computedHash === expectedHash;
  }
}
