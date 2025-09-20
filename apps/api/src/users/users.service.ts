import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmailorPhone(identifier: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async createUser(data: {
    email?: string;
    phone?: string;
    password?: string;
    role?: Role;
  }) {
    const passwordHash = data.password
      ? await bcrypt.hash(data.password, 12)
      : null;
    return this.prisma.user.create({
      data: {
        ...(data.email ? { email: data.email.toLowerCase() } : {}),
        ...(data.phone ? { phone: data.phone } : {}),
        passwordHash,
        role: data.role ?? 'USER',
      },
    });
  }

  async setPassword(userId: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 12);
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async markEmailVerified(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isEmailVerified: true },
    });
  }

  async updateLastLogin(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }
}
