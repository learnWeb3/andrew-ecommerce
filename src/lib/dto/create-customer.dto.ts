import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { EcommerceGateway } from '../interfaces/ecommerce-gateway.enum';

export class CreateCustomerDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;
  @IsNotEmpty()
  @IsString()
  fullName: string;
  @IsNotEmpty()
  @IsEnum(EcommerceGateway)
  gateway: EcommerceGateway;
}
