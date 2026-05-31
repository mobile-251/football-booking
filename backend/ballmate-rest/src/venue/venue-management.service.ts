import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DayType,
  FieldOperationalStatus,
  FieldType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateVenueManagementDto } from './dto/update-venue-management.dto';
import { CreateVenueFieldDto } from './dto/create-venue-field.dto';

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  [FieldType.FIELD_5VS5]: 'Sân 5 người',
  [FieldType.FIELD_7VS7]: 'Sân 7 người',
  [FieldType.FIELD_11VS11]: 'Sân 11 người',
};

const DAY_TYPE_LABELS: Record<DayType, string> = {
  [DayType.WEEKDAY]: 'T2 - T6',
  [DayType.WEEKEND]: 'T7 - CN',
};

const DEFAULT_AMENITIES = [
  'wifi',
  'parking',
  'changing_room',
  'lockers',
  'canteen',
];

const AMENITY_LABELS: Record<string, string> = {
  wifi: 'Wifi miễn phí',
  parking: 'Bãi đỗ xe',
  changing_room: 'Phòng thay đồ / Vệ sinh',
  lockers: 'Tủ đồ',
  canteen: 'Căn tin',
};

const DEFAULT_EQUIPMENT = [
  { name: 'Bóng đá', price: 30000 },
  { name: 'Áo đội bóng', price: 50000 },
  { name: 'Giày đá banh', price: 40000 },
  { name: 'Băng keo / Bảo vệ', price: 15000 },
];

const DEFAULT_CANTEEN = [
  { name: 'Nước suối', price: 10000 },
  { name: 'Nước tăng lực', price: 20000 },
  { name: 'Cơm trưa / tối', price: 35000 },
  { name: 'Mì / Bánh mì', price: 25000 },
];

const DEFAULT_POLICIES = {
  booking:
    'Đặt sân trước ít nhất 2 giờ. Hủy miễn phí trước 4 giờ. Thanh toán tại sân hoặc chuyển khoản.',
  usage:
    'Mang giày đá banh cỏ nhân tạo. Không hút thuốc trong khu vực sân. Giữ gìn vệ sinh chung.',
  insurance:
    'Khách hàng tự bảo đảm an toàn khi thi đấu. Sân không chịu trách nhiệm với tư trang để ngoài khu vực quản lý.',
};

type PricedItem = { name: string; price: number };

@Injectable()
export class VenueManagementService {
  constructor(private readonly prisma: PrismaService) {}

