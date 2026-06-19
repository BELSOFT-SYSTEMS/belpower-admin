export const FRAUD_SCAN_STEPS = [
  { id: 'walletMismatches', label: 'Wallet mismatches' },
  { id: 'negativeAmounts', label: 'Negative amounts' },
  { id: 'capBreaches', label: 'Cap breaches' },
  { id: 'flaggedTransactions', label: 'Flagged transactions needing review' },
] as const;

export type FraudScanStepId = (typeof FRAUD_SCAN_STEPS)[number]['id'];

export type FraudScanStepStatus = 'pending' | 'scanning' | 'complete' | 'error';

export type FraudScanStepState = {
  id: FraudScanStepId;
  label: string;
  status: FraudScanStepStatus;
  found: number;
  created: number;
  skipped: number;
};

export function createInitialFraudScanSteps(): FraudScanStepState[] {
  return FRAUD_SCAN_STEPS.map((step) => ({
    id: step.id,
    label: step.label,
    status: 'pending',
    found: 0,
    created: 0,
    skipped: 0,
  }));
}
