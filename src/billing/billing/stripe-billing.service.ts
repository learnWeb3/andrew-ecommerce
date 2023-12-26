import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import {
  AndrewEcommerceCheckoutCanceledEvent,
  AndrewEcommerceCheckoutCompletedEvent,
} from 'andrew-events-schema';
import { KafkaProducerService } from 'src/kafka-producer/kafka-producer/kafka-producer.service';
import { CreateStripeCheckoutUrlDto } from 'src/lib/dto/create-stripe-checkout-url.dto';
import { CreateStripeProductDto } from 'src/lib/dto/create-stripe-product.dto';
import { UpdateStripeProductDto } from 'src/lib/dto/update-stripe-product.dto';
import { BillingDiscount } from 'src/lib/interfaces/billing-discount.enum';
import { EcommerceGateway } from 'src/lib/interfaces/ecommerce-gateway.enum';
import Stripe from 'stripe';

@Injectable()
export class StripeBillingService {
  private stripeClient: Stripe;

  constructor(
    @Inject(forwardRef(() => KafkaProducerService))
    private readonly kafkaProducerService: KafkaProducerService,
  ) {}

  onModuleInit() {
    this.stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  async createCheckoutUrl(
    createStripeCheckoutUrlDto: CreateStripeCheckoutUrlDto,
  ): Promise<{ url: string }> {
    const errors = [];
    const stripeCustomer = await this.getCustomer(
      createStripeCheckoutUrlDto.customer,
    );
    const stripeProduct = await this.getProduct(
      createStripeCheckoutUrlDto.product,
    );
    const productPrices = await this.getPriceByProductId(
      createStripeCheckoutUrlDto.product,
    );
    const stripePriceId = productPrices?.[0]?.id || null;

    if (!stripeCustomer) {
      errors.push(`invalid stripe customer`);
    }
    if (!stripeProduct) {
      errors.push(`invalid stripe product`);
    }
    if (!stripePriceId) {
      errors.push(`invalid stripe price`);
    }

    if (errors.length) {
      throw new BadRequestException(errors.join(', '));
    }

    return await this.createCheckoutSession(
      stripePriceId,
      createStripeCheckoutUrlDto.quantity,
      stripeCustomer.id,
      createStripeCheckoutUrlDto?.metadata || {},
    );
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
      /** CHECKOUT EVENTS */
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

      // Then define and call a function to handle the event checkout.session.expired
      // /** SUBSCRIPTION EVENTS */
      // case 'subscription_schedule.aborted':
      //   const subscriptionScheduleAborted = event.data.object;
      //   // Then define and call a function to handle the event subscription_schedule.aborted
      //   break;
      // case 'subscription_schedule.canceled':
      //   const subscriptionScheduleCanceled = event.data.object;
      //   // Then define and call a function to handle the event subscription_schedule.canceled
      //   break;
      // case 'subscription_schedule.completed':
      //   const subscriptionScheduleCompleted = event.data.object;
      //   // Then define and call a function to handle the event subscription_schedule.completed
      //   break;
      // case 'subscription_schedule.created':
      //   const subscriptionScheduleCreated = event.data.object;
      //   // Then define and call a function to handle the event subscription_schedule.created
      //   break;
      // case 'subscription_schedule.expiring':
      //   const subscriptionScheduleExpiring = event.data.object;
      //   // Then define and call a function to handle the event subscription_schedule.expiring
      //   break;
      // case 'subscription_schedule.released':
      //   const subscriptionScheduleReleased = event.data.object;
      //   // Then define and call a function to handle the event subscription_schedule.released
      //   break;
      // case 'subscription_schedule.updated':
      //   const subscriptionScheduleUpdated = event.data.object;
      //   // Then define and call a function to handle the event subscription_schedule.updated
      //   break;
      default:
        console.log(`Unhandled event type ${event.type}`);
        break;
    }

    // Respond to the webhook
    return { received: true };
  }

  async createProductWithPrice(
    createStripeProductDto: CreateStripeProductDto,
  ): Promise<{ id: string }> {
    const product = await this.createProduct({
      name: createStripeProductDto.name,
      description: createStripeProductDto.description,
      type: 'service',
    });

    const params = {
      currency: createStripeProductDto.currency,
      product: product.id,
      active: createStripeProductDto.active,
      unit_amount_decimal: `${createStripeProductDto.price * 100}`,
    };

    if (createStripeProductDto.subscription) {
      Object.assign(params, {
        recurring: {
          interval: createStripeProductDto.periodicity,
        },
      });
    }
    const price = await this.createPrice(params);

    await this.updateProduct(product.id, {
      default_price: price.id,
    });

    return { id: product.id };
  }

