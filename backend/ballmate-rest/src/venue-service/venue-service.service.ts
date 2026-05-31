import { Injectable } from '@nestjs/common';
import {
  VenueServiceCategory,
  VenueServiceUnit,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { decimalToNumber, vndToCoin } from '../common/coin.util';

@Injectable()
export class VenueServiceCatalogService {
  constructor(private prisma: PrismaService) {}

  async listByVenue(venueId: number) {
    const services = await this.prisma.venueService.findMany({
      where: { venueId, isActive: true },
      orderBy: { name: 'asc' },
    });
    if (services.length > 0) {
      return services.map((s) => ({
        ...s,
        priceCoin: decimalToNumber(s.priceCoin),
      }));
    }
    return this.listFromVenueJson(venueId);
  }

  private async listFromVenueJson(venueId: number) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      select: { equipment: true, canteenItems: true },
    });
    if (!venue) return [];

    const items: {
      id: string;
      name: string;
      category: VenueServiceCategory;
      priceCoin: number;
      unit: VenueServiceUnit;
    }[] = [];

    const equipment = venue.equipment as
      | { name?: string; price?: number }[]
      | null;
    if (Array.isArray(equipment)) {
      equipment.forEach((eq, i) => {
        if (eq?.name) {
          items.push({
            id: `eq-${i}`,
            name: eq.name,
            category: VenueServiceCategory.EQUIPMENT,
            priceCoin: vndToCoin(Number(eq.price) || 0),
            unit: VenueServiceUnit.PER_MATCH,
          });
        }
      });
    }

    const canteen = venue.canteenItems as
      | { name?: string; price?: number }[]
      | null;
    if (Array.isArray(canteen)) {
      canteen.forEach((c, i) => {
        if (c?.name) {
          items.push({
            id: `can-${i}`,
            name: c.name,
            category: VenueServiceCategory.FOOD_DRINK,
            priceCoin: vndToCoin(Number(c.price) || 0),
            unit: VenueServiceUnit.PER_ITEM,
          });
        }
      });
    }

    return items;
  }
}
