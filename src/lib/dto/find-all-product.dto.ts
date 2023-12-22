import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, Max, Min } from 'class-validator';
import { EcommerceGateway } from '../interfaces/ecommerce-gateway.enum';

export class FindAllProductDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @Max(1)
  @Min(0)
  active: number;

  @IsOptional()
  @IsEnum(EcommerceGateway)
  gateway: EcommerceGateway;
}
