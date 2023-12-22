import { Module } from '@nestjs/common';
import { ApiModule } from './api/api.module';
import { KeycloakModule } from './keycloak/keycloak.module';
import { ConfigModule } from '@nestjs/config';
import { BillingModule } from './billing/billing.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductModule } from './product/product.module';
import { GatewayModule } from './gateway/gateway.module';
import { CustomerModule } from './customer/customer.module';

@Module({
  imports: [
    ...(process.env.NODE_ENV !== 'production'
      ? [ConfigModule.forRoot({ envFilePath: '.env.development' })]
      : []),
    MongooseModule.forRoot(process.env.MONGO_URI),
    ApiModule,
    KeycloakModule,
    BillingModule,
    ProductModule,
    GatewayModule,
    CustomerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
