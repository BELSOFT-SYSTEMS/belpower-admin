'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaCheckCircle, FaCopy, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { AdminTabs } from '@/components/admin/ui/AdminTabs';
import type { MeterElectricityPurchase, MeterVerifyResult } from '@/types/meterVerification';
import { getDiscoDisplayName } from '@/constants/discoNames';
import { getDiscoIcon } from '@/utils/transactionIcons';
import { formatPrice } from '@/utils/FormatPrice';
import { formatAdminDateTime } from '@/utils/formatAdminDate';

type Props = {
  result: MeterVerifyResult;
};

function displayOrDash(value: string | null | undefined) {
  if (value == null || value === '') return '—';
  return value;
}

function formatUserName(
  firstName?: string | null,
  lastName?: string | null
): string {
  const name = [firstName, lastName].filter(Boolean).join(' ').trim();
  return name || 'Guest';
}

function statusLabel(status: string): string {
  if (!status) return 'Unknown';
  return status.replace(/_/g, ' ');
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

function statusPillClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'pill_success';
    case 'pending':
      return 'pill_pending';
    case 'failed':
    case 'cancelled':
      return 'pill_failed';
    default:
      return 'pill_pending';
  }
}

function FieldGrid({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`check_meter_fields_grid ${className}`.trim()}>{children}</div>;
}

function Field({
  label,
  children,
  fullWidth = false,
}: {
  label: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div className={`check_meter_field${fullWidth ? ' check_meter_field_full' : ''}`}>
      <span className="check_meter_field_label">{label}</span>
      {children}
    </div>
  );
}

