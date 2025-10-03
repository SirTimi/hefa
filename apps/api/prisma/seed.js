/* eslint-disable */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// helpers
const hash = (pwd) => bcrypt.hashSync(pwd, 10);

async function upsertUser({ email, phone, role, password }) {
  return prisma.user.upsert({
    where: email ? { email } : { phone },
    update: { role },
    create: {
      email: email ?? null,
      phone: phone ?? null,
      role,
      isEmailVerified: true,
      passwordHash: password ? hash(password) : null,
    },
  });
}

async function ensureMerchantProfile(userId, { storeName, slug }) {
  const existing = await prisma.merchantProfile.findFirst({
    where: { userId, slug },
  });
  if (existing) return existing;
  return prisma.merchantProfile.create({
    data: { userId, storeName, slug, status: 'ACTIVE' },
  });
}

async function ensureWalletAccount({
  ownerType,
  ownerId,
  purpose,
  type,
  currency,
}) {
  // composite unique contains nullable ownerId → use findFirst + create
  let acc = await prisma.walletAccount.findFirst({
    where: { ownerType, ownerId: ownerId ?? null, purpose, currency },
  });
  if (!acc) {
    acc = await prisma.walletAccount.create({
      data: { ownerType, ownerId: ownerId ?? null, purpose, type, currency },
    });
  }
  return acc;
}

async function postTxn(txnId, lines) {
  // idempotent: if txn exists, skip
  const exists = await prisma.journalEntry.findFirst({ where: { txnId } });
  if (exists) return;

  let lineNo = 1;
  for (const l of lines) {
    const acc = await ensureWalletAccount({
      ownerType: l.account.owner.ownerType,
      ownerId: l.account.owner.ownerId ?? null,
      purpose: l.account.purpose,
      type: l.account.type,
      currency: l.account.currency,
    });
    await prisma.journalEntry.create({
      data: {
        txnId,
        lineNo: lineNo++,
        accountId: acc.id,
        side: l.side, // 'DEBIT' | 'CREDIT'
        amount: l.amount,
        currency: l.account.currency,
        meta: l.meta ?? {},
      },
    });
  }
}

