import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { RevenueService } from './revenue.service';
import { CreateRevenueReportDto } from './dto/create-revenue.dto';

@Controller('revenue')
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  @Post()
  create(@Body() createRevenueReportDto: CreateRevenueReportDto) {
    return this.revenueService.create(createRevenueReportDto);
  }

  @Get()
  findAll(
    @Query('venueId') venueId?: string,
    @Query('fieldId') fieldId?: string,
  ) {
    return this.revenueService.findAll(
      venueId ? parseInt(venueId) : undefined,
      fieldId ? parseInt(fieldId) : undefined,
    );
  }

  @Get('venue/:venueId')
  getVenueRevenue(
    @Param('venueId', ParseIntPipe) venueId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.revenueService.getVenueRevenue(venueId, startDate, endDate);
  }

  @Get('field/:fieldId')
  getFieldRevenue(
    @Param('fieldId', ParseIntPipe) fieldId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.revenueService.getFieldRevenue(fieldId, startDate, endDate);
  }
}
