import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  RequestOtpDto,
  ResetPasswordDto,
  StartTwoFADto,
  VerifyOtpDto,
  VerifyTwoFADto,
} from './dto';
import { JwtAccessGuard, JwtRefreshGuard, Roles, RolesGuard } from './guards';
import { TwoFAService } from './twofa.service';

const SECURE_COOKIE = process.env.NODE_ENV === 'production';

@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private users: UsersService,
    private twofa: TwoFAService,
  ) {}

  private setRefreshCookie(res: Response, token: string) {
    // scope cookie to refresh endpoint to reduce surface
    res.cookie('rt', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: SECURE_COOKIE,
      path: '/auth/refresh',
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30d
    });
  }
  private clearRefreshCookie(res: Response) {
    res.clearCookie('rt', { path: '/auth/refresh' });
  }

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, access, refresh } = await this.auth.register(dto);
    this.setRefreshCookie(res, refresh);
    return { user, access };
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, access, refresh } = await this.auth.loginWithPassword(
      dto.identifier,
      dto.password,
      {
        ua: req.headers['user-agent'] || undefined,
        ip: req.ip,
      },
    );
    this.setRefreshCookie(res, refresh);
    return { user, access };
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(200)
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.rt;
    const { access, refresh } = await this.auth.rotateRefresh(
      req.user.userId,
      req.user.sid,
      token,
      {
        ua: req.headers['user-agent'],
        ip: req.ip,
      },
    );
    this.setRefreshCookie(res, refresh);
    return { access };
  }

  @Post('logout')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(200)
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.user.sid);
    this.clearRefreshCookie(res);
    return { ok: true };
  }

  // --- Me (protected) ---
  @Get('me')
  @UseGuards(JwtAccessGuard)
  async me(@Req() req: any) {
    const user = await this.users.findById(req.user.userId);
    return { user };
  }

  // --- OTP (login or step-up) ---
  @Post('request-otp')
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.auth.requestOtp(
      dto.destination,
      dto.purpose as any,
      dto.channel as any,
    );
  }

  @Post('verify-otp')
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, access, refresh } = await this.auth.verifyOtp(
      dto.destination,
      dto.code,
      dto.purpose as any,
      {
        ua: req.headers['user-agent'] || undefined,
        ip: req.ip,
      },
    );
    this.setRefreshCookie(res, refresh);
    return { user, access };
  }

  // --- 2FA (TOTP) ---
  @Post('2fa/setup')
  @UseGuards(JwtAccessGuard)
  async setup2fa(@Req() req: any) {
    return this.twofa.generateSecret(req.user.userId); // returns otpauth url + secret (show QR in UI)
  }

  @Post('2fa/verify')
  @UseGuards(JwtAccessGuard)
  async verify2fa(@Req() req: any, @Body() dto: VerifyTwoFADto) {
    return this.twofa.enable(req.user.userId, dto.code);
  }

  // --- Email verification / Password reset ---
  @Post('email/send-verify')
  @UseGuards(JwtAccessGuard)
  async sendEmailVerify(@Req() req: any) {
    const token = await this.auth.createEmailVerifyToken(req.user.userId);
    // DEV: log instead of sending email
    console.log('[EMAIL_VERIFY_URL] /auth/email/verify?token=' + token);
    return { sent: true };
  }

  @Post('email/verify')
  async verifyEmail(@Body('token') token: string) {
    return this.auth.verifyEmailToken(token);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    // if user not found, still respond 200 to avoid enumeration
    const u = await this.users.findByEmailorPhone(dto.email).catch(() => null);
    if (u?.id) {
      const token = await this.auth.createPasswordResetToken(u.id);
      console.log('[RESET_URL] /auth/reset-password?token=' + token);
    }
    return { sent: true };
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPasswordWithToken(dto.token, dto.newPassword);
  }
}
