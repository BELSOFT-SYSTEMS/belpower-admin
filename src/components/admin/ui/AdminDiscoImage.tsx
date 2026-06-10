'use client';

import Image from 'next/image';
import { getDiscoIcon } from '@/utils/transactionIcons';

const ELECTRICITY_FALLBACK = '/electricity.png';

type AdminDiscoImageProps = {
  disco: string;
  width: number;
  height: number;
  className?: string;
};

export function AdminDiscoImage({ disco, width, height, className }: AdminDiscoImageProps) {
  const src = getDiscoIcon(disco);

  return (
    <Image
      src={src}
      alt={disco}
      width={width}
      height={height}
      className={className}
      onError={(e) => {
        const img = e.currentTarget;
        if (img.src.endsWith(ELECTRICITY_FALLBACK)) return;
        img.src = ELECTRICITY_FALLBACK;
      }}
    />
  );
}
