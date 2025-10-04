import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Wallet')
@ApiBearerAuth('bearer')
@Controller('wallet')
export class WalletController {}
