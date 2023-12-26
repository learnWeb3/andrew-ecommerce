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
import { CustomerService } from 'src/customer/customer/customer.service';
import { SubscriptionService } from 'src/subscription/subscription/subscription.service';

@Injectable()
export class StripeEventService {
  private stripeClient: Stripe;

  constructor(
    @Inject(forwardRef(() => KafkaProducerService))
    private readonly kafkaProducerService: KafkaProducerService,
    @Inject(forwardRef(() => CustomerService))
    private readonly customerService: CustomerService,
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
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
          const ecommerceCustomer = await this.customerService.findOne({
            gateway: EcommerceGateway.STRIPE,
            gatewayResourceId: checkoutSessionCompleted.customer as string,
          });
          const subscription = await this.subscriptionService.create({
            gateway: EcommerceGateway.STRIPE,
            gatewayResourceId: checkoutSessionCompleted.subscription as string,
            customer: ecommerceCustomer._id,
            contract: checkoutSessionCompleted.metadata.contract,
          });
          // TO DO handle invoice payed in customer portal
          const newCheckoutCompletedEvent =
            new AndrewEcommerceCheckoutCompletedEvent(
              checkoutSessionCompleted.customer as string,
              {
                contract: checkoutSessionCompleted.metadata.contract,
                subscription: subscription._id,
                customer: ecommerceCustomer._id,
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
          const ecommerceCustomer = await this.customerService.findOne({
            gateway: EcommerceGateway.STRIPE,
            gatewayResourceId: checkoutSessionExpired.customer as string,
          });
          // TO DO handle subscription cancellation
          // TO DO handle invoice cancellation in customer portal
          const newCheckoutCanceledEvent =
            new AndrewEcommerceCheckoutCanceledEvent(
              checkoutSessionExpired.customer as string,
              {
                contract: checkoutSessionExpired.metadata.contract,
                customer: ecommerceCustomer._id,
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
