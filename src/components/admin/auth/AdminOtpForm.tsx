'use client';

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { maskEmail } from '@/utils/maskEmail';
import { AuthApiError } from '@/lib/adminAuth';
import { digitsFromOtpInput } from '@/utils/otpInput';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SEC = 60;

type AdminOtpFormProps = {
  email: string;
  expiresAt?: string;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
};

function formatExpiryCountdown(expiresAt: string): string | null {
  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  if (Number.isNaN(remainingMs) || remainingMs <= 0) return 'Code expired';
  const totalSec = Math.floor(remainingMs / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `Code expires in ${min}:${sec.toString().padStart(2, '0')}`;
}

export function AdminOtpForm({ email, expiresAt, onVerify, onResend, onBack }: AdminOtpFormProps) {
  const [digits, setDigits] = useState<string[]>(() => Array(OTP_LENGTH).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SEC);
  const [expiryLabel, setExpiryLabel] = useState<string | null>(
    expiresAt ? formatExpiryCountdown(expiresAt) : null
  );
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const otp = digits.join('');
  const isComplete = otp.length === OTP_LENGTH && digits.every((d) => d !== '');

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (!expiresAt) return;
    const update = () => setExpiryLabel(formatExpiryCountdown(expiresAt));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  const updateDigit = (index: number, value: string) => {
    const digitsOnly = value.replace(/\D/g, '');

    if (!digitsOnly) {
      setDigits((prev) => {
        const next = [...prev];
        next[index] = '';
        return next;
      });
      setError(null);
      return;
    }

    if (digitsOnly.length > 1) {
      const next = digitsFromOtpInput(digitsOnly, OTP_LENGTH);
      setDigits(next);
      setError(null);
      const focusIndex = Math.min(digitsOnly.length, OTP_LENGTH - 1);
      inputRefs.current[focusIndex]?.focus();
      return;
    }

    const digit = digitsOnly.slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    setError(null);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    event.preventDefault();
    updateDigit(index, event.clipboardData.getData('text'));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isComplete || isVerifying) return;

    try {
      setIsVerifying(true);
      setError(null);
      await onVerify(otp);
    } catch (err) {
      let message =
        err instanceof Error ? err.message : 'Invalid verification code. Please try again.';
      if (err instanceof AuthApiError && err.attempts) {
        message = `${message} (${err.attempts} failed attempt${err.attempts === 1 ? '' : 's'})`;
      }
      setError(message);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;

    try {
      setIsResending(true);
      setError(null);
      await onResend();
      setCooldown(RESEND_COOLDOWN_SEC);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form className="admin_sign_in_form" onSubmit={handleSubmit}>
      <p className="admin_sign_in_subtitle" style={{ marginTop: 0 }}>
        Enter the 6-digit code sent to
      </p>
      <p className="admin_otp_email">{maskEmail(email)}</p>
      {expiryLabel && (
        <p className="admin_sign_in_subtitle" style={{ marginTop: '0.5rem', textAlign: 'center' }}>
          {expiryLabel}
        </p>
      )}

      <div className="admin_otp_inputs" role="group" aria-label="One-time password">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={OTP_LENGTH}
            value={digit}
            aria-label={`OTP digit ${index + 1}`}
            className={`admin_otp_digit${digit ? ' admin_otp_digit_filled' : ''}`}
            onChange={(e) => updateDigit(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={(e) => handlePaste(e, index)}
            disabled={isVerifying}
          />
        ))}
      </div>

      {error && <p className="admin_sign_in_error" style={{ textAlign: 'center' }}>{error}</p>}

      <div className="admin_otp_resend_row">
        Didn&apos;t receive a code?
        <button
          type="button"
          className="admin_otp_resend_btn"
          onClick={handleResend}
          disabled={cooldown > 0 || isResending || isVerifying}
        >
          {isResending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
      </div>

      <button
        type="submit"
        className="admin_sign_in_submit"
        disabled={!isComplete || isVerifying}
      >
        {isVerifying ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying…
          </>
        ) : (
          'Verify & sign in'
        )}
      </button>

      <button type="button" className="admin_otp_back" onClick={onBack} disabled={isVerifying}>
        ← Back to sign in
      </button>
    </form>
  );
}
