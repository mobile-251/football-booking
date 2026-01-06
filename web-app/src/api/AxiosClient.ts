import axios from 'axios';

const AxiosClient = axios.create({
	baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
	headers: {
		'Content-Type': 'application/json',
	},
});

// Interceptor cho request - CHỈ thêm token cho các endpoint CẦN authentication
AxiosClient.interceptors.request.use(
	(config) => {
		// Danh sách các endpoint KHÔNG cần token
		const publicEndpoints = ['/auth/login', '/auth/register'];
		const isPublicEndpoint = publicEndpoints.some((endpoint) => config.url?.includes(endpoint));

		// Chỉ thêm token nếu KHÔNG phải public endpoint
		if (!isPublicEndpoint) {
			const token = localStorage.getItem('access_token');
			if (token) {
				config.headers.Authorization = `Bearer ${token}`;
			}
		}

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
	async (error) => {
		const originalRequest = error.config;

		// Nếu lỗi 401 và có refresh token, thử refresh
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			try {
				const refreshToken = localStorage.getItem('refresh_token');
				if (refreshToken) {
					// Gọi endpoint refresh token
					const response = await axios.post(
						`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/auth/refresh`,
						{},
						{
							headers: {
								Authorization: `Bearer ${refreshToken}`,
							},
						}
					);

					const { access_token, refresh_token } = response.data;

					// Lưu token mới
					localStorage.setItem('access_token', access_token);
					localStorage.setItem('refresh_token', refresh_token);

					// Retry request ban đầu với token mới
					originalRequest.headers.Authorization = `Bearer ${access_token}`;
					return axios(originalRequest);
				}
			} catch (refreshError) {
				// Nếu refresh thất bại, xóa token và redirect về login
				localStorage.removeItem('access_token');
				localStorage.removeItem('refresh_token');
				localStorage.removeItem('user');
				window.location.href = '/login';
				return Promise.reject(refreshError);
			}
		}

		// Với các lỗi 401 khác (không có refresh token), xóa token
		if (error.response?.status === 401) {
			localStorage.removeItem('access_token');
			localStorage.removeItem('refresh_token');
			localStorage.removeItem('user');
		}

		return Promise.reject(error);
	}
);

export default AxiosClient;
