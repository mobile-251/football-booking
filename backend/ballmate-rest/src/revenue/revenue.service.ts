import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRevenueReportDto } from './dto/create-revenue.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class RevenueService {
  constructor(private prisma: PrismaService) {}

  async create(createRevenueReportDto: CreateRevenueReportDto) {
    return this.prisma.revenueReport.create({
      data: {
        ...createRevenueReportDto,
        reportDate: new Date(createRevenueReportDto.reportDate),
      },
    });
  }

  async findAll(venueId?: number, fieldId?: number) {
    return this.prisma.revenueReport.findMany({
      where: {
        ...(venueId && { venueId }),
        ...(fieldId && { fieldId }),
      },
      orderBy: {
        reportDate: 'desc',
      },
    });
  }

  async getVenueRevenue(venueId: number, startDate?: string, endDate?: string) {
    const where: Prisma.RevenueReportWhereInput = { venueId };

    if (startDate || endDate) {
      where.reportDate = {};
      if (startDate) where.reportDate.gte = new Date(startDate);
      if (endDate) where.reportDate.lte = new Date(endDate);
    }

    const reports = await this.prisma.revenueReport.findMany({
      where,
      orderBy: { reportDate: 'desc' },
    });

    const totalRevenue = reports.reduce((sum, r) => sum + r.totalRevenue, 0);
    const totalBookings = reports.reduce((sum, r) => sum + r.totalBookings, 0);

    return {
      venueId,
      totalRevenue,
      totalBookings,
      reports,
    };
  }

  async getFieldRevenue(fieldId: number, startDate?: string, endDate?: string) {
    const where: Prisma.RevenueReportWhereInput = { fieldId };

    if (startDate || endDate) {
      where.reportDate = {};
      if (startDate) where.reportDate.gte = new Date(startDate);
      if (endDate) where.reportDate.lte = new Date(endDate);
    }

    const reports = await this.prisma.revenueReport.findMany({
      where,
      orderBy: { reportDate: 'desc' },
    });

    const totalRevenue = reports.reduce((sum, r) => sum + r.totalRevenue, 0);
    const totalBookings = reports.reduce((sum, r) => sum + r.totalBookings, 0);

    return {
      fieldId,
      totalRevenue,
      totalBookings,
      reports,
    };
  }
}
