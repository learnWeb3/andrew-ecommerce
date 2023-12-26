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
import { StripeEventService } from 'src/event/stripe-event/stripe-event.service';
import {
  KeycloakAuthGuard,
  KeycloakAuthIgnore,
} from 'src/keycloak/keycloak/keycloak-auth.guard';

@UseGuards(KeycloakAuthGuard)
@Controller('api/gateway')
export class GatewayController {
  constructor(
    @Inject(forwardRef(() => StripeEventService))
    private readonly stripeEventService: StripeEventService,
  ) {}

  @KeycloakAuthIgnore(true)
  @Post('stripe/events')
  handleEvents(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.stripeEventService.handleWebhookEvents(signature, req.rawBody);
  }
}
