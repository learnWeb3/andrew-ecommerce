import {
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
} from 'src/keycloak/keycloak/keycloak-auth.guard';

@UseGuards(KeycloakAuthGuard)
@Controller('api/gateway')
export class GatewayController {
  constructor(
    @Inject(forwardRef(() => GatewayService))
    private readonly gatewayService: GatewayService,
    @Inject(forwardRef(() => StripeBillingService))
    private readonly stripeBillingService: StripeBillingService,
  ) {}

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
