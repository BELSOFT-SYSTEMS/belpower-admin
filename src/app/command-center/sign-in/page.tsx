'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { AdminOtpForm } from '@/components/admin/auth/AdminOtpForm';
import '@/styles/adminSignIn.css';
import { ADMIN_SITE_TITLE, formatAdminDocumentTitle } from '@/utils/adminPageTitle';
import {
  AccountInactiveError,
  adminLogin,
  adminVerifyOtp,
  saveLoginResult,
  SetupRequiredError,
} from '@/lib/adminAuth';

const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

type AdminLoginFormData = z.infer<typeof adminLoginSchema>;
type SignInStep = 'credentials' | 'otp';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams() || new URLSearchParams();
  const [step, setStep] = useState<SignInStep>('credentials');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingPassword, setPendingPassword] = useState('');
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | undefined>();
  const redirectTo = searchParams?.get('from') || '/command-center';

  useEffect(() => {
    document.title =
      step === 'otp'
        ? `Verify OTP · ${ADMIN_SITE_TITLE}`
        : formatAdminDocumentTitle('/command-center/sign-in');
  }, [step]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
  });

  const handleCredentialsSubmit = async (data: AdminLoginFormData) => {
    try {
      setIsLoading(true);
      const result = await adminLogin(data.email, data.password);

      if (result.step === 'otp') {
        setPendingEmail(result.email);
        setPendingPassword(data.password);
        setOtpExpiresAt(result.expiresAt);
        setStep('otp');
        toast.success('Verification code sent to your email');
        return;
      }

      saveLoginResult({ token: result.token, user: result.profile });
      toast.success('Login successful');
      window.location.href = redirectTo;
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof SetupRequiredError) {
        toast.error(error.message);
        const emailParam = error.email ? `&email=${encodeURIComponent(error.email)}` : '';
        router.push(`/command-center/setup-account?setup=required${emailParam}`);
        return;
      }
      if (error instanceof AccountInactiveError) {
        toast.error(error.message);
        return;
      }
      toast.error(error instanceof Error ? error.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async (otp: string) => {
    await adminVerifyOtp(pendingEmail, otp);
    toast.success('Login successful');
    window.location.href = redirectTo;
  };

  const handleOtpResend = async () => {
    const email = pendingEmail || getValues('email');
    const password = pendingPassword || getValues('password');
    if (!email || !password) {
      throw new Error('Session expired. Please sign in again.');
    }

    const result = await adminLogin(email, password);
    if (result.step !== 'otp') {
      throw new Error('Unexpected login response. Please try again.');
    }

    setOtpExpiresAt(result.expiresAt);
    toast.success('Verification code resent to your email');
  };

  const handleBackToCredentials = () => {
    setStep('credentials');
    setPendingEmail('');
    setPendingPassword('');
    setOtpExpiresAt(undefined);
  };

  if (isLoading) {
    return (
      <div className="admin_sign_in_loading">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="admin_sign_in_page">
      <div className="admin_sign_in_card">
        <div className="flex flex-col items-center">
          <div className="admin_sign_in_logo">
            <Image
              src="/belpower_full.png"
              alt="BelPower Command Center"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h2 className="admin_sign_in_title">
            {step === 'credentials' ? 'Command Center Sign In' : 'Verify your identity'}
          </h2>
          <p className="admin_sign_in_subtitle">
            {step === 'credentials'
              ? 'Enter your credentials to access the command center'
              : 'Two-factor authentication keeps your admin account secure'}
          </p>
        </div>

        {step === 'credentials' ? (
          <form className="admin_sign_in_form" onSubmit={handleSubmit(handleCredentialsSubmit)}>
            <div className="rounded-md shadow-sm space-y-4">
              <div className="admin_sign_in_field">
                <label htmlFor="email" className="admin_sign_in_label">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`admin_sign_in_input${errors.email ? ' admin_sign_in_input_error' : ''}`}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="admin_sign_in_error">{errors.email.message}</p>
                )}
              </div>

              <div className="admin_sign_in_field">
                <label htmlFor="password" className="admin_sign_in_label">
                  Password
                </label>
                <div className="admin_sign_in_password_wrap">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`admin_sign_in_input${errors.password ? ' admin_sign_in_input_error' : ''}`}
                    style={{ paddingRight: '2.5rem' }}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="admin_sign_in_password_toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="admin_sign_in_error">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="admin_sign_in_row">
              <label className="admin_sign_in_remember">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                Remember me
              </label>

              <a href="#" className="admin_sign_in_link">
                Forgot your password?
              </a>
            </div>

            <button type="submit" className="admin_sign_in_submit" disabled={isLoading}>
              Sign in
            </button>
          </form>
        ) : (
          <AdminOtpForm
            email={pendingEmail}
            expiresAt={otpExpiresAt}
            onVerify={handleOtpVerify}
            onResend={handleOtpResend}
            onBack={handleBackToCredentials}
          />
        )}

        <div className="admin_sign_in_footer">
          <p>Contact your system administrator if you need access</p>
        </div>
      </div>
    </div>
  );
}