function MeterPurchaseRow({ purchase }: { purchase: MeterElectricityPurchase }) {
  const userName = formatUserName(purchase.user?.firstName, purchase.user?.lastName);
  const userEmail = purchase.user?.email?.trim() || null;

  return (
    <Link
      href={`/command-center/transactions/${purchase.id}`}
      className="admin_txn_row check_meter_purchase_row"
    >
      <div className="admin_txn_icon_wrap">
        <Image src="/electricity.png" alt="" width={24} height={24} />
      </div>
      <div className="admin_txn_row_body">
        <div className="admin_txn_row_top">
          <span className="admin_txn_title check_meter_purchase_ref">{purchase.reference}</span>
          <span className="admin_txn_date">{formatAdminDateTime(purchase.createdAt)}</span>
        </div>
        <div className="admin_txn_row_bottom">
          <div className="check_meter_purchase_meta">
            <span className="admin_txn_amount">{formatPrice(purchase.totalAmount || purchase.amount)}</span>
            <span className="check_meter_purchase_user">
              {userName}
              {userEmail ? ` · ${userEmail}` : ''}
            </span>
            <span className="check_meter_purchase_breakdown">
              Paid {formatPrice(purchase.amount)}
              {purchase.amountPurchased != null && purchase.amountPurchased > 0
                ? ` · Purchased ${formatPrice(purchase.amountPurchased)}`
                : ''}
              {(purchase.vat ?? 0) > 0 ? ` · VAT ${formatPrice(purchase.vat ?? 0)}` : ''}
            </span>
            {purchase.paymentMethod && (
              <span className="check_meter_purchase_payment">{purchase.paymentMethod}</span>
            )}
          </div>
          <div className="admin_txn_pills">
            <span className={`pill ${statusPillClass(purchase.status)}`}>
              {statusLabel(purchase.status)}
            </span>
            {purchase.isSuspicious && <span className="pill pill_fraud">Flagged</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function MeterVerificationResultView({ result }: Props) {
  const [activeTab, setActiveTab] = useState('overview');
  const m = result.payload;
  const vendLabel = m.vend_type?.toLowerCase() === 'postpaid' ? 'Postpaid' : 'Prepaid';
  const verified = result.verificationSuccess;

  const tabs = useMemo(
    () => [
      { id: 'overview', label: 'Overview' },
      { id: 'meter', label: 'Meter' },
      { id: 'provider', label: 'Provider' },
      {
        id: 'purchases',
        label: 'Purchases',
        badge: result.purchaseCount > 0 ? result.purchaseCount : undefined,
      },
    ],
    [result.purchaseCount]
  );

  return (
    <div className="check_meter_results">
      <div
        className={`check_meter_success_banner${verified ? '' : ' check_meter_warning_banner'}`}
      >
        <div
          className={`check_meter_success_icon${verified ? '' : ' check_meter_warning_icon'}`}
          aria-hidden
        >
          {verified ? <FaCheckCircle /> : <FaExclamationTriangle />}
        </div>
        <div>
          <h2>{result.message}</h2>
          <p>
            Response code {m.response_code}
            {result.meterNumber ? ` · Meter ${result.meterNumber}` : ''}
          </p>
        </div>
        <span className={`pill ${verified ? 'pill_success' : 'pill_pending'}`}>
          {verified ? 'Verified' : 'Check response'}
        </span>
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
          <h3 className="check_meter_result_title">{m.customer_name || '—'}</h3>
          <p className="check_meter_result_sub">
            {getDiscoDisplayName(m.disco)} · {m.disco}
          </p>
          <div className="check_meter_result_pills">
            <span className="pill pill_success">{vendLabel}</span>
            {!m.error && <span className="pill pill_success">No error</span>}
            {m.error && <span className="pill pill_failed">Provider error</span>}
          </div>
        </div>
      </div>

      <div className="admin_panel_card check_meter_tabs_container">
        <AdminTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === 'overview' && (
          <div className="tab_panel check_meter_tab_panel">
            <section className="check_meter_panel">
              <h4 className="check_meter_panel_title">Customer</h4>
              <FieldGrid>
                <Field label="Customer name" fullWidth>
                  <span className="check_meter_field_value">{displayOrDash(m.customer_name)}</span>
                </Field>
                <Field label="Address" fullWidth>
                  <span className="check_meter_field_value">{displayOrDash(m.address)}</span>
                </Field>
                {m.BeneficiaryName && m.BeneficiaryName !== m.customer_name && (
                  <Field label="Beneficiary name">
                    <span className="check_meter_field_value">{m.BeneficiaryName}</span>
                  </Field>
                )}
                {m.CustomerAddress && m.CustomerAddress !== m.address && (
                  <Field label="Customer address (API)" fullWidth>
                    <span className="check_meter_field_value">{m.CustomerAddress}</span>
                  </Field>
                )}
              </FieldGrid>
            </section>

            <section className="check_meter_panel">
              <h4 className="check_meter_panel_title">Meter summary</h4>
              <FieldGrid>
                <Field label="Meter number">
                  <CopyableValue value={m.meter_number || result.meterNumber} label="meter number" />
                </Field>
                <Field label="Disco">
                  <span className="check_meter_field_value">{getDiscoDisplayName(m.disco)}</span>
                </Field>
                <Field label="Vend type">
                  <span className="check_meter_field_value">{m.vend_type}</span>
                </Field>
                <Field label="Tariff">
                  <span className="check_meter_field_value">{displayOrDash(m.tariff)}</span>
                </Field>
                <Field label="Min vend amount">
                  <span className="check_meter_field_value">{formatPrice(m.min_vend_amount)}</span>
                </Field>
                <Field label="Max vend amount">
                  <span className="check_meter_field_value">{formatPrice(m.max_vend_amount)}</span>
                </Field>
              </FieldGrid>
            </section>
          </div>
        )}

        {activeTab === 'meter' && (
          <div className="tab_panel check_meter_tab_panel">
            <section className="check_meter_panel">
              <h4 className="check_meter_panel_title">Meter details</h4>
              <FieldGrid>
                <Field label="Meter number">
                  <CopyableValue value={m.meter_number || result.meterNumber} label="meter number" />
                </Field>
                <Field label="Disco">
                  <span className="check_meter_field_value">{getDiscoDisplayName(m.disco)}</span>
                </Field>
                <Field label="Disco code">
                  <span className="check_meter_field_value">{m.disco}</span>
                </Field>
                <Field label="Vend type">
                  <span className="check_meter_field_value">{m.vend_type}</span>
                </Field>
                <Field label="Tariff">
                  <span className="check_meter_field_value">{displayOrDash(m.tariff)}</span>
                </Field>
                <Field label="Tariff class">
                  <span className="check_meter_field_value">{displayOrDash(m.tariff_class)}</span>
                </Field>
              </FieldGrid>
            </section>

            <section className="check_meter_panel">
              <h4 className="check_meter_panel_title">Vend limits &amp; balances</h4>
              <FieldGrid>
                <Field label="Min vend amount">
                  <span className="check_meter_field_value">{formatPrice(m.min_vend_amount)}</span>
                </Field>
                <Field label="Max vend amount">
                  <span className="check_meter_field_value">{formatPrice(m.max_vend_amount)}</span>
                </Field>
                <Field label="Outstanding">
                  <span className="check_meter_field_value">{formatPrice(m.outstanding)}</span>
                </Field>
                <Field label="Debt repayment">
                  <span className="check_meter_field_value">{formatPrice(m.debt_repayment)}</span>
                </Field>
              </FieldGrid>
            </section>
          </div>
        )}

        {activeTab === 'provider' && (
          <div className="tab_panel check_meter_tab_panel">
            <section className="check_meter_panel check_meter_meta_panel">
              <h4 className="check_meter_panel_title">Provider response</h4>
              <FieldGrid>
                <Field label="Response code">
                  <span className="check_meter_field_value">{m.response_code}</span>
                </Field>
                <Field label="Error flag">
                  <span className="check_meter_field_value">{m.error ? 'Yes' : 'No'}</span>
                </Field>
                <Field label="Verification status">
                  <span className="check_meter_field_value">
                    {verified ? 'Verified' : 'Not verified'}
                  </span>
                </Field>
                <Field label="Message">
                  <span className="check_meter_field_value">{result.message}</span>
                </Field>
              </FieldGrid>
            </section>
          </div>
        )}

        {activeTab === 'purchases' && (
          <div className="tab_panel check_meter_tab_panel check_meter_purchases_tab">
            <div className="check_meter_purchases_header_bar">
              <div>
                <h4 className="check_meter_purchases_title">Purchase history</h4>
                <p className="check_meter_purchases_subtitle">
                  Electricity transactions on this meter from BelPower records.
                </p>
              </div>
              <span className="check_meter_purchases_badge">
                {result.purchaseCount} total
              </span>
            </div>

            {result.electricityPurchases.length === 0 ? (
              <div className="check_meter_purchases_empty_card">
                <p className="check_meter_purchases_empty_title">No purchases yet</p>
                <p className="check_meter_purchases_empty">
                  No electricity purchases were found for this meter number.
                </p>
              </div>
            ) : (
              <div className="check_meter_purchases_list">
                <div className="admin_txn_list">
                  {result.electricityPurchases.map((purchase) => (
                    <MeterPurchaseRow key={purchase.id} purchase={purchase} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
