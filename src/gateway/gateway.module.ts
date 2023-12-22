import { Module, forwardRef } from '@nestjs/common';
import { GatewayService } from './gateway/gateway.service';
import { BillingModule } from 'src/billing/billing.module';
import { ProductModule } from 'src/product/product.module';
import { CustomerModule } from 'src/customer/customer.module';

@Module({
  providers: [GatewayService],
  exports: [GatewayService],
  imports: [
    forwardRef(() => BillingModule),
    forwardRef(() => ProductModule),
    forwardRef(() => CustomerModule),
  ],
})
export class GatewayModule {}
