import { Module, forwardRef } from '@nestjs/common';
import { KeycloakModule } from 'src/keycloak/keycloak.module';
import { ProductController } from './product/product.controller';
import { ProductModule } from 'src/product/product.module';
import { GatewayController } from './gateway/gateway.controller';
import { BillingModule } from 'src/billing/billing.module';
import { GatewayModule } from 'src/gateway/gateway.module';

@Module({
  imports: [
    forwardRef(() => KeycloakModule),
    forwardRef(() => GatewayModule),
    forwardRef(() => ProductModule),
    forwardRef(() => BillingModule),
  ],
  controllers: [GatewayController, ProductController],
})
export class ApiModule {}
