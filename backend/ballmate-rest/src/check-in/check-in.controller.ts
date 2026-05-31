import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CheckInService } from './check-in.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('check-in')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PLAYER)
export class CheckInController {
  constructor(
    private checkInService: CheckInService,
    private prisma: PrismaService,
  ) {}

  private async playerId(userId: number) {
    const p = await this.prisma.player.findUniqueOrThrow({
      where: { userId },
    });
    return p.id;
  }

  @Get('status')
  async status(@Req() req: { user: { id: number } }) {
    return this.checkInService.getStatus(await this.playerId(req.user.id));
  }

  @Post()
  async checkIn(@Req() req: { user: { id: number } }) {
    return this.checkInService.checkIn(await this.playerId(req.user.id));
  }
}
