import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { EcommerceGateway } from '../interfaces/ecommerce-gateway.enum';

export class CreateCheckoutUrlDto {
  @IsNotEmpty()
  @IsEnum(EcommerceGateway)
  gateway: EcommerceGateway;

  @IsNotEmpty()
  @IsEmail()
  customerEmail: string;

  @IsNotEmpty()
  @IsString()
  product: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  metadata: Record<string, string>;
}
