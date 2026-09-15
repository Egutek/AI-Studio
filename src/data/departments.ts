import { Department, DepartmentId, ShiftCode } from '../types';

export const DEPARTMENTS: Department[] = [
  {
    id: 'vna',
    name: 'VNA',
    code: 'VNA',
    fullName: 'Very Narrow Aisle (Úzké uličky)',
    description: 'Specializovaní operátoři pro úzké uličky (Very Narrow Aisle)',
    color: 'emerald',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    badgeText: 'text-emerald-700 dark:text-emerald-400',
    borderColor: 'border-emerald-500',
    iconName: 'GitCommitVertical',
    targetCount: 7,
  },
  {
    id: 'hovs',
    name: 'HOVS',
    code: 'HOVS',
    fullName: 'High-bay Skladové regály & konsolidace',
    description: 'Vysokozdvižné zakládání a doplňování pozic',
    color: 'sky',
    badgeBg: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800',
    badgeText: 'text-sky-700 dark:text-sky-400',
    borderColor: 'border-sky-500',
    iconName: 'Boxes',
    targetCount: 10,
  },
  {
    id: 'putaway',
    name: 'Putaway',
    code: 'PUT',
    fullName: 'Putaway (Zaskladnění)',
    description: 'Systematické zaskladňování z příjmu do lokací skladu',
    color: 'indigo',
    badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800',
    badgeText: 'text-indigo-700 dark:text-indigo-400',
    borderColor: 'border-indigo-500',
    iconName: 'ArrowDownToLine',
    targetCount: 10,
  },
  {
    id: 'hovc',
    name: 'Outbound',
    code: 'OUT',
    fullName: 'Outbound (Expedice a balení)',
    description: 'Expedice, kontrola zásilek a výstupní operace',
    color: 'blue',
    badgeBg: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
    badgeText: 'text-blue-700 dark:text-blue-400',
    borderColor: 'border-blue-500',
    iconName: 'PackageCheck',
    targetCount: 10,
  },
  {
    id: 'vas',
    name: 'VAS',
    code: 'VAS',
    fullName: 'Value Added Services',
    description: 'Speciální balení, štítkování, kitting a zákaznické úpravy',
    color: 'amber',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
    badgeText: 'text-amber-700 dark:text-amber-400',
    borderColor: 'border-amber-500',
    iconName: 'Wrench',
    targetCount: 10,
  },
  {
    id: 'obwi',
    name: 'OBWI',
    code: 'OBWI',
    fullName: 'Outbound Web & International',
    description: 'Zásilkový a mezinárodní pick, balení a expedice',
    color: 'rose',
    badgeBg: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
    badgeText: 'text-rose-700 dark:text-rose-400',
    borderColor: 'border-rose-500',
    iconName: 'Globe',
    targetCount: 7,
  },
  {
    id: 'obwf',
    name: 'OBWF',
    code: 'OBWF',
    fullName: 'Outbound Waterfront & Tok expedice',
    description: 'Příprava pro nakládku, konsolidační brány a kamiony',
    color: 'purple',
    badgeBg: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
    badgeText: 'text-purple-700 dark:text-purple-400',
    borderColor: 'border-purple-500',
    iconName: 'Layers',
    targetCount: 8,
  },
  {
    id: 'unassigned',
    name: 'Nepřítomen',
    code: 'NEPŘ',
    fullName: 'Nepřítomen na směně (Absence / Dovolená / PN)',
    description: 'Operátoři mimo směnu: Absence, Dovolená nebo PN',
    color: 'slate',
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    badgeText: 'text-slate-600 dark:text-slate-400',
    borderColor: 'border-slate-400',
    iconName: 'UserX',
    targetCount: 0,
  },
];

export const BUILTIN_DEPARTMENTS: Department[] = DEPARTMENTS;

export interface ExtraWorkPreset {
  name: string;
  code: string;
  description: string;
  color: string;
}

