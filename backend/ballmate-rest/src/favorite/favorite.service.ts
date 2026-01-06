import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoriteService {
    constructor(private prisma: PrismaService) { }

    async getFavorites(playerId: number) {
        const favorites = await this.prisma.favorite.findMany({
            where: { playerId },
            include: {
                field: {
                    include: {
                        venue: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return favorites.map((f) => ({
            id: f.id,
            fieldId: f.fieldId,
            field: {
                ...f.field,
                venue: f.field.venue,
            },
            createdAt: f.createdAt,
        }));
    }

    async addFavorite(playerId: number, fieldId: number) {
        // Check if field exists
        const field = await this.prisma.field.findUnique({
            where: { id: fieldId },
        });

        if (!field) {
            throw new NotFoundException('Field not found');
        }

        // Check if already favorited
        const existing = await this.prisma.favorite.findUnique({
            where: {
                playerId_fieldId: { playerId, fieldId },
            },
        });

        if (existing) {
            throw new ConflictException('Field already in favorites');
        }

        const favorite = await this.prisma.favorite.create({
            data: { playerId, fieldId },
            include: {
                field: {
                    include: { venue: true },
                },
            },
        });

        return favorite;
    }

    async removeFavorite(playerId: number, fieldId: number) {
        const favorite = await this.prisma.favorite.findUnique({
            where: {
                playerId_fieldId: { playerId, fieldId },
            },
        });

        if (!favorite) {
            throw new NotFoundException('Favorite not found');
        }

        await this.prisma.favorite.delete({
            where: { id: favorite.id },
        });

        return { message: 'Removed from favorites' };
    }

    async checkFavorite(playerId: number, fieldId: number) {
        const favorite = await this.prisma.favorite.findUnique({
            where: {
                playerId_fieldId: { playerId, fieldId },
            },
        });

        return { isFavorite: !!favorite };
    }

    async toggleFavorite(playerId: number, fieldId: number) {
        const existing = await this.prisma.favorite.findUnique({
            where: {
                playerId_fieldId: { playerId, fieldId },
            },
        });

        if (existing) {
            await this.prisma.favorite.delete({
                where: { id: existing.id },
            });
            return { isFavorite: false, message: 'Removed from favorites' };
        } else {
            await this.prisma.favorite.create({
                data: { playerId, fieldId },
            });
            return { isFavorite: true, message: 'Added to favorites' };
        }
    }
}
