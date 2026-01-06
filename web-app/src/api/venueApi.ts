import AxiosClient from './AxiosClient';

const venueApi = {
    create: (data: any) => {
        return AxiosClient.post('/venues', data);
    },
    getAll: (params?: { city?: string }) => {
        return AxiosClient.get('/venues', { params });
    },
    getOne: (id: number) => {
        return AxiosClient.get(`/venues/${id}`);
    }
};

export default venueApi;
