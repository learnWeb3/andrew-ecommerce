import { Module } from '@nestjs/common';
import { ApiModule } from './api/api.module';
import { KeycloakModule } from './keycloak/keycloak.module';
import { ConfigModule } from '@nestjs/config';
import { BillingModule } from './billing/billing.module';

@Module({
  imports: [
    ...(process.env.NODE_ENV !== 'production'
      ? [ConfigModule.forRoot({ envFilePath: '.env.development' })]
      : []),
    ApiModule,
    KeycloakModule,
    BillingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
