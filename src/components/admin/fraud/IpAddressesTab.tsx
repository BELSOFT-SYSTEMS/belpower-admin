'use client';

import { useEffect, useMemo, useState } from 'react';
import { FaBan, FaCheckCircle, FaShieldAlt, FaUnlock } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useAdminIpAddresses } from '@/hooks/useAdminIpAddresses';
import {
  banIpAddressForever,
  blockIpAddress,
  removeIpWhitelist,
  unblockIpAddress,
  whitelistIpAddress,
} from '@/lib/adminIpAddresses';
import { formatAdminDateTime } from '@/utils/formatAdminDate';
import type { IpAddressCategoryFilter, IpAddressRecord } from '@/types/adminIpAddresses';

const CATEGORY_OPTIONS: Array<{ value: IpAddressCategoryFilter | ''; label: string }> = [
  { value: '', label: 'All records' },
  { value: 'blacklisted', label: 'Blacklisted (blocked + banned)' },
  { value: 'blocked', label: 'Temporarily blocked' },
  { value: 'banned', label: 'Banned forever' },
  { value: 'whitelisted', label: 'Whitelisted' },
];

function statusPillClass(status: IpAddressRecord['status']): string {
  if (status === 'whitelisted') return 'pill pill_status_whitelisted';
  if (status === 'banned') return 'pill pill_status_banned';
  if (status === 'blocked') return 'pill pill_status_blocked';
  return 'pill pill_status_muted';
}

function statusLabel(record: IpAddressRecord): string {
  if (record.status === 'whitelisted') return 'Whitelisted';
  if (record.status === 'banned') return 'Banned forever';
  if (record.status === 'blocked') return 'Blocked';
  if (record.status === 'expired') return 'Expired';
  return record.status;
}

function sourceLabel(source?: string | null): string {
  if (source === 'admin') return 'Admin action';
  if (source === 'rate_limit') return 'Rate limit';
  if (source === 'honeytoken') return 'Security trap';
  return 'System';
}

