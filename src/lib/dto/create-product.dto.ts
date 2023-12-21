import {
  IsBoolean,
  IsEnum,
  IsISO4217CurrencyCode,
  IsNotEmpty,
  IsNumber,
  Min,
  Validate,
  ValidateIf,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { BillingPeriodicity } from '../interfaces/billing-periodicity.enum';

@ValidatorConstraint()
export class UpTo implements ValidatorConstraintInterface {
  validate(value: any) {
    return typeof value === 'number' || value === 'inf';
  }
}

export class ProductTier {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  unitAmountDecimals: number;
  @IsNotEmpty()
  @Validate(UpTo, {
    message: `upTo must be either a number or inf for infinity, usually the last item of your plan`,
  })
  upTo: number | 'inf';
}

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
}
