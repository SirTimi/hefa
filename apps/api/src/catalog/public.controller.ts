import { Controller, Get, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogPublicController {
  constructor(private svc: CatalogService) {}

  @Get('products')
  list(
    @Query('q') q?: string,
    @Query('category') categorySlug?: string,
    @Query('merchant') merchantSlug?: string,
    @Query('take') take?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.svc.listPublic({
      q,
      categorySlug,
      merchantSlug,
      take: take ? parseInt(take, 10) : undefined,
      cursor,
    });
  }

  @Get('products/:id')
  get(@Param('id') id: string) {
    return this.svc.getPublic(id);
  }
}
