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
import { DepartmentId, Operator } from '../types';

interface QuickMoveModalProps {
  operator: Operator | null;
  operators: Operator[];
  isOpen: boolean;
  onClose: () => void;
  onMove: (targetDeptId: DepartmentId) => void;
}

export const QuickMoveModal: React.FC<QuickMoveModalProps> = ({
  operator,
  operators,
  isOpen,
  onClose,
  onMove,
}) => {
  if (!isOpen || !operator) return null;

  const currentDept = DEPARTMENTS.find((d) => d.id === operator.departmentId);

  const getDeptIcon = (id: DepartmentId) => {
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
