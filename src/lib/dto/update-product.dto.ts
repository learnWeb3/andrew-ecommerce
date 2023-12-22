import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { OmitType } from '@nestjs/swagger';

export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['gateway'] as const),
) {}
