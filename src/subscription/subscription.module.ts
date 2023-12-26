import { Module, forwardRef } from '@nestjs/common';
import { SubscriptionService } from './subscription/subscription.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Subscription,
  SubscriptionSchema,
} from './subscription/subscription.schemas';
import { BillingModule } from 'src/billing/billing.module';

@Module({
  providers: [SubscriptionService],
  exports: [SubscriptionService],
  imports: [
    forwardRef(() => BillingModule),
    MongooseModule.forFeature([
      {
        name: Subscription.name,
        schema: SubscriptionSchema,
      },
    ]),
  ],
})
export class SubscriptionModule {}
