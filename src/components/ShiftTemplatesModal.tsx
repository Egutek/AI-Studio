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
  ArrowRight,
} from 'lucide-react';
import { Operator, ShiftTemplate } from '../types';
import { DEPARTMENTS } from '../data/departments';
import {
  loadAllTemplates,
  saveNewTemplate,
  deleteCustomTemplate,
  updateTemplateWithCurrent,
} from '../data/templates';

interface ShiftTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOperators: Operator[];
  onApplyTemplate: (template: ShiftTemplate) => void;
}

export const ShiftTemplatesModal: React.FC<ShiftTemplatesModalProps> = ({
  isOpen,
  onClose,
  currentOperators,
  onApplyTemplate,
}) => {
  const [templates, setTemplates] = useState<ShiftTemplate[]>([]);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateNote, setNewTemplateNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'custom' | 'builtin'>('all');
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null);

  const reloadTemplates = () => {
    setTemplates(loadAllTemplates());
  };

  useEffect(() => {
    if (isOpen) {
      reloadTemplates();
      // Suggest template name based on day / time
      const now = new Date();
      const dayNames = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
      const dayName = dayNames[now.getDay()];
      const hour = now.getHours();
      const shiftName = hour >= 5 && hour < 14 ? 'Ranní směna' : hour >= 14 && hour < 22 ? 'Odpolední směna' : 'Noční směna';
      setNewTemplateName(`${shiftName} - ${dayName}`);
    }
  }, [isOpen]);

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

    saveNewTemplate(newTemplateName, newTemplateNote, currentOperators);
    setNewTemplateName('');
    setNewTemplateNote('');
    setIsSaving(false);
    reloadTemplates();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Opravdu chcete smazat šablonu "${name}"?`)) {
      deleteCustomTemplate(id);
      reloadTemplates();
    }
  };

  const handleUpdate = (id: string, name: string) => {
    if (
      confirm(
        `Chcete přepsat šablonu "${name}" aktuálním rozložením (${currentOperators.length} operátorů)?`
      )
    ) {
      updateTemplateWithCurrent(id, currentOperators);
      reloadTemplates();
    }
  };

  const handleApply = (template: ShiftTemplate) => {
    setAppliedTemplateId(template.id);
    setTimeout(() => {
      onApplyTemplate(template);
      onClose();
    }, 200);
  };

  const filteredTemplates = templates.filter((t) => {
    if (activeTab === 'custom') return !t.isBuiltIn;
    if (activeTab === 'builtin') return t.isBuiltIn;
    return true;
  });

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
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-900 to-indigo-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-blue-200">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight">
                  Šablony obsazení směny
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  {templates.length} šablon
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-0.5">
                Uložte si výchozí stav směny a další den ho načtěte jedním kliknutím.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Quick Action: Save Current State as Template */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/20 border border-blue-200/80 dark:border-blue-800/60 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <BookmarkCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Uložit aktuální rozdělení jako šablonu
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="text-slate-600 dark:text-slate-300">
                  Celkem: <strong className="text-blue-600 dark:text-blue-400">{currentOperators.length} lidí</strong>
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
                  placeholder="Název šablony (např. Ranní směna - pondělí, Plný stav)..."
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all active:scale-95 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Uložit aktuální stav</span>
                </button>
              </div>
              <input
                id="template-note-input"
                type="text"
                placeholder="Poznámka k šabloně (volitelné)..."
                value={newTemplateNote}
                onChange={(e) => setNewTemplateNote(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
              />
            </form>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'all'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Všechny ({templates.length})
              </button>
              <button
                onClick={() => setActiveTab('custom')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'custom'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Moje uložené ({templates.filter((t) => !t.isBuiltIn).length})
              </button>
              <button
                onClick={() => setActiveTab('builtin')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'builtin'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Tovární ({templates.filter((t) => t.isBuiltIn).length})
              </button>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Kliknutím na "Použít" načtete operátory do směny
            </span>
          </div>

          {/* Templates list */}
          <div className="space-y-3">
            {filteredTemplates.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <Bookmark className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Zatím žádné vlastní šablony
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Uložte si aktuální rozdělení operátorů pomocí formuláře výše.
                </p>
              </div>
            ) : (
              filteredTemplates.map((tmpl) => {
                const isApplied = appliedTemplateId === tmpl.id;

                // Department counts in this template
                const deptCounts = DEPARTMENTS.map((d) => {
                  const count = tmpl.assignments.filter((a) => a.departmentId === d.id).length;
                  return { id: d.id, name: d.name, count };
                }).filter((d) => d.count > 0);

                return (
                  <div
                    key={tmpl.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isApplied
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/70 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                            {tmpl.name}
                          </h4>
                          {tmpl.isBuiltIn ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                              Tovární šablona
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                              Vlastní šablona
                            </span>
                          )}
                        </div>

                        {tmpl.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                            {tmpl.description}
                          </p>
                        )}

                        {/* Metrics */}
                        <div className="flex items-center gap-3 mt-2 text-xs font-bold">
                          <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-blue-500" />
                            {tmpl.operatorCount} lidí celkem
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {tmpl.activeCount} v provozu
                          </span>
                          <span className="text-slate-400 text-[11px] font-normal flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(tmpl.createdAt).toLocaleDateString('cs-CZ')}
                          </span>
                        </div>

                        {/* Breakdown per department chips */}
                        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                          {deptCounts.map((dc) => (
                            <span
                              key={dc.id}
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                                dc.id === 'unassigned'
                                  ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
                                  : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-750 dark:text-slate-200 dark:border-slate-700'
                              }`}
                            >
                              <strong>{dc.name}:</strong> {dc.count}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                        <button
                          id={`apply-template-${tmpl.id}`}
                          onClick={() => handleApply(tmpl)}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95"
                          title="Aktivovat tuto šablonu do aktuální směny"
                        >
                          <Check className="w-4 h-4" />
                          <span>Použít šablonu</span>
                        </button>

                        {!tmpl.isBuiltIn && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleUpdate(tmpl.id, tmpl.name)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
                              title="Přepsat tuto šablonu aktuálním stavem"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(tmpl.id, tmpl.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                              title="Smazat tuto šablonu"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tip: Šablony se ukládají lokálně v prohlížeči a jsou kdykoliv připraveny k použití.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Zavřít
          </button>
        </div>
      </div>
    </div>
  );
};
