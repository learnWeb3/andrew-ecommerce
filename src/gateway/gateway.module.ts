import { Module, forwardRef } from '@nestjs/common';
import { GatewayService } from './gateway/gateway.service';
import { BillingModule } from 'src/billing/billing.module';
import { ProductModule } from 'src/product/product.module';
import { CustomerModule } from 'src/customer/customer.module';
import { SubscriptionModule } from 'src/subscription/subscription.module';

@Module({
  providers: [GatewayService],
  exports: [GatewayService],
  imports: [
    forwardRef(() => BillingModule),
    forwardRef(() => ProductModule),
    forwardRef(() => CustomerModule),
    forwardRef(() => SubscriptionModule),
  ],
})
export class GatewayModule {}
