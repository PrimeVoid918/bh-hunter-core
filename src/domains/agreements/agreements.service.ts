import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { IDatabaseService } from 'src/infrastructure/database/database.interface';
import { AgreementPreviewDto, CreateBookingAgreementDto } from './dto/dto';
import { DBClient } from 'src/infrastructure/image/types/types';
import { marked } from 'marked';

@Injectable()
export class AgreementsService {
  constructor(
    @Inject('IDatabaseService')
    private readonly database: IDatabaseService,
  ) {}

  private get prisma() {
    return this.database.getClient();
  }

  async getAgreementReviewInfo(bookingId: number) {
    const agreement = await this.prisma.bookingAgreement.findUnique({
      where: { bookingId },
    });

    if (!agreement) {
      throw new NotFoundException('Booking agreement not found');
    }

    const currentRules = await this.prisma.boardingHouseRule.findMany({
      where: {
        boardingHouseId: agreement.boardingHouseId,
        isActive: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    const currentTermsVersion = this.resolveTermsVersion(currentRules);
    const acceptedTermsVersion = agreement.termsVersion;

    const hasNewRules = currentTermsVersion !== acceptedTermsVersion;

    return {
      bookingId,
      agreementId: agreement.id,
      agreementStatus: agreement.status,
      acceptedTermsVersion,
      currentTermsVersion,
      hasNewRules,
      tenantAcceptedAt: agreement.tenantAcceptedAt,
      pdfUrl: agreement.pdfUrl,
      htmlUrl: `/api/agreements/bookings/${bookingId}/html`,
      currentRules: currentRules.map((rule) => ({
        id: rule.id,
        title: rule.title,
        content: rule.content,
        isRequired: rule.isRequired,
        version: rule.version,
      })),
      message: hasNewRules
        ? 'The boarding house rules have been updated after this booking agreement was accepted. The saved agreement still contains the original accepted rules.'
        : 'The accepted agreement is up to date with the current active rules.',
    };
  }

  async renderAgreementHtml(bookingId: number) {
    const agreement = await this.prisma.bookingAgreement.findUnique({
      where: { bookingId },
    });

    if (!agreement) {
      throw new NotFoundException('Booking agreement not found');
    }

    return this.buildAgreementHtml(agreement.snapshot as Record<string, any>);
  }

  async getPreview(dto: AgreementPreviewDto) {
    const prisma = this.prisma;
    const occupantsCount = dto.occupantsCount ?? 1;

    if (!dto.roomId || !dto.tenantId) {
      throw new BadRequestException('roomId and tenantId are required');
    }

    if (!dto.checkInDate || !dto.checkOutDate) {
      throw new BadRequestException(
        'checkInDate and checkOutDate are required',
      );
    }

    const [room, tenant] = await Promise.all([
      prisma.room.findFirst({
        where: {
          id: dto.roomId,
          isDeleted: false,
        },
        include: {
          boardingHouse: {
            include: {
              owner: true,
            },
          },
        },
      }),
      prisma.tenant.findFirst({
        where: {
          id: dto.tenantId,
          isDeleted: false,
        },
      }),
    ]);

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const rules = await prisma.boardingHouseRule.findMany({
      where: {
        boardingHouseId: room.boardingHouseId,
        isActive: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    const roomPrice = Number(room.price);
    const totalAmount = roomPrice * occupantsCount;

    return {
      roomId: room.id,
      tenantId: tenant.id,
      boardingHouseId: room.boardingHouseId,
      ownerId: room.boardingHouse.ownerId,
      preview: {
        tenantName: `${tenant.firstname ?? ''} ${tenant.lastname ?? ''}`.trim(),
        ownerName:
          `${room.boardingHouse.owner.firstname ?? ''} ${room.boardingHouse.owner.lastname ?? ''}`.trim(),
        boardingHouseName: room.boardingHouse.name,
        boardingHouseAddress: room.boardingHouse.address,
        roomNumber: room.roomNumber,
        roomPrice,
        occupantsCount,
        totalAmount,
        checkInDate: new Date(dto.checkInDate),
        checkOutDate: new Date(dto.checkOutDate),
      },
      rules,
      termsVersion: this.resolveTermsVersion(rules),
      disclaimer:
        'This agreement records the initial booking arrangement and advance payment acknowledgment only.',
    };
  }

  async createForBooking(bookingId: number, body?: CreateBookingAgreementDto) {
    return this.createForBookingWithClient(this.prisma, bookingId, body);
  }

  async createAcceptedForBookingTx(
    tx: DBClient,
    bookingId: number,
    termsVersion?: string,
  ) {
    return this.createForBookingWithClient(tx, bookingId, {
      tenantAccepted: true,
      termsVersion,
    });
  }

  private async createForBookingWithClient(
    prisma: DBClient,
    bookingId: number,
    body?: CreateBookingAgreementDto,
  ) {
    const tenantAccepted = body?.tenantAccepted === true;

    // Since your current booking flow requires agreement before submit,
    // reject creating agreement without acceptance.
    if (!tenantAccepted) {
      throw new BadRequestException(
        'Tenant must accept the boarding house rules before submitting a booking request.',
      );
    }

    const existing = await prisma.bookingAgreement.findUnique({
      where: { bookingId },
    });

    // Important: do not overwrite snapshot after it exists.
    if (existing) {
      return existing;
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        isDeleted: false,
      },
      include: {
        tenant: true,
        room: true,
        boardingHouse: {
          include: {
            owner: true,
          },
        },
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const rules = await prisma.boardingHouseRule.findMany({
      where: {
        boardingHouseId: booking.boardingHouseId,
        isActive: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    const currentTermsVersion = this.resolveTermsVersion(rules);

    if (body?.termsVersion && body.termsVersion !== currentTermsVersion) {
      throw new ConflictException(
        'Boarding house rules changed. Please refresh the agreement preview and accept again.',
      );
    }

    const snapshot = this.buildSnapshot(booking, rules);
    const acceptedAt = new Date();

    return prisma.bookingAgreement.create({
      data: {
        bookingId,
        tenantId: booking.tenantId,
        ownerId: booking.boardingHouse.ownerId,
        boardingHouseId: booking.boardingHouseId,
        roomId: booking.roomId,
        snapshot,
        termsVersion: currentTermsVersion,
        status: 'ACCEPTED',
        tenantAcceptedAt: acceptedAt,
      },
    });
  }

  async getByBooking(bookingId: number) {
    const agreement = await this.prisma.bookingAgreement.findUnique({
      where: {
        bookingId,
      },
    });

    if (!agreement) {
      throw new NotFoundException('Booking agreement not found');
    }

    return agreement;
  }

  async generatePdfPayload(bookingId: number) {
    const agreement = await this.prisma.bookingAgreement.findUnique({
      where: {
        bookingId,
      },
    });

    if (!agreement) {
      throw new NotFoundException('Booking agreement not found');
    }

    const html = await this.buildAgreementHtml(
      agreement.snapshot as Record<string, any>,
    );

    return {
      bookingId,
      filename: `booking-agreement-${bookingId}.pdf`,
      html,
      snapshot: agreement.snapshot,
      agreement,
    };
  }

  async markPdfGenerated(bookingId: number, pdfUrl: string) {
    const agreement = await this.prisma.bookingAgreement.findUnique({
      where: {
        bookingId,
      },
    });

    if (!agreement) {
      throw new NotFoundException('Booking agreement not found');
    }

    return this.prisma.bookingAgreement.update({
      where: {
        bookingId,
      },
      data: {
        pdfUrl,
        status: 'PDF_GENERATED',
      },
    });
  }

  async createAndPreparePdf(bookingId: number) {
    return this.generatePdfPayload(bookingId);
  }

  private buildSnapshot(booking: any, rules: any[]) {
    const latestPaidPayment =
      booking.payments.find((payment: any) => payment.status === 'PAID') ??
      null;

    const roomPrice = Number(booking.room.price);
    const computedTotal = roomPrice * Number(booking.occupantsCount ?? 1);

    return {
      bookingId: booking.id,
      bookingReference: booking.reference,
      bookingStatus: booking.status,

      tenant: {
        id: booking.tenant.id,
        name: `${booking.tenant.firstname ?? ''} ${booking.tenant.lastname ?? ''}`.trim(),
        email: booking.tenant.email,
        phoneNumber: booking.tenant.phone_number,
      },

      owner: {
        id: booking.boardingHouse.owner.id,
        name: `${booking.boardingHouse.owner.firstname ?? ''} ${booking.boardingHouse.owner.lastname ?? ''}`.trim(),
        email: booking.boardingHouse.owner.email,
        phoneNumber: booking.boardingHouse.owner.phone_number,
      },

      boardingHouse: {
        id: booking.boardingHouse.id,
        name: booking.boardingHouse.name,
        address: booking.boardingHouse.address,
        description: booking.boardingHouse.description,
      },

      room: {
        id: booking.room.id,
        roomNumber: booking.room.roomNumber,
        description: booking.room.description,
        price: roomPrice,
        maxCapacity: booking.room.maxCapacity,
      },

      stay: {
        bookingType: booking.bookingType,
        occupantsCount: booking.occupantsCount,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        dateBooked: booking.dateBooked,
      },

      payment: {
        latestPaidPaymentId: latestPaidPayment?.id ?? null,
        amountPaid: latestPaidPayment ? Number(latestPaidPayment.amount) : 0,
        currency: latestPaidPayment?.currency ?? booking.currency,
        bookingTotalAmount: booking.totalAmount
          ? Number(booking.totalAmount)
          : computedTotal,
      },

      rules: rules.map((rule) => ({
        id: rule.id,
        title: rule.title,
        content: rule.content,
        isRequired: rule.isRequired,
        version: rule.version,
      })),

      generatedAt: new Date(),
    };
  }

  private resolveTermsVersion(rules: any[]) {
    if (!rules.length) {
      return 'booking-agreement-v1';
    }

    const highestVersion = Math.max(...rules.map((rule) => rule.version ?? 1));
    return `boarding-house-rules-v${highestVersion}`;
  }

  private async getTemplateContent() {
    const possiblePaths = [
      join(
        process.cwd(),
        'src',
        'domains',
        'agreements',
        'templates',
        'booking-agreement.template.html',
      ),
      join(
        process.cwd(),
        'src',
        'domains',
        'agreements',
        'template',
        'booking-agreement.template.html',
      ),
      join(
        process.cwd(),
        'dist',
        'domains',
        'agreements',
        'templates',
        'booking-agreement.template.html',
      ),
      join(
        process.cwd(),
        'dist',
        'domains',
        'agreements',
        'template',
        'booking-agreement.template.html',
      ),
    ];

    for (const templatePath of possiblePaths) {
      try {
        return await readFile(templatePath, 'utf-8');
      } catch {}
    }

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{{title}}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.6;
      padding: 20px;
      color: #1A1A1A;
      background: #FFFFFF;
    }

    .agreement-content {
      max-width: 860px;
      margin: 0 auto;
    }

    h1 {
      font-size: 26px;
      line-height: 1.25;
      margin-bottom: 12px;
      color: #123969;
    }

    h2 {
      font-size: 19px;
      margin-top: 28px;
      margin-bottom: 10px;
      color: #357FC1;
      border-bottom: 1px solid #D6ECFA;
      padding-bottom: 6px;
    }

    p {
      font-size: 14px;
      margin: 10px 0;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      margin: 12px 0 18px;
      font-size: 13px;
    }

    th,
    td {
      border: 1px solid #CCCCCC;
      padding: 8px;
      vertical-align: top;
    }

    th {
      background: #F7F9FC;
      font-weight: 600;
      text-align: left;
    }

    ul,
    ol {
      padding-left: 22px;
    }

    li {
      margin-bottom: 8px;
      font-size: 14px;
    }

    hr {
      border: none;
      border-top: 1px solid #CCCCCC;
      margin: 20px 0;
    }

    .footer-note {
      margin-top: 28px;
      padding: 12px;
      border: 1px solid #CCCCCC;
      border-radius: 8px;
      background: #F7F9FC;
      font-size: 12px;
      color: #767474;
    }
  </style>
</head>
<body>
  <main class="agreement-content">
    {{content}}

    <div class="footer-note">
      This digital agreement is generated from the saved BH Hunter booking agreement snapshot.
    </div>
  </main>
</body>
</html>
`;
  }

  private async buildAgreementHtml(snapshot: Record<string, any>) {
    const template = await this.getTemplateContent();

    const markdown = this.buildAgreementMarkdown(snapshot);
    const content = this.renderMarkdown(markdown);

    return this.injectTemplate(
      content,
      'BH Hunter Digital Booking Agreement',
      template,
    );
  }

  private renderMarkdown(markdown: string): string {
    const result = marked.parse(markdown);

    if (typeof result === 'string') {
      return result;
    }

    throw new Error('Marked returned async result unexpectedly');
  }

  private injectTemplate(content: string, title: string, template: string) {
    return template
      .replace('{{title}}', this.escapeHtml(title))
      .replace('{{content}}', content);
  }

  private buildAgreementMarkdown(snapshot: Record<string, any>) {
    const tenant = snapshot.tenant ?? {};
    const owner = snapshot.owner ?? {};
    const boardingHouse = snapshot.boardingHouse ?? {};
    const room = snapshot.room ?? {};
    const stay = snapshot.stay ?? {};
    const payment = snapshot.payment ?? {};
    const rules = snapshot.rules ?? [];

    const rulesMarkdown = rules.length
      ? rules
          .map(
            (rule: any, index: number) => `
${index + 1}. **${this.escapeHtml(rule.title ?? 'Boarding House Rule')}**  
${this.escapeHtml(rule.content ?? '')}
`,
          )
          .join('\n')
      : 'No active boarding house rules were configured at the time of booking.';

    return `
# BH Hunter Digital Booking Agreement

This Digital Booking Agreement records the booking request submitted through **BH Hunter** and the boarding house rules accepted by the tenant at the time of submission.

This agreement is generated from a saved booking snapshot. It preserves the booking details and rules that were shown to and accepted by the tenant when the booking request was created.

---

## 1. Booking Reference

| Field | Details |
|:--- |:--- |
| **Booking Reference** | ${this.escapeHtml(snapshot.bookingReference ?? '')} |
| **Booking Status at Acceptance** | ${this.escapeHtml(snapshot.bookingStatus ?? '')} |
| **Generated At** | ${this.formatDate(snapshot.generatedAt)} |

---

## 2. Tenant Information

| Field | Details |
|:--- |:--- |
| **Tenant Name** | ${this.escapeHtml(tenant.name ?? '')} |
| **Email** | ${this.escapeHtml(tenant.email ?? '')} |
| **Phone Number** | ${this.escapeHtml(tenant.phoneNumber ?? '')} |

---

## 3. Owner Information

| Field | Details |
|:--- |:--- |
| **Owner Name** | ${this.escapeHtml(owner.name ?? '')} |
| **Email** | ${this.escapeHtml(owner.email ?? '')} |
| **Phone Number** | ${this.escapeHtml(owner.phoneNumber ?? '')} |

---

## 4. Boarding House and Room Details

| Field | Details |
|:--- |:--- |
| **Boarding House** | ${this.escapeHtml(boardingHouse.name ?? '')} |
| **Address** | ${this.escapeHtml(boardingHouse.address ?? '')} |
| **Room Number** | ${this.escapeHtml(room.roomNumber ?? '')} |
| **Room Price** | PHP ${this.formatMoney(room.price)} |
| **Maximum Capacity** | ${this.escapeHtml(String(room.maxCapacity ?? ''))} |

---

## 5. Stay Period

| Field | Details |
|:--- |:--- |
| **Booking Type** | ${this.escapeHtml(stay.bookingType ?? '')} |
| **Number of Occupants** | ${this.escapeHtml(String(stay.occupantsCount ?? 1))} |
| **Check-In Date** | ${this.formatDate(stay.checkInDate)} |
| **Check-Out Date** | ${this.formatDate(stay.checkOutDate)} |
| **Date Booked** | ${this.formatDate(stay.dateBooked)} |

---

## 6. Booking Amount Summary

| Field | Details |
|:--- |:--- |
| **Estimated Booking Total** | PHP ${this.formatMoney(payment.bookingTotalAmount)} |
| **Amount Paid at Time of Agreement** | PHP ${this.formatMoney(payment.amountPaid)} |
| **Currency** | ${this.escapeHtml(payment.currency ?? 'PHP')} |

---

## 7. Boarding House Rules Accepted by Tenant

The tenant confirms that the following boarding house rules were displayed before the booking request was submitted:

${rulesMarkdown}

---

## 8. Tenant Acknowledgment

By submitting the booking request through BH Hunter, the tenant confirms that:

1. The tenant has reviewed the boarding house rules shown above.
2. The tenant understands that the booking request is subject to owner approval.
3. The tenant understands that this agreement records the initial booking arrangement and accepted boarding house rules.
4. The tenant understands that final occupancy depends on approval, payment requirements, and the agreed stay period.
5. The tenant acknowledges that any later rule changes by the owner do not alter this saved agreement snapshot.

---

## 9. Owner Acknowledgment

The boarding house owner acknowledges that:

1. The rules shown in this agreement are the active rules associated with the boarding house at the time the tenant submitted the booking request.
2. Any later updates to the boarding house rules are treated as live rule updates and do not overwrite this saved agreement snapshot.
3. The owner remains responsible for ensuring that house rules are clear, accurate, and appropriate for the listed boarding house.

---

## 10. Platform Limitation

BH Hunter acts as a booking and boarding house discovery facilitator. This agreement documents the booking request, stay details, and rules accepted through the platform. BH Hunter does not act as a court, legal representative, government authority, or dispute resolution body.

---

## 11. Digital Record Notice

This agreement was generated electronically by BH Hunter using the saved booking agreement snapshot. The saved snapshot is the system record used to reproduce this agreement for review.

---

© 2026 **BH Hunter** — Boarding House Discovery and Booking Facilitation.
`;
  }

  private buildRulesHtml(rules: any[]) {
    if (!rules.length) {
      return '<li>No active house rules configured.</li>';
    }

    return rules
      .map(
        (rule: any, index: number) => `
          <li>
            <strong>${index + 1}. ${this.escapeHtml(rule.title)}</strong><br />
            <span>${this.escapeHtml(rule.content)}</span>
          </li>
        `,
      )
      .join('');
  }

  private applyTemplate(
    template: string,
    replacements: Record<string, string>,
  ) {
    let html = template;

    for (const [key, value] of Object.entries(replacements)) {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), value ?? '');
    }

    return html;
  }

  private formatMoney(value: unknown) {
    const amount = Number(value ?? 0);
    return amount.toFixed(2);
  }

  private formatDate(value: unknown) {
    if (!value) return '';

    return new Date(value as string).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
