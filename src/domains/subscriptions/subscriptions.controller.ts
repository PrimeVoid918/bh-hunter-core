import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { PaymentsService } from '../payments/payments.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Get('plans')
  getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Get('plans/:planId')
  getPlansById(@Param('planId') planId: string) {
    return this.subscriptionsService.getPlanById(planId);
  }

  // 🔹 Create subscription checkout (for payment)
  @Post(':ownerId/checkout')
  createCheckout(
    @Param('ownerId') ownerId: string,
    @Body() body: { planId: string },
  ) {
    const plan = this.subscriptionsService.getPlanById(body.planId);

    if (!plan) {
      throw new BadRequestException('Invalid Plan Selected!');
    }

    return this.paymentsService.createSubscriptionPayment({
      ownerId: +ownerId,
      planId: plan.id,
    });
  }

  // 🔹 Create TRIAL subscription manually (admin trigger)
  @Post('trial')
  createTrial(@Body() body: { ownerId: number }) {
    if (!body.ownerId) {
      throw new BadRequestException('ownerId is required');
    }
    return this.subscriptionsService.createTrial(body.ownerId);
  }

  @Post('cancel')
  async cancel(@Body('ownerId') ownerId: number) {
    if (!ownerId || typeof ownerId !== 'number') {
      throw new BadRequestException('Invalid or missing owner ID');
    }

    console.log(ownerId);

    return this.subscriptionsService.cancelSubscription(ownerId);
  }

  // 🔹 Activate PAID subscription (temporary endpoint before webhook)
  // @Post('activate')
  // activatePaid(
  //   @Body()
  //   body: {
  //     ownerId: number;
  //     durationMonths: number;
  //     providerReferenceId: string;
  //   },
  // ) {
  //   const { ownerId, durationMonths, providerReferenceId } = body;
  //   if (!ownerId || !durationMonths || !providerReferenceId) {
  //     throw new BadRequestException(
  //       'ownerId, durationMonths, and providerReferenceId are required',
  //     );
  //   }
  //   return this.subscriptionsService.activatePaid(body);
  // }

  //! should get all the subs for transaction
  // 🔹 Get all subscriptions of an owner
  @Get()
  findAll(@Query('ownerId') ownerId: string) {
    if (!ownerId) {
      throw new BadRequestException('ownerId query param required');
    }
    return this.subscriptionsService.findAll(+ownerId);
  }

  // 🔹 Get active subscription
  @Get('active/:ownerId')
  findActive(@Param('ownerId') ownerId: string) {
    if (!ownerId) {
      throw new BadRequestException('ownerId param required');
    }
    return this.subscriptionsService.findActive(+ownerId);
  }

  // 🔹 Manually expire
  @Patch('expire/:id')
  expire(@Param('id') id: string) {
    if (!id) {
      throw new BadRequestException('id param required');
    }
    return this.subscriptionsService.expire(+id);
  }

  // 🔹 Hard delete
  @Delete(':id')
  remove(@Param('id') id: string) {
    if (!id) {
      throw new BadRequestException('id param required');
    }
    return this.subscriptionsService.remove(+id);
  }
}
