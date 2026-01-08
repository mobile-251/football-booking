import { Test, TestingModule } from '@nestjs/testing';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';

describe('MessageController', () => {
    let controller: MessageController;
    let messageService: jest.Mocked<MessageService>;

    const mockRequest = {
        user: {
            userId: 1,
            role: 'PLAYER',
        },
    };

    const mockConversation = {
        id: 1,
        fieldId: 1,
        fieldName: 'Sân bóng',
        otherUser: { name: 'Owner', avatar: 'url' },
        lastMessage: 'Hello',
        lastMessageAt: new Date(),
        unreadCount: 0,
        createdAt: new Date(),
    };

    const mockMessage = {
        id: 1,
        text: 'Hello',
        time: '10:00',
        isMe: true,
        sender: { id: 1, fullName: 'Player', avatarUrl: 'url' },
        createdAt: new Date(),
    };

    const mockMessageService = {
        getConversations: jest.fn(),
        getMessages: jest.fn(),
        sendMessage: jest.fn(),
        startConversationWithField: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [MessageController],
            providers: [{ provide: MessageService, useValue: mockMessageService }],
        }).compile();

        controller = module.get<MessageController>(MessageController);
        messageService = module.get(MessageService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getConversations', () => {
        it('should return conversations', async () => {
            mockMessageService.getConversations.mockResolvedValue([mockConversation]);

            const result = await controller.getConversations(mockRequest);

            expect(result).toEqual([mockConversation]);
            expect(messageService.getConversations).toHaveBeenCalledWith(1, 'PLAYER');
        });
    });

    describe('getMessages', () => {
        it('should return messages', async () => {
            mockMessageService.getMessages.mockResolvedValue([mockMessage]);

            const result = await controller.getMessages(mockRequest, 1);

            expect(result).toEqual([mockMessage]);
            expect(messageService.getMessages).toHaveBeenCalledWith(1, 1);
        });
    });

    describe('sendMessage', () => {
        it('should send message', async () => {
            mockMessageService.sendMessage.mockResolvedValue(mockMessage);

            const result = await controller.sendMessage(mockRequest, 1, 'Hello');

            expect(result).toEqual(mockMessage);
            expect(messageService.sendMessage).toHaveBeenCalledWith(1, 1, 'Hello');
        });
    });

    describe('startConversation', () => {
        it('should start conversation', async () => {
            // Mock returns conversation object (Prisma model style or mapped style? Service returns mapped usually?)
            // Service `startConversationWithField` returns `conversation` (Prisma object in code)
            // Controller returns whatever service returns.
            const mockPrismaConversation = { id: 1, playerId: 1, ownerId: 2 } as any;
            mockMessageService.startConversationWithField.mockResolvedValue(mockPrismaConversation);

            const result = await controller.startConversation(mockRequest, 1, 'Hi');

            expect(result).toEqual(mockPrismaConversation);
            expect(messageService.startConversationWithField).toHaveBeenCalledWith(1, 1, 'Hi');
        });
    });
});
