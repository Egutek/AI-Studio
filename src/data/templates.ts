import { Operator, ShiftTemplate, ShiftTemplateAssignment } from '../types';
import { INITIAL_OPERATORS } from './initialOperators';

const STORAGE_KEY = 'zf_pick_shift_templates_v1';

// Built-in initial template
export const BUILTIN_TEMPLATES: ShiftTemplate[] = [
  {
    id: 'builtin-zf-initial',
    name: 'Výchozí rozdělení ZF PICK (65 lidí)',
    description: 'Standardní obsazení oddělení PICK (HOVC 10, HOVS 12, Putaway 10, VAS 10, OBWF 8, VNA 7, OBWI 8).',
    createdAt: '2026-09-12T06:00:00.000Z',
    isBuiltIn: true,
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
    description: 'Všech 65 operátorů je nastaveno jako aktivních na svých kmenových pracovištích.',
    createdAt: '2026-09-12T06:00:00.000Z',
    isBuiltIn: true,
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

export const loadAllTemplates = (): ShiftTemplate[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return BUILTIN_TEMPLATES;
    const custom: ShiftTemplate[] = JSON.parse(raw);
    return [...BUILTIN_TEMPLATES, ...custom];
  } catch (err) {
    console.warn('Failed to load saved shift templates:', err);
    return BUILTIN_TEMPLATES;
  }
};

export const saveNewTemplate = (
  name: string,
  description: string | undefined,
  currentOperators: Operator[]
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

export const deleteCustomTemplate = (templateId: string): void => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const existing: ShiftTemplate[] = JSON.parse(raw);
    const updated = existing.filter((t) => t.id !== templateId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to delete template from localStorage:', err);
  }
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
