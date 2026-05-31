import {
  Body,
  Controller,
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

@Controller('admin/check-in-rewards')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminCheckInController {
  constructor(private prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.checkInRewardConfig.findMany({
      orderBy: { streakDay: 'asc' },
    });
  }

  @Post()
  create(
    @Body()
    body: { streakDay: number; coinReward: number; isMilestone?: boolean; label?: string },
  ) {
    return this.prisma.checkInRewardConfig.create({
      data: {
        streakDay: body.streakDay,
        coinReward: toDecimal(body.coinReward),
        isMilestone: body.isMilestone ?? false,
        label: body.label,
      },
    });
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: Partial<{
      streakDay: number;
      coinReward: number;
      isMilestone: boolean;
      label: string;
    }>,
  ) {
    return this.prisma.checkInRewardConfig.update({
      where: { id },
      data: {
        ...body,
        coinReward:
          body.coinReward != null ? toDecimal(body.coinReward) : undefined,
      },
    });
  }
}
