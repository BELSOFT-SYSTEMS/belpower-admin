'use client';

import Image from 'next/image';
import { formatPrice } from '@/utils/FormatPrice';
import type { PurchasePreflight } from '@/lib/adminUserPurchases';
import { AdminPurchaseButton } from '@/components/admin/users/billPurchase/AdminPurchaseButton';
import {
  getCableProviderDetails,
  getConfirmTitle,
  getDiscoLogo,
  getNetworkLogo,
  getProviderLabel,
  getPurchaseAmount,
  getServiceCharge,
  getTotalDebit,
  type PurchaseDraft,
} from '@/components/admin/users/billPurchase/purchaseModalUtils';

type Props = {
  draft: PurchaseDraft;
  preflight: PurchasePreflight;
  userEmail?: string | null;
  isSubmitting: boolean;
  submitError?: string | null;
  onBack: () => void;
  onConfirm: () => void;
  onClose: () => void;
};

export function AdminPurchaseConfirmStep({
  draft,
  preflight,
  userEmail,
  isSubmitting,
  submitError,
  onBack,
  onConfirm,
  onClose,
}: Props) {
  const amount = getPurchaseAmount(draft);
  const serviceCharge = getServiceCharge(draft.service);
  const totalAmount = getTotalDebit(draft);
  const balance = preflight.walletBalance;
  const insufficient = balance < totalAmount;

  const providerLogo =
    draft.service === 'electricity'
      ? getDiscoLogo(draft.disco || '')
      : draft.service === 'cable'
        ? getCableProviderDetails(draft.provider || '').logo
        : getNetworkLogo(draft.network || '');

  const providerLabel = getProviderLabel(draft.service, draft);

  return (
    <div className="admin_purchase_confirm">
      <div className="admin_purchase_modal_topbar">
        <button type="button" className="admin_purchase_back_btn" onClick={onBack} aria-label="Back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M15 18L9 12L15 6"
              stroke="#1F2937"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h5>{getConfirmTitle(draft.service)}</h5>
        <button type="button" className="admin_purchase_modal_close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <div className="admin_purchase_confirm_body">
        <div className="admin_purchase_confirm_section">
          <h3 className="admin_purchase_section_title">
            <span>Service</span>
          </h3>
          <div className="admin_purchase_provider_info">
            <div className="admin_purchase_provider_logo">
              <Image
                src={providerLogo}
                alt=""
                width={48}
                height={48}
                onError={(event) => {
                  event.currentTarget.src = '/belPower1.png';
                }}
              />
            </div>
            <div className="admin_purchase_provider_details">
              <p className="admin_purchase_provider_name">{providerLabel}</p>
              {draft.service === 'airtime' && (
                <>
                  <p className="admin_purchase_provider_meta">Phone: {draft.phone}</p>
                  <p className="admin_purchase_provider_meta">{formatPrice(amount)} Airtime</p>
                </>
              )}
              {draft.service === 'data' && (
                <>
                  <p className="admin_purchase_provider_meta">Phone: {draft.phone}</p>
                  <p className="admin_purchase_provider_meta">{draft.bundleLabel} Data Bundle</p>
                </>
              )}
              {draft.service === 'electricity' && (
                <>
                  <p className="admin_purchase_provider_meta">
                    {draft.electricityType === 'postpaid' ? 'Postpaid' : 'Prepaid'}
                  </p>
                  <p className="admin_purchase_provider_meta">Meter: {draft.meter}</p>
                  {draft.customerName && (
                    <p className="admin_purchase_provider_meta">Customer: {draft.customerName}</p>
                  )}
                </>
              )}
              {draft.service === 'cable' && (
                <>
                  <p className="admin_purchase_provider_meta">Smart Card: {draft.smartcard}</p>
                  <p className="admin_purchase_provider_meta">{draft.packageName}</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="admin_purchase_confirm_section">
          <h3 className="admin_purchase_section_title">
            <span>Amount Breakdown</span>
          </h3>
          <div className="admin_purchase_amount_row">
            <span>Amount</span>
            <span>{formatPrice(amount)}</span>
          </div>
          {serviceCharge > 0 && (
            <div className="admin_purchase_amount_row">
              <span>Service Charge</span>
              <span>{formatPrice(serviceCharge)}</span>
            </div>
          )}
          <div className="admin_purchase_amount_row admin_purchase_amount_total">
            <span>Total Amount</span>
            <span>{formatPrice(totalAmount)}</span>
          </div>
        </div>

        <div className="admin_purchase_confirm_section">
          <h3 className="admin_purchase_section_title">
            <span>Payment Method</span>
          </h3>
          <div className="admin_purchase_amount_row">
            <span>User wallet balance</span>
            <span className={insufficient ? 'admin_purchase_balance_low' : 'admin_purchase_balance_ok'}>
              {formatPrice(balance)}
            </span>
          </div>
          {insufficient && (
            <div className="admin_purchase_insufficient">
              <strong>Insufficient funds:</strong> This user&apos;s wallet balance is lower than the required
              amount.
            </div>
          )}
          {userEmail && (
            <div className="admin_purchase_amount_row">
              <span>User email</span>
              <span>{userEmail}</span>
            </div>
          )}
          {draft.adminNote && (
            <div className="admin_purchase_amount_row">
              <span>Admin note</span>
              <span>{draft.adminNote}</span>
            </div>
          )}
        </div>
      </div>

      {submitError && (
        <div className="admin_panel_alert admin_panel_alert_error admin_purchase_submit_error">
          {submitError}
        </div>
      )}

      <div className="admin_purchase_confirm_actions">
        <AdminPurchaseButton
          text="Confirm"
          onClick={onConfirm}
          disabled={insufficient || totalAmount <= 0}
          loading={isSubmitting}
          className="admin_purchase_continue_btn"
        />
      </div>
    </div>
  );
}
