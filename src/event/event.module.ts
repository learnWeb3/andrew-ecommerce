import { Module, forwardRef } from '@nestjs/common';
import { StripeEventService } from './stripe-event/stripe-event.service';
import { KafkaProducerModule } from 'src/kafka-producer/kafka-producer.module';
import { CustomerModule } from 'src/customer/customer.module';

@Module({
  providers: [StripeEventService],
  exports: [StripeEventService],
  imports: [
    forwardRef(() => KafkaProducerModule),
    forwardRef(() => CustomerModule),
  ],
})
export class EventModule {}
