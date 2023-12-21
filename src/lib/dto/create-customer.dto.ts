import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateCustomer {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;
  @IsNotEmpty()
  @IsString()
  fullName: string;
}
