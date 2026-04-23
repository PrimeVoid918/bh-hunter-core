import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IDatabaseService } from 'src/infrastructure/database/database.interface';
import { CreateBoardingHouseRuleDto } from './dto/create-boarding-house-rules.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BoardingHouseRulesService {
  constructor(
    @Inject('IDatabaseService')
    private readonly database: IDatabaseService,
  ) {}

  private get prisma() {
    return this.database.getClient();
  }

  async create(
    rules: CreateBoardingHouseRuleDto[],
    boardingHouseId: number,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx ?? this.prisma;

    const boardingHouse = await prisma.boardingHouse.findFirst({
      where: {
        id: boardingHouseId,
        isDeleted: false,
      },
    });

    if (!boardingHouse) {
      throw new NotFoundException('Boarding house not found');
    }

    if (!rules?.length) {
      return [];
    }

    await prisma.boardingHouseRule.createMany({
      data: rules.map((rule, index) => ({
        boardingHouseId,
        title: rule.title,
        content: rule.content,
        isRequired: rule.isRequired ?? true,
        sortOrder: rule.sortOrder ?? index,
        version: 1,
        isActive: true,
      })),
    });

    return prisma.boardingHouseRule.findMany({
      where: {
        boardingHouseId,
        isActive: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });
  }

  async findByBoardingHouse(
    boardingHouseId: number,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx ?? this.prisma;

    return prisma.boardingHouseRule.findMany({
      where: {
        boardingHouseId,
        isActive: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });
  }

  async replace(
    rules: CreateBoardingHouseRuleDto[],
    boardingHouseId: number,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx ?? this.prisma;

    const boardingHouse = await prisma.boardingHouse.findFirst({
      where: {
        id: boardingHouseId,
        isDeleted: false,
      },
    });

    if (!boardingHouse) {
      throw new NotFoundException('Boarding house not found');
    }

    if (!rules?.length) {
      await prisma.boardingHouseRule.updateMany({
        where: {
          boardingHouseId,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });

      return [];
    }

    const currentRules = await prisma.boardingHouseRule.findMany({
      where: {
        boardingHouseId,
      },
      select: {
        version: true,
      },
      orderBy: {
        version: 'desc',
      },
      take: 1,
    });

    const nextVersion = (currentRules[0]?.version ?? 0) + 1;

    await prisma.boardingHouseRule.updateMany({
      where: {
        boardingHouseId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    await prisma.boardingHouseRule.createMany({
      data: rules.map((rule, index) => ({
        boardingHouseId,
        title: rule.title,
        content: rule.content,
        isRequired: rule.isRequired ?? true,
        sortOrder: rule.sortOrder ?? index,
        version: nextVersion,
        isActive: true,
      })),
    });

    return prisma.boardingHouseRule.findMany({
      where: {
        boardingHouseId,
        isActive: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });
  }

  async getTermsVersion(
    boardingHouseId: number,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx ?? this.prisma;

    const rules = await prisma.boardingHouseRule.findMany({
      where: {
        boardingHouseId,
        isActive: true,
      },
      select: {
        version: true,
      },
    });

    if (!rules.length) {
      return 'booking-agreement-v1';
    }

    const highestVersion = Math.max(...rules.map((rule) => rule.version ?? 1));
    return `boarding-house-rules-v${highestVersion}`;
  }
}
