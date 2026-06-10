'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import '@/styles/adminSignIn.css';
import { ADMIN_SITE_TITLE } from '@/utils/adminPageTitle';
import { completeAccountSetup } from '@/lib/adminAuth';

const setupSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[a-z]/, 'Include a lowercase letter')
      .regex(/[0-9]/, 'Include a number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SetupFormData = z.infer<typeof setupSchema>;

export default function SetupAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams() || new URLSearchParams();
  const token = searchParams.get('token') ?? '';
  const setupRequired = searchParams.get('setup') === 'required';
  const emailHint = searchParams.get('email') ?? '';
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
  });

  useEffect(() => {
    document.title = `Complete Setup · ${ADMIN_SITE_TITLE}`;
  }, []);

  const onSubmit = async (data: SetupFormData) => {
    if (!token) {
      toast.error('Invalid or missing setup link. Check your invite email.');
      return;
    }

    try {
      setIsLoading(true);
      const email = await completeAccountSetup({
        token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      toast.success(
        email
          ? `Account setup complete for ${email}. You can now sign in.`
          : 'Account setup complete. You can now sign in.'
      );
      router.push('/command-center/sign-in');
    } catch (error) {
      console.error('Setup error:', error);
      toast.error(error instanceof Error ? error.message : 'Account setup failed.');
    } finally {
      setIsLoading(false);
    }
  };

  if (setupRequired && !token) {
    return (
      <div className="admin_sign_in_page">
        <div className="admin_sign_in_card">
          <h2 className="admin_sign_in_title">Complete your account setup</h2>
          <p className="admin_sign_in_subtitle">
            {emailHint
              ? `An invite link was sent to ${emailHint}. Open that email to finish setup.`
              : 'Please use the invite link sent to your email to complete account setup.'}
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
          <h2 className="admin_sign_in_title">Complete your account</h2>
          <p className="admin_sign_in_subtitle">
            Create a password to activate your Command Center access
          </p>
        </div>

        <form className="admin_sign_in_form" onSubmit={handleSubmit(onSubmit)}>
          <div className="admin_sign_in_field">
            <label htmlFor="password" className="admin_sign_in_label">
              Password
            </label>
            <div className="admin_sign_in_password_wrap">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
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
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && (
              <p className="admin_sign_in_error">{errors.password.message}</p>
            )}
          </div>

          <div className="admin_sign_in_field">
            <label htmlFor="confirmPassword" className="admin_sign_in_label">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={`admin_sign_in_input${errors.confirmPassword ? ' admin_sign_in_input_error' : ''}`}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="admin_sign_in_error">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button type="submit" className="admin_sign_in_submit">
            Activate account
          </button>
        </form>
      </div>
    </div>
  );
}
