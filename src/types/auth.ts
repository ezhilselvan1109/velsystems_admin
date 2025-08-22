export interface User {
  id: string;
  email: string;
  phoneNumber?: string;
  firstName: string;
  lastName: string;
  gender: string;
  role: string;
  status: number;
  createdAt: string;
  updatedAt: string;
  addresses: any[];
  reviews: any[];
}

export interface AuthResponse {
  message: string;
  data: User | {};
}

export interface LoginFormData {
  email: string;
}

export interface OTPFormData {
  otp: string;
}

export interface OTPIdentifierInfo {
  requestId: string;
  email: string;
  expiryDate: string;
  tooltipText: string;
}