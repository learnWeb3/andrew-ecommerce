import { Body, Controller, Post, Inject, forwardRef } from '@nestjs/common';
import { GatewayService } from 'src/gateway/gateway/gateway.service';
import { ApplyActiveSubscriptionDiscountDto } from 'src/lib/dto/apply-active-subscription-discount.dto';
import { CancelSubscriptionDto } from 'src/lib/dto/cancel-subscription.dto';
import { CreateCheckoutUrlDto } from 'src/lib/dto/create-checkout-url.dto';
import { CreateCustomerDto } from 'src/lib/dto/create-customer.dto';

@Controller('api/gateway')
export class GatewayController {
  constructor(
    @Inject(forwardRef(() => GatewayService))
    private readonly gatewayService: GatewayService,
  ) {}

  @Post('subscription/cancel')
  async cancelSubscriptiion(
    @Body() cancelSubscriptionDto: CancelSubscriptionDto,
  ) {
    return this.gatewayService.cancelSubscription(cancelSubscriptionDto);
  }

  @Post('subscription/active/discount')
  async applyActiveSubscriptionDiscount(
    @Body()
    applyActiveSubscriptionDiscountDto: ApplyActiveSubscriptionDiscountDto,
  ) {
    return this.gatewayService.applyActiveSubscriptionDiscount(
      applyActiveSubscriptionDiscountDto,
    );
  }

  @Post('customer')
  async createCustomer(@Body() createCustomerDto: CreateCustomerDto) {
    return this.gatewayService.createCustomer(createCustomerDto);
  }

  @Post('checkout')
  async createCheckoutUrl(@Body() createCheckoutUrlDto: CreateCheckoutUrlDto) {
    return this.gatewayService.createCheckoutUrl(createCheckoutUrlDto);
  }
}
