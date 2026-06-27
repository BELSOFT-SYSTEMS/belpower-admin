'use client';

import { useState } from 'react';
import { Copy, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { rotatePartnerApiKey } from '@/lib/adminPartners';
import type { PartnerApiKeySummary } from '@/types/adminPartners';

type PartnerApiKeysAdminPanelProps = {
  partnerId: string;
  apiKeys: PartnerApiKeySummary[];
  canManage: boolean;
  onUpdated: () => Promise<void> | void;
};

export function PartnerApiKeysAdminPanel({
  partnerId,
  apiKeys,
  canManage,
  onUpdated,
}: PartnerApiKeysAdminPanelProps) {
  const [busyType, setBusyType] = useState<'test' | 'live' | null>(null);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  const handleRotate = async (keyType: 'test' | 'live') => {
    if (
      !window.confirm(
        `Rotate the ${keyType} API key? The current key will stop working immediately.`
      )
    ) {
      return;
    }

    setBusyType(keyType);
    try {
      const result = await rotatePartnerApiKey(partnerId, keyType);
      setRevealedKey(result.apiKey);
      toast.success(`${keyType} API key rotated`);
      await onUpdated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to rotate API key');
    } finally {
      setBusyType(null);
    }
  };

  const copyKey = async () => {
    if (!revealedKey) return;
    try {
      await navigator.clipboard.writeText(revealedKey);
      toast.success('API key copied');
    } catch {
      toast.error('Unable to copy key');
    }
  };

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-black mb-3">API keys</h2>
      {apiKeys.length === 0 ? (
        <p className="text-sm text-gray-600">
          No API keys yet. Keys are issued when the partner is approved.
        </p>
      ) : (
        <ul className="space-y-3">
          {apiKeys.map((key) => (
            <li key={key.id} className="rounded-md border border-gray-200 px-3 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium capitalize text-gray-900">{key.keyType} key</p>
                  <p className="font-mono text-sm text-gray-700">{key.label}</p>
                  <p className="text-xs text-gray-500">
                    {key.isActive ? 'Active' : 'Inactive'}
                    {key.lastUsedAt ? ` · Last used ${new Date(key.lastUsedAt).toLocaleString()}` : ''}
                  </p>
                </div>
                {canManage ? (
                  <button
                    type="button"
                    onClick={() => void handleRotate(key.keyType)}
                    disabled={busyType !== null}
                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {busyType === key.keyType ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Rotate
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {revealedKey ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-900">New key — copy now. It will not be shown again.</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded bg-white px-3 py-2 font-mono text-xs text-gray-900">
              {revealedKey}
            </code>
            <button
              type="button"
              onClick={() => void copyKey()}
              className="rounded-md border border-gray-300 bg-white p-2 text-gray-600 hover:bg-gray-50"
              aria-label="Copy API key"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