export function IpAddressesTab() {
  const { canAccess } = useAdminAuth();
  const canManage = canAccess('fraud.review');

  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<IpAddressCategoryFilter | ''>('');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIp, setSelectedIp] = useState<string | null>(null);
  const [manualIp, setManualIp] = useState('');
  const [manualReason, setManualReason] = useState('');
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  const { items, pagination, stats, isLoading, error, refresh } = useAdminIpAddresses({
    page,
    category: categoryFilter || 'all',
    search: searchTerm,
  });

  useEffect(() => {
    setPage(1);
  }, [categoryFilter, searchTerm]);

  const selectedRecord = useMemo(
    () => items.find((item) => item.ipAddress === selectedIp) ?? null,
    [items, selectedIp]
  );

  const runAction = async (
    actionKey: string,
    action: () => Promise<unknown>,
    successMessage: string
  ) => {
    setActionBusy(actionKey);
    try {
      await action();
      toast.success(successMessage);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionBusy(null);
    }
  };

  const handleManualAction = async (
    action: 'block' | 'ban' | 'whitelist',
    ipAddress: string
  ) => {
    const trimmedIp = ipAddress.trim();
    if (!trimmedIp) {
      toast.error('Enter an IP address');
      return;
    }

    const payload = {
      ipAddress: trimmedIp,
      reason: manualReason.trim() || undefined,
      description: manualReason.trim() || undefined,
    };

    if (action === 'block') {
      await runAction(`block-${trimmedIp}`, () => blockIpAddress(payload), 'IP blocked');
    } else if (action === 'ban') {
      await runAction(`ban-${trimmedIp}`, () => banIpAddressForever(payload), 'IP banned permanently');
    } else {
      await runAction(
        `whitelist-${trimmedIp}`,
        () => whitelistIpAddress(payload),
        'IP whitelisted'
      );
    }
  };

  return (
    <div className="ip_addresses_tab">
      <section className="stats_section">
        <div className="stats_card">
          <span className="stats_card_label">Temporarily blocked</span>
          <strong>{isLoading ? '—' : stats.activeBlockedCount}</strong>
        </div>
        <div className="stats_card">
          <span className="stats_card_label">Banned forever</span>
          <strong>{isLoading ? '—' : stats.permanentBannedCount}</strong>
        </div>
        <div className="stats_card">
          <span className="stats_card_label">Whitelisted</span>
          <strong>{isLoading ? '—' : stats.whitelistedCount}</strong>
        </div>
        <div className="stats_card">
          <span className="stats_card_label">Auto-blocked (24h)</span>
          <strong>{isLoading ? '—' : stats.autoBlocked24h}</strong>
        </div>
        <div className="stats_card">
          <span className="stats_card_label">Expiring in 24h</span>
          <strong>{isLoading ? '—' : stats.expiring24h}</strong>
        </div>
      </section>

      {canManage && (
        <section className="ip_manual_action_panel">
          <h2 className="ip_section_title">Manage IP address</h2>
          <p className="ip_section_subtitle">
            Block, permanently ban, or whitelist an IP. Whitelisting clears any active block.
          </p>
          <div className="ip_manual_action_form">
            <input
              type="text"
              value={manualIp}
              onChange={(e) => setManualIp(e.target.value)}
              placeholder="e.g. 105.112.11.81"
              aria-label="IP address"
            />
            <input
              type="text"
              value={manualReason}
              onChange={(e) => setManualReason(e.target.value)}
              placeholder="Reason or note (optional)"
              aria-label="Reason"
            />
            <div className="ip_manual_action_buttons">
              <button
                type="button"
                className="btn_secondary"
                disabled={Boolean(actionBusy)}
                onClick={() => handleManualAction('block', manualIp)}
              >
                Block (24h)
              </button>
              <button
                type="button"
                className="btn_danger"
                disabled={Boolean(actionBusy)}
                onClick={() => handleManualAction('ban', manualIp)}
              >
                Ban forever
              </button>
              <button
                type="button"
                className="btn_primary"
                disabled={Boolean(actionBusy)}
                onClick={() => handleManualAction('whitelist', manualIp)}
              >
                Whitelist
              </button>
            </div>
          </div>
        </section>
      )}

      <div className="ip_addresses_toolbar">
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setSearchTerm(searchInput.trim());
          }}
          placeholder="Search IP address…"
          aria-label="Search IP address"
        />
        <button type="button" className="btn_secondary" onClick={() => setSearchTerm(searchInput.trim())}>
          Search
        </button>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as IpAddressCategoryFilter | '')}
          aria-label="Filter IP records"
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="admin_error_banner">{error}</p>}

      <div className="ip_addresses_layout">
        <section className="ip_addresses_list_panel">
          {isLoading ? (
            <div className="empty_fallback">
              <Loader2 className="spin_icon" aria-hidden="true" />
              Loading IP addresses…
            </div>
          ) : items.length === 0 ? (
            <p className="empty_fallback">No IP records match your filters.</p>
          ) : (
            <ul className="ip_addresses_list">
              {items.map((record) => (
                <li key={`${record.recordType}-${record.id}`}>
                  <button
                    type="button"
                    className={`ip_address_row ${selectedIp === record.ipAddress ? 'selected' : ''}`}
                    onClick={() => setSelectedIp(record.ipAddress)}
                  >
                    <div className="ip_address_row_top">
                      <code>{record.ipAddress}</code>
                      <span className={statusPillClass(record.status)}>{statusLabel(record)}</span>
                    </div>
                    <div className="ip_address_row_meta">
                      <span>{record.recordType === 'whitelist' ? 'Whitelist' : sourceLabel(record.source)}</span>
                      <span>{formatAdminDateTime(record.createdAt)}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {pagination.totalPages > 1 && (
            <div className="pagination_controls">
              <button
                type="button"
                className="btn_secondary"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                className="btn_secondary"
                disabled={page >= pagination.totalPages || isLoading}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          )}
        </section>

        <aside className="ip_address_detail_panel">
          {!selectedRecord ? (
            <div className="empty_fallback">Select an IP address to review details and actions.</div>
          ) : (
            <>
              <div className="ip_detail_header">
                <FaShieldAlt aria-hidden="true" />
                <div>
                  <h2>{selectedRecord.ipAddress}</h2>
                  <span className={statusPillClass(selectedRecord.status)}>{statusLabel(selectedRecord)}</span>
                </div>
              </div>

              <div className="ip_detail_grid">
                <div>
                  <span className="fraud_detail_label">Record type</span>
                  <span>{selectedRecord.recordType === 'whitelist' ? 'Whitelist' : 'Block'}</span>
                </div>
                {selectedRecord.source && (
                  <div>
                    <span className="fraud_detail_label">Source</span>
                    <span>{sourceLabel(selectedRecord.source)}</span>
                  </div>
                )}
                {selectedRecord.reason && (
                  <div>
                    <span className="fraud_detail_label">Reason</span>
                    <span>{selectedRecord.reason}</span>
                  </div>
                )}
                {selectedRecord.description && (
                  <div>
                    <span className="fraud_detail_label">Description</span>
                    <span>{selectedRecord.description}</span>
                  </div>
                )}
                {selectedRecord.offenseCount != null && selectedRecord.recordType === 'block' && (
                  <div>
                    <span className="fraud_detail_label">Offense count</span>
                    <span>{selectedRecord.offenseCount}</span>
                  </div>
                )}
                {selectedRecord.expiresAt && (
                  <div>
                    <span className="fraud_detail_label">Expires</span>
                    <span>{formatAdminDateTime(selectedRecord.expiresAt)}</span>
                  </div>
                )}
                <div>
                  <span className="fraud_detail_label">Created</span>
                  <span>{formatAdminDateTime(selectedRecord.createdAt)}</span>
                </div>
              </div>

              {canManage && (
                <div className="ip_detail_actions">
                  {(selectedRecord.status === 'blocked' || selectedRecord.status === 'banned') && (
                    <button
                      type="button"
                      className="btn_secondary"
                      disabled={Boolean(actionBusy)}
                      onClick={() =>
                        runAction(
                          `unblock-${selectedRecord.ipAddress}`,
                          () =>
                            unblockIpAddress({
                              ipAddress: selectedRecord.ipAddress,
                              reason: 'Unblocked from admin panel',
                            }),
                          'IP unblocked'
                        )
                      }
                    >
                      <FaUnlock aria-hidden="true" />
                      Unblock
                    </button>
                  )}
                  {selectedRecord.status === 'whitelisted' ? (
                    <button
                      type="button"
                      className="btn_secondary"
                      disabled={Boolean(actionBusy)}
                      onClick={() =>
                        runAction(
                          `remove-whitelist-${selectedRecord.ipAddress}`,
                          () =>
                            removeIpWhitelist({
                              ipAddress: selectedRecord.ipAddress,
                            }),
                          'Removed from whitelist'
                        )
                      }
                    >
                      <FaBan aria-hidden="true" />
                      Remove whitelist
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn_primary"
                      disabled={Boolean(actionBusy)}
                      onClick={() =>
                        runAction(
                          `whitelist-${selectedRecord.ipAddress}`,
                          () =>
                            whitelistIpAddress({
                              ipAddress: selectedRecord.ipAddress,
                              description: 'Whitelisted from admin panel',
                            }),
                          'IP whitelisted'
                        )
                      }
                    >
                      <FaCheckCircle aria-hidden="true" />
                      Whitelist
                    </button>
                  )}
                  {selectedRecord.status !== 'banned' && selectedRecord.recordType !== 'whitelist' && (
                    <button
                      type="button"
                      className="btn_danger"
                      disabled={Boolean(actionBusy)}
                      onClick={() =>
                        runAction(
                          `ban-${selectedRecord.ipAddress}`,
                          () =>
                            banIpAddressForever({
                              ipAddress: selectedRecord.ipAddress,
                              reason: 'Banned forever from admin panel',
                            }),
                          'IP banned permanently'
                        )
                      }
                    >
                      <FaBan aria-hidden="true" />
                      Ban forever
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
