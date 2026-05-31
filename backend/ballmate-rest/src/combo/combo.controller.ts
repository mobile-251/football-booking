import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FieldType, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ComboService } from './combo.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('combos')
export class ComboController {
  constructor(
    private comboService: ComboService,
    private prisma: PrismaService,
  ) {}

  @Get('venues/:venueId/packages')
  listPackages(@Param('venueId', ParseIntPipe) venueId: number) {
    return this.comboService.listByVenue(venueId);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLAYER)
  async myCombos(@Req() req: { user: { id: number } }) {
    const player = await this.prisma.player.findUniqueOrThrow({
      where: { userId: req.user.id },
    });
    return this.comboService.listMyCombos(player.id);
  }

  @Get('eligible')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLAYER)
  async eligible(
    @Req() req: { user: { id: number } },
    @Query('venueId') venueId: string,
    @Query('fieldType') fieldType: FieldType,
  ) {
    const player = await this.prisma.player.findUniqueOrThrow({
      where: { userId: req.user.id },
    });
    return this.comboService.getEligibleForBooking(
      player.id,
      parseInt(venueId, 10),
      fieldType,
    );
  }

  @Post('packages/:id/purchase')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLAYER)
  async purchase(
    @Req() req: { user: { id: number } },
    @Param('id', ParseIntPipe) id: number,
  ) {
    const player = await this.prisma.player.findUniqueOrThrow({
      where: { userId: req.user.id },
    });
    return this.comboService.purchase(player.id, id);
  }
}
