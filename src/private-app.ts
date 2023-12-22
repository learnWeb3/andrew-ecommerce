import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PrivateApiModule } from './private-api/private-api.module';

@Module({
  imports: [
    ...(process.env.NODE_ENV !== 'production'
      ? [ConfigModule.forRoot({ envFilePath: '.env.development' })]
      : []),
    MongooseModule.forRoot(process.env.MONGO_URI),
    PrivateApiModule,
  ],
  controllers: [],
  providers: [],
})
export class PrivateAppModule {}
