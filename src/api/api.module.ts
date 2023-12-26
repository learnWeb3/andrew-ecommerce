import { Module, forwardRef } from '@nestjs/common';
import { KeycloakModule } from 'src/keycloak/keycloak.module';
import { ProductController } from './product/product.controller';
import { ProductModule } from 'src/product/product.module';
import { GatewayController } from './gateway/gateway.controller';
import { EventModule } from 'src/event/event.module';

@Module({
  imports: [
    forwardRef(() => KeycloakModule),
    forwardRef(() => ProductModule),
    forwardRef(() => EventModule),
  ],
  controllers: [GatewayController, ProductController],
})
export class ApiModule {}
