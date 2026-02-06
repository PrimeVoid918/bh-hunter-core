import { Injectable } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymongoService } from './strategies/paymongo/paymongo.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly paymongoService: PaymongoService) {}

  async createPayment(amount: number) {
    const currency = 'php';
    const paymentIntent = await this.paymongoService.createPaymentIntent(
      amount,
      currency,
    );
    // Save to DB here if you have Payment entity
    return paymentIntent;
  }

  create(createPaymentDto: CreatePaymentDto) {
    return 'This action adds a new payment';
  }

  findAll() {
    return `This action returns all payments`;
  }

  findOne(id: number) {
    return `This action returns a #${id} payment`;
  }

  update(id: number, updatePaymentDto: UpdatePaymentDto) {
    return `This action updates a #${id} payment`;
  }

  remove(id: number) {
    return `This action removes a #${id} payment`;
  }
}
