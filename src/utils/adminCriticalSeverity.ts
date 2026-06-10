export type CriticalSeverity = 'warning' | 'danger' | 'critical';

/**
 * Map flagged counts (+ optional very-critical subset) to banner severity.
 * critical = deep red, danger = red, warning = amber.
 */
export function resolveCriticalSeverity(
  totalFlagged: number,
  veryCriticalCount = 0
): CriticalSeverity | null {
  if (totalFlagged <= 0 && veryCriticalCount <= 0) return null;

  if (veryCriticalCount > 0 || totalFlagged >= 10) return 'critical';
  if (totalFlagged >= 3) return 'danger';
  return 'warning';
}

export function criticalSeverityClass(severity: CriticalSeverity): string {
  switch (severity) {
    case 'critical':
      return 'admin_alert_critical';
    case 'danger':
      return 'admin_alert_danger';
    default:
      return 'admin_alert_warning';
  }
}
