import { INITIAL_OPERATORS, INITIAL_OPERATORS_SHIFT_A, INITIAL_OPERATORS_SHIFT_B, INITIAL_OPERATORS_SHIFT_C } from '../data/initialOperators';
import { MoveHistoryRecord, Operator, ShiftCode, UndoOperation } from '../types';

const OPERATORS_KEY = 'zf_ostrov_pick_operators_real_v3';
const HISTORY_KEY = 'zf_ostrov_pick_history_real_v3';
const UNDO_KEY = 'zf_ostrov_pick_undo_stack_v1';
const ACTIVE_SHIFT_KEY = 'zf_ostrov_active_shift_v1';

export const loadActiveShift = (): ShiftCode => {
  try {
    const saved = localStorage.getItem(ACTIVE_SHIFT_KEY);
    if (saved === 'A' || saved === 'B' || saved === 'C') {
      return saved;
    }
  } catch (e) {
    console.error('Failed to load active shift from localStorage', e);
  }
  return 'A';
};

export const saveActiveShift = (shift: ShiftCode): void => {
  try {
    localStorage.setItem(ACTIVE_SHIFT_KEY, shift);
  } catch (e) {
    console.error('Failed to save active shift to localStorage', e);
  }
};

export const getAllDefaultOperators = (): Operator[] => {
  return [
    ...INITIAL_OPERATORS_SHIFT_A,
    ...INITIAL_OPERATORS_SHIFT_B,
    ...INITIAL_OPERATORS_SHIFT_C,
  ];
};

export const loadOperators = (): Operator[] => {
  try {
    const saved = localStorage.getItem(OPERATORS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((op: Operator) => ({
          ...op,
          shift: op.shift || 'A',
          machineType: op.machineType || 'NONE',
          absenceReason: op.absenceReason || (op.departmentId === 'unassigned' ? 'Absence' : undefined),
        }));
      }
    }
  } catch (e) {
    console.error('Failed to load operators from localStorage', e);
  }
  // Default to all initial operators with their respective shifts
  return getAllDefaultOperators();
};

export const saveOperators = (operators: Operator[]): void => {
  try {
    if (Array.isArray(operators) && operators.length > 0) {
      localStorage.setItem(OPERATORS_KEY, JSON.stringify(operators));
      localStorage.setItem('zf_last_saved_timestamp', new Date().toISOString());
    }
  } catch (e) {
    console.error('Failed to save operators to localStorage', e);
  }
};

export const loadHistory = (): MoveHistoryRecord[] => {
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load history from localStorage', e);
  }
  return [];
};

export const saveHistory = (history: MoveHistoryRecord[]): void => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
  } catch (e) {
    console.error('Failed to save history to localStorage', e);
  }
};

export const loadUndoStack = (): UndoOperation[] => {
  try {
    const saved = localStorage.getItem(UNDO_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.slice(0, 5);
      }
    }
  } catch (e) {
    console.error('Failed to load undo stack from localStorage', e);
  }
  return [];
};

export const saveUndoStack = (stack: UndoOperation[]): void => {
  try {
    localStorage.setItem(UNDO_KEY, JSON.stringify(stack.slice(0, 5)));
  } catch (e) {
    console.error('Failed to save undo stack to localStorage', e);
  }
};

export const resetToInitialOperators = (): Operator[] => {
  try {
    localStorage.removeItem(OPERATORS_KEY);
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(UNDO_KEY);
  } catch (e) {
    console.error('Failed to clear storage', e);
  }
  return getAllDefaultOperators();
};
