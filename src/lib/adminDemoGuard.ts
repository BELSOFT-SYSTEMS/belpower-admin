import { AuthApiError } from '@/lib/adminAuth';
import { getAdminDemoMode } from '@/lib/adminDemoMode';

export function assertLiveAdminApi(): void {
  if (typeof window !== 'undefined' && getAdminDemoMode()) {
    throw new AuthApiError('This action is disabled in demo mode.', 'DEMO_MODE');
  }
}
