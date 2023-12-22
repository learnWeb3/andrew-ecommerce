import {
  IsBoolean,
  IsEnum,
  IsISO4217CurrencyCode,
  IsNotEmpty,
  Min,
  ValidateIf,
} from 'class-validator';
import { BillingPeriodicity } from '../interfaces/billing-periodicity.enum';

export class CreateStripeProductDto {
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
}
