import type { MeterVerificationResult } from '@/types/meterVerification';

export type VerifyMeterInput = {
  meter: string;
  disco: string;
  vendType: 'PREPAID' | 'POSTPAID';
};

/** Mock — replace with API call when integrated */
export async function verifyMeter(input: VerifyMeterInput): Promise<MeterVerificationResult> {
  await new Promise((r) => setTimeout(r, 600));

  const meter = input.meter.trim();
  const disco = input.disco.toUpperCase();

  if (meter.length < 10) {
    throw new Error('Enter a valid meter number (at least 10 digits).');
  }

  if (!disco) {
    throw new Error('Select a disco.');
  }

  // Sample response aligned with production API shape
  if (meter === '45022530096' || meter.startsWith('450225')) {
    return {
      success: true,
      message: 'Meter verified successfully',
      data: {
        success: true,
        data: {
          meter_number: meter,
          disco,
          vend_type: input.vendType,
          customer_name: 'KAFE GARDEN 2 ESTATE ABUJARES.ASSOCIATION',
          address: 'KAFE GARDEN 2 ESTATE ABUJA SECURITY POST,, GWARIMPA',
          tariff: null,
          tariff_class: null,
          min_vend_amount: 900,
          max_vend_amount: 10000000,
          outstanding: 0,
          debt_repayment: 0,
          response_code: 100,
          error: false,
          BeneficiaryName: 'KAFE GARDEN 2 ESTATE ABUJARES.ASSOCIATION',
          CustomerAddress:
            'KAFE GARDEN 2 ESTATE ABUJA SECURITY POST, , GWARIMPA',
        },
        verification_id: '16fe55c0-ebf2-42ac-bc94-526613f0b122',
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
    };
  }

  return {
    success: true,
    message: 'Meter verified successfully',
    data: {
      success: true,
      data: {
        meter_number: meter,
        disco,
        vend_type: input.vendType,
        customer_name: 'JOHN TRAVIS',
        address: '12 Admiralty Way, Lekki, Lagos',
        tariff: 'R2',
        tariff_class: 'Residential',
        min_vend_amount: 500,
        max_vend_amount: 500000,
        outstanding: 0,
        debt_repayment: 0,
        response_code: 100,
        error: false,
        BeneficiaryName: 'JOHN TRAVIS',
        CustomerAddress: '12 Admiralty Way, Lekki, Lagos',
      },
      verification_id: `mock-${Date.now().toString(36)}`,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    },
  };
}

/**
 * Future: wire to bills verify endpoint
 * GET /api/bills/verify/meter?meter=&disco=&vertical=ELECTRICITY&vendType=
 */
export async function verifyMeterFromApi(
  input: VerifyMeterInput
): Promise<MeterVerificationResult> {
  const params = new URLSearchParams({
    meter: input.meter.trim(),
    disco: input.disco.toUpperCase(),
    vertical: 'ELECTRICITY',
    vendType: input.vendType,
  });
  const res = await fetch(`/api/bills/verify/meter?${params}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message ?? 'Meter verification failed');
  }
  return json as MeterVerificationResult;
}
