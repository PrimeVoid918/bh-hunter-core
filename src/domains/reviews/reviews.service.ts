import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { IDatabaseService } from 'src/infrastructure/database/database.interface';

@Injectable()
export class ReviewsService {
  constructor(
    @Inject('IDatabaseService') private readonly database: IDatabaseService,
  ) {}

  private get prisma() {
    return this.database.getClient();
  }

  async create(bhId: number, payload: CreateReviewDto) {
    const prisma = this.prisma;

    if (!bhId) {
      throw new BadRequestException('Boarding House ID is required');
    }

    const ifBHExists = await prisma.boardingHouse.findUnique({
      where: { id: bhId },
      select: { id: true },
    });

    if (!ifBHExists) {
      throw new BadRequestException('Boarding House does not exist');
    }

    // Check if the tenant already has an active review
    const existingActive = await prisma.review.findFirst({
      where: {
        tenantId: payload.tenantId,
        boardingHouseId: bhId,
        isDeleted: false,
      },
    });

    if (existingActive) {
      throw new ConflictException(
        'You already have an active review for this boarding house',
      );
    }

    // Create the review
    try {
      const review = await prisma.review.create({
        data: {
          boardingHouseId: bhId,
          tenantId: payload.tenantId,
          rating: payload.rating,
          comment: payload.comment,
        },
      });

      return review;
    } catch (e) {
      console.error('review service create(): ', e);
      // Fallback for unexpected errors
      throw new BadRequestException('Failed to create review');
    }
  }

  async findBoardingHouseReviews(boardingHouseId: number) {
    if (!boardingHouseId) {
      throw new BadRequestException('Boarding House ID is required!');
    }

    try {
      return await this.prisma.review.findMany({
        where: { isDeleted: false, boardingHouseId: boardingHouseId },
        include: {
          tenant: {
            select: {
              username: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      throw new BadRequestException('Failed to fetch reviews');
    }
  }

  async getBoardingHouseReviewSummary(boardingHouseId: number) {
    const prisma = this.prisma;

    if (!boardingHouseId) {
      throw new BadRequestException('Boarding House ID is required!');
    }

    const [aggregate, grouped] = await Promise.all([
      prisma.review.aggregate({
        where: {
          boardingHouseId,
          isDeleted: false,
        },
        _avg: { rating: true },
        _count: { rating: true },
      }),

      prisma.review.groupBy({
        by: ['rating'],
        where: {
          boardingHouseId,
          isDeleted: false,
        },
        _count: { rating: true },
      }),
    ]);

    return {
      average: Number(aggregate._avg.rating?.toFixed(1) ?? 0),
      total: aggregate._count.rating,
      distribution: this.normalizeDistribution(grouped),
    };
  }

  async findAll() {
    try {
      return await this.prisma.review.findMany({
        where: { isDeleted: false },
        include: {
          tenant: {
            select: {
              username: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      throw new BadRequestException('Failed to fetch reviews');
    }
  }

  async findOne(id: number) {
    const prisma = this.prisma;

    if (!id) {
      throw new BadRequestException('Id is required');
    }

    try {
      return await prisma.review.findFirst({
        where: {
          id: id,
          isDeleted: false,
        },
      });
    } catch (error: any) {
      throw new Error(`Error finding review data: ${error}`);
    }
  }

  async update(id: number, updateReviewDto: UpdateReviewDto) {
    const prisma = this.prisma;

    if (!id) {
      throw new BadRequestException('Id is required');
    }

    try {
      return await prisma.review.update({
        where: {
          id: id,
        },
        data: {
          rating: updateReviewDto.rating,
          comment: updateReviewDto.comment,
        },
      });
    } catch (error: any) {
      throw new Error(`Error updating review data: ${error}`);
    }
  }

  async remove(id: number) {
    const prisma = this.prisma;

    if (!id) {
      throw new BadRequestException('Review ID is required');
    }

    try {
      return await prisma.review.update({
        where: {
          id: id,
        },
        data: {
          isDeleted: true,
        },
      });
    } catch (err: any) {
      throw new Error(`Error deleting review data: ${err}`);
    }
  }

  /**
   * private methods
   */
  private normalizeDistribution(
    rows: { rating: number; _count: { rating: number } }[],
  ) {
    const base = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    for (const r of rows) {
      base[r.rating as 1 | 2 | 3 | 4 | 5] = r._count.rating;
    }

    return base;
  }
}
