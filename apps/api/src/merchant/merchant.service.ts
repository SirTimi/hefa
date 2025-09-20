import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MerchantStatus } from '@prisma/client';

@Injectable()
export class MerchantService {
  constructor(private prisma: PrismaService) {}

  async createMyProfile(userId: string, storeName: string) {
    const exists = await this.prisma.merchantProfile.findFirst({
      where: { userId },
    });
    if (exists)
      throw new BadRequestException('merchant profile already exists');
    const slug = storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return this.prisma.merchantProfile.create({
      data: { userId, storeName, slug, status: 'PENDING' },
    });
  }

  getMyProfile(userId: string) {
    return this.prisma.merchantProfile.findFirst({ where: { userId } });
  }

  async activateMyProfile(userId: string) {
    const mp = await this.prisma.merchantProfile.findFirst({
      where: { userId },
    });
    if (!mp) throw new BadRequestException('no merchant profile');
    return this.prisma.merchantProfile.update({
      where: { id: mp.id },
      data: { status: 'ACTIVE' },
    });
  }
}
