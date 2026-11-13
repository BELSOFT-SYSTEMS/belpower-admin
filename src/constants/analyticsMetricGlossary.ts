export const ANALYTICS_METRIC_GLOSSARY = {
  gmv: 'Gross Merchandise Value — total naira amount of completed fee-bearing purchases in the period (customer spend before profit split).',
  feeBearingGmv:
    'GMV only on purchases that charged BelPower’s service fee (respects current Analytics scope checkboxes).',
  sc: 'Service Charge — BelPower’s ₦100 fee collected on eligible purchases; this is BelPower-side profit, not BuyPower commission.',
  bpCommission:
    'Main figure is the live BuyPower commission balance (usually ₦0 — credits fold into wallet float). Subtitle is all-time earned commission credits from synced walletTransactions (type=commission). Date range does not change this card; period commissions still feed Combined profit / charts.',
  combinedProfit:
    'Service charges (SC) + BuyPower commissions earned in the selected date range. Matches the offline float/profit PDF once the BuyPower ledger is fully synced.',
  profitMargin:
    'Combined profit ÷ fee-bearing GMV for the period (same basis as the float/profit PDF “on fee-bearing collections”).',
  buyPowerWalletBalance:
    'Main figure is live BuyPower wallet float (GET /wallet/balance). Subtitle is float at the selected start date, inferred from the nearest synced ledger row’s balance_before/after. Green ≥ ₦1,000,000, amber under ₦1M (≥ ₦500,000), red under ₦500,000.',
  activeBuyers:
    'Distinct BelPower users in the current Analytics scope with ≥1 completed purchase in the period.',
  feeTxs: 'Count of completed purchases that included a service charge.',
  paymentFor:
    'Share of completed purchases by product category (from Transaction.payment_for): Electricity, Airtime, Data, Cable TV, Betting, plus ops rows like Adjustment or Refund correction. Counts are for the selected date range and Analytics scope.',
  vend: 'A successful or attempted BuyPower fulfillment debit against wallet float.',
  reversal: 'BuyPower wallet credit that undoes a failed/reversed vend.',
  completedPurchases:
    'Completed purchase debits in the selected period under the current Analytics scope.',
  newUsers: 'Users who registered within the selected period (respects current scope).',
  userGrowth: 'New user registrations by month, with running cumulative total.',
  includeDeletedUsers:
    'When checked, soft-deleted users and their purchases are counted in Analytics KPIs and user totals.',
  includePartners:
    'When checked, partner API purchases are included in Analytics (normally excluded; partners also have their own tab).',
  includeBusinesses:
    'When checked, BelPower Business purchases are included in Analytics (normally excluded; businesses also have their own tab).',
  excludeInternalTest:
    'When checked, QA/internal test accounts are excluded from Analytics counts. Synced with the top-bar toggle for Super Admin and Finance.',
  excludeRefundedOriginals:
    'When checked, purchase debits later marked wallet_refunded are excluded from KPIs. Default is off so refunded originals are included. Money was credited back to the user wallet after these purchases.',
  refundedOriginals:
    'Completed purchase debits later refunded to the user wallet (metadata wallet_refunded). Shown as a breakdown; by default they also count in main KPIs unless “Exclude refunded purchase originals” is checked.',
} as const;

export type AnalyticsMetricKey = keyof typeof ANALYTICS_METRIC_GLOSSARY;

export function getMetricHelp(key: AnalyticsMetricKey): string {
  return ANALYTICS_METRIC_GLOSSARY[key];
}
