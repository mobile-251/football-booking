import axios from 'axios';

const AxiosClient = axios.create({
    baseURL: 'http://localhost:8080/api', // Tạm thời để localhost hoặc để trống
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor cho request
AxiosClient.interceptors.request.use(
    (config) => {
        // Có thể thêm token ở đây nếu cần
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor cho response
AxiosClient.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default AxiosClient;
