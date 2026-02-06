import { Injectable } from '@nestjs/common';
import { ConfigService } from 'src/config/config.service';

@Injectable()
export class PaymongoService {
  //! can return undefined? until tested
  constructor(private readonly configService: ConfigService) {}

  async createPaymentIntent(amount: number, currency: string) {
    const payload = {
      data: {
        attributes: {
          amount,
          currency,
          payment_method_allowed: ['gcash', 'card'],
          capture_type: 'automatic',
        },
      },
    };

    // you can mock axios call for now
    // return axios.post(`${this.apiBase}/payment_intents`, payload, { auth: { username: this.secretKey, password: '' } });

    // Mock response for testing without credentials
    return {
      id: 'pi_mock_123',
      attributes: {
        amount,
        currency,
        status: 'pending',
      },
    };
  }

  // Example: verify webhook signature
  verifyWebhookSignature(signature: string, payload: any): boolean {
    // For now just return true for local testing
    return true;
  }
}
