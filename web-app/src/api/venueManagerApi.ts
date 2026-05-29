import AxiosClient from './AxiosClient';

export interface VenueManagerRecord {
  id: number;
  userId: number;
  venueId: number;
  isActive: boolean;
  createdAt: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    isActive: boolean;
    mustChangePassword?: boolean;
    createdAt: string;
  };
}

const venueManagerApi = {
  list: (venueId: number) =>
    AxiosClient.get(`/venues/${venueId}/managers`),

  create: (venueId: number, data: { email: string; fullName: string }) =>
    AxiosClient.post(`/venues/${venueId}/managers`, data),

  deactivate: (venueId: number, managerId: number) =>
    AxiosClient.delete(`/venues/${venueId}/managers/${managerId}`),

  resetPassword: (venueId: number, managerId: number) =>
    AxiosClient.post(
      `/venues/${venueId}/managers/${managerId}/reset-password`,
    ),
};

export default venueManagerApi;
