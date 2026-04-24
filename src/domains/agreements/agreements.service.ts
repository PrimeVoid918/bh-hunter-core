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
        'dist',
        'domains',
        'agreements',
        'templates',
        'booking-agreement.template.html',
      ),
    ];

    for (const templatePath of possiblePaths) {
      try {
        return await readFile(templatePath, 'utf-8');
      } catch {}
    }

    throw new NotFoundException('Booking agreement template file not found');
  }

  private async buildAgreementHtml(snapshot: Record<string, any>) {
    const template = await this.getTemplateContent();

    const rulesHtml = this.buildRulesHtml(snapshot.rules ?? []);

    const replacements: Record<string, string> = {
      bookingReference: this.escapeHtml(
        String(snapshot.bookingReference ?? ''),
      ),
      bookingStatus: this.escapeHtml(String(snapshot.bookingStatus ?? '')),
      checkInDate: this.formatDate(snapshot.stay?.checkInDate),
      checkOutDate: this.formatDate(snapshot.stay?.checkOutDate),
      occupantsCount: this.escapeHtml(
        String(snapshot.stay?.occupantsCount ?? 1),
      ),
      bookingType: this.escapeHtml(String(snapshot.stay?.bookingType ?? '')),

      tenantName: this.escapeHtml(String(snapshot.tenant?.name ?? '')),
      tenantEmail: this.escapeHtml(String(snapshot.tenant?.email ?? '')),
      tenantPhone: this.escapeHtml(String(snapshot.tenant?.phoneNumber ?? '')),

      ownerName: this.escapeHtml(String(snapshot.owner?.name ?? '')),
      ownerEmail: this.escapeHtml(String(snapshot.owner?.email ?? '')),
      ownerPhone: this.escapeHtml(String(snapshot.owner?.phoneNumber ?? '')),

      boardingHouseName: this.escapeHtml(
        String(snapshot.boardingHouse?.name ?? ''),
      ),
      boardingHouseAddress: this.escapeHtml(
        String(snapshot.boardingHouse?.address ?? ''),
      ),

      roomNumber: this.escapeHtml(String(snapshot.room?.roomNumber ?? '')),
      roomPrice: this.formatMoney(snapshot.room?.price),
      bookingTotalAmount: this.formatMoney(
        snapshot.payment?.bookingTotalAmount,
      ),
      amountPaid: this.formatMoney(snapshot.payment?.amountPaid),

      rulesHtml,
      generatedAt: this.formatDate(snapshot.generatedAt),
    };

    return this.applyTemplate(template, replacements);
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