async function main() {
  console.log('Seeding…');

  // --- USERS
  const admin = await upsertUser({
    email: 'admin@hefa.local',
    phone: '08000000001',
    role: 'ADMIN',
    password: 'Admin123!',
  });

  const buyer = await upsertUser({
    email: 'buyer@hefa.local',
    phone: '08000000002',
    role: 'USER',
    password: 'Buyer123!',
  });

  const sellerUser = await upsertUser({
    email: 'seller@hefa.local',
    phone: '08000000003',
    role: 'USER', // can also buy
    password: 'Seller123!',
  });

  const driver = await upsertUser({
    email: 'driver@hefa.local',
    phone: '08000000004',
    role: 'DRIVER',
    password: 'Driver123!',
  });

  // --- MERCHANT PROFILE (+ KYC approved)
  const mp = await ensureMerchantProfile(sellerUser.id, {
    storeName: 'Demo Mart',
    slug: 'demo-mart',
  });
  await prisma.merchantKyc.upsert({
    where: { merchantProfileId: mp.id },
    update: {
      status: 'APPROVED',
      reviewedById: admin.id,
      reviewedAt: new Date(),
    },
    create: {
      merchantProfileId: mp.id,
      contactName: 'Demo Seller',
      businessName: 'Demo Mart NG',
      status: 'APPROVED',
      reviewedById: admin.id,
      reviewedAt: new Date(),
    },
  });

  // --- DRIVER KYC approved + presence online
  await prisma.driverKyc.upsert({
    where: { userId: driver.id },
    update: {
      status: 'APPROVED',
      reviewedById: admin.id,
      reviewedAt: new Date(),
    },
    create: {
      userId: driver.id,
      fullName: 'Demo Driver',
      idNumber: 'DRV-123456',
      licenseNumber: 'AAA-1111',
      status: 'APPROVED',
      reviewedById: admin.id,
      reviewedAt: new Date(),
    },
  });
  await prisma.driverPresence.upsert({
    where: { driverId: driver.id },
    update: { online: true, lastSeenAt: new Date() },
    create: { driverId: driver.id, online: true },
  });

  // --- PRODUCTS (MVP placeholder)
  const prod1 = await prisma.product
    ?.create?.({
      data: {
        merchantProfileId: mp.id,
        name: 'Demo Widget',
        price: 150000, // in kobo
        currency: 'NGN',
        stock: 20,
        active: true,
      },
    })
    .catch(() => null); // ignore if you haven't built products table

  const prod2 = await prisma.product
    ?.create?.({
      data: {
        merchantProfileId: mp.id,
        name: 'Demo Gadget',
        price: 95000,
        currency: 'NGN',
        stock: 35,
        active: true,
      },
    })
    .catch(() => null);

  // Currency baseline
  const C = 'NGN';

  // --- ACCOUNTS (platform level)
  await ensureWalletAccount({
    ownerType: 'PLATFORM',
    ownerId: null,
    purpose: 'ESCROW',
    type: 'LIABILITY',
    currency: C,
  });
  await ensureWalletAccount({
    ownerType: 'PLATFORM',
    ownerId: null,
    purpose: 'CASH_GATEWAY',
    type: 'ASSET',
    currency: C,
  });
  await ensureWalletAccount({
    ownerType: 'PLATFORM',
    ownerId: null,
    purpose: 'FEES',
    type: 'INCOME',
    currency: C,
  });

  // --- ORDERS

  // 1) Buyer pays merchant (held in escrow)
  const orderPaidHeld = await prisma.order.upsert({
    where: { publicRef: 'DEMO-ORDER-HELD' },
    update: {},
    create: {
      publicRef: 'DEMO-ORDER-HELD',
      creatorType: 'MERCHANT',
      createdByMerchantId: mp.id,
      currency: C,
      amount: 250000,
      status: 'PAID_HELD',
    },
  });

  const intent1 = await prisma.paymentIntent.upsert({
    where: {
      provider_providerRef: {
        provider: 'PAYSTACK',
        providerRef: 'pi_demo_held',
      },
    },
    update: { status: 'SUCCEEDED' },
    create: {
      orderId: orderPaidHeld.id,
      provider: 'PAYSTACK',
      providerRef: 'pi_demo_held',
      status: 'SUCCEEDED',
      amount: orderPaidHeld.amount,
      currency: C,
      metadata: { demo: true },
    },
  });

  // Ledger: hold in escrow (DR asset cash_gateway, CR liability escrow)
  await postTxn(`pay:${intent1.id}`, [
    {
      side: 'DEBIT',
      amount: intent1.amount,
      account: {
        owner: { ownerType: 'PLATFORM' },
        purpose: 'CASH_GATEWAY',
        type: 'ASSET',
        currency: C,
      },
      meta: { orderId: orderPaidHeld.id, intent: intent1.id },
    },
    {
      side: 'CREDIT',
      amount: intent1.amount,
      account: {
        owner: { ownerType: 'PLATFORM' },
        purpose: 'ESCROW',
        type: 'LIABILITY',
        currency: C,
      },
      meta: { orderId: orderPaidHeld.id, intent: intent1.id },
    },
  ]);

  // 2) Another order → delivered and released to merchant (income fee kept)
  const orderReleased = await prisma.order.upsert({
    where: { publicRef: 'DEMO-ORDER-RELEASED' },
    update: {},
    create: {
      publicRef: 'DEMO-ORDER-RELEASED',
      creatorType: 'MERCHANT',
      createdByMerchantId: mp.id,
      currency: C,
      amount: 180000,
      status: 'RELEASED',
    },
  });

  const intent2 = await prisma.paymentIntent.upsert({
    where: {
      provider_providerRef: {
        provider: 'PAYSTACK',
        providerRef: 'pi_demo_rel',
      },
    },
    update: { status: 'SUCCEEDED' },
    create: {
      orderId: orderReleased.id,
      provider: 'PAYSTACK',
      providerRef: 'pi_demo_rel',
      status: 'SUCCEEDED',
      amount: orderReleased.amount,
      currency: C,
      metadata: { demo: true },
    },
  });

  // Hold
  await postTxn(`pay:${intent2.id}`, [
    {
      side: 'DEBIT',
      amount: intent2.amount,
      account: {
        owner: { ownerType: 'PLATFORM' },
        purpose: 'CASH_GATEWAY',
        type: 'ASSET',
        currency: C,
      },
      meta: { orderId: orderReleased.id, intent: intent2.id },
    },
    {
      side: 'CREDIT',
      amount: intent2.amount,
      account: {
        owner: { ownerType: 'PLATFORM' },
        purpose: 'ESCROW',
        type: 'LIABILITY',
        currency: C,
      },
      meta: { orderId: orderReleased.id, intent: intent2.id },
    },
  ]);

  // Release: fee 5% to platform income, 95% to merchant receivable
  const feeBps = 500;
  const fee = Math.floor((orderReleased.amount * feeBps) / 10000);
  const toMerchant = orderReleased.amount - fee;

  await postTxn(`rel:${orderReleased.id}`, [
    // Move out of ESCROW liability
    {
      side: 'DEBIT',
      amount: orderReleased.amount,
      account: {
        owner: { ownerType: 'PLATFORM' },
        purpose: 'ESCROW',
        type: 'LIABILITY',
        currency: C,
      },
      meta: { orderId: orderReleased.id, feeBps },
    },
    // Credit merchant receivable (liability)
    {
      side: 'CREDIT',
      amount: toMerchant,
      account: {
        owner: { ownerType: 'MERCHANT', ownerId: mp.id },
        purpose: 'MERCHANT_RECEIVABLE',
        type: 'LIABILITY',
        currency: C,
      },
      meta: { orderId: orderReleased.id },
    },
    // Credit platform fees (income)
    {
      side: 'CREDIT',
      amount: fee,
      account: {
        owner: { ownerType: 'PLATFORM' },
        purpose: 'FEES',
        type: 'INCOME',
        currency: C,
      },
      meta: { orderId: orderReleased.id, feeBps },
    },
  ]);

  // --- DELIVERIES

  // A) Assigned & picked up (not yet delivered)
  const del1 = await prisma.delivery.upsert({
    where: { id: 'demo-del-picked' },
    update: {},
    create: {
      id: 'demo-del-picked',
      orderId: orderPaidHeld.id,
      status: 'PICKED_UP',
      assignedDriverId: driver.id,
      pickupAddress: 'Demo Pickup Address',
      dropoffAddress: 'Demo Dropoff Address',
      pickedUpAt: new Date(),
      podCode: '123456',
    },
  });
  await prisma.deliveryEvent.create({
    data: {
      deliveryId: del1.id,
      actorUserId: driver.id,
      kind: 'PICKED_UP',
      data: { note: 'Picked from seller' },
    },
  });

  // B) Delivered with PoD
  const del2 = await prisma.delivery.upsert({
    where: { id: 'demo-del-delivered' },
    update: {},
    create: {
      id: 'demo-del-delivered',
      orderId: orderReleased.id,
      status: 'DELIVERED',
      assignedDriverId: driver.id,
      pickupAddress: 'Demo Pickup Address',
      dropoffAddress: 'Buyer Address',
      pickedUpAt: new Date(Date.now() - 60 * 60 * 1000),
      deliveredAt: new Date(),
      podCode: '654321',
      podVerifiedAt: new Date(),
      recipientName: 'Client A',
    },
  });
  await prisma.deliveryEvent.create({
    data: {
      deliveryId: del2.id,
      actorUserId: driver.id,
      kind: 'DELIVERED',
      data: { recipientName: 'Client A' },
    },
  });

  // --- PAYOUT SETUP: merchant bank + request pending
  const bank = await prisma.bankAccount.upsert({
    where: {
      ownerType_ownerId_bankCode_accountNo: {
        ownerType: 'MERCHANT',
        ownerId: mp.id,
        bankCode: '058', // GTB example
        accountNo: '0123456789',
      },
    },
    update: {
      accountName: 'Demo Mart',
      isDefault: true,
      recipientCode: 'RCP_demo',
    },
    create: {
      ownerType: 'MERCHANT',
      ownerId: mp.id,
      bankCode: '058',
      accountNo: '0123456789',
      accountName: 'Demo Mart',
      isDefault: true,
      recipientCode: 'RCP_demo',
    },
  });

  await prisma.payoutRequest.upsert({
    where: { id: 'demo-payout-1' },
    update: {},
    create: {
      id: 'demo-payout-1',
      ownerType: 'MERCHANT',
      ownerId: mp.id,
      bankAccountId: bank.id,
      amount: toMerchant, // match receivable
      currency: C,
      provider: 'PAYSTACK',
      status: 'PENDING',
      createdBy: sellerUser.id,
    },
  });

  // --- AUDIT examples
  await prisma.audtLog.createMany({
    data: [
      {
        actorId: admin.id,
        action: 'KYC_APPROVE',
        entity: `MerchantKyc:${mp.id}`,
        details: { note: 'Looks good' },
      },
      {
        actorId: admin.id,
        action: 'PAYOUT_REVIEW',
        entity: 'Payout:demo-payout-1',
        details: { status: 'PENDING' },
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seed complete.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
