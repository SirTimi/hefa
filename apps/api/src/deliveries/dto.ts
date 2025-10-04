import { IsOptional, IsString } from 'class-validator';

export class ArrivedDto {
  @IsOptional() @IsString() note?: string;
}

export class PickedUpDto {
  @IsOptional() @IsString() note?: string;
}

export class DeliverDto {
  @IsString() code!: string; // 6-digit OTP
  @IsOptional() @IsString() recipientName?: string;
  @IsOptional() @IsString() recipientPhotoUrl?: string;
}
