'use client';

import { useState } from 'react';
import { FaCheck, FaCopy } from 'react-icons/fa';

type AdminCopyableValueProps = {
  value: string;
  label?: string;
  variant?: 'field' | 'inline';
  copyLabel?: string;
  className?: string;
};

export function AdminCopyableValue({
  value,
  label,
  variant = 'field',
  copyLabel = 'Copy',
  className = '',
}: AdminCopyableValueProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const copyTitle = copied ? 'Copied' : `Copy ${label ?? 'value'}`;

  const button = (
    <button
      type="button"
      className={`admin_copyable_btn${copied ? ' admin_copyable_btn_done' : ''}`}
      onClick={copy}
      title={copyTitle}
      aria-label={copyTitle}
    >
      {copied ? <FaCheck /> : <FaCopy />}
      {variant === 'field' ? <span>{copied ? 'Copied' : copyLabel}</span> : null}
    </button>
  );

  if (variant === 'inline') {
    return (
      <span className={`admin_copyable_inline ${className}`.trim()}>
        <span className="admin_copyable_mono">{value}</span>
        {button}
      </span>
    );
  }

  return (
    <div className={`admin_copyable_field ${className}`.trim()}>
      {label ? <span className="admin_copyable_label">{label}</span> : null}
      <div className="admin_copyable_row">
        <code className="admin_copyable_mono">{value}</code>
        {button}
      </div>
    </div>
  );
}
