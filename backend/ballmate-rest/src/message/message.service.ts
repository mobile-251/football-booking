import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessageService {
    constructor(private prisma: PrismaService) { }

    async getConversations(userId: number, userRole: 'PLAYER' | 'FIELD_OWNER') {
        let where: any;

        if (userRole === 'PLAYER') {
            const player = await this.prisma.player.findFirst({
                where: { userId },
            });
            if (!player) return [];
            where = { playerId: player.id };
        } else {
            const owner = await this.prisma.fieldOwner.findFirst({
                where: { userId },
            });
            if (!owner) return [];
            where = { ownerId: owner.id };
        }

        const conversations = await this.prisma.conversation.findMany({
            where,
            include: {
                player: {
                    include: { user: { select: { fullName: true, avatarUrl: true } } },
                },
                owner: {
                    include: {
                        user: { select: { fullName: true, avatarUrl: true } },
                        venues: { take: 1 },
                    },
                },
                field: { select: { id: true, name: true } },
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                },
            },
            orderBy: { lastMessageAt: 'desc' },
        });

        return conversations.map((c) => ({
            id: c.id,
            fieldId: c.fieldId,
            fieldName: c.field?.name || c.owner?.venues[0]?.name || 'Sân bóng',
            // fieldImage: c.field?.images?.[0] || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=100',
            otherUser: userRole === 'PLAYER'
                ? { name: c.owner?.user?.fullName, avatar: c.owner?.user?.avatarUrl }
                : { name: c.player?.user?.fullName, avatar: c.player?.user?.avatarUrl },
            lastMessage: c.lastMessage,
            lastMessageAt: c.lastMessageAt,
            unreadCount: 0, // TODO: Calculate unread count
            createdAt: c.createdAt,
        }));
    }

    async getMessages(userId: number, conversationId: number) {
        // Verify user has access to this conversation
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                player: true,
                owner: true,
            },
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        // Check user belongs to this conversation
        const player = await this.prisma.player.findFirst({ where: { userId } });
        const owner = await this.prisma.fieldOwner.findFirst({ where: { userId } });

        if (
            (player && conversation.playerId !== player.id) &&
            (owner && conversation.ownerId !== owner.id)
        ) {
            throw new ForbiddenException('Access denied');
        }

        const messages = await this.prisma.message.findMany({
            where: { conversationId },
            include: {
                sender: { select: { id: true, fullName: true, avatarUrl: true } },
            },
            orderBy: { createdAt: 'asc' },
        });

        return messages.map((m) => ({
            id: m.id,
            text: m.content,
            time: m.createdAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            isMe: m.senderId === userId,
            sender: m.sender,
            createdAt: m.createdAt,
        }));
    }

    async createConversation(playerId: number, ownerId: number, fieldId?: number) {
        // Check if conversation already exists
        const existing = await this.prisma.conversation.findUnique({
            where: { playerId_ownerId: { playerId, ownerId } },
        });

        if (existing) {
            return existing;
        }

        return this.prisma.conversation.create({
            data: { playerId, ownerId, fieldId },
        });
    }

    async sendMessage(userId: number, conversationId: number, content: string) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { player: true, owner: true },
        });

        if (!conversation) {
            throw new NotFoundException('Conversation not found');
        }

        // Check user belongs to this conversation
        const player = await this.prisma.player.findFirst({ where: { userId } });
        const owner = await this.prisma.fieldOwner.findFirst({ where: { userId } });

        if (
            (player && conversation.playerId !== player.id) &&
            (owner && conversation.ownerId !== owner.id)
        ) {
            throw new ForbiddenException('Access denied');
        }

        // Create message and update conversation
        const [message] = await this.prisma.$transaction([
            this.prisma.message.create({
                data: {
                    conversationId,
                    senderId: userId,
                    content,
                },
                include: {
                    sender: { select: { id: true, fullName: true, avatarUrl: true } },
                },
            }),
            this.prisma.conversation.update({
                where: { id: conversationId },
                data: {
                    lastMessage: content.length > 50 ? content.substring(0, 47) + '...' : content,
                    lastMessageAt: new Date(),
                },
            }),
        ]);

        return {
            id: message.id,
            text: message.content,
            time: message.createdAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            isMe: true,
            sender: message.sender,
            createdAt: message.createdAt,
        };
    }

    async startConversationWithField(userId: number, fieldId: number, initialMessage?: string) {
        // Get field and its owner
        const field = await this.prisma.field.findUnique({
            where: { id: fieldId },
            include: { venue: { include: { owner: true } } },
        });

        if (!field) {
            throw new NotFoundException('Field not found');
        }

        // Get player
        const player = await this.prisma.player.findFirst({ where: { userId } });
        if (!player) {
            throw new ForbiddenException('Only players can start conversations');
        }

        // Get or create conversation
        const conversation = await this.createConversation(
            player.id,
            field.venue.ownerId,
            fieldId,
        );

        // Send initial message if provided
        if (initialMessage) {
            await this.sendMessage(userId, conversation.id, initialMessage);
        }

        return conversation;
    }
}
