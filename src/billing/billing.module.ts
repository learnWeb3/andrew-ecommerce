import { Module, forwardRef } from '@nestjs/common';
import { BillingService } from './billing/billing.service';
import { KafkaProducerModule } from 'src/kafka-producer/kafka-producer.module';

@Module({
  providers: [BillingService],
  exports: [BillingService],
  imports: [forwardRef(() => KafkaProducerModule)],
})
export class BillingModule {}
