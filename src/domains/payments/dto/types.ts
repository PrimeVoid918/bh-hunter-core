export interface PaymongoWebhookRef {
  id: string;
  type?: string;
}

/**
 * Attributes inside the actual payment resource
 */
export interface PaymongoPaymentResourceAttributes {
  payment_intent_id?: string;
  payment_link_id?: string;

  // if expanded
  payment_intent?: PaymongoWebhookRef;
  payment_link?: PaymongoWebhookRef;

  // allow unknown extra fields safely
  [key: string]: any;
}

/**
 * The resource inside attributes.data
 */
export interface PaymongoWebhookResourceData {
  id: string;
  type: string; // e.g. "payment"
  attributes: PaymongoPaymentResourceAttributes;
}

/**
 * Event attributes (top level attributes)
 */
export interface PaymongoWebhookEventAttributes {
  type: string; // e.g. "payment.paid"
  livemode: boolean;
  data: PaymongoWebhookResourceData;

  previous_data?: Record<string, any>;
  pending_webhooks?: number;
  created_at?: number;
  updated_at?: number;
}

/**
 * Top-level webhook payload
 */
export interface PaymongoWebhookPayload {
  data: {
    id: string; // evt_...
    type: string; // "event"
    attributes: PaymongoWebhookEventAttributes;
  };
}
