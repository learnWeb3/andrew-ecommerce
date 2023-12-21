import { Transform } from 'class-transformer';
import { IsOptional, Max, Min } from 'class-validator';

export class FindAllProductDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @Max(1)
  @Min(0)
  active: number;
}
