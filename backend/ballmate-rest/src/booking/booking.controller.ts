import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingStatus } from '@prisma/client';

@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingService.create(createBookingDto);
  }

  @Get()
  findAll(
    @Query('playerId') playerId?: string,
    @Query('fieldId') fieldId?: string,
    @Query('venueId') venueId?: string,
    @Query('status') status?: BookingStatus,
  ) {
    return this.bookingService.findAll({
      playerId: playerId ? parseInt(playerId) : undefined,
      fieldId: fieldId ? parseInt(fieldId) : undefined,
      venueId: venueId ? parseInt(venueId) : undefined,
      status,
    });
  }

  @Get('field/:fieldId/availability')
  getFieldAvailability(
    @Param('fieldId', ParseIntPipe) fieldId: number,
    @Query('date') date: string,
  ) {
    return this.bookingService.getFieldAvailability(fieldId, date);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bookingService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBookingDto: UpdateBookingDto,
  ) {
    return this.bookingService.update(id, updateBookingDto);
  }

  @Patch(':id/confirm')
  confirmBooking(@Param('id', ParseIntPipe) id: number) {
    return this.bookingService.confirmBooking(id);
  }

  @Patch(':id/cancel')
  cancelBooking(@Param('id', ParseIntPipe) id: number) {
    return this.bookingService.cancelBooking(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bookingService.remove(id);
  }
}
