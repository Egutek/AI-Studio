import type React from 'react';
import { Operator } from '../types';

export interface DragState {
  operatorId: string | null;
  operatorName: string | null;
  operatorIds: string[];
  fromDeptId: string | null;
  isDragging: boolean;
}

// Module-level persistent drag state
// Ensures drag & drop works 100% reliably even in iframes, Chrome sandboxes, or when dataTransfer is restricted
const globalDragState: DragState = {
  operatorId: null,
  operatorName: null,
  operatorIds: [],
  fromDeptId: null,
  isDragging: false,
};

let clearTimer: ReturnType<typeof setTimeout> | null = null;

type DragListener = (state: DragState) => void;
const listeners = new Set<DragListener>();

export const notifyDragChange = () => {
  listeners.forEach((listener) => listener({ ...globalDragState }));
};

export const subscribeDragState = (listener: DragListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const startGlobalDrag = (operator: Operator, bulkIds?: string[]) => {
  if (clearTimer) {
    clearTimeout(clearTimer);
    clearTimer = null;
  }
  const ids = bulkIds && bulkIds.length > 0 && bulkIds.includes(operator.id)
    ? bulkIds
    : [operator.id];

  globalDragState.operatorId = operator.id;
  globalDragState.operatorName = operator.name;
  globalDragState.operatorIds = ids;
  globalDragState.fromDeptId = operator.departmentId;
  globalDragState.isDragging = true;
  notifyDragChange();
};

export const endGlobalDrag = () => {
  globalDragState.isDragging = false;
  notifyDragChange();

  // Keep operatorId and operatorIds alive for 1200ms so any asynchronous or queued drop event has access
  if (clearTimer) clearTimeout(clearTimer);
  clearTimer = setTimeout(() => {
    globalDragState.operatorId = null;
    globalDragState.operatorName = null;
    globalDragState.operatorIds = [];
    globalDragState.fromDeptId = null;
    notifyDragChange();
  }, 1200);
};

export const getGlobalDragState = (): DragState => ({
  ...globalDragState,
});

/**
 * Resolves all operator IDs being dropped (supports single or multi-drag):
 */
export const resolveOperatorIdsFromDrop = (
  e: React.DragEvent,
  operators: Operator[]
): string[] => {
  // 1. Check for bulk operator JSON array in dataTransfer
  try {
    const bulkJson = e.dataTransfer.getData('application/x-bulk-operator-ids');
    if (bulkJson) {
      const parsed = JSON.parse(bulkJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore JSON or permission error
  }

  // 2. Check global memory state if multiple operators were dragged
  if (globalDragState.operatorIds && globalDragState.operatorIds.length > 0) {
    return globalDragState.operatorIds;
  }

  // 3. Fallback to single operator resolver
  const single = resolveOperatorFromDrop(e, operators);
  return single ? [single.id] : [];
};

/**
 * Resolves the primary operator being dropped using multiple fallback strategies
 */
export const resolveOperatorFromDrop = (
  e: React.DragEvent,
  operators: Operator[]
): Operator | null => {
  let rawData = '';

  // 1. Try custom MIME type
  try {
    rawData = e.dataTransfer.getData('application/x-operator-id');
  } catch {
    // Ignore iframe permission errors
  }

  // 2. Try global memory state
  if (!rawData && globalDragState.operatorId) {
    rawData = globalDragState.operatorId;
  }

  // 3. Try standard text/plain
  if (!rawData) {
    try {
      rawData = e.dataTransfer.getData('text/plain');
    } catch {
      // Ignore
    }
  }

  // 4. Try global memory state operatorName
  if (!rawData && globalDragState.operatorName) {
    rawData = globalDragState.operatorName;
  }

  if (!rawData) return null;

  const trimmed = rawData.trim();

  // Find by ID directly
  const byId = operators.find((op) => op.id === trimmed);
  if (byId) return byId;

  // Fallback: match by full name (case insensitive)
  const byName = operators.find(
    (op) => op.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (byName) return byName;

  // Fallback: match by globalDragState operatorId if still active
  if (globalDragState.operatorId) {
    const byGlobal = operators.find((op) => op.id === globalDragState.operatorId);
    if (byGlobal) return byGlobal;
  }

  return null;
};
