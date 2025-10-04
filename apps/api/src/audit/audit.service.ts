import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}
  log(actorId: string | null, action: string, entity?: string, details?: any) {
    return this.prisma.audtLog.create({
      data: { actorId, action, entity, details: details ?? undefined },
    });
  }
}
