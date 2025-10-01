import { Body, Controller, Get, Put, Req } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Notifications')
@ApiBearerAuth('bearer')
@Controller('me/notifications')
export class NotificationPrefsController {
  constructor(private prisma: PrismaService) {}

  @Get('prefs')
  async getPrefs(@Req() req: any) {
    const userId: string = req.user?.id;
    if (!userId) throw new Error('Unauthorized'); // or throw HttpException(401)

    const p = await this.prisma.notificationPrefs.findUnique({
      where: { userId },
    });
    return (
      p ?? {
        emailEnabled: true,
        smsEnabled: true,
        orderPaidEmail: true,
        orderPaidSms: true,
        deliveryAssignedEmail: true,
        deliveryAssignedSms: true,
        deliveryDeliveredEmail: true,
        deliveryDeliveredSms: true,
        payoutSentEmail: true,
        payoutSentSms: true,
      }
    );
  }

  @Put('prefs')
  async upsertPrefs(
    @Req() req: any,
    @Body()
    body: Partial<{
      emailEnabled: boolean;
      smsEnabled: boolean;
      orderPaidEmail: boolean;
      orderPaidSms: boolean;
      deliveryAssignedEmail: boolean;
      deliveryAssignedSms: boolean;
      deliveryDeliveredEmail: boolean;
      deliveryDeliveredSms: boolean;
      payoutSentEmail: boolean;
      payoutSentSms: boolean;
    }>,
  ) {
    const userId: string = req.user?.id;
    if (!userId) throw new Error('Unauthorized');

    await this.prisma.notificationPrefs.upsert({
      where: { userId },
      create: { userId, ...body },
      update: { ...body },
    });
    return { ok: true };
  }
}
