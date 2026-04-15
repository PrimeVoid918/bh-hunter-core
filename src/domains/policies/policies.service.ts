import { Injectable } from '@nestjs/common';
import { marked } from 'marked';
import * as fs from 'fs';
import * as path from 'path';

import TermsOfService from './data/policies.t_o_s';
import OwnerLegitimacyConsent from './data/policies.owner-legitimacy-consent';
import TenantLegitimacyConsent from './data/policies.tenant-legitimacy-consent';
import PrivacyPolicy from './data/policies.privacy';
import BookingRefundPolicy from './data/policies.booking.refund';
import SubscriptionPolicy from './data/policies.subscription.refund';

@Injectable()
export class PoliciesService {
  private template: string;

  constructor() {
    const templatePath = path.join(
      process.cwd(),
      'src',
      'domains',
      'policies',
      'template',
      'policies.template.html',
    );

    this.template = fs.readFileSync(templatePath, 'utf8');
  }

  getTerms() {
    const html = this.renderMarkdown(TermsOfService);
    return this.injectTemplate(html, 'Terms and Conditions');
    // return TermsOfService; // Returns raw string
  }

  getPrivacy() {
    const html = this.renderMarkdown(
      PrivacyPolicy || '# Privacy Policy\nComing soon.',
    );
    return this.injectTemplate(html, 'Privacy Policy');
  }

  getUserLegitimacyConsentPolicies(type: 'owner' | 'tenant') {
    switch (type) {
      case 'owner':
        return this.getOwnerConsent();
      case 'tenant':
        return this.getTenantConsent();
      default:
        return this.renderMarkdown(
          '# LegitimacyConsent Policy\n404 Not Found.',
        );
    }
  }

  getRefundPolicies(type: 'booking' | 'subscription') {
    switch (type) {
      case 'booking':
        return this.getBookingRefundPolicy();
      case 'subscription':
        return this.getSubscriptionRefundPolicy();
      default:
        return this.renderMarkdown('# Refund Policy\n404 Not Found.');
    }
  }

  private getOwnerConsent() {
    const html = this.renderMarkdown(OwnerLegitimacyConsent);
    return this.injectTemplate(html, 'Owner Legitimacy Consent');
  }

  private getTenantConsent() {
    const html = this.renderMarkdown(TenantLegitimacyConsent);
    return this.injectTemplate(html, 'Owner Legitimacy Consent');
  }

  private getBookingRefundPolicy() {
    const html = this.renderMarkdown(
      BookingRefundPolicy || '# Refund Policy\nComing soon.',
    );
    return this.injectTemplate(html, 'Booking Refund Policy');
  }

  private getSubscriptionRefundPolicy() {
    const html = this.renderMarkdown(
      SubscriptionPolicy || '# Refund Policy\nComing soon.',
    );
    return this.injectTemplate(html, 'Subscription Refund Policy');
  }

  private renderMarkdown(markdown: string): string {
    const result = marked.parse(markdown);

    if (typeof result === 'string') {
      return result;
    }

    throw new Error('Marked returned async result unexpectedly');
  }

  private injectTemplate(content: string, title: string) {
    return this.template
      .replace('{{title}}', title)
      .replace('{{content}}', content);
  }
}
