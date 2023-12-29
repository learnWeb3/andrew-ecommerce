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
  AndrewEcommerceSubscriptionCanceledEvent,
  AndrewEcommerceSubscriptionErrorEvent,
  AndrewEcommerceSubscriptionErrorType,
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
              ecommerceCustomer._id as string,
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
          // TO DO handle invoice cancellation in customer portal
          const newCheckoutCanceledEvent =
            new AndrewEcommerceCheckoutCanceledEvent(
              ecommerceCustomer._id as string,
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
        const invoicePaymentFailed = event.data.object;
        console.log(
          `received stripe invoice payment failed event`,
          JSON.stringify(invoicePaymentFailed, null, 4),
        );
        try {
          const ecommerceCustomer = await this.customerService.findOne({
            gateway: EcommerceGateway.STRIPE,
            gatewayResourceId: invoicePaymentFailed.customer as string,
          });
          const subscription = await this.subscriptionService.findOne({
            gateway: EcommerceGateway.STRIPE,
            gatewayResourceId: invoicePaymentFailed.subscription as string,
          });
          // TO DO handle invoice cancellation in customer portal
          const newSubscriptionErrorEvent =
            new AndrewEcommerceSubscriptionErrorEvent(
              ecommerceCustomer._id as string,
              {
                contract: subscription.contract,
                customer: ecommerceCustomer._id,
                gateway: EcommerceGateway.STRIPE,
                errorType: AndrewEcommerceSubscriptionErrorType.PAYMENT_ERROR,
                subscription: subscription._id,
              },
            );
          this.kafkaProducerService.emit(newSubscriptionErrorEvent);
        } catch (error) {
          console.log(error);
        }

        break;
      case 'customer.subscription.deleted':
        const subscriptionDeleted = event.data.object;
        console.log(
          `received stripe subscription deleted event`,
          JSON.stringify(subscriptionDeleted, null, 4),
        );
        try {
          const ecommerceCustomer = await this.customerService.findOne({
            gateway: EcommerceGateway.STRIPE,
            gatewayResourceId: subscriptionDeleted.customer as string,
          });
          const subscription = await this.subscriptionService.findOne({
            gateway: EcommerceGateway.STRIPE,
            gatewayResourceId: subscriptionDeleted.id as string,
          });
          // TO DO handle invoice cancellation in customer portal
          const newSubscriptionCanceledEvent =
            new AndrewEcommerceSubscriptionCanceledEvent(
              ecommerceCustomer._id as string,
              {
                contract: subscription.contract,
                customer: ecommerceCustomer._id,
                gateway: EcommerceGateway.STRIPE,
                subscription: subscription._id,
              },
            );
          this.kafkaProducerService.emit(newSubscriptionCanceledEvent);
        } catch (error) {
          console.log(error);
        }

        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
        break;
    }

    // Respond to the webhook
    return { received: true };
  }
}
