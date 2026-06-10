'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FaSearch } from 'react-icons/fa';
import '@/styles/adminCheckMeter.css';
import '@/styles/adminShared.css';
import { AdminDropdown } from '@/components/admin/ui/AdminDropdown';
import { useElectricityDiscos } from '@/hooks/useElectricityDiscos';
import { verifyMeter } from '@/lib/meterVerification';
import type { MeterVerifyResult } from '@/types/meterVerification';
import { MeterVerificationResultView } from '@/components/admin/meter/MeterVerificationResult';
import { useAdminAuth } from '@/context/AdminAuthContext';

function CheckMeterPageContent() {
  const searchParams = useSearchParams();
  const { canAccess } = useAdminAuth();
  const { discos, dropdownOptions, isLoading: discosLoading, error: discosError } =
    useElectricityDiscos();
  const initialMeter = searchParams.get('meter') ?? '';
  const initialDisco = (searchParams.get('disco') ?? '').toUpperCase();
  const initialType = (searchParams.get('type') ?? 'prepaid').toUpperCase();

  const [meterNumber, setMeterNumber] = useState(initialMeter);
  const [disco, setDisco] = useState('');
  const [vendType, setVendType] = useState<'PREPAID' | 'POSTPAID'>(
    initialType === 'POSTPAID' ? 'POSTPAID' : 'PREPAID'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MeterVerifyResult | null>(null);

  const canVerify = canAccess('meters.verify');

  useEffect(() => {
    if (!initialDisco || discos.length === 0) return;
    if (discos.some((item) => item.code === initialDisco)) {
      setDisco(initialDisco);
    }
  }, [initialDisco, discos]);

  const meterTypeOptions = useMemo(
    () => [
      { value: 'PREPAID', label: 'Prepaid' },
      { value: 'POSTPAID', label: 'Postpaid' },
    ],
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canVerify) return;

      setError(null);
      setResult(null);
      setLoading(true);
      try {
        const response = await verifyMeter({
          meter: meterNumber,
          disco,
          vendType,
        });
        setResult(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Verification failed');
      } finally {
        setLoading(false);
      }
    },
    [meterNumber, disco, vendType, canVerify]
  );

  const handleReset = () => {
    setMeterNumber('');
    setDisco('');
    setVendType('PREPAID');
    setError(null);
    setResult(null);
  };

  if (!canVerify) {
    return (
      <div className="check_meter_page">
        <h1>Check Meter</h1>
        <p className="empty_fallback">You do not have permission to verify meters.</p>
      </div>
    );
  }

  return (
    <div className="check_meter_page">
      <h1>Check Meter</h1>
      <p className="check_meter_subtitle">
        Verify a customer meter before support or admin actions.
      </p>

      <form className="check_meter_form_card" onSubmit={handleSubmit}>
        <div className="check_meter_form_grid">
          <div className="check_meter_field_meter">
            <label className="check_meter_label" htmlFor="meter_number">
              Meter number
            </label>
            <input
              id="meter_number"
              type="text"
              className="check_meter_input check_meter_input_mono"
              placeholder="Enter meter number"
              value={meterNumber}
              onChange={(e) => setMeterNumber(e.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
              autoComplete="off"
              required
            />
          </div>
          <div>
            <label className="check_meter_label" htmlFor="disco">
              Disco
            </label>
            <AdminDropdown
              id="disco"
              value={disco}
              onChange={setDisco}
              options={dropdownOptions}
              placeholder={discosLoading ? 'Loading discos…' : 'Select disco'}
              disabled={discosLoading || dropdownOptions.length <= 1}
            />
            {discosError && (
              <p className="check_meter_subtitle" style={{ marginTop: '0.35rem', color: '#b45309' }}>
                {discosError} Showing fallback disco list.
              </p>
            )}
          </div>
          <div>
            <label className="check_meter_label" htmlFor="vend_type">
              Meter type
            </label>
            <AdminDropdown
              id="vend_type"
              value={vendType}
              onChange={(value) => setVendType(value as 'PREPAID' | 'POSTPAID')}
              options={meterTypeOptions}
            />
          </div>
        </div>
        <div className="check_meter_form_actions">
          <button
            type="submit"
            className="check_meter_submit"
            disabled={loading || !meterNumber || !disco}
          >
            <FaSearch style={{ marginRight: 6 }} />
            {loading ? 'Verifying…' : 'Verify'}
          </button>
          <button type="button" className="check_meter_reset" onClick={handleReset}>
            Clear
          </button>
        </div>
        {error && <p className="check_meter_error">{error}</p>}
      </form>

      {result && <MeterVerificationResultView result={result} />}
    </div>
  );
}

export default function CheckMeterPage() {
  return (
    <Suspense
      fallback={
        <div className="check_meter_page">
          <h1>Check Meter</h1>
          <p className="check_meter_subtitle">Loading…</p>
        </div>
      }
    >
      <CheckMeterPageContent />
    </Suspense>
  );
}
