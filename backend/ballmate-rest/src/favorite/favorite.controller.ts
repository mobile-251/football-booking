import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  private requirePlayer(req: any) {
    if (!req.user?.playerId) {
      throw new ForbiddenException('Player account required');
    }
    return req.user.playerId as number;
  }

  @Get()
  async getFavorites(@Request() req) {
    const playerId = this.requirePlayer(req);
    return this.favoriteService.getFavorites(playerId);
  }

  @Post(':fieldId')
  async addFavorite(
    @Request() req,
    @Param('fieldId', ParseIntPipe) fieldId: number,
  ) {
    const playerId = this.requirePlayer(req);
    return this.favoriteService.addFavorite(playerId, fieldId);
  }

  @Delete(':fieldId')
  async removeFavorite(
    @Request() req,
    @Param('fieldId', ParseIntPipe) fieldId: number,
  ) {
    const playerId = this.requirePlayer(req);
    return this.favoriteService.removeFavorite(playerId, fieldId);
  }

  @Get(':fieldId/check')
  async checkFavorite(
    @Request() req,
    @Param('fieldId', ParseIntPipe) fieldId: number,
  ) {
    const playerId = this.requirePlayer(req);
    return this.favoriteService.checkFavorite(playerId, fieldId);
  }

  @Post(':fieldId/toggle')
  async toggleFavorite(
    @Request() req,
    @Param('fieldId', ParseIntPipe) fieldId: number,
  ) {
    const playerId = this.requirePlayer(req);
    return this.favoriteService.toggleFavorite(playerId, fieldId);
  }
}
