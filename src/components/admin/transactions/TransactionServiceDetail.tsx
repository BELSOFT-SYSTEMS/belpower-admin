'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FaCopy, FaCheck } from 'react-icons/fa';
import { AdminTransaction } from '@/data/adminMockData';
import { getDiscoDisplayName } from '@/constants/discoNames';
import {
  getProviderDisplayName,
  getTransactionIcon,
  getTransactionIconFallback,
} from '@/utils/transactionIcons';
import { getTransactionTitle } from '@/data/adminMockData';
import { TransactionAmountBreakdown } from '@/components/admin/transactions/TransactionAmountBreakdown';
import { formatPrice } from '@/utils/FormatPrice';
import { getPaymentMethodLabel } from '@/utils/transactionAmountDisplay';

type Props = {
  transaction: AdminTransaction;
};

function ServiceField({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === '') return null;
  return (
    <div className="service_detail_field">
      <span className="service_detail_field_label">{label}</span>
      <span className="service_detail_field_value">{value}</span>
    </div>
  );
}

function PaymentRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="service_detail_payment_row">
      <span>{label}</span>
      <span>{value ?? 'N/A'}</span>
    </div>
  );
}

export function TransactionServiceDetail({ transaction }: Props) {
  const [tokenCopied, setTokenCopied] = useState(false);
  const type = transaction.type;
  const isElectricity = type === 'electricity';
  const isCable = type === 'cable';
  const isAirtime = type === 'airtime';
  const isData = type === 'data';
  const isDeposit = type === 'deposit';

  const iconSrc = getTransactionIcon({
    type: transaction.type,
    provider: transaction.provider,
    service: transaction.service,
  });

  const copyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      setTokenCopied(true);
      window.setTimeout(() => setTokenCopied(false), 2000);
    } catch {
      setTokenCopied(false);
    }
  };

  return (
    <div className="service_detail_tab">
      <div className="service_detail_header">
        <div className="service_detail_provider_icon">
          <Image
            src={iconSrc}
            alt={transaction.provider}
            width={48}
            height={48}
            onError={(e) => {
              e.currentTarget.src = getTransactionIconFallback(transaction.type);
            }}
          />
        </div>
        <div className="service_detail_header_body">
          <h3 className="service_detail_title">{getTransactionTitle(transaction)}</h3>
          {isElectricity && (
            <p className="service_detail_subtitle">
              {getProviderDisplayName(transaction.provider)} ·{' '}
              {getDiscoDisplayName(transaction.provider)} · Prepaid
            </p>
          )}
          {isElectricity && transaction.meter_number && (
            <p className="service_detail_meter">
              Meter <span className="service_detail_mono">{transaction.meter_number}</span>
            </p>
          )}
          {isCable && transaction.smartcard_number && (
            <p className="service_detail_meter">
              Smartcard{' '}
              <span className="service_detail_mono">{transaction.smartcard_number}</span>
            </p>
          )}
          {isCable && transaction.package_name && (
            <p className="service_detail_subtitle">{transaction.package_name}</p>
          )}
          {(isAirtime || isData) && transaction.phone_number && (
            <p className="service_detail_meter">
              Phone <span className="service_detail_mono">{transaction.phone_number}</span>
            </p>
          )}
          {isData && transaction.data_bundle && (
            <p className="service_detail_subtitle">{transaction.data_bundle}</p>
          )}
          {isDeposit && (
            <p className="service_detail_subtitle">Wallet credit — bank or card funding</p>
          )}
        </div>
      </div>

      <div className="service_detail_layout">
        <section className="service_detail_panel">
          <h4 className="service_detail_panel_title">Service information</h4>
          <div className="service_detail_fields">
            {isElectricity && (
              <>
                <ServiceField label="Customer name" value={transaction.customer_name} />
                <ServiceField label="Address" value={transaction.address} />
                <ServiceField
                  label="Payment method"
                  value={getPaymentMethodLabel(transaction.payment_method)}
                />
                <ServiceField label="Amount paid" value={formatPrice(transaction.amount)} />
                <ServiceField
                  label="Amount purchased"
                  value={formatPrice(transaction.amount_purchased ?? 0)}
                />
                <ServiceField
                  label="Service charge"
                  value={formatPrice(transaction.service_charge)}
                />
                <ServiceField label="VAT" value={formatPrice(transaction.vat)} />
                <ServiceField label="Total paid" value={formatPrice(transaction.total_amount)} />
              </>
            )}
            {isCable && (
              <>
                <ServiceField
                  label="Payment method"
                  value={getPaymentMethodLabel(transaction.payment_method)}
                />
                <ServiceField label="Package amount" value={formatPrice(transaction.amount)} />
                <ServiceField
                  label="Service charge"
                  value={formatPrice(transaction.service_charge)}
                />
                <ServiceField label="Total paid" value={formatPrice(transaction.total_amount)} />
              </>
            )}
            {isCable && <ServiceField label="Customer" value={transaction.customer_name} />}
            {(isAirtime || isData) && (
              <ServiceField
                label="Network"
                value={getProviderDisplayName(transaction.provider)}
              />
            )}
            {isDeposit && (
              <ServiceField label="Funding type" value="Wallet top-up" />
            )}
            {isDeposit && (
              <ServiceField label="Payment method" value={transaction.payment_method} />
            )}
          </div>
        </section>

        <section className="service_detail_panel">
          <h4 className="service_detail_panel_title">Payment breakdown</h4>
          <div className="service_detail_payment_box">
            {isDeposit ? (
              <PaymentRow
                label="Amount credited"
                value={<strong>{formatPrice(transaction.total_amount)}</strong>}
              />
            ) : (
              <TransactionAmountBreakdown
                transaction={transaction}
                rowClassName="service_detail_payment_row"
                totalClassName="service_detail_payment_row"
              />
            )}
          </div>
        </section>
      </div>

      {isElectricity && transaction.token && (
        <div className="service_detail_token_card">
          <div className="service_detail_token_top">
            <div>
              <span className="service_detail_token_label">Electricity token</span>
              {transaction.units != null && (
                <span className="service_detail_token_units">{transaction.units} kWh</span>
              )}
            </div>
            <button
              type="button"
              className={`service_detail_copy_btn${tokenCopied ? ' service_detail_copy_btn_done' : ''}`}
              onClick={() => copyToken(transaction.token!)}
            >
              {tokenCopied ? (
                <>
                  <FaCheck /> Copied
                </>
              ) : (
                <>
                  <FaCopy /> Copy token
                </>
              )}
            </button>
          </div>
          <code className="service_detail_token_value">{transaction.token}</code>
        </div>
      )}
    </div>
  );
}
