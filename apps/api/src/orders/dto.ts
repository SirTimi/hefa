// apps/api/src/orders/dto.ts
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
  IsEmail,
  IsBoolean,
} from 'class-validator';

export enum OrderScope {
  BUYER = 'buyer',
  SELLER = 'seller',
}

export class CreateOrderDto {
  @IsString() currency!: string;
  @IsInt() @Min(100) amount!: number;
  @IsString() @IsBoolean() asMerchant?: boolean;
}

export class CreateGuestOrderDto {
  @IsString() currency!: string;
  @IsInt() @Min(100) amount!: number;
  @IsOptional() @IsString() customerName?: string;
  @IsString() customerPhone!: string;
  @IsOptional() @IsEmail() customerEmail?: string;
}

export class CreatePayIntentDto {
  @IsString() provider!: 'DUMMY';
}

export class ReleaseDto {
  @IsString() driverId!: string;
  @IsInt() @Min(0) @Max(10000) feeBps!: number;
}

export class ListOrdersQuery {
  @IsOptional() @IsEnum(OrderScope) scope?: OrderScope;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() cursor?: string;
  @IsOptional() @IsInt() @Min(1) take?: number;
}
