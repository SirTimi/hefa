import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KycStatus } from '@prisma/client';

@Injectable()
export class DriverKycService {
  constructor(private prisma: PrismaService) {}

  me(userId: string) {
    return this.prisma.driverKyc.findUnique({ where: { userId } });
  }

  async submit(
    userId: string,
    data: {
      fullName: string;
      idNumber: string;
      licenseNumber: string;
      licenseExpiry?: string;
      vehicleType?: string;
      vehiclePlate?: string;
      idDocUrl?: string;
      licenseDocUrl?: string;
      selfieUrl?: string;
    },
  ) {
    const exists = await this.prisma.driverKyc.findUnique({
      where: { userId },
    });
    const payload = {
      ...data,
      licenseExpiry: data.licenseExpiry
        ? new Date(data.licenseExpiry)
        : undefined,
      status: KycStatus.PENDING,
      reviewNote: null,
      reviewedAt: null,
      reviewedById: null,
    };
    return exists
      ? this.prisma.driverKyc.update({ where: { userId }, data: payload })
      : this.prisma.driverKyc.create({ data: { userId, ...payload } });
  }

  async approve(id: string, adminId: string, note?: string) {
    await this.prisma.driverKyc.update({
      where: { id },
      data: {
        status: KycStatus.APPROVED,
        reviewNote: note ?? null,
        reviewedAt: new Date(),
        reviewedById: adminId,
      },
    });
  }

  async reject(id: string, adminId: string, note?: string) {
    await this.prisma.driverKyc.update({
      where: { id },
      data: {
        status: KycStatus.REJECTED,
        reviewNote: note ?? null,
        reviewedAt: new Date(),
        reviewedById: adminId,
      },
    });
  }
}
