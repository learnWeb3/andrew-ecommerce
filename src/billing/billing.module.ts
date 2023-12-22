import { Module, forwardRef } from '@nestjs/common';
import { StripeBillingService } from './billing/stripe-billing.service';
import { KafkaProducerModule } from 'src/kafka-producer/kafka-producer.module';

@Module({
  providers: [StripeBillingService],
  exports: [StripeBillingService],
  imports: [forwardRef(() => KafkaProducerModule)],
})
export class BillingModule {}
