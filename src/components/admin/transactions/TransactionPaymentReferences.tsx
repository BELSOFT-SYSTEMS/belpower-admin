'use client';

import { useState } from 'react';
import { FaCopy, FaCheck, FaCreditCard, FaClock, FaCalendarCheck } from 'react-icons/fa';
import { AdminTransaction } from '@/data/adminMockData';
import { formatPrice } from '@/utils/FormatPrice';
import {
  formatScheduledFrequency,
  formatTxnDateTime,
  isScheduledTransaction,
} from '@/utils/adminTransactionDisplay';

type Props = {
  transaction: AdminTransaction;
};

function formatDisplayDate(iso: string | null) {
  if (!iso) return '—';
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

function CopyableRef({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
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
    <div className="payment_ref_copy_field">
      <span className="payment_ref_field_label">{label}</span>
      <div className="payment_ref_copy_row">
        <code className="payment_ref_mono">{value}</code>
        <button
          type="button"
          className={`payment_ref_copy_btn${copied ? ' payment_ref_copy_btn_done' : ''}`}
          onClick={copy}
          title={`Copy ${label}`}
        >
          {copied ? <FaCheck /> : <FaCopy />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
    </div>
  );
}

function AmountRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="payment_ref_amount_row">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function TransactionPaymentReferences({ transaction }: Props) {
  const scheduled = isScheduledTransaction(transaction) && transaction.scheduled_info;

  return (
    <div className="payment_ref_tab">
      <div className="payment_ref_hero">
        <div className="payment_ref_hero_amount">
          <span className="payment_ref_hero_label">Total paid</span>
          <strong className="payment_ref_hero_value">
            {formatPrice(transaction.total_amount)}
          </strong>
        </div>
        <div className="payment_ref_hero_method">
          <FaCreditCard aria-hidden />
          <div>
            <span className="payment_ref_hero_label">Payment method</span>
            <span className="payment_ref_method_value">
              {transaction.payment_method ?? 'N/A'}
            </span>
          </div>
        </div>
      </div>

      <div className="payment_ref_layout">
        <section className="payment_ref_panel">
          <h4 className="payment_ref_panel_title">References</h4>
          <div className="payment_ref_fields">
            <CopyableRef label="Transaction ID" value={transaction.reference} />
            {transaction.order_id && (
              <CopyableRef label="Order ID" value={transaction.order_id} />
            )}
          </div>
        </section>

        <section className="payment_ref_panel">
          <h4 className="payment_ref_panel_title">Amount breakdown</h4>
          <div className="payment_ref_amount_box">
            <AmountRow label="Amount" value={formatPrice(transaction.amount)} />
            <AmountRow label="Service charge" value={formatPrice(transaction.service_charge)} />
            <AmountRow label="VAT" value={formatPrice(transaction.vat)} />
            <AmountRow
              label="Total paid"
              value={<strong>{formatPrice(transaction.total_amount)}</strong>}
            />
          </div>
        </section>
      </div>

      <section className="payment_ref_panel payment_ref_dates_panel">
        <h4 className="payment_ref_panel_title">Timeline</h4>
        <div className="payment_ref_timeline">
          <div className="payment_ref_timeline_item">
            <FaClock className="payment_ref_timeline_icon" aria-hidden />
            <div>
              <span className="payment_ref_timeline_label">Created</span>
              <span className="payment_ref_timeline_value">
                {formatDisplayDate(transaction.created_at)}
              </span>
            </div>
          </div>
          <div className="payment_ref_timeline_item">
            <FaCalendarCheck className="payment_ref_timeline_icon" aria-hidden />
            <div>
              <span className="payment_ref_timeline_label">Completed</span>
              <span className="payment_ref_timeline_value">
                {formatDisplayDate(transaction.completed_at)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {scheduled && (
        <section className="payment_ref_panel payment_ref_scheduled_panel">
          <h4 className="payment_ref_panel_title">Scheduled payment</h4>
          <div className="payment_ref_scheduled_grid">
            <div className="payment_ref_field">
              <span className="payment_ref_field_label">Scheduled</span>
              <span className="payment_ref_field_value">
                <span className="pill pill_scheduled">Yes</span>
              </span>
            </div>
            <div className="payment_ref_field">
              <span className="payment_ref_field_label">Frequency</span>
              <span className="payment_ref_field_value">
                {formatScheduledFrequency(transaction.scheduled_info!.frequency)}
              </span>
            </div>
            <div className="payment_ref_field">
              <span className="payment_ref_field_label">Next purchase</span>
              <span className="payment_ref_field_value">
                {formatTxnDateTime(transaction.scheduled_info!.next_purchase)}
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
