'use client';

import { useCallback, useMemo, useState } from 'react';

export function useBulkSelection(visibleIds: string[]) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const visibleIdSet = useMemo(() => new Set(visibleIds), [visibleIds]);

  const selectedVisibleIds = useMemo(
    () => selectedIds.filter((id) => visibleIdSet.has(id)),
    [selectedIds, visibleIdSet]
  );

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode((current) => {
      if (current) {
        setSelectedIds([]);
      }
      return !current;
    });
  }, []);

  const toggleItem = useCallback((id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }, []);

  const isSelected = useCallback(
    (id: string) => selectedIds.includes(id),
    [selectedIds]
  );

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds([]);
  }, []);

  const allVisibleSelected =
    visibleIds.length > 0 && selectedVisibleIds.length === visibleIds.length;

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleIdSet.has(id));
      }

      const next = new Set(current);
      for (const id of visibleIds) {
        next.add(id);
      }
      return [...next];
    });
  }, [allVisibleSelected, visibleIds, visibleIdSet]);

  return {
    selectionMode,
    selectedIds: selectedVisibleIds,
    selectedCount: selectedVisibleIds.length,
    allVisibleSelected,
    toggleSelectionMode,
    toggleItem,
    toggleSelectAll,
    isSelected,
    clearSelection,
    exitSelectionMode,
  };
}
