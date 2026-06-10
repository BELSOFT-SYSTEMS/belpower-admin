'use client';

import { FaExclamationTriangle } from 'react-icons/fa';
import {
  criticalSeverityClass,
  type CriticalSeverity,
} from '@/utils/adminCriticalSeverity';

type AdminCriticalAlertProps = {
  severity: CriticalSeverity;
  title: string;
  message: string;
  className?: string;
};

export function AdminCriticalAlert({
  severity,
  title,
  message,
  className = '',
}: AdminCriticalAlertProps) {
  const classes = [
    'admin_alert',
    criticalSeverityClass(severity),
    'admin_flagged_alert',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} role="status">
      <FaExclamationTriangle aria-hidden />
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
    </div>
  );
}
