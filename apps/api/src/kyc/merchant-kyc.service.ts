import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KycStatus } from '@prisma/client';

@Injectable()
export class MerchantKycService {
  constructor(private prisma: PrismaService) {}

  me(userId: string) {
    return this.prisma.merchantProfile.findFirst({
      where: { userId },
      select: {
        id: true,
        storeName: true,
        status: true,
        kyc: { select: { id: true, status: true, reviewNote: true } } as any,
      }, // will work once relation is used
    });
  }

  async submit(
    userId: string,
    data: {
      merchantProfileId: string;
      contactName: string;
      businessName?: string;
      taxId?: string;
      address?: string;
      docUrl?: string;
    },
  ) {
    // Verify ownership
    const mp = await this.prisma.merchantProfile.findUnique({
      where: { id: data.merchantProfileId },
    });
    if (!mp || mp.userId !== userId)
      throw new BadRequestException('invalid merchant profile');

    const exists = await this.prisma.merchantKyc.findUnique({
      where: { merchantProfileId: data.merchantProfileId },
    });
    const payload = {
      ...data,
      status: KycStatus.PENDING,
      reviewedAt: null,
      reviewedById: null,
      reviewNote: null,
    };
    return exists
      ? this.prisma.merchantKyc.update({
          where: { merchantProfileId: data.merchantProfileId },
          data: payload,
        })
      : this.prisma.merchantKyc.create({ data: payload });
  }

  async approve(id: string, adminId: string, note?: string) {
    const k = await this.prisma.merchantKyc.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewNote: note ?? null,
        reviewedAt: new Date(),
        reviewedById: adminId,
      },
    });
    // Activate merchant profile on approval
    await this.prisma.merchantProfile.update({
      where: { id: k.merchantProfileId },
      data: { status: 'ACTIVE' },
    });
    return k;
  }

  async reject(id: string, adminId: string, note?: string) {
    return this.prisma.merchantKyc.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewNote: note ?? null,
        reviewedAt: new Date(),
        reviewedById: adminId,
      },
    });
  }
}
