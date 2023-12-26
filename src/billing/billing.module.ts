import { Module } from '@nestjs/common';
import { StripeBillingService } from './billing/stripe-billing.service';

@Module({
  providers: [StripeBillingService],
  exports: [StripeBillingService],
})
export class BillingModule {}
