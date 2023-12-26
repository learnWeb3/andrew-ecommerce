import { Module, forwardRef } from '@nestjs/common';
import { StripeEventService } from './stripe-event/stripe-event.service';
import { KafkaProducerModule } from 'src/kafka-producer/kafka-producer.module';

@Module({
  providers: [StripeEventService],
  exports: [StripeEventService],
  imports: [forwardRef(() => KafkaProducerModule)],
})
export class EventModule {}
