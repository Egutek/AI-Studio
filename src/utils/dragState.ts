import type React from 'react';
import { Operator } from '../types';

export interface DragState {
  operatorId: string | null;
  operatorName: string | null;
  fromDeptId: string | null;
  isDragging: boolean;
}

// Module-level persistent drag state
// Ensures drag & drop works 100% reliably even in iframes, Chrome sandboxes, or when dataTransfer is restricted
const globalDragState: DragState = {
  operatorId: null,
  operatorName: null,
  fromDeptId: null,
  isDragging: false,
};

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

export const startGlobalDrag = (operator: Operator) => {
  globalDragState.operatorId = operator.id;
  globalDragState.operatorName = operator.name;
  globalDragState.fromDeptId = operator.departmentId;
  globalDragState.isDragging = true;
  notifyDragChange();
};

export const endGlobalDrag = () => {
  globalDragState.operatorId = null;
  globalDragState.operatorName = null;
  globalDragState.fromDeptId = null;
  globalDragState.isDragging = false;
  notifyDragChange();
};

export const getGlobalDragState = (): DragState => ({
  ...globalDragState,
});

/**
 * Resolves the operator being dropped using multiple fallback strategies:
 * 1. application/x-operator-id from dataTransfer
 * 2. text/plain from dataTransfer
 * 3. in-memory globalDragState operatorId
 * 4. match operator by exact name if text string was dragged
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
