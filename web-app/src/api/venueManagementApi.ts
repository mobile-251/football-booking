import AxiosClient from './AxiosClient';

export type FieldOperationalStatus = 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';

export interface PricedItem {
  name: string;
  price: number;
}

export interface VenuePolicies {
  booking: string;
  usage: string;
  insurance: string;
}

export interface AmenityItem {
  key: string;
  label: string;
}

export interface PricingRow {
  dayType: string;
  dayLabel: string;
  startTime: string;
  endTime: string;
  price: number;
}

export interface PricingByType {
  fieldType: string;
  label: string;
  rows: PricingRow[];
  minPrice: number;
  maxPrice: number;
}

export interface SubField {
  id: number;
  name: string;
  fieldType: string;
  fieldTypeLabel: string;
  operationalStatus: FieldOperationalStatus;
  isActive: boolean;
}

export interface VenueManagementData {
  venue: {
    id: number;
    name: string;
    description: string | null;
    address: string;
    city: string;
    district: string | null;
    phoneNumber: string | null;
    email: string | null;
    openTime: string;
    closeTime: string;
    images: string[];
    amenities: AmenityItem[];
    equipment: PricedItem[];
    canteenItems: PricedItem[];
    policies: VenuePolicies;
  };
  pricingByType: PricingByType[];
  fields: SubField[];
}

export interface PricingRowPayload {
  dayType: 'WEEKDAY' | 'WEEKEND';
  startTime: string;
  endTime: string;
  price: number;
}

export interface UpdateVenueManagementPayload {
  name?: string;
  description?: string;
  address?: string;
  city?: string;
  district?: string;
  phoneNumber?: string;
  email?: string;
  openTime?: string;
  closeTime?: string;
  images?: string[];
  amenities?: string[];
  equipment?: PricedItem[];
  canteenItems?: PricedItem[];
  policies?: Partial<VenuePolicies>;
  pricing?: { fieldType: string; rows: PricingRowPayload[] }[];
  fieldNames?: { id: number; name: string }[];
}

const venueManagementApi = {
  getManagement: (venueId: number): Promise<VenueManagementData> =>
    AxiosClient.get(`/venues/${venueId}/management`) as Promise<VenueManagementData>,

  updateManagement: (
    venueId: number,
    payload: UpdateVenueManagementPayload,
  ): Promise<VenueManagementData> =>
    AxiosClient.patch(
      `/venues/${venueId}/management`,
      payload,
    ) as Promise<VenueManagementData>,

  createField: (
    venueId: number,
    payload: { name: string; fieldType: string },
  ): Promise<VenueManagementData> =>
    AxiosClient.post(`/venues/${venueId}/fields`, payload) as Promise<VenueManagementData>,

  updateFieldStatus: (
    venueId: number,
    fieldId: number,
    operationalStatus: FieldOperationalStatus,
  ): Promise<VenueManagementData> =>
    AxiosClient.patch(`/venues/${venueId}/fields/${fieldId}/status`, {
      operationalStatus,
    }) as Promise<VenueManagementData>,
};

export default venueManagementApi;
