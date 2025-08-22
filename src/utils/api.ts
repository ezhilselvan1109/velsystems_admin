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
    const token = Cookies.get('AUTH-TOKEN');
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
      // Clear auth token on 401
      Cookies.remove('AUTH-TOKEN');
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
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
    const response = await api.request<ApiResponse<{ message: string; data: T }>>({
      method,
      url,
      data,
      params,
    });
    
    // Handle the nested response structure from your API
    const responseData = response.data.data;
    
    // Check if the inner response indicates an error
    if (responseData && typeof responseData === 'object' && 'message' in responseData) {
      if (responseData.message === 'error') {
        throw new Error(responseData.data as string || 'An error occurred');
      }
      // Return the inner data if it's a success
      return responseData.data as T;
    }
    
    // Return the data directly if it's not in the nested format
    return responseData as T;
  } catch (error) {
    const axiosError = error as AxiosError<ApiError>;
    
    // If it's already a custom error, re-throw it
    if (error instanceof Error && !(error as any).response) {
      throw error;
    }
    
    // Handle axios errors
    const errorMessage = axiosError.response?.data?.message || 
                        axiosError.message || 
                        'An error occurred';
    throw new Error(errorMessage);
  }
};

export default api;