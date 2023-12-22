import { PartialType } from '@nestjs/mapped-types';
import { CreateStripeProductDto } from './create-stripe-product.dto';

export class UpdateStripeProductDto extends PartialType(
  CreateStripeProductDto,
) {}
