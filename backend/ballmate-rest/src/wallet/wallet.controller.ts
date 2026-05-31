import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { WalletService } from './wallet.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PLAYER)
export class WalletController {
  constructor(
    private walletService: WalletService,
    private prisma: PrismaService,
  ) {}

  private async resolvePlayerId(userId: number): Promise<number> {
    const player = await this.prisma.player.findUnique({
      where: { userId },
    });
    if (!player) throw new Error('Player profile not found');
    return player.id;
  }

  @Get('me')
  async getMe(@Req() req: { user: { id: number } }) {
    const playerId = await this.resolvePlayerId(req.user.id);
    const balance = await this.walletService.getBalance(playerId);
    return { playerId, balance };
  }

  @Get('transactions')
  async getTransactions(
    @Req() req: { user: { id: number } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const playerId = await this.resolvePlayerId(req.user.id);
    return this.walletService.getWalletWithTransactions(
      playerId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
