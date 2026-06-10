import { NextResponse } from 'next/server';
import { getBackendBaseUrl } from '@/lib/backendUrl';

export async function GET() {
  try {
    const backendUrl = getBackendBaseUrl();
    const response = await fetch(`${backendUrl}/api/guest/bills/providers/electricity`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    const responseData = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: responseData.message ?? 'Failed to fetch electricity discos',
        },
        { status: response.status }
      );
    }

    return NextResponse.json(responseData, { status: response.status });
  } catch (error) {
    console.error('Fetch electricity discos error:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to reach the BelPower API' },
      { status: 502 }
    );
  }
}
