// src/modules/payments/strategies/paymongo/paymongo.interface.ts
import { Payment, PaymentStatus } from '@prisma/client';

export interface PaymentIntentResult {
  id: string; // provider's payment intent ID
  checkoutUrl?: string; // optional, only for payment links
  clientSecret?: string; // optional, only for payment intents
}

export interface PaymentProviderAdapter {
  /**
   * Create a payment intent for a given Payment object
   * @param payment - Prisma Payment model
   * @returns provider-specific payment intent info
   */
  createPaymentLink(payment: Payment): Promise<PaymentIntentResult>;

  createPaymentIntent(payment: Payment): Promise<PaymentIntentResult>;

  /**
   * Refund a payment
   * @param payment - Prisma Payment model
   * @param reason - optional refund reason
   * @returns provider-specific refund response
   */
  refundPayment(payment: Payment, reason?: string): Promise<any>;

  retrievePaymentIntent(intentId: string): Promise<any>;

  /**
   * Optionally handle webhook payloads from provider
   * @param payload - raw provider webhook payload
   * @returns normalized object with event type and payment intent ID
   */
  handleWebhook?(
    payload: any,
  ): Promise<{ paymentIntentId: string; eventType: string }>;
}
