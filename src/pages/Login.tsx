import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation } from '@tanstack/react-query';
import { Mail, Phone, ArrowRight, Loader2 } from 'lucide-react';
import { authService } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';
import { LoginFormData, OTPFormData } from '../types/auth';

const loginSchema = yup.object({
  identifier: yup
    .string()
    .required('Email or phone number is required')
    .test('email-or-phone', 'Enter a valid email or phone number', (value) => {
      if (!value) return false;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^[+]?[\d\s-()]+$/;
      return emailRegex.test(value) || phoneRegex.test(value);
    }),
});

const otpSchema = yup.object({
  otp: yup
    .string()
    .required('OTP is required')
    .length(6, 'OTP must be 6 digits'),
});

const Login: React.FC = () => {
  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [identifier, setIdentifier] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from?.pathname || '/';

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
  });

  const {
    register: registerOTP,
    handleSubmit: handleOTPSubmit,
    formState: { errors: otpErrors },
  } = useForm<OTPFormData>({
    resolver: yupResolver(otpSchema),
  });

  const requestOTPMutation = useMutation({
    mutationFn: authService.requestOTP,
    onSuccess: () => {
      setStep('otp');
    },
    onError: (error: Error) => {
      console.error('Request OTP failed:', error.message);
    },
  });

  const verifyOTPMutation = useMutation({
    mutationFn: authService.verifyOTP,
    onSuccess: (user) => {
      login(user);
      navigate(from, { replace: true });
    },
    onError: (error: Error) => {
      console.error('OTP verification failed:', error.message);
    },
  });

  const onLoginSubmit = useCallback((data: LoginFormData) => {
    setIdentifier(data.identifier);
    requestOTPMutation.mutate(data.identifier);
  }, [requestOTPMutation]);

  const onOTPSubmit = useCallback((data: OTPFormData) => {
    verifyOTPMutation.mutate(data.otp);
  }, [verifyOTPMutation]);

  const isEmail = identifier.includes('@');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              {isEmail ? (
                <Mail className="w-8 h-8 text-white" />
              ) : (
                <Phone className="w-8 h-8 text-white" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {step === 'login' ? 'Welcome Back' : 'Verify OTP'}
            </h1>
            <p className="text-gray-600">
              {step === 'login'
                ? 'Enter your email or phone number to continue'
                : `We've sent a 6-digit code to ${identifier}`}
            </p>
          </div>

          {/* Login Form */}
          {step === 'login' && (
            <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email or Phone Number
                </label>
                <input
                  {...registerLogin('identifier')}
                  type="text"
                  placeholder="Enter email or phone number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                {loginErrors.identifier && (
                  <p className="mt-1 text-sm text-red-600">
                    {loginErrors.identifier.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={requestOTPMutation.isPending}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {requestOTPMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Send OTP
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>

              {requestOTPMutation.error && (
                <p className="text-sm text-red-600 text-center">
                  {requestOTPMutation.error.message}
                </p>
              )}
            </form>
          )}

          {/* OTP Form */}
          {step === 'otp' && (
            <form onSubmit={handleOTPSubmit(onOTPSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP
                </label>
                <input
                  {...registerOTP('otp')}
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-center text-2xl font-mono tracking-widest"
                />
                {otpErrors.otp && (
                  <p className="mt-1 text-sm text-red-600">
                    {otpErrors.otp.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={verifyOTPMutation.isPending}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {verifyOTPMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Verify & Login'
                )}
              </button>

              {verifyOTPMutation.error && (
                <p className="text-sm text-red-600 text-center">
                  {verifyOTPMutation.error.message}
                </p>
              )}

              <button
                type="button"
                onClick={() => setStep('login')}
                className="w-full text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Back to login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;