export const EXTRA_WORK_PRESETS: ExtraWorkPreset[] = [
  {
    name: 'ŠKOLENÍ',
    code: 'ŠKOLENÍ',
    description: 'Zaškolení nováčků, BOZP a periodická školení',
    color: 'indigo',
  },
  {
    name: 'CLEARING',
    code: 'CLEARING',
    description: 'Čištění zón, úklid uliček, odklízení palet a obalů',
    color: 'amber',
  },
  {
    name: 'SERVISKA',
    code: 'SERVISKA',
    description: 'Servisní zásahy, údržba techniky a pozic',
    color: 'orange',
  },
  {
    name: 'VÝPOMOC NA JINÉ OD.',
    code: 'VÝPOMOC',
    description: 'Dočasná výpomoc na jiných odděleních skladu',
    color: 'teal',
  },
];

const CUSTOM_DEPTS_STORAGE_KEY = 'zf_custom_departments_v1';

export const loadStoredCustomDepartments = (): Department[] => {
  try {
    const raw = localStorage.getItem(CUSTOM_DEPTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((d: any) => ({
        ...d,
        isCustom: true,
      }));
    }
    return [];
  } catch (e) {
    console.warn('Failed to load custom departments from localStorage:', e);
    return [];
  }
};

export const saveStoredCustomDepartments = (depts: Department[]): void => {
  try {
    localStorage.setItem(CUSTOM_DEPTS_STORAGE_KEY, JSON.stringify(depts));
  } catch (e) {
    console.warn('Failed to save custom departments to localStorage:', e);
  }
};

export const loadCustomDepartments = loadStoredCustomDepartments;
export const saveCustomDepartments = saveStoredCustomDepartments;

export const addCustomDepartment = (dept: Department): Department[] => {
  const current = loadStoredCustomDepartments();
  const updated = [...current.filter((d) => d.id !== dept.id), dept];
  saveStoredCustomDepartments(updated);
  return updated;
};

export const removeCustomDepartment = (deptId: string): Department[] => {
  const current = loadStoredCustomDepartments();
  const updated = current.filter((d) => d.id !== deptId);
  saveStoredCustomDepartments(updated);
  return updated;
};

export const createCustomDepartment = (
  name: string,
  description = 'Mimořádné vícepráce mimo hlavní oddělení',
  code = 'VÍCE',
  color = 'amber',
  shift?: ShiftCode
): Department => {
  const cleanId = `extra_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  return {
    id: cleanId,
    name: name.trim(),
    fullName: `Vícepráce: ${name.trim()}`,
    code: (code || 'VÍCE').toUpperCase().slice(0, 8),
    description: description.trim(),
    color,
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    badgeText: 'text-amber-700 dark:text-amber-400',
    borderColor: 'border-amber-400 dark:border-amber-600',
    iconName: 'Wrench',
    targetCount: 0,
    isCustom: true,
    shift: shift || 'A',
    createdAt: new Date().toISOString(),
  };
};

export const getDepartmentById = (
  id: DepartmentId,
  customDepartments: Department[] = []
): Department => {
  // Search custom departments first
  if (customDepartments && customDepartments.length > 0) {
    const foundCustom = customDepartments.find((d) => d.id === id);
    if (foundCustom) return foundCustom;
  }
  // Try localStorage cached custom depts
  const stored = loadStoredCustomDepartments();
  const foundStored = stored.find((d) => d.id === id);
  if (foundStored) return foundStored;

  // Search standard built-in departments
  const found = DEPARTMENTS.find((d) => d.id === id);
  if (found) return found;

  // Smart fallback for unknown or ad-hoc custom department ID
  return {
    id,
    name: id.startsWith('extra_') ? 'Vícepráce' : id,
    code: 'VÍCE',
    fullName: `Mimořádné vícepráce (${id})`,
    description: 'Mimořádný úkol mimo hlavní tabulku',
    color: 'amber',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    badgeText: 'text-amber-700 dark:text-amber-400',
    borderColor: 'border-amber-400 dark:border-amber-600',
    iconName: 'Wrench',
    targetCount: 0,
    isCustom: true,
  };
};
