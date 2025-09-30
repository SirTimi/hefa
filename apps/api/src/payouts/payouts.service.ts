import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AccountPurpose,
  AccountType,
  JournalSide,
  PaymentProvider,
  PayoutStatus,
  TransferStatus,
} from '@prisma/client';
import { WalletService } from '../wallet/wallet.service';
import { PaystackProvider } from '../payments/paystack.provider';
import { NotifyQueueService } from '../notifications/queue/notify.queue';
import { AuditService } from '../audit/audit.service';

type OwnerKind = 'MERCHANT' | 'DRIVER';

@Injectable()
export class PayoutsService {
  constructor(
    private prisma: PrismaService,
    private wallet: WalletService,
    private paystack: PaystackProvider,
    private notifyQ: NotifyQueueService,
    private audit: AuditService,
  ) {}

  private liabilityPurposeFor(ownerType: OwnerKind) {
    return ownerType === 'MERCHANT'
      ? AccountPurpose.MERCHANT_RECEIVABLE
      : AccountPurpose.DRIVER_PAYABLE;
  }

  /** Compute owner balance (signed, NGN only for now). */
  async ownerLiabilityBalance(
    ownerType: OwnerKind,
    ownerId: string,
    currency: string,
  ) {
    const purpose = this.liabilityPurposeFor(ownerType);
    const acc = await this.prisma.walletAccount.findFirst({
      where: { ownerType, ownerId, purpose, currency },
    });
    if (!acc) return 0;
    const entries = await this.prisma.journalEntry.findMany({
      where: { accountId: acc.id },
    });
    let debit = 0,
      credit = 0;
    for (const e of entries) {
      if (e.side === 'DEBIT') debit += e.amount;
      else credit += e.amount;
    }
    // Liability balance = credit - debit
    return credit - debit;
  }

  /** Owner adds/updates their bank account; Paystack recipient created lazily on approve. */
  async upsertBankAccount(
    ownerType: OwnerKind,
    ownerId: string,
    p: {
      bankCode: string;
      accountNo: string;
      accountName?: string;
      isDefault?: boolean;
    },
  ) {
    const created = await this.prisma.bankAccount.upsert({
      where: {
        ownerType_ownerId_bankCode_accountNo: {
          ownerType,
          ownerId,
          bankCode: p.bankCode,
          accountNo: p.accountNo,
        },
      },
      update: {
        accountName: p.accountName ?? undefined,
        isDefault: p.isDefault ?? undefined,
      },
      create: {
        ownerType,
        ownerId,
        bankCode: p.bankCode,
        accountNo: p.accountNo,
        accountName: p.accountName ?? null,
        isDefault: !!p.isDefault,
      },
    });
    if (p.isDefault) {
      await this.prisma.bankAccount.updateMany({
        where: { ownerType, ownerId, id: { not: created.id } },
        data: { isDefault: false },
      });
    }
    return created;
  }

