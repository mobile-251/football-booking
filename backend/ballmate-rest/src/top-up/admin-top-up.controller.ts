import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { toDecimal } from '../common/coin.util';

@Controller('admin/top-up-packages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminTopUpController {
  constructor(private prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.topUpPackage.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  @Post()
  create(
    @Body()
    body: {
      name: string;
      priceVnd: number;
      baseCoin: number;
      bonusCoin?: number;
      sortOrder?: number;
    },
  ) {
    return this.prisma.topUpPackage.create({
      data: {
        name: body.name,
        priceVnd: body.priceVnd,
        baseCoin: toDecimal(body.baseCoin),
        bonusCoin: toDecimal(body.bonusCoin ?? 0),
        sortOrder: body.sortOrder ?? 0,
      },
    });
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: Partial<{
      name: string;
      priceVnd: number;
      baseCoin: number;
      bonusCoin: number;
      isActive: boolean;
      sortOrder: number;
    }>,
  ) {
    return this.prisma.topUpPackage.update({
      where: { id },
      data: {
        ...body,
        baseCoin: body.baseCoin != null ? toDecimal(body.baseCoin) : undefined,
        bonusCoin:
          body.bonusCoin != null ? toDecimal(body.bonusCoin) : undefined,
      },
    });
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.topUpPackage.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
