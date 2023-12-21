import { Module, forwardRef } from '@nestjs/common';
import { KeycloakModule } from 'src/keycloak/keycloak.module';
import { BillingModule } from 'src/billing/billing.module';
import { StripeController } from './stripe/stripe.controller';

@Module({
  imports: [KeycloakModule, forwardRef(() => BillingModule)],
  controllers: [StripeController],
})
export class ApiModule {}
