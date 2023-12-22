import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateStripeCustomerDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;
  @IsNotEmpty()
  @IsString()
  fullName: string;
}
