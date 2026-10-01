'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import {
  listMeterOwnershipClaims,
  listPrimaryMeterChangeRequests,
  updateMeterOwnershipClaimStatus,
  updatePrimaryMeterChangeStatus,
} from '@/lib/adminMeterOwnership';
import '@/styles/adminShared.css';

type Tab = 'primary' | 'claims';

function MeterRequestsContent() {
  const [tab, setTab] = useState<Tab>('primary');
  const [status, setStatus] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'primary') {
        const res = await listPrimaryMeterChangeRequests({
          status: status || undefined,
          limit: 50,
        });
        const data = (res as any).data || [];
        setRows(Array.isArray(data) ? data : []);
        setTotal((res as any).total || data.length || 0);
      } else {
        const res = await listMeterOwnershipClaims({
          status: status || undefined,
          limit: 50,
        });
        const data = (res as any).data || [];
        setRows(Array.isArray(data) ? data : []);
        setTotal((res as any).total || data.length || 0);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [tab, status]);

  useEffect(() => {
    load();
  }, [load]);

  const actPrimary = async (id: string, next: string) => {
    setBusyId(id);
    try {
      await updatePrimaryMeterChangeStatus(id, { status: next, admin_note: note || undefined });
      toast.success(`Marked ${next}`);
      setNote('');
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  const actClaim = async (id: string, next: string) => {
    setBusyId(id);
    try {
      await updateMeterOwnershipClaimStatus(id, { status: next, admin_note: note || undefined });
      toast.success(`Claim ${next}`);
      setNote('');
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin_page">
      <div className="admin_page_header">
        <h1>Meter requests</h1>
        <p>Primary meter changes (90-day gate) and Hycess ownership claims.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`admin_btn ${tab === 'primary' ? 'admin_btn_primary' : ''}`}
          onClick={() => setTab('primary')}
        >
          Primary meter changes
        </button>
        <button
          type="button"
          className={`admin_btn ${tab === 'claims' ? 'admin_btn_primary' : ''}`}
          onClick={() => setTab('claims')}
        >
          Ownership claims
        </button>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {tab === 'primary' ? (
            <>
              <option value="pending">Pending</option>
              <option value="in_review">In review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </>
          ) : (
            <>
              <option value="pending">Pending</option>
              <option value="claim_auto_verified">Auto verified</option>
              <option value="needs_support">Needs support</option>
              <option value="merged">Merged</option>
              <option value="overturned">Overturned</option>
              <option value="rejected">Rejected</option>
            </>
          )}
        </select>
        <button type="button" className="admin_btn" onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      <label style={{ display: 'block', marginBottom: 12 }}>
        Admin note (optional)
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ width: '100%', marginTop: 4 }}
          placeholder="Note for user / audit"
        />
      </label>

      <p style={{ marginBottom: 8 }}>
        {total} item{total === 1 ? '' : 's'}
      </p>

      {loading ? (
        <p>Loading…</p>
      ) : rows.length === 0 ? (
        <p>No rows</p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {rows.map((row) => (
            <div
              key={row.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: 12,
                background: '#fff',
              }}
            >
              {tab === 'primary' ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <strong>
                      {row.user?.name || row.user?.email || row.user_id} → {row.new_meter_number}
                    </strong>
                    <span>
                      {row.status}
                      {row.eligible ? ' · eligible' : ' · not eligible'}
                    </span>
                  </div>
                  <p style={{ margin: '8px 0', fontSize: 14 }}>
                    {row.old_meter_number || 'n/a'} → {row.new_meter_number} ({row.new_disco}/
                    {row.new_vend_type}) · {row.eligibility_days}/90 days · {row.purchase_count}{' '}
                    purchases
                  </p>
                  <p style={{ fontSize: 13, color: '#4b5563' }}>{row.reason}</p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    {row.status === 'pending' ? (
                      <button
                        type="button"
                        className="admin_btn"
                        disabled={busyId === row.id}
                        onClick={() => actPrimary(row.id, 'in_review')}
                      >
                        In review
                      </button>
                    ) : null}
                    {row.status === 'pending' || row.status === 'in_review' ? (
                      <>
                        <button
                          type="button"
                          className="admin_btn admin_btn_primary"
                          disabled={busyId === row.id || !row.eligible}
                          title={
                            row.eligible
                              ? 'Approve and swap primary'
                              : 'Cannot approve until 90-day eligible'
                          }
                          onClick={() => actPrimary(row.id, 'approved')}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="admin_btn"
                          disabled={busyId === row.id}
                          onClick={() => actPrimary(row.id, 'rejected')}
                        >
                          Reject
                        </button>
                      </>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <strong>
                      {row.claim_type} · {row.meter_number}
                    </strong>
                    <span>{row.status}</span>
                  </div>
                  <p style={{ margin: '8px 0', fontSize: 14 }}>
                    User: {row.belpowerUser?.email || row.belpower_user_id || 'n/a'} · score:{' '}
                    {row.ocr_score ?? 'n/a'} · attempts: {row.attempt_count}
                  </p>
                  {row.document_url ? (
                    <p style={{ fontSize: 13 }}>
                      <a href={row.document_url} target="_blank" rel="noreferrer">
                        View document
                      </a>
                    </p>
                  ) : null}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="admin_btn"
                      disabled={busyId === row.id}
                      onClick={() => actClaim(row.id, 'claim_auto_verified')}
                    >
                      Confirm verified
                    </button>
                    <button
                      type="button"
                      className="admin_btn"
                      disabled={busyId === row.id}
                      onClick={() => actClaim(row.id, 'overturned')}
                    >
                      Overturn
                    </button>
                    <button
                      type="button"
                      className="admin_btn"
                      disabled={busyId === row.id}
                      onClick={() => actClaim(row.id, 'rejected')}
                    >
                      Reject
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MeterRequestsPage() {
  return (
    <ProtectedRoute>
      <MeterRequestsContent />
    </ProtectedRoute>
  );
}
