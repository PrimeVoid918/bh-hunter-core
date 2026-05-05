import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { IDatabaseService } from 'src/infrastructure/database/database.interface';
import { TenantsService } from '../tenants/tenants.service';
import { OwnersService } from '../owners/owners.service';
import { AdminsPublisher } from './events/admins.publisher';

@Injectable()
export class AdminTransactionsService {
  constructor(
    @Inject('IDatabaseService') private readonly database: IDatabaseService,
    @Inject(forwardRef(() => TenantsService))
    private readonly tenantsService: TenantsService,
    @Inject(forwardRef(() => OwnersService))
    private readonly ownersService: OwnersService,
    private readonly adminsPublisher: AdminsPublisher,
  ) {}

  private get prisma() {
    return this.database.getClient();
  }

  async findAll(query: any) {
    return this.prisma.payment.findMany({
      include: {
        booking: {
          select: {
            id: true,
            reference: true,
            status: true,
          },
        },
        subscription: {
          select: {
            id: true,
            status: true,
            type: true,
          },
        },
        payouts: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.payment.findUnique({
      where: { id },
      include: {
        booking: true,
        subscription: true,
        payouts: true,
      },
    });
  }

  async getStats() {
    const [total, paid, pending, failed, refunded] = await Promise.all([
      this.prisma.payment.count(),
      this.prisma.payment.count({ where: { status: 'PAID' } }),
      this.prisma.payment.count({ where: { status: 'PENDING' } }),
      this.prisma.payment.count({ where: { status: 'FAILED' } }),
      this.prisma.payment.count({ where: { status: 'REFUNDED' } }),
    ]);

    return {
      total,
      paid,
      pending,
      failed,
      refunded,
    };
  }

  async findRefundRequests(query?: {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
    page?: number;
    limit?: number;
  }) {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query?.status) {
      where.status = query.status;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.refundRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          payment: {
            select: {
              id: true,
              amount: true,
              currency: true,
              status: true,
              purchaseType: true,
              userId: true,
            },
          },
          admin: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
            },
          },
        },
      }),
      this.prisma.refundRequest.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
