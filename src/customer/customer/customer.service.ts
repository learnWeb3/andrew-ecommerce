import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Customer, CustomerDocument } from './customer.schemas';
import { FilterQuery, Model } from 'mongoose';
import { CreateCustomerDto } from 'src/lib/dto/create-customer.dto';
import { EcommerceGateway } from 'src/lib/interfaces/ecommerce-gateway.enum';
import { StripeBillingService } from 'src/billing/billing/stripe-billing.service';

@Injectable()
export class CustomerService {
  constructor(
    @InjectModel(Customer.name)
    private readonly customerModel: Model<Customer>,
    @Inject(forwardRef(() => StripeBillingService))
    private readonly stripeBillingService: StripeBillingService,
  ) {}

  findOne(filters: FilterQuery<Customer>): Promise<CustomerDocument> {
    return this.customerModel.findOne(filters);
  }

  async create(createCustomerDto: CreateCustomerDto): Promise<{ id: string }> {
    let gatewayCustomer: { id: string } = null;
    const newCustomer = new this.customerModel(createCustomerDto);
    switch (createCustomerDto.gateway) {
      case EcommerceGateway.STRIPE:
        gatewayCustomer = await this.stripeBillingService.createCustomer({
          name: createCustomerDto.fullName,
          email: createCustomerDto.email,
        });
        break;
      default:
        console.log(`gateway does not exists`);
        throw new BadRequestException(`gateway does exists`);
    }
    newCustomer.gatewayResourceId = gatewayCustomer.id;
    return newCustomer.save().then((data) => ({
      id: data._id,
    }));
  }
}
