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
import { PasswordVisibilityToggle } from '@/components/admin/auth/PasswordVisibilityToggle';
import '@/styles/adminSignIn.css';
import { ADMIN_SITE_TITLE, formatAdminDocumentTitle } from '@/utils/adminPageTitle';
import {
  AccountInactiveError,
  adminLogin,
  adminVerifyOtp,
  getRememberMePreference,
  saveLoginResult,
  SetupRequiredError,
} from '@/lib/adminAuth';
import { useAdminAuth } from '@/context/AdminAuthContext';

const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

type AdminLoginFormData = z.infer<typeof adminLoginSchema>;
type SignInStep = 'credentials' | 'otp';

export default function AdminLoginPage() {
  const router = useRouter();
  const { setAdmin } = useAdminAuth();
  const searchParams = useSearchParams() || new URLSearchParams();
  const [step, setStep] = useState<SignInStep>('credentials');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingPassword, setPendingPassword] = useState('');
  const [pendingRememberMe, setPendingRememberMe] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | undefined>();
  const redirectTo = searchParams?.get('from') || '/command-center';

  useEffect(() => {
    setRememberMe(getRememberMePreference());
  }, []);

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
        setPendingRememberMe(rememberMe);
        setOtpExpiresAt(result.expiresAt);
        setStep('otp');
        toast.success('Verification code sent to your email');
        return;
      }

      const profile = saveLoginResult({ token: result.token, user: result.profile }, { remember: rememberMe });
      setAdmin(profile);
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
    const profile = await adminVerifyOtp(pendingEmail, otp, { remember: pendingRememberMe });
    setAdmin(profile);
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
    setPendingRememberMe(false);
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
                  <PasswordVisibilityToggle
                    visible={showPassword}
                    onToggle={() => setShowPassword((current) => !current)}
                  />
                </div>
                {errors.password && (
                  <p className="admin_sign_in_error">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="admin_sign_in_row admin_sign_in_row_remember">
              <label className="admin_sign_in_remember">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                Remember me
              </label>
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
