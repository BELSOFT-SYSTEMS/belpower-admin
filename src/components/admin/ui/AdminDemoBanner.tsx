'use client';

import { FaInfoCircle } from 'react-icons/fa';
import { useIsAdminDemoMode } from '@/context/AdminDemoContext';

type AdminDemoBannerProps = {
  message?: string;
};

export function AdminDemoBanner({
  message = 'Sample data for team review. Figures and records on this page are not real production data.',
}: AdminDemoBannerProps) {
  const enabled = useIsAdminDemoMode();
  if (!enabled) return null;

  return (
    <div className="admin_demo_banner" role="status">
      <FaInfoCircle className="admin_demo_banner_icon" aria-hidden />
      <div>
        <strong>Demo data</strong>
        <p>{message}</p>
      </div>
    </div>
  );
}
