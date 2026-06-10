'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { PasswordVisibilityToggle } from '@/components/admin/auth/PasswordVisibilityToggle';
import '@/styles/adminSignIn.css';
import { ADMIN_SITE_TITLE } from '@/utils/adminPageTitle';
import { resetAdminPassword } from '@/lib/adminAuth';

const resetSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[0-9]/, 'Include a number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams() || new URLSearchParams();
  const token = searchParams.get('token') ?? '';
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  useEffect(() => {
    document.title = `Reset Password · ${ADMIN_SITE_TITLE}`;
  }, []);

  const onSubmit = async (data: ResetFormData) => {
    if (!token) {
      toast.error('Invalid or missing reset link. Request a new link from your administrator.');
      return;
    }

    try {
      setIsLoading(true);
      const email = await resetAdminPassword({
        token,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      toast.success(
        email
          ? `Password updated for ${email}. You can now sign in.`
          : 'Password updated. You can now sign in.'
      );
      router.push('/command-center/sign-in');
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(error instanceof Error ? error.message : 'Password reset failed.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="admin_sign_in_page">
        <div className="admin_sign_in_card">
          <h2 className="admin_sign_in_title">Reset your password</h2>
          <p className="admin_sign_in_subtitle">
            This reset link is invalid or has expired. Ask your super admin to send a new password
            reset link.
          </p>
          <button
            type="button"
            className="admin_sign_in_submit"
            onClick={() => router.push('/command-center/sign-in')}
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

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
          <h2 className="admin_sign_in_title">Set a new password</h2>
          <p className="admin_sign_in_subtitle">
            Choose a new password for your Command Center account
          </p>
        </div>

        <form className="admin_sign_in_form" onSubmit={handleSubmit(onSubmit)}>
          <div className="admin_sign_in_field">
            <label htmlFor="newPassword" className="admin_sign_in_label">
              New password
            </label>
            <div className="admin_sign_in_password_wrap">
              <input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={`admin_sign_in_input${errors.newPassword ? ' admin_sign_in_input_error' : ''}`}
                style={{ paddingRight: '2.5rem' }}
                {...register('newPassword')}
              />
              <PasswordVisibilityToggle
                visible={showPassword}
                onToggle={() => setShowPassword((current) => !current)}
              />
            </div>
            {errors.newPassword && (
              <p className="admin_sign_in_error">{errors.newPassword.message}</p>
            )}
          </div>

          <div className="admin_sign_in_field">
            <label htmlFor="confirmPassword" className="admin_sign_in_label">
              Confirm password
            </label>
            <div className="admin_sign_in_password_wrap">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={`admin_sign_in_input${errors.confirmPassword ? ' admin_sign_in_input_error' : ''}`}
                style={{ paddingRight: '2.5rem' }}
                {...register('confirmPassword')}
              />
              <PasswordVisibilityToggle
                visible={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((current) => !current)}
              />
            </div>
            {errors.confirmPassword && (
              <p className="admin_sign_in_error">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button type="submit" className="admin_sign_in_submit">
            Set new password
          </button>
        </form>
      </div>
    </div>
  );
}