  async updateProductAndPrice(
    id: string,
    updateStripeProductDto: UpdateStripeProductDto,
  ) {
    const updatedProduct = await this.updateProduct(id, {
      name: updateStripeProductDto.name,
      description: updateStripeProductDto.description,
    });
    const prices = await this.getPriceByProductId(id);
    if (prices?.length && prices?.[0]?.id) {
      await this.updateProduct(updatedProduct.id, {
        default_price: null,
      });

      await this.updatePrice(prices[0].id, { active: false });
    }

    const params = {
      currency: updateStripeProductDto.currency,
      product: updatedProduct.id,
      active: updateStripeProductDto.active,
      unit_amount_decimal: `${updateStripeProductDto.price * 100}`,
    };

    if (updateStripeProductDto.subscription) {
      Object.assign(params, {
        recurring: {
          interval: updateStripeProductDto.periodicity,
        },
      });
    }

    await this.createPrice(params);
  }

  async createProduct(params: Stripe.ProductCreateParams) {
    return await this.stripeClient.products.create(params);
  }

  async getProduct(
    productId: string,
    params: Stripe.ProductRetrieveParams = {},
  ) {
    return await this.stripeClient.products.retrieve(productId, params);
  }

  async updateProduct(productId: string, params: Stripe.ProductUpdateParams) {
    return await this.stripeClient.products.update(productId, params);
  }

  async archiveProduct(productId: string) {
    const prices = await this.getPriceByProductId(productId);
    if (prices?.length) {
      await this.updatePrice(prices[0].id, { active: false });
    }
    return await this.stripeClient.products.update(productId, {
      active: false,
    });
  }

  async createPrice(params: Stripe.PriceCreateParams) {
    return await this.stripeClient.prices.create(params);
  }

  async updatePrice(priceId: string, params: Stripe.PriceUpdateParams) {
    return await this.stripeClient.prices.update(priceId, params);
  }

  async getPriceByProductId(productId: string) {
    return await this.stripeClient.prices
      .list({
        product: productId,
        limit: 1,
        active: true,
      })
      .then(({ data }) => data);
  }

  async createCustomer(
    params: Stripe.CustomerCreateParams,
  ): Promise<{ id: string }> {
    return await this.stripeClient.customers.create(params).then(({ id }) => ({
      id,
    }));
  }

  async getCustomer(
    customerId: string,
    params: Stripe.CustomerRetrieveParams = {},
  ) {
    return await this.stripeClient.customers.retrieve(customerId, params);
  }

  async updateCustomer(
    customerId: string,
    params: Stripe.CustomerUpdateParams,
  ) {
    return await this.stripeClient.customers.update(customerId, params);
  }

  async getOneProduct(productId: string) {
    const params = {
      expand: ['default_price'],
    };
    return await this.stripeClient.products.retrieve(productId, params);
  }

  async getAllProducts(
    filters: Stripe.ProductListParams,
    limit: number,
    startAfterItemId: string = null,
  ) {
    const params = {
      limit,
      ...filters,
      expand: ['data.default_price'],
    };
    if (startAfterItemId) {
      Object.assign(params, { starting_after: startAfterItemId });
    }
    return await this.stripeClient.products.list(params);
  }

  async createCoupon(billingDiscount: BillingDiscount) {
    await this.stripeClient.coupons.create({
      duration: 'forever',
      id: '',
      percent_off: billingDiscount,
    });
  }

  async getAllCounpons(
    filters: Stripe.CouponListParams,
    limit: number,
    startAfterItemId: string = null,
  ) {
    const params = {
      limit,
      ...filters,
    };
    if (startAfterItemId) {
      Object.assign(params, { starting_after: startAfterItemId });
    }
    return await this.stripeClient.coupons.list(params);
  }

  async createCheckoutSession(
    priceId: string,
    quantity: number,
    customerId: string,
    metadata: { [key: string]: any },
  ) {
    const session = await this.stripeClient.checkout.sessions.create({
      billing_address_collection: 'required',
      line_items: [{ price: priceId, quantity }],
      customer: customerId,
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_ROOT_URL_SUCCESS_PAYMENT_CALLBACK}/?&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_ROOT_URL_CANCEL_PAYMENT_CALLBACK}?canceled=true`,
      metadata,
    });

    return { url: session.url };
  }
}
