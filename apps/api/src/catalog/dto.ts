import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductDto {
  merchantProfileId!: string;
  title!: string;
  @IsOptional() description?: string;
  @IsOptional() categories?: string[]; // category slugs
}

export class UpdateProductDto {
  @IsOptional() title?: string;
  @IsOptional() description?: string;
}

export class AddVariantDto {
  sku!: string;
  title!: string;
  currency!: string;
  @IsInt() @Min(0) price!: number;
  @IsInt() @Min(0) stock!: number;
  @IsOptional() @IsBoolean() isDefault?: boolean;
  @IsOptional() @IsBoolean() active?: boolean;
}

export class SetStatusDto {
  status!: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export class AddMediaDto {
  url!: string;
  @IsOptional() @IsInt() position?: number;
}
