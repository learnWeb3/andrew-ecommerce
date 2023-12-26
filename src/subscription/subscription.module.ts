import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription/subscription.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Subscription,
  SubscriptionSchema,
} from './subscription/subscription.schemas';

@Module({
  providers: [SubscriptionService],
  imports: [
    MongooseModule.forFeature([
      {
        name: Subscription.name,
        schema: SubscriptionSchema,
      },
    ]),
  ],
})
export class SubscriptionModule {}
