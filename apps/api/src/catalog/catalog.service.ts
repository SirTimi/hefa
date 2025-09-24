import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductStatus } from '@prisma/client';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  async assertMerchantActive(userId: string, merchantProfileId: string) {
    const mp = await this.prisma.merchantProfile.findUnique({
      where: { id: merchantProfileId },
    });
    if (!mp || mp.userId !== userId)
      throw new BadRequestException('invalid merchant profile');
    if (mp.status !== 'ACTIVE')
      throw new BadRequestException('merchant not ACTIVE');
    return mp;
  }

  async createProduct(
    userId: string,
    dto: {
      merchantProfileId: string;
      title: string;
      description?: string;
      categories?: string[];
    },
  ) {
    await this.assertMerchantActive(userId, dto.merchantProfileId);
    // upsert categories by slug
    const catConnect = dto.categories?.length
      ? await Promise.all(
          dto.categories.map(async (slug) => {
            const c = await this.prisma.category.upsert({
              where: { slug },
              update: {},
              create: { slug, name: slug },
            });
            return { categoryId: c.id };
          }),
        )
      : [];
    return this.prisma.product.create({
      data: {
        merchantProfileId: dto.merchantProfileId,
        title: dto.title,
        description: dto.description,
        status: ProductStatus.DRAFT,
        categories: { create: catConnect },
      },
    });
  }

  async updateProduct(
    userId: string,
    productId: string,
    payload: { title?: string; description?: string },
  ) {
    const p = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!p) throw new NotFoundException('product not found');
    await this.assertMerchantActive(userId, p.merchantProfileId);
    return this.prisma.product.update({
      where: { id: productId },
      data: payload,
    });
  }

  async setStatus(userId: string, productId: string, status: ProductStatus) {
    const p = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true },
    });
    if (!p) throw new NotFoundException('product not found');
    await this.assertMerchantActive(userId, p.merchantProfileId);
    if (status === ProductStatus.PUBLISHED) {
      if (!p.variants.some((v) => v.active && v.stock >= 0))
        throw new BadRequestException(
          'add at least one active variant before publishing',
        );
    }
    return this.prisma.product.update({
      where: { id: productId },
      data: { status },
    });
  }

  async addVariant(
    userId: string,
    productId: string,
    v: {
      sku: string;
      title: string;
      currency: string;
      price: number;
      stock: number;
      isDefault?: boolean;
      active?: boolean;
    },
  ) {
    const p = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!p) throw new NotFoundException('product not found');
    await this.assertMerchantActive(userId, p.merchantProfileId);

    if (v.isDefault) {
      await this.prisma.productVariant.updateMany({
        where: { productId },
        data: { isDefault: false },
      });
    }
    return this.prisma.productVariant.create({
      data: {
        productId,
        sku: v.sku,
        title: v.title,
        currency: v.currency,
        price: v.price,
        stock: v.stock,
        isDefault: !!v.isDefault,
        active: v.active ?? true,
      },
    });
  }

  async addMedia(
    userId: string,
    productId: string,
    m: { url: string; position?: number },
  ) {
    const p = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!p) throw new NotFoundException('product not found');
    await this.assertMerchantActive(userId, p.merchantProfileId);
    return this.prisma.productMedia.create({
      data: { productId, url: m.url, position: m.position ?? 0 },
    });
  }

  // Public browse
  listPublic(params: {
    q?: string;
    categorySlug?: string;
    merchantSlug?: string;
    take?: number;
    cursor?: string;
  }) {
    const take = Math.min(Math.max(params.take ?? 20, 1), 100);
    return this.prisma.product.findMany({
      where: {
        status: ProductStatus.PUBLISHED,
        ...(params.q
          ? { title: { contains: params.q, mode: 'insensitive' } }
          : {}),
        ...(params.categorySlug
          ? {
              categories: { some: { category: { slug: params.categorySlug } } },
            }
          : {}),
        ...(params.merchantSlug
          ? { merchantProfile: { slug: params.merchantSlug } }
          : {}),
      },
      select: {
        id: true,
        title: true,
        description: true,
        merchantProfile: { select: { id: true, storeName: true, slug: true } },
        variants: {
          where: { active: true },
          select: {
            id: true,
            title: true,
            price: true,
            currency: true,
            stock: true,
            isDefault: true,
          },
        },
        media: { orderBy: { position: 'asc' }, take: 1 },
      },
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  getPublic(productId: string) {
    return this.prisma.product.findFirst({
      where: { id: productId, status: ProductStatus.PUBLISHED },
      select: {
        id: true,
        title: true,
        description: true,
        merchantProfile: { select: { id: true, storeName: true, slug: true } },
        variants: {
          where: { active: true },
          select: {
            id: true,
            title: true,
            price: true,
            currency: true,
            stock: true,
            isDefault: true,
          },
        },
        media: { orderBy: { position: 'asc' } },
        categories: {
          select: { category: { select: { name: true, slug: true } } },
        },
      },
    });
  }
}
