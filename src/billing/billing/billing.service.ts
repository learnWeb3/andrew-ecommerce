import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateProductDto } from 'src/lib/dto/create-product.dto';
import { UpdateProductDto } from 'src/lib/dto/update-product.dto';
import { BillingDiscount } from 'src/lib/interfaces/billing-discount.enum';
import Stripe from 'stripe';

@Injectable()
export class BillingService {
  private stripeClient: Stripe;

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
      /** CHECKOUT EVENTS */
      case 'checkout.session.async_payment_failed':
        const checkoutSessionAsyncPaymentFailed = event.data.object;
        // Then define and call a function to handle the event checkout.session.async_payment_failed
        break;
      case 'checkout.session.async_payment_succeeded':
        const checkoutSessionAsyncPaymentSucceeded = event.data.object;
        // Then define and call a function to handle the event checkout.session.async_payment_succeeded
        break;
      case 'checkout.session.completed':
        const checkoutSessionCompleted = event.data.object;
        // Then define and call a function to handle the event checkout.session.completed
        break;
      case 'checkout.session.expired':
        const checkoutSessionExpired = event.data.object;
      // Then define and call a function to handle the event checkout.session.expired
      /** SUBSCRIPTION EVENTS */
      case 'subscription_schedule.aborted':
        const subscriptionScheduleAborted = event.data.object;
        // Then define and call a function to handle the event subscription_schedule.aborted
        break;
      case 'subscription_schedule.canceled':
        const subscriptionScheduleCanceled = event.data.object;
        // Then define and call a function to handle the event subscription_schedule.canceled
        break;
      case 'subscription_schedule.completed':
        const subscriptionScheduleCompleted = event.data.object;
        // Then define and call a function to handle the event subscription_schedule.completed
        break;
      case 'subscription_schedule.created':
        const subscriptionScheduleCreated = event.data.object;
        // Then define and call a function to handle the event subscription_schedule.created
        break;
      case 'subscription_schedule.expiring':
        const subscriptionScheduleExpiring = event.data.object;
        // Then define and call a function to handle the event subscription_schedule.expiring
        break;
      case 'subscription_schedule.released':
        const subscriptionScheduleReleased = event.data.object;
        // Then define and call a function to handle the event subscription_schedule.released
        break;
      case 'subscription_schedule.updated':
        const subscriptionScheduleUpdated = event.data.object;
        // Then define and call a function to handle the event subscription_schedule.updated
        break;
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

  async getProduct(productId: string) {
    return await this.stripeClient.products.retrieve(productId);
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

  async createCustomer(params: Stripe.CustomerCreateParams) {
    return await this.stripeClient.customers.create(params);
  }

  async getCustomer(customerId: string) {
    return await this.stripeClient.customers.retrieve(customerId);
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
