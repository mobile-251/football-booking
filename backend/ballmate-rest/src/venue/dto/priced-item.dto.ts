import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class PricedItemDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsInt()
  @Min(0)
  price: number;
}
