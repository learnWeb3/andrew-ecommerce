import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { EcommerceGateway } from '../interfaces/ecommerce-gateway.enum';

export class ApplyActiveSubscriptionDiscountDto {
  @IsNotEmpty()
  @IsString()
  customer: string;

  @IsNotEmpty()
  @IsString()
  contract: string;

  @IsNotEmpty()
  @IsEnum(EcommerceGateway)
  gateway: EcommerceGateway;

  @IsNumber()
  @IsInt()
  @Min(0)
  @Max(100)
  discountPercent: number;
}
