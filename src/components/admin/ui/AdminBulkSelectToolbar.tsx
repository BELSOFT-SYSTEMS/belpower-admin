'use client';

import type { ReactNode } from 'react';

export type AdminBulkAction = {
  key: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'danger' | 'primary';
};

type AdminBulkSelectToolbarProps = {
  filters: ReactNode;
  selectionMode: boolean;
  selectedCount: number;
  isBusy?: boolean;
  actions?: AdminBulkAction[];
  allVisibleSelected?: boolean;
  onToggleSelectAll?: () => void;
  onToggleSelectionMode: () => void;
};

export function AdminBulkSelectToolbar({
  filters,
  selectionMode,
  selectedCount,
  isBusy = false,
  actions = [],
  allVisibleSelected = false,
  onToggleSelectAll,
  onToggleSelectionMode,
}: AdminBulkSelectToolbarProps) {
  return (
    <div className="admin_filter_row admin_bulk_filter_row">
      {filters}

      {selectionMode && actions.length > 0 && (
        <div className="admin_bulk_actions" role="group" aria-label="Bulk actions">
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              className={`admin_bulk_action_btn admin_bulk_action_btn_${action.variant ?? 'default'}`}
              disabled={isBusy || action.disabled || selectedCount === 0}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      <div className="admin_bulk_select_spacer" aria-hidden />

      {selectionMode && onToggleSelectAll && (
        <button
          type="button"
          className="admin_bulk_select_link"
          onClick={onToggleSelectAll}
          disabled={isBusy}
        >
          {allVisibleSelected ? 'Deselect all' : 'Select all'}
        </button>
      )}

      <button
        type="button"
        className="admin_bulk_select_link"
        onClick={onToggleSelectionMode}
        disabled={isBusy}
      >
        {selectionMode ? 'Cancel' : 'Select'}
      </button>
    </div>
  );
}
