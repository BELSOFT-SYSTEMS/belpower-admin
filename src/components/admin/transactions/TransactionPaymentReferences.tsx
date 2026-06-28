'use client';

import { FaCreditCard, FaClock, FaCalendarCheck } from 'react-icons/fa';
import { AdminTransaction } from '@/data/adminMockData';
import type { TransactionPaymentInfo } from '@/types/adminTransactions';
import { TransactionAmountBreakdown } from '@/components/admin/transactions/TransactionAmountBreakdown';
import { AdminCopyableValue } from '@/components/admin/ui/AdminCopyableValue';
import { formatPrice } from '@/utils/FormatPrice';
import { getPaymentMethodLabel } from '@/utils/transactionAmountDisplay';
import { formatRecordAdminDateTime } from '@/utils/formatAdminDate';
import {
  formatScheduledFrequency,
  formatTxnDateTime,
  isScheduledTransaction,
} from '@/utils/adminTransactionDisplay';

type Props = {
  transaction: AdminTransaction;
  payment?: TransactionPaymentInfo;
};

export function TransactionPaymentReferences({ transaction, payment }: Props) {
  const scheduled = isScheduledTransaction(transaction) && transaction.scheduled_info;
  const paymentMethod = payment?.method ?? transaction.payment_method;

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
              {getPaymentMethodLabel(paymentMethod)}
            </span>
          </div>
        </div>
      </div>

      <div className="payment_ref_layout">
        <section className="payment_ref_panel">
          <h4 className="payment_ref_panel_title">References</h4>
          <div className="payment_ref_fields">
            <AdminCopyableValue label="Transaction ID" value={transaction.id} />
            <AdminCopyableValue label="Reference" value={transaction.reference} />
            {transaction.order_id && (
              <AdminCopyableValue label="Order ID" value={transaction.order_id} />
            )}
            {payment?.gatewayReference && (
              <AdminCopyableValue label="Gateway reference" value={payment.gatewayReference} />
            )}
            {payment?.walletDebitReference && (
              <AdminCopyableValue
                label="Wallet debit reference"
                value={payment.walletDebitReference}
              />
            )}
            {payment?.providerReference && (
              <AdminCopyableValue label="Provider reference" value={payment.providerReference} />
            )}
          </div>
        </section>

        <section className="payment_ref_panel">
          <h4 className="payment_ref_panel_title">Amount breakdown</h4>
          <div className="payment_ref_amount_box">
            <TransactionAmountBreakdown
              transaction={transaction}
              rowClassName="payment_ref_amount_row"
              totalClassName="payment_ref_amount_total"
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
                {formatRecordAdminDateTime(transaction, 'createdAt', 'created_at')}
              </span>
            </div>
          </div>
          <div className="payment_ref_timeline_item">
            <FaCalendarCheck className="payment_ref_timeline_icon" aria-hidden />
            <div>
              <span className="payment_ref_timeline_label">Completed</span>
              <span className="payment_ref_timeline_value">
                {formatRecordAdminDateTime(transaction, 'completedAt', 'completed_at')}
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
