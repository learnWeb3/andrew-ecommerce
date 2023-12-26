import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { EcommerceGateway } from '../interfaces/ecommerce-gateway.enum';

export class CancelSubscriptionDto {
  @IsNotEmpty()
  @IsString()
  customer: string;
  @IsNotEmpty()
  @IsString()
  contract: string;
  @IsNotEmpty()
  @IsEnum(EcommerceGateway)
  gateway: EcommerceGateway;
}
