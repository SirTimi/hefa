import {
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsPhoneNumber() phone?: string;
  @IsString() @MinLength(8) password!: string;
}

export class LoginDto {
  @IsString() identifier!: string; //email or phone
  @IsString() password!: string;
}

export class RefreshDto {}

export class LogoutDto {}

export class RequestOtpDto {
  @IsString() destination!: string; // email or phone (raw)
  @IsString() purpose!: 'LOGIN' | 'STEP_UP';
  @IsString() channel!: 'EMAIL' | 'SMS';
}

export class VerifyOtpDto {
  @IsString() destination!: string;
  @IsString() code!: string;
  @IsString() purpose!: 'LOGIN' | 'STEP_UP';
}

export class StartTwoFADto {}
export class VerifyTwoFADto {
  @IsString() code!: string;
}

export class ForgotPasswordDto {
  @IsEmail() email!: string;
}
export class ResetPasswordDto {
  @IsString() token!: string;
  @IsString() @MinLength(8) newPassword!: string;
}
