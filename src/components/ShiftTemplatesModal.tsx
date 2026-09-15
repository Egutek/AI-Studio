import React, { useState, useEffect } from 'react';
import {
  X,
  Bookmark,
  BookmarkCheck,
  Plus,
  Trash2,
  RefreshCw,
  Check,
  Users,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Department, Operator, ShiftCode, ShiftTemplate } from '../types';
import { DEPARTMENTS } from '../data/departments';
import {
  loadAllTemplates,
  saveNewTemplate,
  deleteTemplate,
  updateTemplateWithCurrent,
  restoreDefaultTemplates,
} from '../data/templates';
import {
  syncTemplateToCloud,
  deleteTemplateFromCloud,
  subscribeToTemplates,
} from '../services/firestoreSync';

interface ShiftTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOperators: Operator[];
  activeShift?: ShiftCode;
  onApplyTemplate: (template: ShiftTemplate) => void;
  customDepartments?: Department[];
}

export const ShiftTemplatesModal: React.FC<ShiftTemplatesModalProps> = ({
  isOpen,
  onClose,
  currentOperators,
  activeShift = 'A',
  onApplyTemplate,
  customDepartments = [],
}) => {
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateNote, setNewTemplateNote] = useState('');
  const [targetShift, setTargetShift] = useState<ShiftCode | 'all'>(activeShift);
  const [shiftFilter, setShiftFilter] = useState<string>(activeShift);
  const [typeFilter, setTypeFilter] = useState<'all' | 'custom' | 'builtin'>('all');
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null);

  const reloadTemplates = () => {
    setTemplates(loadAllTemplates());
  };

  useEffect(() => {
    if (isOpen) {
      reloadTemplates();
      setTargetShift(activeShift);
      setShiftFilter(activeShift);

      // Suggest template name based on day / time and current shift
      const now = new Date();
      const dayNames = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
      const dayName = dayNames[now.getDay()];
      const hour = now.getHours();
      const timeShift =
        hour >= 5 && hour < 14
          ? 'Ranní'
          : hour >= 14 && hour < 22
          ? 'Odpolední'
          : 'Noční';
      setNewTemplateName(`Směna ${activeShift} - ${timeShift} (${dayName})`);

      // Realtime sync from cloud
      const unsub = subscribeToTemplates((cloudTemplates) => {
        if (cloudTemplates && cloudTemplates.length > 0) {
          setTemplates((prev) => {
            const builtIns = prev.filter((t) => t.isBuiltIn);
            // Merge custom templates without duplicates
            const customMap = new Map<string, ShiftTemplate>();
            for (const t of cloudTemplates) {
              customMap.set(t.id, t);
            }
            return [...builtIns, ...Array.from(customMap.values())];
          });
        }
      });
      return () => unsub();
    }
  }, [isOpen, activeShift]);

  if (!isOpen) return null;

  const currentActiveCount = currentOperators.filter(
    (o) => o.departmentId !== 'unassigned' && o.status === 'active'
  ).length;
  const currentAbsenceCount = currentOperators.filter(
    (o) => o.departmentId === 'unassigned' || o.status === 'absence'
  ).length;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    const created = saveNewTemplate(newTemplateName, newTemplateNote, currentOperators, targetShift);
    if (created) {
      syncTemplateToCloud(created).catch((err) => console.warn('Cloud template sync notice:', err));
    }
    setNewTemplateName('');
    setNewTemplateNote('');
    reloadTemplates();
  };

  const handleDelete = (id: string) => {
    deleteTemplate(id);
    deleteTemplateFromCloud(id).catch((err) => console.warn('Cloud template delete notice:', err));
    reloadTemplates();
  };

  const handleRestoreDefaults = () => {
    restoreDefaultTemplates();
    reloadTemplates();
  };

  const handleUpdate = (id: string) => {
    updateTemplateWithCurrent(id, currentOperators);
    const allT = loadAllTemplates();
    const updatedT = allT.find((t) => t.id === id);
    if (updatedT) {
      syncTemplateToCloud(updatedT).catch((err) => console.warn('Cloud template update notice:', err));
    }
    reloadTemplates();
  };

  const handleApply = (template: ShiftTemplate) => {
    setAppliedTemplateId(template.id);
    setTimeout(() => {
      onApplyTemplate(template);
      onClose();
    }, 200);
  };

  const filteredTemplates = templates.filter((t) => {
    // Filter by shift
    if (shiftFilter !== 'all') {
      const tmplShift = t.shift || 'A';
      if (tmplShift !== 'all' && tmplShift !== shiftFilter) {
        return false;
      }
    }
    // Filter by type
    if (typeFilter === 'custom') return !t.isBuiltIn;
    if (typeFilter === 'builtin') return t.isBuiltIn;
    return true;
  });

  const allKnownDepartments = [...DEPARTMENTS, ...(customDepartments || [])];

  const getShiftBadgeProps = (shiftCode?: ShiftCode | 'all') => {
    switch (shiftCode) {
      case 'A':
        return {
          label: 'Směna A',
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-200 border-blue-300 dark:border-blue-800',
        };
      case 'B':
        return {
          label: 'Směna B',
          className: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-200 border-purple-300 dark:border-purple-800',
        };
      case 'C':
        return {
          label: 'Směna C',
          className: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200 border-amber-300 dark:border-amber-800',
        };
      default:
        return {
          label: 'Všechny směny',
          className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800',
        };
    }
  };

  return (
    <div
      id="shift-templates-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="shift-templates-modal"
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-900 via-indigo-900 to-indigo-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-blue-200 shrink-0 shadow-xs">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Šablony obsazení směn
                </h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  {templates.length} šablon
                </span>
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30">
                  Směna {activeShift}
                </span>
              </div>
              <p className="text-xs text-blue-200/85 mt-0.5">
                Každá směna (A, B, C) má své vlastní uložené šablony pro rychlé rozdělení lidí.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Quick Action: Save Current State as Template */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/40 dark:from-slate-800/90 dark:to-slate-850 border border-blue-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <BookmarkCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Uložit aktuální rozdělení do šablony
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold flex-wrap">
                <span className="text-slate-700 dark:text-slate-300">
                  Směna: <strong className="text-blue-600 dark:text-blue-400">Směna {activeShift}</strong> ({currentOperators.length} lidí)
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {currentActiveCount} v provozu
                </span>
                {currentAbsenceCount > 0 && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-rose-600 dark:text-rose-400">
                      {currentAbsenceCount} absence
                    </span>
                  </>
                )}
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-2.5">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="template-name-input"
                  type="text"
                  required
                  placeholder="Název šablony (např. Ranní směna - plný stav)..."
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />

                {/* Target Shift Selector for the template */}
                <div className="flex items-center gap-1 shrink-0 bg-white dark:bg-slate-800 p-1 border border-slate-300 dark:border-slate-700 rounded-xl">
                  {(['A', 'B', 'C', 'all'] as const).map((sc) => (
                    <button
                      key={sc}
                      type="button"
                      onClick={() => setTargetShift(sc)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        targetShift === sc
                          ? sc === 'A'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : sc === 'B'
                            ? 'bg-purple-600 text-white shadow-2xs'
                            : sc === 'C'
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                      title={sc === 'all' ? 'Univerzální pro všechny směny' : `Určeno pro Směnu ${sc}`}
                    >
                      {sc === 'all' ? 'Všechny' : `Směna ${sc}`}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Uložit šablonu</span>
                </button>
              </div>

              <input
                id="template-note-input"
                type="text"
                placeholder="Poznámka k šabloně (např. pondělní rozjezd, inventurní směna)..."
                value={newTemplateNote}
                onChange={(e) => setNewTemplateNote(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </form>
          </div>

          {/* Shift Filter & View Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
            {/* Shift filter tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">
                Zobrazit pro:
              </span>
              {[
                { id: activeShift, label: `Moje směna (${activeShift})`, isCurrent: true },
                { id: 'A', label: 'Směna A' },
                { id: 'B', label: 'Směna B' },
                { id: 'C', label: 'Směna C' },
                { id: 'all', label: 'Všechny směny' },
              ].map((item) => {
                const isActive = shiftFilter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setShiftFilter(item.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      isActive
                        ? item.id === 'A'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : item.id === 'B'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : item.id === 'C'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-800 text-white dark:bg-slate-700 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Type Filter & restore defaults button */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTypeFilter('all')}
                  className={`px-2 py-0.5 text-[11px] font-bold rounded-lg cursor-pointer ${
                    typeFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Vše
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('custom')}
                  className={`px-2 py-0.5 text-[11px] font-bold rounded-lg cursor-pointer ${
                    typeFilter === 'custom'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Vlastní
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('builtin')}
                  className={`px-2 py-0.5 text-[11px] font-bold rounded-lg cursor-pointer ${
                    typeFilter === 'builtin'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Tovární
                </button>
              </div>

              <button
                type="button"
                onClick={handleRestoreDefaults}
                className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Vrátit smazané tovární šablony zpět"
              >
                Obnovit výchozí
              </button>
            </div>
          </div>

          {/* Templates list */}
          <div className="space-y-3">
            {filteredTemplates.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <Bookmark className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {shiftFilter !== 'all'
                    ? `Zatím žádné šablony pro Směnu ${shiftFilter}`
                    : 'Zatím žádné šablony'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Uložte si aktuální rozdělení operátorů formulářem výše pro tuto směnu.
                </p>
              </div>
            ) : (
              filteredTemplates.map((tmpl) => {
                const isApplied = appliedTemplateId === tmpl.id;
                const shiftBadge = getShiftBadgeProps(tmpl.shift);

                // Department counts in this template with rich metadata & colors
                const deptCounts = allKnownDepartments
                  .map((d) => {
                    const count = tmpl.assignments.filter((a) => a.departmentId === d.id).length;
                    return {
                      id: d.id,
                      name: d.name,
                      code: d.code,
                      badgeBg: d.badgeBg,
                      color: d.color,
                      count,
                    };
                  })
                  .filter((d) => d.count > 0);

                return (
                  <div
                    key={tmpl.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isApplied
                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/75 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                            {tmpl.name}
                          </h4>

                          {/* Shift Badge */}
                          <span
                            className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${shiftBadge.className}`}
                          >
                            {shiftBadge.label}
                          </span>

                          {tmpl.isBuiltIn ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700/80 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                              Tovární
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              Vlastní
                            </span>
                          )}
                        </div>

                        {tmpl.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                            {tmpl.description}
                          </p>
                        )}

                        {/* Metrics */}
                        <div className="flex items-center gap-3.5 mt-2.5 text-xs font-bold flex-wrap">
                          <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-blue-500" />
                            <span>{tmpl.operatorCount} lidí v šabloně</span>
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span>{tmpl.activeCount} v provozu</span>
                          </span>
                          <span className="text-slate-400 dark:text-slate-400 text-[11px] font-normal flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{new Date(tmpl.createdAt).toLocaleDateString('cs-CZ')}</span>
                          </span>
                        </div>

                        {/* Breakdown per department colored chips */}
                        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                          {deptCounts.map((dc) => (
                            <span
                              key={dc.id}
                              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border shadow-2xs flex items-center gap-1 transition-colors ${
                                dc.badgeBg ||
                                (dc.id === 'unassigned'
                                  ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900'
                                  : 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600')
                              }`}
                            >
                              <span className="font-bold opacity-90">{dc.name}:</span>
                              <span className="font-extrabold">{dc.count}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          id={`apply-template-${tmpl.id}`}
                          onClick={() => handleApply(tmpl)}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 cursor-pointer"
                          title="Aktivovat tuto šablonu do aktuální směny"
                        >
                          <Check className="w-4 h-4" />
                          <span>Použít na Směnu {activeShift}</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdate(tmpl.id)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Přepsat tuto šablonu aktuálním rozdělením operátorů"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(tmpl.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Smazat tuto šablonu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tip: Šablony jsou spárovány se směnami (A, B, C) a synchronizují se přes cloud v reálném čase.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Zavřít
          </button>
        </div>
      </div>
    </div>
  );
};
