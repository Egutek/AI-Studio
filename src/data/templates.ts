import { Operator, ShiftCode, ShiftTemplate, ShiftTemplateAssignment } from '../types';
import { INITIAL_OPERATORS } from './initialOperators';

const STORAGE_KEY = 'zf_pick_shift_templates_v1';
const STORAGE_DELETED_KEY = 'zf_pick_deleted_templates_v1';

// Built-in initial templates for each shift
export const BUILTIN_TEMPLATES: ShiftTemplate[] = [
  {
    id: 'builtin-zf-initial-a',
    name: 'Výchozí rozdělení PICK - Směna A',
    description: 'Standardní obsazení oddělení PICK pro Směnu A (Outbound 10, HOVS 12, Putaway 10, VAS 10, OBWF 8, VNA 7, OBWI 8).',
    createdAt: '2026-09-12T06:00:00.000Z',
    isBuiltIn: true,
    shift: 'A',
    operatorCount: INITIAL_OPERATORS.length,
    activeCount: INITIAL_OPERATORS.filter((o) => o.status === 'active' && o.departmentId !== 'unassigned').length,
    assignments: INITIAL_OPERATORS.map((o) => ({
      operatorId: o.id,
      operatorName: o.name,
      departmentId: o.departmentId,
      status: o.status,
      machineType: o.machineType,
      notes: o.notes,
    })),
  },
  {
    id: 'builtin-zf-initial-b',
    name: 'Výchozí rozdělení PICK - Směna B',
    description: 'Standardní obsazení oddělení PICK pro Směnu B.',
    createdAt: '2026-09-12T06:00:00.000Z',
    isBuiltIn: true,
    shift: 'B',
    operatorCount: INITIAL_OPERATORS.length,
    activeCount: INITIAL_OPERATORS.filter((o) => o.status === 'active' && o.departmentId !== 'unassigned').length,
    assignments: INITIAL_OPERATORS.map((o) => ({
      operatorId: o.id,
      operatorName: o.name,
      departmentId: o.departmentId,
      status: o.status,
      machineType: o.machineType,
      notes: o.notes,
    })),
  },
  {
    id: 'builtin-zf-initial-c',
    name: 'Výchozí rozdělení PICK - Směna C',
    description: 'Standardní obsazení oddělení PICK pro Směnu C.',
    createdAt: '2026-09-12T06:00:00.000Z',
    isBuiltIn: true,
    shift: 'C',
    operatorCount: INITIAL_OPERATORS.length,
    activeCount: INITIAL_OPERATORS.filter((o) => o.status === 'active' && o.departmentId !== 'unassigned').length,
    assignments: INITIAL_OPERATORS.map((o) => ({
      operatorId: o.id,
      operatorName: o.name,
      departmentId: o.departmentId,
      status: o.status,
      machineType: o.machineType,
      notes: o.notes,
    })),
  },
  {
    id: 'builtin-all-active',
    name: 'Všichni přítomní na hale (0 absencí)',
    description: 'Všichni operátoři jsou nastaveni jako aktivní na pracovištích (univerzální pro všechny směny).',
    createdAt: '2026-09-12T06:00:00.000Z',
    isBuiltIn: true,
    shift: 'all',
    operatorCount: INITIAL_OPERATORS.length,
    activeCount: INITIAL_OPERATORS.length,
    assignments: INITIAL_OPERATORS.map((o) => ({
      operatorId: o.id,
      operatorName: o.name,
      departmentId: o.departmentId === 'unassigned' ? 'hovc' : o.departmentId,
      status: 'active',
      machineType: o.machineType,
      notes: o.notes,
    })),
  },
];

const getDeletedTemplateIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(STORAGE_DELETED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const saveDeletedTemplateIds = (ids: Set<string>) => {
  try {
    localStorage.setItem(STORAGE_DELETED_KEY, JSON.stringify(Array.from(ids)));
  } catch (err) {
    console.error('Failed to save deleted template IDs:', err);
  }
};

export const loadAllTemplates = (): ShiftTemplate[] => {
  try {
    const deletedIds = getDeletedTemplateIds();
    const activeBuiltIns = BUILTIN_TEMPLATES.filter((t) => !deletedIds.has(t.id));

    const raw = localStorage.getItem(STORAGE_KEY);
    const custom: ShiftTemplate[] = raw ? JSON.parse(raw) : [];
    const activeCustom = custom.filter((t) => !deletedIds.has(t.id));

    return [...activeBuiltIns, ...activeCustom];
  } catch (err) {
    console.warn('Failed to load saved shift templates:', err);
    return BUILTIN_TEMPLATES;
  }
};

export const saveNewTemplate = (
  name: string,
  description: string | undefined,
  currentOperators: Operator[],
  shift: ShiftCode | 'all' = 'A'
): ShiftTemplate => {
  const assignments: ShiftTemplateAssignment[] = currentOperators.map((o) => ({
    operatorId: o.id,
    operatorName: o.name,
    departmentId: o.departmentId,
    status: o.status,
    machineType: o.machineType,
    notes: o.notes,
  }));

  const activeCount = currentOperators.filter(
    (o) => o.departmentId !== 'unassigned' && o.status === 'active'
  ).length;

  const newTemplate: ShiftTemplate = {
    id: `template-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    description: description?.trim() || undefined,
    createdAt: new Date().toISOString(),
    isBuiltIn: false,
    shift,
    operatorCount: currentOperators.length,
    activeCount,
    assignments,
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing: ShiftTemplate[] = raw ? JSON.parse(raw) : [];
    existing.unshift(newTemplate);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.error('Failed to save template to localStorage:', err);
  }

  return newTemplate;
};

export const deleteTemplate = (templateId: string): void => {
  try {
    // Record in deleted IDs so built-ins don't reappear
    const deleted = getDeletedTemplateIds();
    deleted.add(templateId);
    saveDeletedTemplateIds(deleted);

    // Also remove from custom storage
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const existing: ShiftTemplate[] = JSON.parse(raw);
      const updated = existing.filter((t) => t.id !== templateId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.error('Failed to delete template:', err);
  }
};

// Backwards compatibility alias
export const deleteCustomTemplate = deleteTemplate;

export const restoreDefaultTemplates = (): ShiftTemplate[] => {
  try {
    localStorage.removeItem(STORAGE_DELETED_KEY);
  } catch (err) {
    console.error('Failed to restore default templates:', err);
  }
  return loadAllTemplates();
};

export const updateTemplateWithCurrent = (
  templateId: string,
  currentOperators: Operator[]
): void => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const existing: ShiftTemplate[] = JSON.parse(raw);
    const target = existing.find((t) => t.id === templateId);
    if (!target) return;

    target.assignments = currentOperators.map((o) => ({
      operatorId: o.id,
      operatorName: o.name,
      departmentId: o.departmentId,
      status: o.status,
      machineType: o.machineType,
      notes: o.notes,
    }));
    target.operatorCount = currentOperators.length;
    target.activeCount = currentOperators.filter(
      (o) => o.departmentId !== 'unassigned' && o.status === 'active'
    ).length;
    target.createdAt = new Date().toISOString();

    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.error('Failed to update template in localStorage:', err);
  }
};

export const applyTemplateToOperators = (
  template: ShiftTemplate,
  currentOperators: Operator[]
): Operator[] => {
  const mapById = new Map<string, ShiftTemplateAssignment>();
  const mapByName = new Map<string, ShiftTemplateAssignment>();

  for (const a of template.assignments) {
    mapById.set(a.operatorId, a);
    mapByName.set(a.operatorName.trim().toLowerCase(), a);
  }

  const nowIso = new Date().toISOString();

  // Update existing operators
  const updated = currentOperators.map((op) => {
    const matched =
      mapById.get(op.id) || mapByName.get(op.name.trim().toLowerCase());
    if (matched) {
      return {
        ...op,
        departmentId: matched.departmentId,
        status: matched.status,
        machineType: matched.machineType || op.machineType,
        notes: matched.notes !== undefined ? matched.notes : op.notes,
        lastMovedAt: nowIso,
      };
    }
    return op;
  });

  return updated;
};
