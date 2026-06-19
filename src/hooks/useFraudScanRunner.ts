'use client';

import { useCallback, useState } from 'react';
import {
  createInitialFraudScanSteps,
  FRAUD_SCAN_STEPS,
  type FraudScanStepState,
} from '@/constants/fraudScanSteps';
import {
  beginFraudScan,
  cancelFraudScan,
  finishFraudScan,
  runFraudScanCheck,
} from '@/lib/adminFraud';
import type { FraudScanResult } from '@/types/adminFraud';

export function useFraudScanRunner() {
  const [steps, setSteps] = useState<FraudScanStepState[]>(createInitialFraudScanSteps);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<FraudScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setSteps(createInitialFraudScanSteps());
    setIsScanning(false);
    setResult(null);
    setError(null);
  }, []);

  const run = useCallback(async () => {
    setIsScanning(true);
    setError(null);
    setResult(null);
    setSteps(createInitialFraudScanSteps());

    let started = false;

    try {
      await beginFraudScan();
      started = true;

      for (const step of FRAUD_SCAN_STEPS) {
        setSteps((current) =>
          current.map((item) =>
            item.id === step.id ? { ...item, status: 'scanning' } : item
          )
        );

        const stepResult = await runFraudScanCheck(step.id);

        setSteps((current) =>
          current.map((item) =>
            item.id === step.id
              ? {
                  ...item,
                  status: 'complete',
                  found: stepResult.found,
                  created: stepResult.created,
                  skipped: stepResult.skipped,
                }
              : item
          )
        );
      }

      const finalResult = await finishFraudScan();
      setResult(finalResult);
      return finalResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to run fraud scan';
      setError(message);

      if (started) {
        try {
          await cancelFraudScan();
        } catch {
          // Ignore cancel failures after a scan error.
        }
      }

      setSteps((current) =>
        current.map((item) =>
          item.status === 'scanning' ? { ...item, status: 'error' } : item
        )
      );
      throw err;
    } finally {
      setIsScanning(false);
    }
  }, []);

  return {
    steps,
    isScanning,
    result,
    error,
    run,
    reset,
  };
}
