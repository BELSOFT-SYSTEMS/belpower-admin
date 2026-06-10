import { adminFetch, AuthApiError } from '@/lib/adminAuth';
import { normalizeMeterVerifyResponse } from '@/lib/normalizeMeterVerification';
import type { MeterVerifyResult } from '@/types/meterVerification';

export type VerifyMeterInput = {
  meter: string;
  disco: string;
  vendType: 'PREPAID' | 'POSTPAID';
  purchaseLimit?: number;
};

export async function verifyMeter(input: VerifyMeterInput): Promise<MeterVerifyResult> {
  const meterNumber = input.meter.replace(/\D/g, '').trim();

  if (meterNumber.length < 10) {
    throw new Error('Enter a valid meter number (at least 10 digits).');
  }

  if (!input.disco) {
    throw new Error('Select a disco.');
  }

  try {
    const raw = await adminFetch<unknown>('/meters/verify', {
      method: 'POST',
      body: JSON.stringify({
        meterNumber,
        disco: input.disco.toUpperCase(),
        meterType: input.vendType.toLowerCase(),
        purchaseLimit: input.purchaseLimit ?? 50,
      }),
    });

    return normalizeMeterVerifyResponse(raw, 'Meter verified successfully');
  } catch (err) {
    if (err instanceof AuthApiError) {
      throw new Error(err.message || 'Meter verification failed');
    }
    throw err instanceof Error ? err : new Error('Meter verification failed');
  }
}
