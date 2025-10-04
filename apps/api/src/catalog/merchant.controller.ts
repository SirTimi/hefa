import {
  Body,
  Controller,
  Param,
  Post,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards';
import { CatalogService } from './catalog.service';
import {
  AddMediaDto,
  AddVariantDto,
  CreateProductDto,
  SetStatusDto,
  UpdateProductDto,
} from './dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('merchant/catalog')
@UseGuards(JwtAccessGuard)
@Roles(Role.USER) // merchant is a user; service checks ownership + ACTIVE
export class CatalogMerchantController {
  constructor(private svc: CatalogService) {}

  @Post('products')
  create(@Req() req: any, @Body() dto: CreateProductDto) {
    return this.svc.createProduct(req.user.userId, dto);
  }

  @Patch('products/:id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.svc.updateProduct(req.user.userId, id, dto);
  }

  @Patch('products/:id/status')
  setStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: SetStatusDto,
  ) {
    return this.svc.setStatus(req.user.userId, id, dto.status as any);
  }

  @Post('products/:id/variants')
  addVariant(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: AddVariantDto,
  ) {
    return this.svc.addVariant(req.user.userId, id, dto);
  }

  @Post('products/:id/media')
  addMedia(@Req() req: any, @Param('id') id: string, @Body() dto: AddMediaDto) {
    return this.svc.addMedia(req.user.userId, id, dto);
  }
}