  /** CREATE PAYOUT REQUEST AFTER BALANCE GUARD. */
  async request(
    ownerType: OwnerKind,
    ownerId: string,
    userId: string,
    bankAccountId: string,
    amount: number,
    currency: string,
  ) {
    if (amount <= 0) throw new BadRequestException('invalid amount');
    const ba = await this.prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
    });
    if (!ba || ba.ownerType !== ownerType || ba.ownerId !== ownerId)
      throw new BadRequestException('bank account mismatch');

    const bal = await this.ownerLiabilityBalance(ownerType, ownerId, currency);
    if (bal < amount) throw new BadRequestException('insufficient balance');
    const minAmt = parseInt(process.env.PAYOUT_MIN_AMOUNT ?? '0', 10);
    if (amount < minAmt) throw new BadRequestException('below minimum');

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const todaySum = await this.prisma.payoutRequest.aggregate({
      _sum: { amount: true },
      where: {
        ownerType,
        ownerId,
        createdAt: { gte: start, lte: end },
        status: { in: ['PENDING', 'APPROVED', 'SENT', 'SUCCEEDED'] },
      },
    });
    const dailyLimit = parseInt(process.env.PAYOUT_DAILY_LIMIT ?? '0', 10);
    if (dailyLimit > 0 && (todaySum._sum.amount ?? 0) + amount > dailyLimit)
      throw new BadRequestException('daily limit exceeded');

    // Optional fee on payout (reduce amount sent later if you want; ledger stays clean)
    const feeBps = parseInt(process.env.PAYOUT_FEE_BPS ?? '0', 10);
    const netAmount = Math.floor((amount * (10000 - feeBps)) / 10000);

    return this.prisma.payoutRequest.create({
      data: {
        ownerType,
        ownerId,
        bankAccountId,
        amount,
        currency,
        provider: PaymentProvider.PAYSTACK,
        status: PayoutStatus.PENDING,
        createdBy: userId,
      },
    });
  }

  /** Admin approve + send via Paystack. */
  async approveAndSend(payoutId: string, adminUserId: string) {
    const p = await this.prisma.payoutRequest.findUnique({
      where: { id: payoutId },
      include: { bankAccount: true },
    });
    if (!p) throw new NotFoundException('payout not found');
    if (!(p.status === 'PENDING' || p.status === 'APPROVED'))
      throw new BadRequestException('invalid status');

    // Ensure recipientCode on bank account
    let ba = p.bankAccount;
    if (!ba.recipientCode) {
      const rc = await this.paystack.createTransferRecipient({
        bankCode: ba.bankCode,
        accountNo: ba.accountNo,
        name: ba.accountName ?? undefined,
      });
      ba = await this.prisma.bankAccount.update({
        where: { id: ba.id },
        data: { recipientCode: rc, verifiedAt: new Date() },
      });
    }

    // Initiate transfer
    const reference = `payout_${p.id}`;
    const init = await this.paystack.initiateTransfer({
      amount: p.amount,
      currency: p.currency,
      recipientCode: ba.recipientCode!,
      reason: `Payout ${p.ownerType}:${p.ownerId}`,
      reference,
    });

    await this.audit.log(adminUserId, 'PAYOUT_SEND', `Payout:${p.id}`, {
      amount: p.amount,
      currency: p.currency,
      reference: init.reference,
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.payoutRequest.update({
        where: { id: p.id },
        data: {
          status: PayoutStatus.SENT,
          updatedAt: new Date(),
          createdBy: adminUserId, // NOTE: if you later add approvedBy, change this field.
        },
      });
      await tx.transfer.create({
        data: {
          payoutRequestId: p.id,
          provider: PaymentProvider.PAYSTACK,
          providerRef: init.reference,
          status: TransferStatus.SENT,
          amount: p.amount,
          currency: p.currency,
        },
      });
    });

    return { ok: true, reference: init.reference };
  }

  /** Webhook: transfer.success / transfer.failed */
  async processTransferWebhook(reference: string, event: string, raw?: any) {
    const tr = await this.prisma.transfer.findUnique({
      where: {
        provider_providerRef: {
          provider: PaymentProvider.PAYSTACK,
          providerRef: reference,
        },
      },
      include: { payoutRequest: true },
    });
    if (!tr) return { ok: false, reason: 'transfer-not-found' };

    if (event.includes('success') && tr.status !== TransferStatus.SUCCEEDED) {
      // Ledger posting (idempotent): DR liability, CR CASH_GATEWAY
      const purpose = this.liabilityPurposeFor(
        tr.payoutRequest.ownerType as OwnerKind,
      );
      const txnId = `PAYOUT:${tr.payoutRequest.id}:${reference}`;

      await this.wallet.post(txnId, [
        {
          side: JournalSide.DEBIT,
          amount: tr.amount,
          account: {
            owner: {
              ownerType: tr.payoutRequest.ownerType as any,
              ownerId: tr.payoutRequest.ownerId,
            },
            purpose,
            type: AccountType.LIABILITY,
            currency: tr.currency,
          },
          meta: { payoutId: tr.payoutRequestId, reference },
        },
        {
          side: JournalSide.CREDIT,
          amount: tr.amount,
          account: {
            owner: { ownerType: 'PLATFORM' },
            purpose: AccountPurpose.CASH_GATEWAY,
            type: AccountType.ASSET,
            currency: tr.currency,
          },
          meta: { payoutId: tr.payoutRequestId, reference },
        },
      ]);

      await this.prisma.$transaction(async (tx) => {
        await tx.transfer.update({
          where: { id: tr.id },
          data: {
            status: TransferStatus.SUCCEEDED,
            rawPayload: raw ?? undefined,
          },
        });
        await tx.payoutRequest.update({
          where: { id: tr.payoutRequestId },
          data: { status: PayoutStatus.SUCCEEDED },
        });
      });

      // ---- P6: Notify owner that payout was sent/succeeded ----
      const owner = await this.resolveOwnerContact(
        tr.payoutRequest.ownerType as OwnerKind,
        tr.payoutRequest.ownerId!,
      );
      if (owner) {
        await this.notifyQ.enqueue({
          kind: 'payout_sent',
          to: {
            email: owner.email ?? null,
            phone: owner.phone ?? null,
            name: owner.name ?? null,
          },
          data: { amount: tr.amount, currency: tr.currency, reference },
        });
      }

      return { ok: true };
    }

    if (event.includes('failed') && tr.status !== TransferStatus.FAILED) {
      await this.prisma.$transaction(async (tx) => {
        await tx.transfer.update({
          where: { id: tr.id },
          data: { status: TransferStatus.FAILED, rawPayload: raw ?? undefined },
        });
        await tx.payoutRequest.update({
          where: { id: tr.payoutRequestId },
          data: { status: PayoutStatus.FAILED },
        });
      });
      return { ok: true };
    }

    return { ok: true, idempotent: true };
  }

  // --- Helpers --------------------------------------------------------------

  /** Resolve contact info for an owner (merchant profile or driver user). */
  private async resolveOwnerContact(ownerType: OwnerKind, ownerId: string) {
    if (ownerType === 'DRIVER') {
      const u = await this.prisma.user.findUnique({
        where: { id: ownerId },
        select: { email: true, phone: true },
      });
      return u
        ? { email: u.email, phone: u.phone, name: null as string | null }
        : null;
    }
    if (ownerType === 'MERCHANT') {
      const mp = await this.prisma.merchantProfile.findUnique({
        where: { id: ownerId },
        select: {
          storeName: true,
          user: { select: { email: true, phone: true } },
        },
      });
      if (!mp) return null;
      return {
        email: mp.user?.email ?? null,
        phone: mp.user?.phone ?? null,
        name: mp.storeName ?? null,
      };
    }
    return null;
  }
}
