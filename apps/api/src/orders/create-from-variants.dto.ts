import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class Item {
  @IsString() variantId!: string;
  @IsInt() @Min(1) quantity!: number;
}

export class CreateOrderFromVariantsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Item)
  items!: Item[];

  // guest contact (optional if authed)
  @IsOptional() @IsString() customerName?: string;
  @IsOptional() @IsString() customerPhone?: string;
  @IsOptional() @IsString() customerEmail?: string;
}
