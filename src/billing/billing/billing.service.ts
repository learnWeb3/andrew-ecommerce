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
import { CreateCheckoutUrl } from 'src/lib/dto/create-checkout-url.dto';
import { CreateProductDto } from 'src/lib/dto/create-product.dto';
import { UpdateProductDto } from 'src/lib/dto/update-product.dto';
import { BillingDiscount } from 'src/lib/interfaces/billing-discount.enum';
import Stripe from 'stripe';

@Injectable()
export class BillingService {
  private stripeClient: Stripe;

  constructor(
    @Inject(forwardRef(() => KafkaProducerService))
    private readonly kafkaProducerService: KafkaProducerService,
  ) {}

  onModuleInit() {
    this.stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  async createCheckoutUrl(
    createCheckoutUrl: CreateCheckoutUrl,
  ): Promise<{ url: string }> {
    const errors = [];
    const stripeCustomer = await this.getCustomer(createCheckoutUrl.customer);
    const stripeProduct = await this.getProduct(createCheckoutUrl.product);
    const productPrices = await this.getPriceByProductId(
      createCheckoutUrl.product,
    );
    const stripePriceId = productPrices?.[0]?.id || null;

    if (stripeCustomer) {
      errors.push(`invalid stripe customer`);
    }
    if (stripeProduct) {
      errors.push(`invalid stripe product`);
    }
    if (stripePriceId) {
      errors.push(`invalid stripe price`);
    }

    if (errors.length) {
      throw new BadRequestException(errors.join(', '));
    }

    return await this.createCheckoutSession(
      stripePriceId,
      createCheckoutUrl.quantity,
      stripeCustomer.id,
      createCheckoutUrl?.metadata || {},
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
          const newCheckoutCompletedEvent =
            new AndrewEcommerceCheckoutCompletedEvent(
              checkoutSessionCompleted.customer as string,
              {
                contract: checkoutSessionCompleted.metadata.contract,
                customer: checkoutSessionCompleted.customer as string,
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
          const newCheckoutCanceledEvent =
            new AndrewEcommerceCheckoutCanceledEvent(
              checkoutSessionExpired.customer as string,
              {
                contract: checkoutSessionExpired.metadata.contract,
                customer: checkoutSessionExpired.customer as string,
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

  async createProductWithPrice(createProductDto: CreateProductDto) {
    const product = await this.createProduct({
      name: createProductDto.name,
      description: createProductDto.description,
      type: 'service',
    });

    const params = {
      currency: createProductDto.currency,
      product: product.id,
      active: true,
      unit_amount_decimal: `${createProductDto.price * 100}`,
    };

    if (createProductDto.subscription) {
      Object.assign(params, {
        recurring: {
          interval: createProductDto.periodicity,
        },
      });
    }
    const price = await this.createPrice(params);

    return await this.updateProduct(product.id, {
      default_price: price.id,
    });
  }

  async updateProductAndPrice(id: string, updateProductDto: UpdateProductDto) {
    const updatedProduct = await this.updateProduct(id, {
      name: updateProductDto.name,
      description: updateProductDto.description,
    });
    const prices = await this.getPriceByProductId(id);
    if (prices?.length) {
      await this.updatePrice(prices[0].id, { active: false });
    }

    const params = {
      currency: updateProductDto.currency,
      product: updatedProduct.id,
      active: true,
      unit_amount_decimal: `${updateProductDto.price * 100}`,
    };

    if (updateProductDto.subscription) {
      Object.assign(params, {
        recurring: {
          interval: updateProductDto.periodicity,
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
