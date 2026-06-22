'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/utils/FormatPrice';
import type { AdminPurchaseService } from '@/lib/adminUserPurchases';
import { fetchCablePlans, fetchDataPlans } from '@/lib/adminPurchaseCatalog';
import { verifyMeter } from '@/lib/meterVerification';
import { useElectricityDiscos } from '@/hooks/useElectricityDiscos';
import { AdminPurchaseButton } from '@/components/admin/users/billPurchase/AdminPurchaseButton';
import {
  AIRTIME_AMOUNTS,
  CABLE_PROVIDERS,
  ELECTRICITY_AMOUNTS,
  NETWORKS,
  groupCablePackages,
  groupDataBundles,
  parseRawPlans,
  getServiceTitle,
  type CablePackage,
  type DataBundle,
  type PurchaseDraft,
} from '@/components/admin/users/billPurchase/purchaseModalUtils';

type Props = {
  service: AdminPurchaseService;
  onContinue: (draft: PurchaseDraft) => void;
  onClose: () => void;
};

type FormErrors = Record<string, string>;

export function AdminPurchaseFormStep({ service, onContinue, onClose }: Props) {
  const { dropdownOptions, discos, isLoading: isLoadingDiscos, error: discoError } =
    useElectricityDiscos('Select disco');

  const [network, setNetwork] = useState(NETWORKS[0].code);
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [electricityType, setElectricityType] = useState('prepaid');
  const [disco, setDisco] = useState('');
  const [meter, setMeter] = useState('');
  const [verifiedName, setVerifiedName] = useState('');
  const [verifiedAddress, setVerifiedAddress] = useState('');
  const [minVendAmount, setMinVendAmount] = useState(500);
  const [maxVendAmount, setMaxVendAmount] = useState(30000);
  const [isVerifying, setIsVerifying] = useState(false);
  const [provider, setProvider] = useState<string>(CABLE_PROVIDERS[0]);
  const [smartcard, setSmartcard] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const [dataCategories, setDataCategories] = useState<{ category: string; bundles: DataBundle[] }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Daily');
  const [selectedBundle, setSelectedBundle] = useState<DataBundle | null>(null);
  const [isLoadingDataPlans, setIsLoadingDataPlans] = useState(false);

  const [cablePackages, setCablePackages] = useState<CablePackage[]>([]);
  const [groupedCablePackages, setGroupedCablePackages] = useState<
    { category: string; packages: CablePackage[] }[]
  >([]);
  const [selectedCableCategory, setSelectedCableCategory] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<CablePackage | null>(null);
  const [isLoadingCablePlans, setIsLoadingCablePlans] = useState(false);

  const selectedNetwork = useMemo(
    () => NETWORKS.find((item) => item.code === network) || NETWORKS[0],
    [network]
  );

  useEffect(() => {
    if (discos.length > 0 && !disco) {
      const firstAvailable = discos.find((item) => item.available) || discos[0];
      setDisco(firstAvailable.code);
    }
  }, [discos, disco]);

  useEffect(() => {
    if (service !== 'data' || !network) return;

    const load = async () => {
      setIsLoadingDataPlans(true);
      setSelectedBundle(null);
      try {
        const raw = await fetchDataPlans(network);
        const plans = parseRawPlans(raw);
        const grouped = groupDataBundles(plans);
        setDataCategories(grouped);
        setSelectedCategory(grouped[0]?.category || 'Plans');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load data plans');
        setDataCategories([]);
      } finally {
        setIsLoadingDataPlans(false);
      }
    };

    void load();
  }, [service, network]);

  useEffect(() => {
    if (service !== 'cable' || !provider) return;

    const load = async () => {
      setIsLoadingCablePlans(true);
      setSelectedPackage(null);
      try {
        const raw = await fetchCablePlans(provider);
        const plans = parseRawPlans(raw).map((plan) => ({
          name: plan.size,
          price: plan.price,
          code: plan.code || plan.tariffClass || plan.size,
          tariffClass: plan.tariffClass,
        }));
        setCablePackages(plans);
        const grouped = groupCablePackages(provider, plans);
        setGroupedCablePackages(grouped.grouped);
        setSelectedCableCategory(grouped.grouped[0]?.category || '');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load cable packages');
        setCablePackages([]);
        setGroupedCablePackages([]);
      } finally {
        setIsLoadingCablePlans(false);
      }
    };

    void load();
  }, [service, provider]);

  useEffect(() => {
    if (service !== 'electricity' || !meter || !disco) return;

    const timer = setTimeout(async () => {
      if (meter.replace(/\D/g, '').length < 10) return;
      setIsVerifying(true);
      setVerifiedName('');
      setVerifiedAddress('');
      try {
        const result = await verifyMeter({
          meter,
          disco,
          vendType: electricityType.toUpperCase() === 'POSTPAID' ? 'POSTPAID' : 'PREPAID',
        });
        const name =
          result.payload.customer_name ||
          result.payload.BeneficiaryName ||
          '';
        const address = result.payload.address || result.payload.CustomerAddress || '';
        setVerifiedName(name);
        setVerifiedAddress(address);
        if (result.payload.min_vend_amount) {
          setMinVendAmount(Number(result.payload.min_vend_amount));
        }
        if (result.payload.max_vend_amount) {
          setMaxVendAmount(Number(result.payload.max_vend_amount));
        }
      } catch (err) {
        setVerifiedName('');
        setVerifiedAddress('');
        toast.error(err instanceof Error ? err.message : 'Meter verification failed');
      } finally {
        setIsVerifying(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [service, meter, disco, electricityType]);

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (service === 'airtime' || service === 'data') {
      if (!/^[0-9]{11}$/.test(phone)) {
        nextErrors.phone = 'Enter a valid 11-digit phone number';
      }
    }

    if (service === 'airtime') {
      if (!amount || Number(amount) < 100) {
        nextErrors.amount = 'Minimum amount is ₦100';
      }
    }

    if (service === 'data') {
      if (!selectedBundle) {
        nextErrors.amount = 'Select a data bundle';
      }
    }

    if (service === 'electricity') {
      if (!disco) nextErrors.disco = 'Select a disco';
      if (!meter) nextErrors.meter = 'Enter a meter number';
      if (!verifiedName) nextErrors.meter = 'Meter must be verified';
      if (!amount || Number(amount) < minVendAmount) {
        nextErrors.amount = `Minimum amount is ${formatPrice(minVendAmount)}`;
      } else if (Number(amount) > maxVendAmount) {
        nextErrors.amount = `Maximum amount is ${formatPrice(maxVendAmount)}`;
      }
    }

    if (service === 'cable') {
      if (!smartcard) nextErrors.smartcard = 'Enter a smartcard number';
      if (!selectedPackage) nextErrors.amount = 'Select a package';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;

    const draft: PurchaseDraft = {
      service,
      adminNote: adminNote.trim() || undefined,
    };

    if (service === 'airtime') {
      draft.network = network;
      draft.phone = phone;
      draft.amount = Number(amount);
    }

    if (service === 'data') {
      draft.network = network;
      draft.phone = phone;
      draft.amount = selectedBundle?.price;
      draft.bundleLabel = selectedBundle?.size;
      draft.planId = selectedBundle?.code;
      draft.tariffClass = selectedBundle?.code || selectedBundle?.tariffClass;
    }

    if (service === 'electricity') {
      draft.disco = disco.toUpperCase();
      draft.meter = meter;
      draft.amount = Number(amount);
      draft.electricityType = electricityType;
      draft.customerName = verifiedName;
      draft.address = verifiedAddress;
    }

    if (service === 'cable') {
      draft.provider = provider;
      draft.smartcard = smartcard;
      draft.amount = selectedPackage?.price;
      draft.packageName = selectedPackage?.name;
      draft.packageCode = selectedPackage?.code;
      draft.tariffClass = selectedPackage?.tariffClass;
    }

    onContinue(draft);
  };

  const canContinue = useMemo(() => {
    if (service === 'airtime') return Boolean(phone && amount && Number(amount) >= 100);
    if (service === 'data') return Boolean(phone && selectedBundle);
    if (service === 'electricity') {
      return Boolean(disco && meter && verifiedName && amount && Number(amount) >= minVendAmount);
    }
    if (service === 'cable') return Boolean(smartcard && selectedPackage);
    return false;
  }, [service, phone, amount, selectedBundle, disco, meter, verifiedName, minVendAmount, smartcard, selectedPackage]);

  return (
    <div className="admin_purchase_form">
      <div className="admin_purchase_modal_topbar">
        <span className="admin_purchase_topbar_spacer" aria-hidden="true" />
        <h5>{getServiceTitle(service)}</h5>
        <button type="button" className="admin_purchase_modal_close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <div className="admin_purchase_form_body">
        {(service === 'airtime' || service === 'data') && (
          <div className="admin_purchase_number_network">
            <div className="admin_purchase_field_group">
              <label htmlFor="purchase-network">Select Network</label>
              <div className="admin_purchase_select_network">
                <figure>
                  <Image src={selectedNetwork.logo} alt="" width={24} height={24} />
                </figure>
                <select
                  id="purchase-network"
                  value={network}
                  onChange={(event) => setNetwork(event.target.value)}
                >
                  {NETWORKS.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin_purchase_field_group">
              <label htmlFor="purchase-phone">Phone Number</label>
              <input
                id="purchase-phone"
                type="tel"
                placeholder="08012345678"
                value={phone}
                maxLength={11}
                onChange={(event) => setPhone(event.target.value.replace(/\D/g, ''))}
              />
              {errors.phone && <p className="admin_purchase_error">{errors.phone}</p>}
            </div>
          </div>
        )}

        {service === 'airtime' && (
          <>
            <div className="admin_purchase_field_group">
              <label htmlFor="purchase-airtime-amount">Amount</label>
              <input
                id="purchase-airtime-amount"
                type="number"
                placeholder="1000"
                value={amount}
                onChange={(event) => {
                  const value = event.target.value;
                  setAmount(value === '' ? '' : Number(value));
                }}
              />
              {errors.amount && <p className="admin_purchase_error">{errors.amount}</p>}
            </div>
            <div className="admin_purchase_fixed_amounts">
              {AIRTIME_AMOUNTS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={amount === item ? 'selected' : 'not_selected'}
                  onClick={() => setAmount(item)}
                >
                  {formatPrice(item)}
                </button>
              ))}
            </div>
          </>
        )}

        {service === 'data' && (
          <>
            <div className="admin_purchase_field_group">
              <label>Selected Bundle</label>
              <div className="admin_purchase_amount_card">
                {selectedBundle ? (
                  <p>
                    {selectedBundle.size} — {formatPrice(selectedBundle.price)}
                  </p>
                ) : (
                  <p className="admin_purchase_placeholder">No bundle selected</p>
                )}
              </div>
              {errors.amount && <p className="admin_purchase_error">{errors.amount}</p>}
            </div>

            {dataCategories.length > 0 && (
              <div className="admin_purchase_tabs">
                {dataCategories.map((tab) => (
                  <button
                    key={tab.category}
                    type="button"
                    className={selectedCategory === tab.category ? 'tab_active' : ''}
                    onClick={() => setSelectedCategory(tab.category)}
                  >
                    {tab.category}
                  </button>
                ))}
              </div>
            )}

            <div className="admin_purchase_bundle_options">
              {isLoadingDataPlans ? (
                <div className="admin_purchase_inline_loading">
                  <Loader2 className="animate-spin" /> Loading plans…
                </div>
              ) : (
                dataCategories
                  .find((tab) => tab.category === selectedCategory)
                  ?.bundles.map((bundle, index) => (
                    <button
                      key={`${bundle.size}-${index}`}
                      type="button"
                      className={selectedBundle === bundle ? 'selected' : 'not_selected'}
                      onClick={() => setSelectedBundle(bundle)}
                    >
                      <span>{bundle.size}</span>
                      <p>{formatPrice(bundle.price)}</p>
                    </button>
                  ))
              )}
            </div>
          </>
        )}

        {service === 'electricity' && (
          <>
            <div className="admin_purchase_field_group">
              <label htmlFor="purchase-meter-type">Meter Type</label>
              <select
                id="purchase-meter-type"
                value={electricityType}
                onChange={(event) => setElectricityType(event.target.value)}
              >
                <option value="prepaid">Prepaid</option>
                <option value="postpaid">Postpaid</option>
              </select>
            </div>

            <div className="admin_purchase_field_group">
              <label htmlFor="purchase-disco">Distribution Company</label>
              {isLoadingDiscos ? (
                <div className="admin_purchase_inline_loading">
                  <Loader2 className="animate-spin" /> Loading discos…
                </div>
              ) : (
                <select
                  id="purchase-disco"
                  value={disco}
                  onChange={(event) => setDisco(event.target.value)}
                >
                  {dropdownOptions
                    .filter((item) => item.value)
                    .map((item) => {
                      const discoMeta = discos.find(
                        (entry) => entry.code.toUpperCase() === item.value.toUpperCase()
                      );
                      return (
                        <option
                          key={item.value}
                          value={item.value}
                          disabled={discoMeta ? !discoMeta.available : false}
                        >
                          {item.label}
                        </option>
                      );
                    })}
                </select>
              )}
              {discoError && <p className="admin_purchase_error">{discoError}</p>}
              {errors.disco && <p className="admin_purchase_error">{errors.disco}</p>}
            </div>

            <div className="admin_purchase_field_group">
              <label htmlFor="purchase-meter">Meter Number</label>
              <div className="admin_purchase_meter_wrap">
                <input
                  id="purchase-meter"
                  type="tel"
                  placeholder="Enter meter number"
                  value={meter}
                  className={verifiedName ? 'verified' : ''}
                  onChange={(event) => setMeter(event.target.value.replace(/\D/g, ''))}
                />
                {isVerifying && <span className="admin_purchase_meter_status">Verifying…</span>}
                {!isVerifying && verifiedName && (
                  <span className="admin_purchase_meter_status verified">✓ Verified</span>
                )}
              </div>
              {verifiedName && (
                <div className="admin_purchase_verified_box">
                  <p>Customer: {verifiedName}</p>
                  {verifiedAddress && <p>{verifiedAddress}</p>}
                </div>
              )}
              {errors.meter && <p className="admin_purchase_error">{errors.meter}</p>}
            </div>

            <div className="admin_purchase_field_group">
              <label htmlFor="purchase-electricity-amount">Amount</label>
              <input
                id="purchase-electricity-amount"
                type="number"
                placeholder="3000"
                value={amount}
                onChange={(event) => {
                  const value = event.target.value;
                  setAmount(value === '' ? '' : Number(value));
                }}
              />
              {errors.amount && <p className="admin_purchase_error">{errors.amount}</p>}
            </div>

            <h6 className="admin_purchase_subheading">Select Amount</h6>
            <div className="admin_purchase_fixed_amounts admin_purchase_fixed_amounts_2col">
              {ELECTRICITY_AMOUNTS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={amount === item ? 'selected' : 'not_selected'}
                  onClick={() => setAmount(item)}
                >
                  {formatPrice(item)}
                </button>
              ))}
            </div>
          </>
        )}

        {service === 'cable' && (
          <>
            <div className="admin_purchase_field_group">
              <label htmlFor="purchase-smartcard">Smart Card Number</label>
              <input
                id="purchase-smartcard"
                type="tel"
                placeholder="Smart card number"
                value={smartcard}
                onChange={(event) => setSmartcard(event.target.value.replace(/\D/g, ''))}
              />
              {errors.smartcard && <p className="admin_purchase_error">{errors.smartcard}</p>}
            </div>

            <div className="admin_purchase_field_group">
              <label htmlFor="purchase-cable-provider">Provider</label>
              <select
                id="purchase-cable-provider"
                value={provider}
                onChange={(event) => setProvider(event.target.value)}
              >
                {CABLE_PROVIDERS.map((item) => (
                  <option key={item} value={item}>
                    {item === 'STARTIMES' ? 'Startimes' : item === 'GOTV' ? 'GOtv' : item}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin_purchase_field_group">
              <label>Amount</label>
              <div className="admin_purchase_amount_card">
                {selectedPackage ? (
                  <p>{formatPrice(selectedPackage.price)}</p>
                ) : (
                  <p className="admin_purchase_placeholder">No package selected</p>
                )}
              </div>
              {errors.amount && <p className="admin_purchase_error">{errors.amount}</p>}
            </div>

            <h6 className="admin_purchase_subheading">Select Package</h6>
            {isLoadingCablePlans ? (
              <div className="admin_purchase_inline_loading">
                <Loader2 className="animate-spin" /> Loading packages…
              </div>
            ) : groupedCablePackages.length > 0 ? (
              <>
                <div className="admin_purchase_tabs">
                  {groupedCablePackages.map((tab) => (
                    <button
                      key={tab.category}
                      type="button"
                      className={selectedCableCategory === tab.category ? 'tab_active' : ''}
                      onClick={() => setSelectedCableCategory(tab.category)}
                    >
                      {tab.category}
                    </button>
                  ))}
                </div>
                <div className="admin_purchase_bundle_options">
                  {groupedCablePackages
                    .find((tab) => tab.category === selectedCableCategory)
                    ?.packages.map((pkg, index) => (
                      <button
                        key={`${pkg.code}-${index}`}
                        type="button"
                        className={selectedPackage?.code === pkg.code ? 'selected' : 'not_selected'}
                        onClick={() => setSelectedPackage(pkg)}
                      >
                        <span>{pkg.name}</span>
                        <p>{formatPrice(pkg.price)}</p>
                      </button>
                    ))}
                </div>
              </>
            ) : (
              <div className="admin_purchase_bundle_options admin_purchase_flat_packages">
                {cablePackages.map((pkg, index) => (
                  <button
                    key={`${pkg.code}-${index}`}
                    type="button"
                    className={selectedPackage?.code === pkg.code ? 'selected' : 'not_selected'}
                    onClick={() => setSelectedPackage(pkg)}
                  >
                    <span>{pkg.name}</span>
                    <p>{formatPrice(pkg.price)}</p>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <div className="admin_purchase_field_group">
          <label htmlFor="purchase-admin-note">Admin note (optional)</label>
          <textarea
            id="purchase-admin-note"
            rows={3}
            placeholder="Why is support completing this purchase?"
            value={adminNote}
            onChange={(event) => setAdminNote(event.target.value)}
          />
        </div>
      </div>

      <div className="admin_purchase_form_actions">
        <AdminPurchaseButton
          text="Continue"
          onClick={handleContinue}
          disabled={!canContinue}
          className="admin_purchase_continue_btn"
        />
      </div>
    </div>
  );
}
