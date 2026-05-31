import AxiosClient from "./AxiosClient";

export interface ComboPackageRecord {
  id: number;
  venueId: number;
  fieldType: string;
  name: string;
  description?: string;
  matchCount: number;
  priceCoin: number;
  pricePerMatch?: number;
  validityDays: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ComboPackageFormData = {
  fieldType: string;
  name: string;
  description?: string;
  matchCount: number;
  priceCoin: number;
  validityDays: number;
};

const comboApi = {
  list(venueId: number) {
    return AxiosClient.get(`/venues/${venueId}/combo-packages`) as Promise<
      ComboPackageRecord[]
    >;
  },
  create(venueId: number, body: ComboPackageFormData) {
    return AxiosClient.post(
      `/venues/${venueId}/combo-packages`,
      body,
    ) as Promise<ComboPackageRecord>;
  },
  update(
    venueId: number,
    id: number,
    body: Partial<
      ComboPackageFormData & {
        isActive: boolean;
      }
    >,
  ) {
    return AxiosClient.patch(
      `/venues/${venueId}/combo-packages/${id}`,
      body,
    ) as Promise<ComboPackageRecord>;
  },
  remove(venueId: number, id: number) {
    return AxiosClient.delete(
      `/venues/${venueId}/combo-packages/${id}`,
    ) as Promise<void>;
  },
};

export default comboApi;
