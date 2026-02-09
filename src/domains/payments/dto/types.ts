export interface PaymongoWebhookRef {
  id: string;
  type?: string;
}

export interface PaymongoWebhookAttributes {
  event_type: string;

  // May be string OR expanded object
  payment_intent?: string | PaymongoWebhookRef;

  // Add this 👇
  payment_link?: string | PaymongoWebhookRef;
}

export interface PaymongoWebhookData {
  id: string;
  type: string;
  attributes: PaymongoWebhookAttributes;
}

export interface PaymongoWebhookPayload {
  data: PaymongoWebhookData;
}
