import axios, { AxiosResponse, AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { ApiResponse, ApiError } from '../types/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      Cookies.remove('auth-token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Generic API call function
export const apiCall = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  data?: any,
  params?: any
): Promise<T> => {
  try {
    const response = await api.request<ApiResponse<T>>({
      method,
      url,
      data,
      params,
    });
    return response.data.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    throw new Error(axiosError.response?.data?.message || 'An error occurred');
  }
};

export default api;