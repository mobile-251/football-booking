import { IsOptional, IsString } from 'class-validator';

export class UpdatePoliciesDto {
  @IsOptional()
  @IsString()
  booking?: string;

  @IsOptional()
  @IsString()
  usage?: string;

  @IsOptional()
  @IsString()
  insurance?: string;
}
