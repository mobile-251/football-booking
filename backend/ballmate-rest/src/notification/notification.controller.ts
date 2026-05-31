import {
    Controller,
    Get,
    Patch,
    Delete,
    Param,
    Query,
    UseGuards,
    Request,
    ParseIntPipe,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    @Get()
    async getNotifications(
        @Request() req,
        @Query('unreadOnly') unreadOnly?: string,
    ) {
        return this.notificationService.getNotifications(req.user.id, {
            unreadOnly: unreadOnly === 'true',
        });
    }

    @Get('unread-count')
    async getUnreadCount(@Request() req) {
        return this.notificationService.getUnreadCount(req.user.id);
    }

    @Patch(':id/read')
    async markAsRead(
        @Request() req,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.notificationService.markAsRead(req.user.id, id);
    }

    @Patch('read-all')
    async markAllAsRead(@Request() req) {
        return this.notificationService.markAllAsRead(req.user.id);
    }

    @Delete(':id')
    async deleteNotification(
        @Request() req,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.notificationService.deleteNotification(req.user.id, id);
    }
}
