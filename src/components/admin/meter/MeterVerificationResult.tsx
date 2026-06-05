'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FaCheckCircle, FaCopy, FaCheck } from 'react-icons/fa';
import type { MeterVerificationResult as MeterVerificationResultType } from '@/types/meterVerification';
import { getDiscoDisplayName } from '@/constants/discoNames';
import { getDiscoIcon } from '@/utils/transactionIcons';
import { formatPrice } from '@/utils/FormatPrice';

type Props = {
  result: MeterVerificationResultType;
};

function formatExpiresAt(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function displayOrDash(value: string | null | undefined) {
  if (value == null || value === '') return '—';
  return value;
}

function CopyableValue({ value, label }: { value: string; label: string }) {
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

  return (
    <div className="check_meter_copy_row">
      <span className="check_meter_field_value check_meter_field_value_mono">{value}</span>
      <button type="button" className="check_meter_copy_btn" onClick={copy} title={`Copy ${label}`}>
        {copied ? <FaCheck /> : <FaCopy />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

export function MeterVerificationResultView({ result }: Props) {
  const envelope = result.data;
  const m = envelope.data;
  const vendLabel = m.vend_type?.toLowerCase() === 'postpaid' ? 'Postpaid' : 'Prepaid';

  return (
    <div className="check_meter_results">
      <div className="check_meter_success_banner">
        <div className="check_meter_success_icon" aria-hidden>
          <FaCheckCircle />
        </div>
        <div>
          <h2>{result.message}</h2>
          <p>Response code {m.response_code} · Verification valid until {formatExpiresAt(envelope.expires_at)}</p>
        </div>
        <span className="pill pill_success">Verified</span>
      </div>

      <div className="check_meter_result_header">
        <div className="check_meter_result_disco_icon">
          <Image
            src={getDiscoIcon(m.disco)}
            alt={m.disco}
            width={48}
            height={48}
            onError={(e) => {
              e.currentTarget.src = '/electricity.png';
            }}
          />
        </div>
        <div>
          <h3 className="check_meter_result_title">{m.customer_name}</h3>
          <p className="check_meter_result_sub">{getDiscoDisplayName(m.disco)} · {m.disco}</p>
          <div className="check_meter_result_pills">
            <span className="pill pill_success">{vendLabel}</span>
            {!m.error && <span className="pill pill_success">No error</span>}
          </div>
        </div>
      </div>

      <div className="check_meter_sections">
        <section className="check_meter_panel">
          <h4 className="check_meter_panel_title">Customer</h4>
          <div className="check_meter_fields_grid">
            <div className="check_meter_field check_meter_field_full">
              <span className="check_meter_field_label">Customer name</span>
              <span className="check_meter_field_value">{m.customer_name}</span>
            </div>
            <div className="check_meter_field check_meter_field_full">
              <span className="check_meter_field_label">Address</span>
              <span className="check_meter_field_value">{m.address}</span>
            </div>
            {m.BeneficiaryName && m.BeneficiaryName !== m.customer_name && (
              <div className="check_meter_field">
                <span className="check_meter_field_label">Beneficiary name</span>
                <span className="check_meter_field_value">{m.BeneficiaryName}</span>
              </div>
            )}
            {m.CustomerAddress && m.CustomerAddress !== m.address && (
              <div className="check_meter_field check_meter_field_full">
                <span className="check_meter_field_label">Customer address (API)</span>
                <span className="check_meter_field_value">{m.CustomerAddress}</span>
              </div>
            )}
          </div>
        </section>

        <section className="check_meter_panel">
          <h4 className="check_meter_panel_title">Meter</h4>
          <div className="check_meter_fields_grid">
            <div className="check_meter_field">
              <span className="check_meter_field_label">Meter number</span>
              <CopyableValue value={m.meter_number} label="meter number" />
            </div>
            <div className="check_meter_field">
              <span className="check_meter_field_label">Disco</span>
              <span className="check_meter_field_value">{getDiscoDisplayName(m.disco)}</span>
            </div>
            <div className="check_meter_field">
              <span className="check_meter_field_label">Disco code</span>
              <span className="check_meter_field_value">{m.disco}</span>
            </div>
            <div className="check_meter_field">
              <span className="check_meter_field_label">Vend type</span>
              <span className="check_meter_field_value">{m.vend_type}</span>
            </div>
            <div className="check_meter_field">
              <span className="check_meter_field_label">Tariff</span>
              <span className="check_meter_field_value">{displayOrDash(m.tariff)}</span>
            </div>
            <div className="check_meter_field">
              <span className="check_meter_field_label">Tariff class</span>
              <span className="check_meter_field_value">{displayOrDash(m.tariff_class)}</span>
            </div>
          </div>
        </section>

        <section className="check_meter_panel">
          <h4 className="check_meter_panel_title">Vend limits &amp; balances</h4>
          <div className="check_meter_fields_grid">
            <div className="check_meter_field">
              <span className="check_meter_field_label">Min vend amount</span>
              <span className="check_meter_field_value">{formatPrice(m.min_vend_amount)}</span>
            </div>
            <div className="check_meter_field">
              <span className="check_meter_field_label">Max vend amount</span>
              <span className="check_meter_field_value">{formatPrice(m.max_vend_amount)}</span>
            </div>
            <div className="check_meter_field">
              <span className="check_meter_field_label">Outstanding</span>
              <span className="check_meter_field_value">{formatPrice(m.outstanding)}</span>
            </div>
            <div className="check_meter_field">
              <span className="check_meter_field_label">Debt repayment</span>
              <span className="check_meter_field_value">{formatPrice(m.debt_repayment)}</span>
            </div>
          </div>
        </section>

        <section className="check_meter_panel check_meter_meta_panel">
          <h4 className="check_meter_panel_title">Verification</h4>
          <div className="check_meter_fields_grid">
            <div className="check_meter_field check_meter_field_full">
              <span className="check_meter_field_label">Verification ID</span>
              <CopyableValue value={envelope.verification_id} label="verification ID" />
            </div>
            <div className="check_meter_field">
              <span className="check_meter_field_label">Expires at</span>
              <span className="check_meter_field_value">{formatExpiresAt(envelope.expires_at)}</span>
            </div>
            <div className="check_meter_field">
              <span className="check_meter_field_label">Response code</span>
              <span className="check_meter_field_value">{m.response_code}</span>
            </div>
            <div className="check_meter_field">
              <span className="check_meter_field_label">Error flag</span>
              <span className="check_meter_field_value">{m.error ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
