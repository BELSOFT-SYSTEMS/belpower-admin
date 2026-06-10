'use client';

import { useAdminAuth } from '@/context/AdminAuthContext';
import { getAdminInitials } from '@/utils/adminDisplay';
import { getAvatarBackground } from '@/utils/userAvatar';

type AdminAvatarProps = {
  size?: number;
  className?: string;
};

export function AdminAvatar({ size = 40, className }: AdminAvatarProps) {
  const { admin } = useAdminAuth();
  const initials = getAdminInitials(admin);
  const seed = admin?.id ?? admin?.email ?? 'admin';
  const background = getAvatarBackground(seed);

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.4,
        fontWeight: 700,
        color: '#fff',
        border: '2px solid #f0f4ff',
        flexShrink: 0,
      }}
      aria-hidden
    >
      {initials}
    </div>
  );
}
