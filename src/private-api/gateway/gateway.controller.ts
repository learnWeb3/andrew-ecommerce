import { Body, Controller, Post, Inject, forwardRef } from '@nestjs/common';
import { GatewayService } from 'src/gateway/gateway/gateway.service';
import { CreateCheckoutUrlDto } from 'src/lib/dto/create-checkout-url.dto';
import { CreateCustomerDto } from 'src/lib/dto/create-customer.dto';

@Controller('api/gateway')
export class GatewayController {
  constructor(
    @Inject(forwardRef(() => GatewayService))
    private readonly gatewayService: GatewayService,
  ) {}

  @Post('customer')
  async createCustomer(@Body() createCustomerDto: CreateCustomerDto) {
    return this.gatewayService.createCustomer(createCustomerDto);
  }

  @Post('checkout')
  async createCheckoutUrl(@Body() createCheckoutUrlDto: CreateCheckoutUrlDto) {
    return this.gatewayService.createCheckoutUrl(createCheckoutUrlDto);
  }
}
