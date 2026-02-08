export interface PaymongoWebhookPaymentIntentRef {
  id: string;
  type?: string;
}

export interface PaymongoWebhookAttributes {
  event_type: string;
  payment_intent: string | PaymongoWebhookPaymentIntentRef;
}

export interface PaymongoWebhookData {
  id: string;
  type: string;
  attributes: PaymongoWebhookAttributes;
}

export interface PaymongoWebhookPayload {
  data: PaymongoWebhookData;
}
