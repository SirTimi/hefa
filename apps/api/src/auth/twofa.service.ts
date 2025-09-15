import { Injectable, UnauthorizedException } from '@nestjs/common';
import { authenticator } from 'otplib';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TwoFAService {
  constructor(private prisma: PrismaService) {}

  async generateSecret(userId: string) {
    const secret = authenticator.generateSecret();
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { twoFASecret: secret },
    });
    const otpauth = authenticator.keyuri(
      user.email || user.phone || userId,
      'HEFA',
      secret,
    );
    return { otpauthUrl: otpauth, secret };
  }

  async enable(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFASecret)
      throw new UnauthorizedException('2FA secret not set');
    const ok = authenticator.verify({ token: code, secret: user.twoFASecret });
    if (!ok) throw new UnauthorizedException('Invalid 2FA code');
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFAEnabled: true },
    });
    return { enabled: true };
  }

  async verify(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFAEnabled || !user.twoFASecret) return { ok: false };
    const ok = authenticator.verify({ token: code, secret: user.twoFASecret });
    return { ok };
  }
}
