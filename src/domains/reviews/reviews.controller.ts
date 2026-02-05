import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('boarding-house/:boardingHouseId')
  create(
    @Param('boardingHouseId') boardingHouseId: number,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(+boardingHouseId, dto);
  }

  @Get('boarding-house/:boardingHouseId')
  findBoardingHouseReview(@Param('boardingHouseId') boardingHouseId: number) {
    return this.reviewsService.findBoardingHouseReviews(+boardingHouseId);
  }

  @Get('boarding-house/:boardingHouseId/summary')
  getSummary(@Param('boardingHouseId') id: number) {
    return this.reviewsService.getBoardingHouseReviewSummary(id);
  }

  @Get()
  findAll() {
    return this.reviewsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto) {
    return this.reviewsService.update(+id, updateReviewDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(+id);
  }
}
