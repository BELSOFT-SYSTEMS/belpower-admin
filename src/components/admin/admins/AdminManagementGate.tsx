'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FaLock } from 'react-icons/fa';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { canAccessAdminManagement } from '@/utils/adminManagementAccess';

type AdminManagementGateProps = {
  children: ReactNode;
};

export function AdminManagementGate({ children }: AdminManagementGateProps) {
  const { admin, isLoading } = useAdminAuth();
  const router = useRouter();
  const allowed = canAccessAdminManagement(admin);

  useEffect(() => {
    if (!isLoading && !allowed) {
      router.replace('/command-center');
    }
  }, [isLoading, allowed, router]);

  if (isLoading) return null;

  if (!allowed) {
    return (
      <div className="admin_access_denied">
        <FaLock aria-hidden />
        <h2>Access restricted</h2>
        <p>Admin Management is only available to super admin and admin roles.</p>
      </div>
    );
  }

  return <>{children}</>;
}
