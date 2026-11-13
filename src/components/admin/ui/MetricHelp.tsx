'use client';

import { useEffect, useId, useRef, useState } from 'react';
import {
  ANALYTICS_METRIC_GLOSSARY,
  type AnalyticsMetricKey,
} from '@/constants/analyticsMetricGlossary';

type MetricHelpProps = {
  metricKey?: AnalyticsMetricKey;
  text?: string;
  label?: string;
};

export function MetricHelp({ metricKey, text, label }: MetricHelpProps) {
  const tip = text || (metricKey ? ANALYTICS_METRIC_GLOSSARY[metricKey] : '');
  const [open, setOpen] = useState(false);
  const tipId = useId();
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!tip) return null;

  return (
    <span
      ref={rootRef}
      className={`metric_help${open ? ' is_open' : ''}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="metric_help_btn"
        aria-label={label || 'More information'}
        aria-describedby={open ? tipId : undefined}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        ?
      </button>
      {open ? (
        <span id={tipId} role="tooltip" className="metric_help_popover">
          {tip}
        </span>
      ) : null}
    </span>
  );
}
