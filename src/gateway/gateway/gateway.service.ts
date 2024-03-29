import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { StripeBillingService } from 'src/billing/billing/stripe-billing.service';
import { CustomerService } from 'src/customer/customer/customer.service';
import { ApplyActiveSubscriptionDiscountDto } from 'src/lib/dto/apply-active-subscription-discount.dto';
import { CancelSubscriptionDto } from 'src/lib/dto/cancel-subscription.dto';
import { CreateCheckoutUrlDto } from 'src/lib/dto/create-checkout-url.dto';
import { CreateCustomerDto } from 'src/lib/dto/create-customer.dto';
import { EcommerceGateway } from 'src/lib/interfaces/ecommerce-gateway.enum';
import { ProductService } from 'src/product/product/product.service';
import { SubscriptionService } from 'src/subscription/subscription/subscription.service';

@Injectable()
export class GatewayService {
  constructor(
    @Inject(forwardRef(() => StripeBillingService))
    private readonly stripeBillingService: StripeBillingService,
    @Inject(forwardRef(() => ProductService))
    private readonly productService: ProductService,
    @Inject(forwardRef(() => CustomerService))
    private readonly customerService: CustomerService,
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async applyActiveSubscriptionDiscount(
    applyActiveSubscriptionDiscountDto: ApplyActiveSubscriptionDiscountDto,
  ): Promise<{ id: string }> {
    switch (applyActiveSubscriptionDiscountDto.gateway) {
      case EcommerceGateway.STRIPE:
        const subscription = await this.subscriptionService.findOne({
          customer: applyActiveSubscriptionDiscountDto.customer,
          gateway: EcommerceGateway.STRIPE,
          active: true,
          contract: applyActiveSubscriptionDiscountDto.contract,
        });
        return this.subscriptionService.applyDiscount(
          subscription._id,
          applyActiveSubscriptionDiscountDto.discountPercent,
        );
      default:
        console.log(`gateway does not exists`);
        throw new BadRequestException(`gateway does not exists`);
    }
  }

  async cancelSubscription(
    cancelSubscriptionDto: CancelSubscriptionDto,
  ): Promise<{ id: string }> {
    switch (cancelSubscriptionDto.gateway) {
      case EcommerceGateway.STRIPE:
        const subscription = await this.subscriptionService.findOne({
          customer: cancelSubscriptionDto.customer,
          gateway: EcommerceGateway.STRIPE,
          active: true,
          contract: cancelSubscriptionDto.contract,
        });
        return this.subscriptionService.cancel(subscription._id);
      default:
        console.log(`gateway does not exists`);
        throw new BadRequestException(`gateway does not exists`);
    }
  }

  async createCustomer(createCustomerDto: CreateCustomerDto) {
    switch (createCustomerDto.gateway) {
      case EcommerceGateway.STRIPE:
        return this.customerService.create({
          fullName: createCustomerDto.fullName,
          email: createCustomerDto.email,
          gateway: EcommerceGateway.STRIPE,
        });
      default:
        console.log(`gateway does not exists`);
        throw new BadRequestException(`gateway does not exists`);
    }
  }

  async createCheckoutUrl(createCheckoutUrlDto: CreateCheckoutUrlDto) {
    const errors = [];
    switch (createCheckoutUrlDto.gateway) {
      case EcommerceGateway.STRIPE:
        const product = await this.productService.findOne({
          _id: createCheckoutUrlDto.product,
        });
        const customer = await this.customerService.findOne({
          email: createCheckoutUrlDto.customerEmail,
          gateway: EcommerceGateway.STRIPE,
        });
        if (!product) {
          errors.push(
            `product with id ${createCheckoutUrlDto.product} does not exists`,
          );
        }
        if (!customer) {
          errors.push(`customer does not exists`);
        }
        if (errors.length) {
          throw new BadRequestException(errors.join(', '));
        }
        return this.stripeBillingService.createCheckoutUrl({
          customer: customer.gatewayResourceId,
          product: product.gatewayResourceId,
          quantity: createCheckoutUrlDto.quantity,
          metadata: createCheckoutUrlDto.metadata,
        });

      default:
        console.log(`gateway does not exists`);
        throw new BadRequestException(`gateway does not exists`);
    }
  }
}
