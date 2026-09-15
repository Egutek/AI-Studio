import React from 'react';
import {
  X,
  ArrowRightLeft,
  PackageCheck,
  Boxes,
  ArrowDownToLine,
  Wrench,
  Layers,
  GitCommitVertical,
  Globe,
  UserX,
  Check,
} from 'lucide-react';
import { DEPARTMENTS } from '../data/departments';
import { AbsenceReason, Department, DepartmentId, Operator } from '../types';

interface QuickMoveModalProps {
  operator: Operator | null;
  operators: Operator[];
  customDepartments?: Department[];
  isOpen: boolean;
  onClose: () => void;
  onMove: (targetDeptId: DepartmentId, absenceReason?: AbsenceReason) => void;
}

export const QuickMoveModal: React.FC<QuickMoveModalProps> = ({
  operator,
  operators,
  customDepartments = [],
  isOpen,
  onClose,
  onMove,
}) => {
  if (!isOpen || !operator) return null;

  const allDepts = [...DEPARTMENTS, ...customDepartments];
  const currentDept = allDepts.find((d) => d.id === operator.departmentId);

  const getDeptIcon = (id: DepartmentId, isCustom?: boolean) => {
    if (isCustom) {
      return <Wrench className="w-5 h-5 text-amber-500" />;
    }
    switch (id) {
      case 'hovc':
        return <PackageCheck className="w-5 h-5 text-blue-500" />;
      case 'hovs':
        return <Boxes className="w-5 h-5 text-sky-500" />;
      case 'putaway':
        return <ArrowDownToLine className="w-5 h-5 text-indigo-500" />;
      case 'vas':
        return <Wrench className="w-5 h-5 text-amber-500" />;
      case 'obwf':
        return <Layers className="w-5 h-5 text-purple-500" />;
      case 'vna':
        return <GitCommitVertical className="w-5 h-5 text-emerald-500" />;
      case 'obwi':
        return <Globe className="w-5 h-5 text-rose-500" />;
      default:
        return <UserX className="w-5 h-5 text-slate-500" />;
    }
  };

  const getCountForDept = (deptId: DepartmentId) => {
    return operators.filter((o) => o.departmentId === deptId).length;
  };

  return (
    <div
      id="quick-move-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="quick-move-dialog"
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Přesun operátora v rámci PICK
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {operator.name}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status banner */}
        <div className="px-5 py-3 bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/40 flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">Aktuálně:</span>
            <span className="font-bold text-blue-700 dark:text-blue-300">
              {currentDept?.name || 'Nezařazeno'}
            </span>
          </div>

          {operator.machineType && operator.machineType !== 'NONE' && (
            <span
              className={`font-black text-xs px-2.5 py-0.5 rounded-md ${
                operator.machineType === 'RTR'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
              }`}
            >
              {operator.machineType}
            </span>
          )}
        </div>

        {/* Department Selection Grid */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-3">
            Vyberte cílové oddělení v rámci PICK:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {DEPARTMENTS.map((dept) => {
              const isCurrent = dept.id === operator.departmentId;
              const count = getCountForDept(dept.id);

              if (dept.id === 'unassigned') {
                return (
                  <div
                    key={dept.id}
                    className={`sm:col-span-2 p-3 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700/60 text-slate-500">
                          {getDeptIcon(dept.id)}
                        </div>
                        <div>
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {dept.name}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            Zvolte důvod nepřítomnosti:
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-semibold px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                          {count} lidí
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {(['Absence', 'Dovolená', 'PN'] as AbsenceReason[]).map((reason) => {
                        const isReasonCurrent = isCurrent && operator.absenceReason === reason;
                        return (
                          <button
                            key={reason}
                            type="button"
                            onClick={() => {
                              onMove('unassigned', reason);
                              onClose();
                            }}
                            className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer text-xs font-bold ${
                              isReasonCurrent
                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/30'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-400 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {isReasonCurrent && '✓ '}
                            {reason}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={dept.id}
                  id={`move-to-${dept.id}-btn`}
                  disabled={isCurrent}
                  onClick={() => {
                    onMove(dept.id);
                    onClose();
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    isCurrent
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 opacity-60 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700/60 shrink-0">
                      {getDeptIcon(dept.id)}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {dept.name}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {isCurrent ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-200/70 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                        <Check className="w-3 h-3" /> Zde
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                        {count} lidí
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom / Extra Work Departments */}
          {customDepartments.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" />
                <span>Mimořádné úkoly a vícepráce:</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {customDepartments.map((dept) => {
                  const isCurrent = dept.id === operator.departmentId;
                  const count = getCountForDept(dept.id);

                  return (
                    <button
                      key={dept.id}
                      id={`move-to-${dept.id}-btn`}
                      disabled={isCurrent}
                      onClick={() => {
                        onMove(dept.id);
                        onClose();
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border border-dashed text-left transition-all ${
                        isCurrent
                          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/60 opacity-60 cursor-not-allowed'
                          : 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-300 dark:border-amber-700/60 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 shrink-0">
                          {getDeptIcon(dept.id, true)}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-sm text-slate-900 dark:text-white truncate block">
                            {dept.name}
                          </span>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                            {dept.code}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-200/70 dark:bg-amber-900/60 px-2 py-0.5 rounded-md">
                            <Check className="w-3 h-3" /> Zde
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                            {count} lidí
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Zavřít
          </button>
        </div>
      </div>
    </div>
  );
};