  async getManagementDetail(venueId: number) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      include: {
        fields: {
          orderBy: [{ fieldType: 'asc' }, { name: 'asc' }],
          include: { pricings: { orderBy: [{ dayType: 'asc' }, { startTime: 'asc' }] } },
        },
      },
    });

    if (!venue) {
      throw new NotFoundException(`Venue with ID ${venueId} not found`);
    }

    const equipment = this.parsePricedItems(venue.equipment, DEFAULT_EQUIPMENT);
    const canteenItems = this.parsePricedItems(
      venue.canteenItems,
      DEFAULT_CANTEEN,
    );
    const policies = this.parsePolicies(venue.policies);
    const amenities =
      venue.amenities.length > 0 ? venue.amenities : DEFAULT_AMENITIES;

    const pricingByType = this.buildPricingByType(venue.fields);
    const images =
      venue.images.length > 0
        ? venue.images
        : [
            'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400',
            'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400',
            'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=400',
            'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400',
          ];

    return {
      venue: {
        id: venue.id,
        name: venue.name,
        description: venue.description,
        address: venue.address,
        city: venue.city,
        district: venue.district,
        phoneNumber: venue.phoneNumber,
        email: venue.email,
        openTime: venue.openTime ?? '06:00',
        closeTime: venue.closeTime ?? '24:00',
        images,
        amenities: amenities.map((key) => ({
          key,
          label: AMENITY_LABELS[key] ?? key,
        })),
        equipment,
        canteenItems,
        policies,
      },
      pricingByType,
      fields: venue.fields.map((f) => ({
        id: f.id,
        name: f.name,
        fieldType: f.fieldType,
        fieldTypeLabel: FIELD_TYPE_LABELS[f.fieldType],
        operationalStatus: f.operationalStatus,
        isActive: f.isActive,
      })),
    };
  }

  async updateManagement(venueId: number, dto: UpdateVenueManagementDto) {
    await this.getManagementDetail(venueId);

    const data: Prisma.VenueUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.district !== undefined) data.district = dto.district;
    if (dto.phoneNumber !== undefined) data.phoneNumber = dto.phoneNumber;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.openTime !== undefined) data.openTime = dto.openTime;
    if (dto.closeTime !== undefined) data.closeTime = dto.closeTime;
    if (dto.images !== undefined) data.images = dto.images;
    if (dto.amenities !== undefined) data.amenities = dto.amenities;
    if (dto.equipment !== undefined) {
      data.equipment = dto.equipment.map(({ name, price }) => ({ name, price }));
    }
    if (dto.canteenItems !== undefined) {
      data.canteenItems = dto.canteenItems.map(({ name, price }) => ({
        name,
        price,
      }));
    }
    if (dto.policies !== undefined) {
      data.policies = dto.policies as Prisma.InputJsonValue;
    }

    await this.prisma.venue.update({ where: { id: venueId }, data });

    if (dto.pricing?.length) {
      for (const group of dto.pricing) {
        await this.syncPricingForFieldType(venueId, group.fieldType, group.rows);
      }
    }

    if (dto.fieldNames?.length) {
      for (const item of dto.fieldNames) {
        await this.prisma.field.updateMany({
          where: { id: item.id, venueId },
          data: { name: item.name },
        });
      }
    }

    return this.getManagementDetail(venueId);
  }

  private async syncPricingForFieldType(
    venueId: number,
    fieldType: FieldType,
    rows: {
      dayType: DayType;
      startTime: string;
      endTime: string;
      price: number;
    }[],
  ) {
    const fields = await this.prisma.field.findMany({
      where: { venueId, fieldType },
      select: { id: true },
    });

    if (fields.length === 0) return;

    const fieldIds = fields.map((f) => f.id);

    await this.prisma.fieldPricing.deleteMany({
      where: { fieldId: { in: fieldIds } },
    });

    const createData = fieldIds.flatMap((fieldId) =>
      rows.map((row) => ({
        fieldId,
        dayType: row.dayType,
        startTime: row.startTime,
        endTime: row.endTime,
        price: row.price,
      })),
    );

    if (createData.length > 0) {
      await this.prisma.fieldPricing.createMany({ data: createData });
    }
  }

  async createField(venueId: number, dto: CreateVenueFieldDto) {
    const venue = await this.prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) {
      throw new NotFoundException(`Venue with ID ${venueId} not found`);
    }

    const template = await this.prisma.field.findFirst({
      where: { venueId, fieldType: dto.fieldType },
      include: { pricings: true },
    });

    const field = await this.prisma.field.create({
      data: {
        name: dto.name,
        venueId,
        fieldType: dto.fieldType,
        operationalStatus: FieldOperationalStatus.ACTIVE,
        isActive: true,
      },
    });

    if (template?.pricings.length) {
      await this.prisma.fieldPricing.createMany({
        data: template.pricings.map((p) => ({
          fieldId: field.id,
          dayType: p.dayType,
          startTime: p.startTime,
          endTime: p.endTime,
          price: p.price,
        })),
      });
    }

    return this.getManagementDetail(venueId);
  }

  async updateFieldStatus(
    venueId: number,
    fieldId: number,
    status: FieldOperationalStatus,
  ) {
    const field = await this.prisma.field.findFirst({
      where: { id: fieldId, venueId },
    });

    if (!field) {
      throw new NotFoundException('Field not found in this venue');
    }

    const isActive = status === FieldOperationalStatus.ACTIVE;

    await this.prisma.field.update({
      where: { id: fieldId },
      data: { operationalStatus: status, isActive },
    });

    return this.getManagementDetail(venueId);
  }

  private parsePricedItems(
    raw: Prisma.JsonValue | null,
    fallback: PricedItem[],
  ): PricedItem[] {
    if (raw === null || raw === undefined) return fallback;
    if (!Array.isArray(raw)) return fallback;
    if (raw.length === 0) return [];

    const parsed = raw
      .filter(
        (item): item is PricedItem =>
          typeof item === 'object' &&
          item !== null &&
          'name' in item &&
          typeof (item as PricedItem).name === 'string' &&
          (item as PricedItem).name.trim().length > 0 &&
          'price' in item,
      )
      .map((item) => ({
        name: String((item as PricedItem).name).trim(),
        price: Number((item as PricedItem).price),
      }));

    // Dữ liệu cũ bị strip bởi validation (mảng [{}]) → dùng mặc định
    if (parsed.length === 0) return fallback;

    return parsed;
  }

  private parsePolicies(raw: Prisma.JsonValue | null) {
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const p = raw as Record<string, string>;
      return {
        booking: p.booking ?? DEFAULT_POLICIES.booking,
        usage: p.usage ?? DEFAULT_POLICIES.usage,
        insurance: p.insurance ?? DEFAULT_POLICIES.insurance,
      };
    }
    return { ...DEFAULT_POLICIES };
  }

  private buildPricingByType(
    fields: {
      fieldType: FieldType;
      pricings: {
        dayType: DayType;
        startTime: string;
        endTime: string;
        price: number;
      }[];
    }[],
  ) {
    const byType = new Map<FieldType, (typeof fields)[0]>();

    for (const field of fields) {
      if (!byType.has(field.fieldType) && field.pricings.length > 0) {
        byType.set(field.fieldType, field);
      }
    }

    return Array.from(byType.entries()).map(([fieldType, field]) => {
      const rows = field.pricings.map((p) => ({
        dayType: p.dayType,
        dayLabel: DAY_TYPE_LABELS[p.dayType],
        startTime: p.startTime,
        endTime: p.endTime,
        price: p.price,
      }));
      const prices = rows.map((r) => r.price);

      return {
        fieldType,
        label: FIELD_TYPE_LABELS[fieldType],
        rows,
        minPrice: prices.length ? Math.min(...prices) : 0,
        maxPrice: prices.length ? Math.max(...prices) : 0,
      };
    });
  }
}
