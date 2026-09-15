import React, { useState } from 'react';
import {
  X,
  Plus,
  Wrench,
  Sparkles,
  ClipboardList,
  Check,
  AlertCircle,
  Trash2,
  Users,
  FolderPlus,
  Layers,
} from 'lucide-react';
import { Department, Operator, ShiftCode } from '../types';
import { EXTRA_WORK_PRESETS, ExtraWorkPreset, createCustomDepartment } from '../data/departments';

interface AddCustomDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateDepartment: (dept: Department) => void;
  customDepartments?: Department[];
  operators?: Operator[];
  onDeleteDepartment?: (deptId: string) => void;
  activeShift?: ShiftCode;
}

const COLOR_OPTIONS = [
  { id: 'amber', name: 'Jantarová', badge: 'bg-amber-500' },
  { id: 'orange', name: 'Oranžová', badge: 'bg-orange-500' },
  { id: 'teal', name: 'Tyrkysová', badge: 'bg-teal-500' },
  { id: 'cyan', name: 'Azurová', badge: 'bg-cyan-500' },
  { id: 'indigo', name: 'Indigová', badge: 'bg-indigo-500' },
  { id: 'slate', name: 'Břidlicová', badge: 'bg-slate-500' },
];

export const AddCustomDepartmentModal: React.FC<AddCustomDepartmentModalProps> = ({
  isOpen,
  onClose,
  onCreateDepartment,
  customDepartments = [],
  operators = [],
  onDeleteDepartment,
  activeShift = 'A',
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('amber');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Filter custom departments belonging to this specific shift
  const shiftCustomDepartments = customDepartments.filter(
    (d) => (d.shift || 'A') === activeShift
  );

  const handleApplyPreset = (preset: ExtraWorkPreset) => {
    setName(preset.name);
    setCode(preset.code);
    setDescription(preset.description);
    setColor(preset.color);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Vyplňte prosím název oddělení nebo úkolu.');
      return;
    }

    const cleanCode = (code.trim() || trimmedName.slice(0, 6)).toUpperCase();
    const newDept = createCustomDepartment(
      trimmedName,
      description.trim() || 'Vícepráce a mimořádné úkoly',
      cleanCode,
      color,
      (activeShift || 'A') as ShiftCode
    );

    onCreateDepartment(newDept);
    // Reset form
    setName('');
    setCode('');
    setDescription('');
    setError('');
    onClose();
  };

  return (
    <div
      id="add-custom-dept-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="add-custom-dept-modal-card"
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shadow-xs shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Vícepráce a mimořádné úkoly
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-amber-500 text-white shadow-2xs">
                  Směna {activeShift}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Vytvoření oddělení specificky pro <strong>Směnu {activeShift}</strong> (ostatní směny nebudou ovlivněny)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === 'create'
                ? 'border-amber-600 text-amber-700 dark:text-amber-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            <span>Nové oddělení (Směna {activeShift})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === 'list'
                ? 'border-amber-600 text-amber-700 dark:text-amber-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Vícepráce směny ({shiftCustomDepartments.length})</span>
          </button>
        </div>

        {/* Tab 1: Create New Department */}
        {activeTab === 'create' && (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
            {error && (
              <div className="flex items-center gap-2 p-3 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Presets */}
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Rychlé předvolby:</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {EXTRA_WORK_PRESETS.map((preset) => {
                  const isSelected = name === preset.name;
                  return (
                    <button
                      key={preset.code}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={`p-2.5 text-left rounded-xl border text-xs transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/30 font-bold shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold truncate">{preset.name}</span>
                        {isSelected && <Check className="w-3 h-3 text-amber-600 shrink-0 ml-1" />}
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono uppercase">
                        Štítek: {preset.code}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name & Code Row */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Název oddělení / úkolu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!code) {
                      setCode(e.target.value.slice(0, 8).toUpperCase());
                    }
                    if (error) setError('');
                  }}
                  placeholder="např. ŠKOLENÍ, CLEARING..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-900 dark:text-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kód štítku
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="VÍCE"
                  className="w-full px-3 py-2 text-sm font-mono uppercase bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-900 dark:text-white text-center"
                />
              </div>
            </div>

            {/* Description / Instructions */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Podrobnosti / Instrukce pro směnu (volitelné)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="např. Zácvik nováčků na LL, úklid uliček C a D..."
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-900 dark:text-white"
              />
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Barevné odlišení sloupce
              </label>
              <div className="flex items-center gap-2 pt-1">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    className={`w-7 h-7 rounded-full ${c.badge} transition-transform flex items-center justify-center cursor-pointer ${
                      color === c.id ? 'ring-2 ring-offset-2 ring-slate-800 dark:ring-white scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                    title={c.name}
                  >
                    {color === c.id && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Helper hint */}
            <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Jak to funguje:</span>
              </p>
              <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                Oddělení se zobrazí jako nový sloupec na nástěnce. Můžete do něj přetahovat operátory stejně jako do běžných sekcí. Lidé v tomto oddělení se počítají jako aktivní na směně a po dokončení úkolu můžete oddělení kdykoliv smazat.
              </p>
            </div>

            {/* Footer actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Zavřít
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Vytvořit oddělení</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Manage Existing Custom Departments */}
        {activeTab === 'list' && (
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {shiftCustomDepartments.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Wrench className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Zatím jste na Směně {activeShift} nevytvořili žádná oddělení víceprací
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Potřebujete poslat operátory na mimořádný úkol? Vytvořte nové oddělení pro Směnu {activeShift} kliknutím na záložku výše.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="px-4 py-2 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-xl hover:bg-amber-100 transition-colors"
                >
                  ➕ Vytvořit první vícepráce na Směně {activeShift}
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Zde můžete zrušit a smazat oddělení víceprací pro <strong>Směnu {activeShift}</strong>. Ostatní směny zůstanou beze změny. Přiřazení operátoři budou bezpečně přesunuti zpět do Outbound.
                </p>

                {shiftCustomDepartments.map((dept) => {
                  const assignedCount = operators.filter((o) => o.departmentId === dept.id).length;
                  return (
                    <div
                      key={dept.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                          {dept.code}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {dept.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>{assignedCount} operátorů</span>
                            </span>
                            {dept.description && (
                              <span className="truncate hidden sm:inline opacity-75">
                                • {dept.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (onDeleteDepartment) {
                            onDeleteDepartment(dept.id);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-600 hover:text-white transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                        title={`Smazat oddělení ${dept.name} ze Směny ${activeShift}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Smazat</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Zavřít
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
