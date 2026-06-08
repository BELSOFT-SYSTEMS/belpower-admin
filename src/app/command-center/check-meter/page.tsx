'use client';

import { Suspense, useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FaSearch } from 'react-icons/fa';
import '@/styles/adminCheckMeter.css';
import '@/styles/adminShared.css';
import { AdminDropdown } from '@/components/admin/ui/AdminDropdown';
import { DISCO_NAMES } from '@/constants/discoNames';
import { verifyMeter } from '@/lib/meterVerification';
import type { MeterVerificationResult } from '@/types/meterVerification';
import { MeterVerificationResultView } from '@/components/admin/meter/MeterVerificationResult';

const DISCO_OPTIONS = Object.keys(DISCO_NAMES)
  .map((code) => ({ code, name: DISCO_NAMES[code] }))
  .sort((a, b) => a.name.localeCompare(b.name));

function CheckMeterPageContent() {
  const searchParams = useSearchParams();
  const initialMeter = searchParams.get('meter') ?? '';
  const initialDisco = (searchParams.get('disco') ?? '').toUpperCase();
  const initialType = (searchParams.get('type') ?? 'prepaid').toUpperCase();

  const [meterNumber, setMeterNumber] = useState(initialMeter);
  const [disco, setDisco] = useState(
    DISCO_OPTIONS.some((d) => d.code === initialDisco) ? initialDisco : ''
  );
  const [vendType, setVendType] = useState<'PREPAID' | 'POSTPAID'>(
    initialType === 'POSTPAID' ? 'POSTPAID' : 'PREPAID'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MeterVerificationResult | null>(null);

  const discoOptions = useMemo(() => DISCO_OPTIONS, []);

  const discoDropdownOptions = useMemo(
    () => [
      { value: '', label: 'Select disco' },
      ...discoOptions.map((d) => ({ value: d.code, label: d.name })),
    ],
    [discoOptions]
  );

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
    [meterNumber, disco, vendType]
  );

  const handleReset = () => {
    setMeterNumber('');
    setDisco('');
    setVendType('PREPAID');
    setError(null);
    setResult(null);
  };

  return (
    <div className="check_meter_page">
      <h1>Check Meter</h1>
      <p className="check_meter_subtitle">
        Verify a customer meter before support or admin actions. Mock data matches the production
        verify API shape — swap in <code>verifyMeterFromApi</code> when ready.
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
              placeholder="e.g. 45022530096"
              value={meterNumber}
              onChange={(e) => setMeterNumber(e.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
              autoComplete="off"
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
              options={discoDropdownOptions}
              placeholder="Select disco"
            />
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
          <button type="submit" className="check_meter_submit" disabled={loading}>
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

      {!result && !loading && !error && (
        <p className="check_meter_subtitle" style={{ marginTop: 0 }}>
          Try sample meter <strong>45022530096</strong> with disco <strong>ABUJA</strong> (prepaid).
        </p>
      )}
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
