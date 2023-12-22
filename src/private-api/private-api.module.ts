import { Module, forwardRef } from '@nestjs/common';
import { GatewayController } from './gateway/gateway.controller';
import { GatewayModule } from 'src/gateway/gateway.module';

@Module({
  imports: [forwardRef(() => GatewayModule)],
  controllers: [GatewayController],
})
export class PrivateApiModule {}
