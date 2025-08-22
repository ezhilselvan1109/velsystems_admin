import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMutation } from '@tanstack/react-query';
import { Mail, ArrowRight, Loader2, UserPlus, LogIn } from 'lucide-react';
import { authService } from '../services/auth';
import { useAuth } from '../contexts/AuthContext';
import { LoginFormData, OTPFormData, OTPIdentifierInfo } from '../types/auth';
import { toast } from 'react-toastify';

const loginSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),
});

const otpSchema = yup.object({
  otp: yup
    .string()
    .required('OTP is required')
    .length(6, 'OTP must be 6 digits'),
});

const Login: React.FC = () => {
  const [step, setStep] = useState<'auth-type' | 'email' | 'otp'>('auth-type');
  const [authType, setAuthType] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [otpInfo, setOtpInfo] = useState<OTPIdentifierInfo | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from?.pathname || '/';

  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
  });

  const {
    register: registerOTP,
    handleSubmit: handleOTPSubmit,
    formState: { errors: otpErrors },
    reset: resetOTP,
  } = useForm<OTPFormData>({
    resolver: yupResolver(otpSchema),
  });

  const generateOTPMutation = useMutation({
    mutationFn: authService.generateOTP,
    onSuccess: (data) => {
      if (data.otpIdentifierInfo && data.otpIdentifierInfo.length > 0) {
        setOtpInfo(data.otpIdentifierInfo[0]);
        setStep('otp');
        toast.success(data.toastMessage);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send OTP');
    },
  });

  const verifyOTPMutation = useMutation({
    mutationFn: ({ otp, requestId, email, type }: { 
      otp: string; 
      requestId: string; 
      email: string; 
      type: 'sign-in' | 'sign-up' 
    }) => {
      if (type === 'sign-in') {
        return authService.verifySignInOTP(otp, requestId, email);
      } else {
        return authService.verifySignUpOTP(otp, requestId, email);
      }
    },
    onSuccess: async () => {
      toast.success(`${authType === 'sign-in' ? 'Sign in' : 'Sign up'} successful!`);
      // Fetch user data after successful authentication
      try {
        const user = await authService.me();
        login(user);
        navigate(from, { replace: true });
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        toast.error('Authentication successful but failed to load user data');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'OTP verification failed');
      resetOTP();
    },
  });

  const onEmailSubmit = useCallback((data: LoginFormData) => {
    setEmail(data.email);
    generateOTPMutation.mutate(data.email);
  }, [generateOTPMutation]);

  const onOTPSubmit = useCallback((data: OTPFormData) => {
    if (otpInfo) {
      verifyOTPMutation.mutate({
        otp: data.otp,
        requestId: otpInfo.requestId,
        email: otpInfo.email,
        type: authType,
      });
    }
  }, [verifyOTPMutation, otpInfo, authType]);

  const handleBackToEmail = useCallback(() => {
    setStep('email');
    setOtpInfo(null);
    resetOTP();
  }, [resetOTP]);

  const handleBackToAuthType = useCallback(() => {
    setStep('auth-type');
    setEmail('');
    setOtpInfo(null);
    resetOTP();
  }, [resetOTP]);

  const handleAuthTypeSelect = useCallback((type: 'sign-in' | 'sign-up') => {
    setAuthType(type);
    setStep('email');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-40 h-30 mx-auto mb-4 flex items-center justify-center">
              <img
                src="/vels-logo.png"
                alt="Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center hidden">
                <Mail className="w-8 h-8 text-white" />
              </div>
            </div>
            
            {step === 'auth-type' && (
              <>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome</h1>
                <p className="text-gray-600">Choose how you'd like to continue</p>
              </>
            )}
            
            {step === 'email' && (
              <>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {authType === 'sign-in' ? 'Welcome Back' : 'Create Account'}
                </h1>
                <p className="text-gray-600">
                  {authType === 'sign-in' 
                    ? 'Enter your email to sign in' 
                    : 'Enter your email to create a new account'
                  }
                </p>
              </>
            )}
            
            {step === 'otp' && (
              <>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify OTP</h1>
                <p className="text-gray-600">
                  {otpInfo?.tooltipText || `We've sent a 6-digit code to ${email}`}
                </p>
              </>
            )}
          </div>

          {/* Auth Type Selection */}
          {step === 'auth-type' && (
            <div className="space-y-4">
              <button
                onClick={() => handleAuthTypeSelect('sign-in')}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Sign In
              </button>
              
              <button
                onClick={() => handleAuthTypeSelect('sign-up')}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Sign Up
              </button>
            </div>
          )}

          {/* Email Form */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  {...registerEmail('email')}
                  type="email"
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                {emailErrors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {emailErrors.email.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={generateOTPMutation.isPending}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {generateOTPMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Send OTP
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleBackToAuthType}
                className="w-full text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Back to options
              </button>
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

              {otpInfo && (
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <p><strong>Email:</strong> {otpInfo.email}</p>
                  <p><strong>Expires:</strong> {new Date(otpInfo.expiryDate).toLocaleString()}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={verifyOTPMutation.isPending}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {verifyOTPMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  `Verify & ${authType === 'sign-in' ? 'Sign In' : 'Sign Up'}`
                )}
              </button>

              <div className="flex flex-col space-y-2">
                <button
                  type="button"
                  onClick={() => generateOTPMutation.mutate(email)}
                  disabled={generateOTPMutation.isPending}
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors disabled:opacity-50"
                >
                  {generateOTPMutation.isPending ? 'Sending...' : 'Resend OTP'}
                </button>
                
                <button
                  type="button"
                  onClick={handleBackToEmail}
                  className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Back to email
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;