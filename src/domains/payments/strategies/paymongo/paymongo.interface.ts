import { Payment } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface PaymentIntentResult {
  id: string; // provider's payment intent ID
  paymentIntentId: string; // same as above for link compatibility
  checkoutUrl?: string; // for payment links
  clientSecret?: string; // for in-app payment intents
}

export interface PaymentProviderAdapter {
  /**
   * Create a payment link for a Payment object
   * @param payment - Prisma Payment model
   */
  createPaymentLink(payment: Payment): Promise<PaymentIntentResult>;

  /**
   * Create a payment intent for in-app payments
   * @param payment - Prisma Payment model
   */
  createPaymentIntent(payment: Payment): Promise<PaymentIntentResult>;

  /**
   * Refund a payment
   * @param payment - Prisma Payment model
   * @param refundAmount - amount to refund
   * @param reason - optional reason
   */
  refundPayment(
    payment: Payment,
    refundAmount: Decimal,
    reason?: string,
  ): Promise<any>;

  /**
   * Retrieve a payment intent by ID
   * @param intentId
   */
  retrievePaymentIntent(intentId: string): Promise<any>;

  /**
   * Optional: handle provider webhook
   */
  handleWebhook?(
    payload: any,
  ): Promise<{ paymentIntentId: string; eventType: string }>;
}
