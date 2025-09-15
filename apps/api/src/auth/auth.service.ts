import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { addDays, addMinutes } from 'date-fns';
import { TokenType, OtpChannel, OtpPurpose } from '@prisma/client';

const ACCESS_TTL_SEC = 15 * 60;
const REFRESH_TTL_DAYS = 30;
const SECURE_COOKIE = process.env.NODE_ENV === 'production';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private users: UsersService,
    private jwt: JwtService,
  ) {}

  private signAccess(user: { id: string; role: string }, sid?: string) {
    return this.jwt.sign(
      { sub: user.id, role: user.role, sid },
      {
        secret: process.env.JWT_SECRET || 'change-me',
        expiresIn: ACCESS_TTL_SEC,
      },
    );
  }

  private signRefresh(user: { id: string; role: string }, sid: string) {
    return this.jwt.sign(
      { sub: user.id, role: user.role, sid },
      {
        secret: process.env.JWT_SECRET || 'change-me',
        expiresIn: `${REFRESH_TTL_DAYS}d`,
      },
    );
  }

  private async createSession(
    userId: string,
    refreshToken: string,
    meta?: { ua?: string; ip?: string },
  ) {
    const hash = await bcrypt.hash(refreshToken, 12);
    const expiresAt = addDays(new Date(), REFRESH_TTL_DAYS);
    return this.prisma.session.create({
      data: {
        userId,
        refreshHash: hash,
        userAgent: meta?.ua,
        ip: meta?.ip,
        expiresAt,
      },
    });
  }

  async register(dto: { email?: string; phone?: string; password: string }) {
    if (!dto.email && !dto.phone)
      throw new BadRequestException('email or phone required');
    const user = await this.users.createUser({
      email: dto.email,
      phone: dto.phone,
      password: dto.password,
    });
    // issue tokens
    const sid = crypto.randomUUID();
    const access = this.signAccess({ id: user.id, role: user.role }, sid);
    const refresh = this.signRefresh({ id: user.id, role: user.role }, sid);
    await this.createSession(user.id, refresh);
    return { user, access, refresh };
  }

  async loginWithPassword(
    identifier: string,
    password: string,
    meta?: { ua?: string; ip?: string },
  ) {
    const user = await this.users.findByEmailorPhone(identifier);
    if (!user?.passwordHash)
      throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    // If 2FA enabled, the UI should call /auth/2fa/verify after receiving a temp token.
    // For simplicity here, we’ll just issue tokens and rely on a 2FA step-up endpoint for sensitive ops.

    const sid = crypto.randomUUID();
    const access = this.signAccess({ id: user.id, role: user.role }, sid);
    const refresh = this.signRefresh({ id: user.id, role: user.role }, sid);
    await this.createSession(user.id, refresh, meta);
    await this.users.updateLastLogin(user.id);
    return { user, access, refresh };
  }

  async rotateRefresh(
    userId: string,
    sid: string,
    presentedRefresh: string,
    meta?: { ua?: string; ip?: string },
  ) {
    const session = await this.prisma.session
      .findUnique({ where: { id: sid } })
      .catch(() => null);
    if (!session || session.userId !== userId || session.revokedAt)
      throw new UnauthorizedException('Invalid session');
    if (session.expiresAt < new Date())
      throw new UnauthorizedException('Session expired');
    const ok = await bcrypt.compare(presentedRefresh, session.refreshHash);
    if (!ok) throw new UnauthorizedException('Invalid token');

    // rotate
    await this.prisma.session.update({
      where: { id: sid },
      data: { revokedAt: new Date() },
    });
    const newSid = crypto.randomUUID();
    const access = this.signAccess(
      { id: userId, role: (await this.users.findById(userId))!.role },
      newSid,
    );
    const refresh = this.signRefresh(
      { id: userId, role: (await this.users.findById(userId))!.role },
      newSid,
    );
    await this.createSession(userId, refresh, meta);
    return { access, refresh, newSid };
  }

  async logout(sid: string) {
    await this.prisma.session.updateMany({
      where: { id: sid, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { ok: true };
  }

  // --- Email verification & password reset tokens (sha256) ---

  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async createEmailVerifyToken(userId: string) {
    const token = crypto.randomBytes(24).toString('hex');
    const tokenHash = this.hashToken(token);
    await this.prisma.token.create({
      data: {
        userId,
        type: 'EMAIL_VERIFY',
        tokenHash,
        expiresAt: addDays(new Date(), 2),
      },
    });
    return token;
  }

  async verifyEmailToken(token: string) {
    const tokenHash = this.hashToken(token);
    const rec = await this.prisma.token.findFirst({
      where: {
        type: 'EMAIL_VERIFY',
        tokenHash,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!rec) throw new UnauthorizedException('Invalid token');
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: rec.userId },
        data: { isEmailVerified: true },
      }),
      this.prisma.token.update({
        where: { id: rec.id },
        data: { consumedAt: new Date() },
      }),
    ]);
    return { verified: true };
  }

  async createPasswordResetToken(userId: string) {
    const token = crypto.randomBytes(24).toString('hex');
    const tokenHash = this.hashToken(token);
    await this.prisma.token.create({
      data: {
        userId,
        type: 'PASSWORD_RESET',
        tokenHash,
        expiresAt: addMinutes(new Date(), 30),
      },
    });
    return token;
  }

  async resetPasswordWithToken(token: string, newPassword: string) {
    const tokenHash = this.hashToken(token);
    const rec = await this.prisma.token.findFirst({
      where: {
        type: 'PASSWORD_RESET',
        tokenHash,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!rec) throw new UnauthorizedException('Invalid token');
    await this.users.setPassword(rec.userId, newPassword);
    await this.prisma.token.update({
      where: { id: rec.id },
      data: { consumedAt: new Date() },
    });
    return { ok: true };
  }

  // --- OTP login / step-up (via email or SMS). In dev, we just log codes. ---

  private randomCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async requestOtp(
    destination: string,
    purpose: 'LOGIN' | 'STEP_UP',
    channel: 'EMAIL' | 'SMS',
  ) {
    const code = this.randomCode();
    const expiresAt = addMinutes(new Date(), 10);
    const user = await this.users.findByEmailorPhone(destination);
    await this.prisma.otpCode.create({
      data: {
        userId: user?.id,
        destination,
        purpose: purpose as any,
        channel: channel as any,
        code,
        expiresAt,
      },
    });
    // DEV: log instead of sending
    // TODO: integrate email/SMS provider
    console.log(`[OTP][${channel}] ${destination} -> ${code}`);
    return { sent: true };
  }

  async verifyOtp(
    destination: string,
    code: string,
    purpose: 'LOGIN' | 'STEP_UP',
    meta?: { ua?: string; ip?: string },
  ) {
    const rec = await this.prisma.otpCode.findFirst({
      where: {
        destination,
        purpose: purpose as any,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!rec || rec.code !== code)
      throw new UnauthorizedException('Invalid OTP');
    await this.prisma.otpCode.update({
      where: { id: rec.id },
      data: { consumedAt: new Date() },
    });

    // If login and no user, create a new one (OTP-only account)
    let user = rec.userId ? await this.users.findById(rec.userId) : null;
    if (!user) {
      const isEmail = destination.includes('@');
      user = await this.users.createUser({
        email: isEmail ? destination : undefined,
        phone: isEmail ? undefined : destination,
      });
    }

    const sid = crypto.randomUUID();
    const access = this.signAccess({ id: user!.id, role: user!.role }, sid);
    const refresh = this.signRefresh({ id: user!.id, role: user!.role }, sid);
    await this.createSession(user!.id, refresh, meta);
    await this.users.updateLastLogin(user!.id);
    return { user, access, refresh };
  }
}
