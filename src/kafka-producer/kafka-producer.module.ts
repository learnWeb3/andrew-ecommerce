import { Module } from '@nestjs/common';
import { KafkaProducerService } from './kafka-producer/kafka-producer.service';

@Module({
  providers: [KafkaProducerService],
  imports: [],
  exports: [KafkaProducerService],
})
export class KafkaProducerModule {}
