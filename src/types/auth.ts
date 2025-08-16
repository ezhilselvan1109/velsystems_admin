export interface User {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  message: string;
  data: User | {};
}

export interface LoginFormData {
  identifier: string;
}

export interface OTPFormData {
  otp: string;
}