import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TopUpService } from './top-up.service';
import { CreateTopUpOrderDto } from './dto/create-top-up-order.dto';
import { PrismaService } from '../prisma/prisma.service';

@Controller('top-up')
export class TopUpController {
  constructor(
    private topUpService: TopUpService,
    private prisma: PrismaService,
  ) {}

  @Get('packages')
  listPackages() {
    return this.topUpService.listPackages();
  }

  @Post('orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLAYER)
  async createOrder(
    @Req() req: { user: { id: number } },
    @Body() dto: CreateTopUpOrderDto,
  ) {
    const player = await this.prisma.player.findUniqueOrThrow({
      where: { userId: req.user.id },
    });
    return this.topUpService.createOrder(player.id, dto);
  }

  @Get('orders/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLAYER)
  async getOrder(
    @Req() req: { user: { id: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    const player = await this.prisma.player.findUniqueOrThrow({
      where: { userId: req.user.id },
    });
    return this.topUpService.getOrder(player.id, id);
  }
}
