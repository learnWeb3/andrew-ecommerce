import { Module, forwardRef } from '@nestjs/common';
import { CustomerService } from './customer/customer.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Customer, CustomerSchema } from './customer/customer.schemas';
import { BillingModule } from 'src/billing/billing.module';

@Module({
  providers: [CustomerService],
  exports: [CustomerService],
  imports: [
    MongooseModule.forFeature([
      {
        name: Customer.name,
        schema: CustomerSchema,
      },
    ]),
    forwardRef(() => BillingModule),
  ],
})
export class CustomerModule {}
