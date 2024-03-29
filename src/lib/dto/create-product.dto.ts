import {
  IsBoolean,
  IsEnum,
  IsISO4217CurrencyCode,
  IsNotEmpty,
  Min,
  ValidateIf,
} from 'class-validator';
import { BillingPeriodicity } from '../interfaces/billing-periodicity.enum';
import { EcommerceGateway } from '../interfaces/ecommerce-gateway.enum';

export class CreateProductDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsISO4217CurrencyCode()
  currency: string;

  @IsNotEmpty()
  @Min(1)
  price: number;

  @IsBoolean()
  subscription: boolean;

  @ValidateIf((object) => object.subscription)
  @IsEnum(BillingPeriodicity)
  periodicity: BillingPeriodicity;

  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  @IsBoolean()
  active: boolean;

  @IsNotEmpty()
  @IsEnum(EcommerceGateway)
  gateway: EcommerceGateway;
}
