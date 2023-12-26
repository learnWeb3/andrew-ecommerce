import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { EcommerceGateway } from 'src/lib/interfaces/ecommerce-gateway.enum';
import {
  AndrewEcommerceCheckoutCanceledEvent,
  AndrewEcommerceCheckoutCompletedEvent,
} from 'andrew-events-schema/andrew-ecommerce-events';
import Stripe from 'stripe';
import { KafkaProducerService } from 'src/kafka-producer/kafka-producer/kafka-producer.service';

@Injectable()
export class StripeEventService {
  private stripeClient: Stripe;

  constructor(
    @Inject(forwardRef(() => KafkaProducerService))
    private readonly kafkaProducerService: KafkaProducerService,
  ) {}

  onModuleInit() {
    this.stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  async handleWebhookEvents(signature: string, data: Buffer) {
    let event: Stripe.Event;

    try {
      event = this.stripeClient.webhooks.constructEvent(
        data,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    console.log(event);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const checkoutSessionCompleted = event.data.object;
        console.log(
          `received stripe session completed event`,
          JSON.stringify(checkoutSessionCompleted, null, 4),
        );
        try {
          // TO DO handle invoice payed in customer portal
          const newCheckoutCompletedEvent =
            new AndrewEcommerceCheckoutCompletedEvent(
              checkoutSessionCompleted.customer as string,
              {
                contract: checkoutSessionCompleted.metadata.contract,
                customer: checkoutSessionCompleted.customer as string,
                gateway: EcommerceGateway.STRIPE,
              },
            );
          this.kafkaProducerService.emit(newCheckoutCompletedEvent);
        } catch (error) {
          console.log(error);
        }

        break;
      case 'checkout.session.expired':
        const checkoutSessionExpired = event.data.object;
        console.log(
          `received stripe session expired event`,
          JSON.stringify(checkoutSessionExpired, null, 4),
        );
        try {
          // TO DO handle subscription cancellation
          // TO DO handle invoice cancellation in customer portal
          const newCheckoutCanceledEvent =
            new AndrewEcommerceCheckoutCanceledEvent(
              checkoutSessionExpired.customer as string,
              {
                contract: checkoutSessionExpired.metadata.contract,
                customer: checkoutSessionExpired.customer as string,
                gateway: EcommerceGateway.STRIPE,
              },
            );
          this.kafkaProducerService.emit(newCheckoutCanceledEvent);
        } catch (error) {
          console.log(error);
        }

        break;
      case 'invoice.payment_failed':
        console.log(`payment failed cancel/pause the contract`);
        break;
      case 'customer.subscription.deleted':
        console.log(
          `customer removed its subscription cancel/pause the contract`,
        );
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
        break;
    }

    // Respond to the webhook
    return { received: true };
  }
}
