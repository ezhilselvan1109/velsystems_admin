import { apiCall } from '../utils/api';
import { User, AuthResponse } from '../types/auth';

export const authService = {
  // Check if user is authenticated
  me: () => apiCall<User>('GET', '/auth/me'),

  // Generate OTP for both sign-in and sign-up
  generateOTP: (email: string) =>
    apiCall<{
      otpIdentifierInfo: Array<{
        requestId: string;
        email: string;
        expiryDate: string;
        tooltipText: string;
      }>;
      toastMessage: string;
    }>('POST', '/auth/otp/generate', { email }),

  // Verify OTP for sign-in
  verifySignInOTP: (otp: string, requestId: string, email: string) =>
    apiCall<string>('POST', '/auth/admin/sign-in/verify-otp', {
      otp,
      requestId,
      email,
    }),

  // Verify OTP for sign-up
  verifySignUpOTP: (otp: string, requestId: string, email: string) =>
    apiCall<string>('POST', '/auth/admin/sign-up/verify-otp', {
      otp,
      requestId,
      email,
    }),

  // Logout
  logout: () => apiCall<{}>('POST', '/auth/logout'),
};