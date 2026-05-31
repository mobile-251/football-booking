import AxiosClient from "./AxiosClient";

export interface ComboPackageRecord {
  id: number;
  venueId: number;
  fieldType: string;
  name: string;
  description?: string;
  matchCount: number;
  priceCoin: number;
  validityDays: number;
  isActive: boolean;
}

const comboApi = {
  list(venueId: number) {
    return AxiosClient.get<ComboPackageRecord[]>(
      `/venues/${venueId}/combo-packages`,
    );
  },
  create(
    venueId: number,
    body: {
      fieldType: string;
      name: string;
      description?: string;
      matchCount: number;
      priceCoin: number;
      validityDays: number;
    },
  ) {
    return AxiosClient.post<ComboPackageRecord>(
      `/venues/${venueId}/combo-packages`,
      body,
    );
  },
  update(
    venueId: number,
    id: number,
    body: Partial<{
      name: string;
      matchCount: number;
      priceCoin: number;
      validityDays: number;
      isActive: boolean;
    }>,
  ) {
    return AxiosClient.patch<ComboPackageRecord>(
      `/venues/${venueId}/combo-packages/${id}`,
      body,
    );
  },
  remove(venueId: number, id: number) {
    return AxiosClient.delete(`/venues/${venueId}/combo-packages/${id}`);
  },
};

export default comboApi;
