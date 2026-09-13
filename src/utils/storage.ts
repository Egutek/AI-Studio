import { INITIAL_OPERATORS } from '../data/initialOperators';
import { MoveHistoryRecord, Operator, UndoOperation } from '../types';

const OPERATORS_KEY = 'zf_ostrov_pick_operators_real_v3';
const HISTORY_KEY = 'zf_ostrov_pick_history_real_v3';
const UNDO_KEY = 'zf_ostrov_pick_undo_stack_v1';

export const loadOperators = (): Operator[] => {
  try {
    const saved = localStorage.getItem(OPERATORS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure operators are real operators, if old mock list was stored, upgrade to INITIAL_OPERATORS
        const isRealCrew = parsed.some((op: Operator) => op.name === 'Andrii Gurkot' || op.name === 'Hemzáček Lukáš (TL)');
        if (isRealCrew) {
          return parsed.map((op: Operator) => ({ ...op, isVnaOnly: false }));
        }
      }
    }
  } catch (e) {
    console.error('Failed to load operators from localStorage', e);
  }
  // Default to real 65 operators
  return INITIAL_OPERATORS;
};

export const saveOperators = (operators: Operator[]): void => {
  try {
    localStorage.setItem(OPERATORS_KEY, JSON.stringify(operators));
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
  return INITIAL_OPERATORS;
};
