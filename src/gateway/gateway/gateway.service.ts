import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { StripeBillingService } from 'src/billing/billing/stripe-billing.service';
import { CustomerService } from 'src/customer/customer/customer.service';
import { CreateCheckoutUrlDto } from 'src/lib/dto/create-checkout-url.dto';
import { CreateCustomerDto } from 'src/lib/dto/create-customer.dto';
import { EcommerceGateway } from 'src/lib/interfaces/ecommerce-gateway.enum';
import { ProductService } from 'src/product/product/product.service';

@Injectable()
export class GatewayService {
  constructor(
    @Inject(forwardRef(() => StripeBillingService))
    private readonly stripeBillingService: StripeBillingService,
    @Inject(forwardRef(() => ProductService))
    private readonly productService: ProductService,
    @Inject(forwardRef(() => CustomerService))
    private readonly customerService: CustomerService,
  ) {}

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
        const product = await this.productService.findOne(
          createCheckoutUrlDto.product,
        );
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
