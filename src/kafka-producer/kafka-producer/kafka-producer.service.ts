import { Injectable } from '@nestjs/common';
import {
  AndrewEcommerceCheckoutCanceledEvent,
  AndrewEcommerceCheckoutCompletedEvent,
  AndrewEcommerceSubscriptionCanceledEvent,
  AndrewEcommerceSubscriptionErrorEvent,
} from 'andrew-events-schema/andrew-ecommerce-events';
import { Kafka, Producer } from 'kafkajs';
import { hostname } from 'os';
import { Subject } from 'rxjs';

@Injectable()
export class KafkaProducerService {
  private readonly client: Kafka;
  private readonly producer: Producer;
  private readonly topic: string = process.env.KAFKA_TOPIC;
  private subject: Subject<
    | AndrewEcommerceCheckoutCanceledEvent
    | AndrewEcommerceCheckoutCompletedEvent
    | AndrewEcommerceSubscriptionCanceledEvent
    | AndrewEcommerceSubscriptionErrorEvent
  > = new Subject();
  constructor() {
    this.client = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID + '_' + hostname(),
      brokers: process.env.KAFKA_BROKERS.split(','),
      sasl: {
        mechanism: 'scram-sha-512',
        username: process.env.KAFKA_SASL_USERNAME,
        password: process.env.KAFKA_SASL_PASSWORD,
      },
    });
    this.producer = this.client.producer({});
  }

  emit(
    event:
      | AndrewEcommerceCheckoutCanceledEvent
      | AndrewEcommerceCheckoutCompletedEvent
      | AndrewEcommerceSubscriptionCanceledEvent
      | AndrewEcommerceSubscriptionErrorEvent,
  ) {
    this.subject.next(event);
  }

  onModuleInit() {
    this.producer.connect().then(() => {
      console.log(
        `kafka producer successfully connected to kafka topic ${this.topic}`,
      );
      this.subject.subscribe({
        next: (
          event:
            | AndrewEcommerceCheckoutCanceledEvent
            | AndrewEcommerceCheckoutCompletedEvent
            | AndrewEcommerceSubscriptionCanceledEvent
            | AndrewEcommerceSubscriptionErrorEvent,
        ) => {
          this.producer.send({
            topic: this.topic,
            messages: [{ key: event.source, value: JSON.stringify(event) }],
          });
        },
      });
    });
  }
}
