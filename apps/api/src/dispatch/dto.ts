import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class DispatchOrderDto {
  @IsOptional() @IsString() pickupAddress?: string;
  @IsOptional() @IsNumber() pickupLat?: number;
  @IsOptional() @IsNumber() pickupLng?: number;

  @IsOptional() @IsString() dropoffAddress?: string;
  @IsOptional() @IsNumber() dropoffLat?: number;
  @IsOptional() @IsNumber() dropoffLng?: number;

  // selection params
  @IsOptional() @IsInt() @Min(1) @Max(50) maxOffers?: number; // default 10
  @IsOptional() @IsNumber() @Min(0.5) @Max(100) radiusKm?: number; // default 20
  @IsOptional() @IsInt() @Min(10) @Max(600) ttlSec?: number; // default 60
}
