import { apiCall } from '../utils/api';
import { User, AuthResponse } from '../types/auth';

export const authService = {
  // Check if user is authenticated
  me: () => apiCall<User>('GET', '/auth/me'),

  // Request OTP
  requestOTP: (identifier: string) =>
    apiCall<{}>('POST', '/auth/request-otp', null, { identifier }),

  // Verify OTP
  verifyOTP: (otp: string) =>
    apiCall<User>('POST', '/auth/verify-otp', null, { otp }),

  // Logout
  logout: () => apiCall<{}>('POST', '/auth/logout'),
};