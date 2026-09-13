import React from 'react';
import {
  CheckSquare,
  X,
  ArrowRight,
  UserX,
  PackageCheck,
  Boxes,
  ArrowDownToLine,
  Wrench,
  Globe,
  Layers,
  GitCommitVertical,
} from 'lucide-react';
import { DepartmentId } from '../types';
import { DEPARTMENTS } from '../data/departments';

interface BulkActionBarProps {
  selectedCount: number;
  totalOperatorsCount: number;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onBulkMove: (targetDeptId: DepartmentId) => void;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  totalOperatorsCount,
  onClearSelection,
  onSelectAll,
  onBulkMove,
}) => {
  if (selectedCount === 0) return null;

  const getDeptColorClass = (id: DepartmentId) => {
    switch (id) {
      case 'vna':
        return 'bg-emerald-600 hover:bg-emerald-500 text-white';
      case 'hovs':
        return 'bg-sky-600 hover:bg-sky-500 text-white';
      case 'putaway':
        return 'bg-indigo-600 hover:bg-indigo-500 text-white';
      case 'hovc':
        return 'bg-blue-600 hover:bg-blue-500 text-white';
      case 'vas':
        return 'bg-amber-600 hover:bg-amber-500 text-white';
      case 'obwi':
        return 'bg-rose-600 hover:bg-rose-500 text-white';
      case 'obwf':
        return 'bg-purple-600 hover:bg-purple-500 text-white';
      case 'unassigned':
        return 'bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600';
      default:
        return 'bg-slate-700 hover:bg-slate-600 text-white';
    }
  };

  return (
    <div
      id="bulk-actions-floating-bar"
      className="fixed bottom-4 inset-x-0 z-40 flex justify-center px-3 pointer-events-none animate-in slide-in-from-bottom-5 duration-200"
    >
      <div className="pointer-events-auto bg-slate-900/95 dark:bg-slate-950/95 text-white backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/80 p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 max-w-4xl w-full">
        {/* Left Info: Selected Count & Selection toggles */}
        <div className="flex items-center justify-between sm:justify-start gap-2.5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <CheckSquare className="w-3.5 h-3.5 text-white" />
            </span>
            <span className="text-xs sm:text-sm font-bold text-white">
              Vybráno: <span className="text-blue-400 font-extrabold">{selectedCount}</span>{' '}
              <span className="text-slate-400 text-xs font-normal">
                (z {totalOperatorsCount})
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 ml-1">
            {selectedCount < totalOperatorsCount && (
              <button
                id="bulk-select-all-btn"
                onClick={onSelectAll}
                className="text-[11px] font-semibold text-slate-300 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
                title="Vybrat všechny operátory na směně"
              >
                Vybrat vše
              </button>
            )}

            <button
              id="bulk-clear-selection-btn"
              onClick={onClearSelection}
              className="text-[11px] font-semibold text-slate-400 hover:text-rose-300 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1"
              title="Zrušit označení"
            >
              <X className="w-3 h-3" />
              <span>Zrušit</span>
            </button>
          </div>
        </div>

        {/* Right Target Department Actions */}
        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap justify-end">
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 shrink-0 mr-1">
            <span>Přesunout do</span>
            <ArrowRight className="w-3 h-3 text-slate-500" />
          </span>

          <div className="flex items-center gap-1 flex-wrap">
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept.id}
                id={`bulk-move-to-${dept.id}-btn`}
                onClick={() => onBulkMove(dept.id)}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-2xs cursor-pointer ${getDeptColorClass(
                  dept.id
                )}`}
                title={`Hromadně přesunout ${selectedCount} vybraných do ${dept.name}`}
              >
                {dept.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
