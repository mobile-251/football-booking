import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    Request,
    ParseIntPipe,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class MessageController {
    constructor(private readonly messageService: MessageService) { }

    @Get()
    async getConversations(@Request() req) {
        return this.messageService.getConversations(
            req.user.userId,
            req.user.role,
        );
    }

    @Get(':id/messages')
    async getMessages(
        @Request() req,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.messageService.getMessages(req.user.userId, id);
    }

    @Post(':id/messages')
    async sendMessage(
        @Request() req,
        @Param('id', ParseIntPipe) id: number,
        @Body('content') content: string,
    ) {
        return this.messageService.sendMessage(req.user.userId, id, content);
    }

    @Post('start')
    async startConversation(
        @Request() req,
        @Body('fieldId', ParseIntPipe) fieldId: number,
        @Body('message') message?: string,
    ) {
        return this.messageService.startConversationWithField(
            req.user.userId,
            fieldId,
            message,
        );
    }
}
