import {
  Body,
  Controller,
  Post,
  RawBodyRequest,
  Req,
  Headers,
  UseGuards,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { StripeBillingService } from 'src/billing/billing/stripe-billing.service';
import { GatewayService } from 'src/gateway/gateway/gateway.service';
import {
  KeycloakAuthGuard,
  KeycloakAuthIgnore,
  KeycloakAvailableRoles,
  KeycloakRoles,
} from 'src/keycloak/keycloak/keycloak-auth.guard';
import { CreateCheckoutUrlDto } from 'src/lib/dto/create-checkout-url.dto';
import { CreateCustomerDto } from 'src/lib/dto/create-customer.dto';

@UseGuards(KeycloakAuthGuard)
@Controller('api/gateway')
export class GatewayController {
  constructor(
    @Inject(forwardRef(() => GatewayService))
    private readonly gatewayService: GatewayService,
    @Inject(forwardRef(() => StripeBillingService))
    private readonly stripeBillingService: StripeBillingService,
  ) {}

  @KeycloakRoles([
    KeycloakAvailableRoles.SUPERADMIN,
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.USER,
  ])
  @Post('customer')
  async createCustomer(@Body() createCustomerDto: CreateCustomerDto) {
    return this.gatewayService.createCustomer(createCustomerDto);
  }

  @KeycloakRoles([
    KeycloakAvailableRoles.SUPERADMIN,
    KeycloakAvailableRoles.INSURER,
    KeycloakAvailableRoles.USER,
  ])
  @Post('checkout')
  async createCheckoutUrl(@Body() createCheckoutUrlDto: CreateCheckoutUrlDto) {
    return this.gatewayService.createCheckoutUrl(createCheckoutUrlDto);
  }

  @KeycloakAuthIgnore(true)
  @Post('stripe/events')
  handleEvents(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.stripeBillingService.handleWebhookEvents(
      signature,
      req.rawBody,
    );
  }
}
