import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KycStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class DriverKycService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

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

  async approve(id: string, adminUserId: string, note?: string) {
    const kyc = await this.prisma.driverKyc.findUnique({
      where: { id },
    });
    if (!kyc) throw new NotFoundException('driver kyc not found');

    const updated = await this.prisma.driverKyc.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewNote: note ?? null,
        reviewedById: adminUserId,
        reviewedAt: new Date(),
      },
    });

    await this.audit.log(
      adminUserId,
      'KYC_APPROVE',
      `DriverKyc:${updated.id}`,
      { note },
    );
    return updated;
  }

  async reject(id: string, adminUserId: string, note?: string) {
    const kyc = await this.prisma.driverKyc.findUnique({
      where: { id },
    });
    if (!kyc) throw new NotFoundException('driver kyc not found');

    const updated = await this.prisma.driverKyc.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewNote: note ?? null,
        reviewedById: adminUserId,
        reviewedAt: new Date(),
      },
    });
    await this.audit.log(adminUserId, 'KYC_REJECT', `DriverKyc:${updated.id}`, {
      note,
    });
    return updated;
  }
}
