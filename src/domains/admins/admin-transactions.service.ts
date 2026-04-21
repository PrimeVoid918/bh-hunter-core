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
}
