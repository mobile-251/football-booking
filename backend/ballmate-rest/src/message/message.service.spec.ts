import { Test, TestingModule } from '@nestjs/testing';
import { MessageService } from './message.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('MessageService', () => {
    let service: MessageService;
    let prismaService: jest.Mocked<PrismaService>;

    const mockConversation = {
        id: 1,
        playerId: 1,
        ownerId: 2,
        fieldId: 1,
        lastMessage: 'Hello',
        lastMessageAt: new Date(),
        createdAt: new Date(),
        field: { name: 'Sân bóng' },
        owner: { user: { fullName: 'Owner', avatarUrl: 'url' }, venues: [{ name: 'Venue' }] },
        player: { user: { fullName: 'Player', avatarUrl: 'url' } },
    };

    const mockMessage = {
        id: 1,
        conversationId: 1,
        senderId: 1,
        content: 'Hello',
        createdAt: new Date(),
        sender: { id: 1, fullName: 'Player', avatarUrl: 'url' },
    };

    beforeEach(async () => {
        const mockPrismaService = {
            player: { findFirst: jest.fn() },
            fieldOwner: { findFirst: jest.fn() },
            conversation: {
                findMany: jest.fn(),
                findUnique: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
            },
            message: {
                findMany: jest.fn(),
                create: jest.fn(),
            },
            field: { findUnique: jest.fn() },
            $transaction: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MessageService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<MessageService>(MessageService);
        prismaService = module.get(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getConversations', () => {
        it('should return conversations for player', async () => {
            (prismaService.player.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
            (prismaService.conversation.findMany as jest.Mock).mockResolvedValue([mockConversation]);

            const result = await service.getConversations(1, 'PLAYER');

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe(1);
        });

        it('should return empty if player not found', async () => {
            (prismaService.player.findFirst as jest.Mock).mockResolvedValue(null);
            const result = await service.getConversations(1, 'PLAYER');
            expect(result).toEqual([]);
        });
    });

    describe('getMessages', () => {
        it('should return messages for valid access', async () => {
            (prismaService.conversation.findUnique as jest.Mock).mockResolvedValue(mockConversation);
            (prismaService.player.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
            (prismaService.message.findMany as jest.Mock).mockResolvedValue([mockMessage]);

            const result = await service.getMessages(1, 1);

            expect(result).toHaveLength(1);
            expect(result[0].text).toBe('Hello');
        });

        it('should throw ForbiddenException if user not in conversation', async () => {
            (prismaService.conversation.findUnique as jest.Mock).mockResolvedValue(mockConversation);
            (prismaService.player.findFirst as jest.Mock).mockResolvedValue({ id: 99 }); // Different ID
            (prismaService.fieldOwner.findFirst as jest.Mock).mockResolvedValue(null);

            await expect(service.getMessages(1, 1)).rejects.toThrow(ForbiddenException);
        });
    });

    describe('sendMessage', () => {
        it('should send message', async () => {
            (prismaService.conversation.findUnique as jest.Mock).mockResolvedValue(mockConversation);
            (prismaService.player.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
            (prismaService.$transaction as jest.Mock).mockResolvedValue([mockMessage]);

            const result = await service.sendMessage(1, 1, 'Hello');

            expect(result.text).toBe('Hello');
        });
    });

    describe('startConversationWithField', () => {
        it('should create conversation with field owner', async () => {
            (prismaService.field.findUnique as jest.Mock).mockResolvedValue({
                id: 1,
                venue: { ownerId: 2 },
            });
            (prismaService.player.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
            (prismaService.conversation.findUnique as jest.Mock).mockResolvedValue(null);
            (prismaService.conversation.create as jest.Mock).mockResolvedValue(mockConversation);
            // For sendMessage inside
            (prismaService.conversation.findUnique as jest.Mock).mockResolvedValueOnce(null) // first time for start
                .mockResolvedValueOnce(mockConversation); // second time for sendMessage
            (prismaService.$transaction as jest.Mock).mockResolvedValue([mockMessage]);

            const result = await service.startConversationWithField(1, 1, 'Hi');

            expect(result).toEqual(mockConversation);
        });
    });
});
