'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FaArrowLeft } from 'react-icons/fa';
import { getAdminReturnFromSearchParams } from '@/utils/adminReturnNavigation';

type AdminBackButtonProps = {
  defaultHref: string;
  defaultLabel: string;
  className?: string;
};

export function AdminBackButton({
  defaultHref,
  defaultLabel,
  className = 'receipt_back',
}: AdminBackButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { href, label } = getAdminReturnFromSearchParams(searchParams, {
    href: defaultHref,
    label: defaultLabel,
  });

  return (
    <button type="button" className={className} onClick={() => router.push(href)}>
      <FaArrowLeft /> {label}
    </button>
  );
}
