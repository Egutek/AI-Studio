import React, { useState, useRef } from 'react';
import {
  PackageCheck,
  Boxes,
  ArrowDownToLine,
  Wrench,
  Layers,
  GitCommitVertical,
  Globe,
  UserX,
  Plus,
  Users,
  CheckSquare,
  Trash2,
} from 'lucide-react';
import {
  Department,
  DepartmentId,
  Operator,
  OperatorStatus,
  AbsenceReason,
} from '../types';
import { OperatorCard } from './OperatorCard';
import {
  resolveOperatorIdsFromDrop,
  getGlobalDragState,
} from '../utils/dragState';

interface DepartmentColumnProps {
  department: Department;
  operators: Operator[];
  allOperators?: Operator[];
  totalOperatorsCount: number;
  selectedOperatorId?: string | null;
  bulkSelectedIds?: Set<string>;
  onToggleBulkSelect?: (operatorId: string) => void;
  onSelectOperator?: (operator: Operator) => void;
  onDeselectOperator?: () => void;
  onOpenQuickMove: (operator: Operator) => void;
  onEditOperator: (operator: Operator) => void;
  onChangeStatus?: (operatorId: string, newStatus: OperatorStatus) => void;
  onChangeAbsenceReason?: (operatorId: string, reason: AbsenceReason) => void;
  onAddOperatorToDept: (deptId: DepartmentId) => void;
  onDropOperator: (operatorIds: string[], targetDeptId: DepartmentId) => void;
  onDeleteDepartment?: (deptId: DepartmentId) => void;
}

// Vibrant department header color configurations
const DEPT_HEADER_THEMES: Record<
  DepartmentId,
  {
    headerBg: string;
    border: string;
    iconBg: string;
    addBtnHover: string;
    chipBgLL: string;
    chipBgRTR: string;
  }
> = {
  hovc: {
    headerBg: 'bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 text-white',
    border: 'border-blue-300/80 dark:border-blue-700/80',
    iconBg: 'bg-white/20 text-white shadow-xs',
    addBtnHover: 'hover:bg-white/20 text-white',
    chipBgLL: 'bg-white/20 text-white border border-white/30',
    chipBgRTR: 'bg-white/30 text-white font-extrabold border border-white/40',
  },
  hovs: {
    headerBg: 'bg-gradient-to-r from-sky-600 via-cyan-600 to-sky-700 text-white',
    border: 'border-sky-300/80 dark:border-sky-700/80',
    iconBg: 'bg-white/20 text-white shadow-xs',
    addBtnHover: 'hover:bg-white/20 text-white',
    chipBgLL: 'bg-white/20 text-white border border-white/30',
    chipBgRTR: 'bg-white/30 text-white font-extrabold border border-white/40',
  },
  putaway: {
    headerBg: 'bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-800 text-white',
    border: 'border-indigo-300/80 dark:border-indigo-700/80',
    iconBg: 'bg-white/20 text-white shadow-xs',
    addBtnHover: 'hover:bg-white/20 text-white',
    chipBgLL: 'bg-white/20 text-white border border-white/30',
    chipBgRTR: 'bg-white/30 text-white font-extrabold border border-white/40',
  },
  vas: {
    headerBg: 'bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 text-white',
    border: 'border-amber-300/80 dark:border-amber-700/80',
    iconBg: 'bg-white/20 text-white shadow-xs',
    addBtnHover: 'hover:bg-white/20 text-white',
    chipBgLL: 'bg-white/20 text-white border border-white/30',
    chipBgRTR: 'bg-white/30 text-white font-extrabold border border-white/40',
  },
  obwf: {
    headerBg: 'bg-gradient-to-r from-purple-700 via-purple-600 to-fuchsia-800 text-white',
    border: 'border-purple-300/80 dark:border-purple-700/80',
    iconBg: 'bg-white/20 text-white shadow-xs',
    addBtnHover: 'hover:bg-white/20 text-white',
    chipBgLL: 'bg-white/20 text-white border border-white/30',
    chipBgRTR: 'bg-white/30 text-white font-extrabold border border-white/40',
  },
  vna: {
    headerBg: 'bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-800 text-white',
    border: 'border-emerald-300/80 dark:border-emerald-700/80',
    iconBg: 'bg-white/20 text-white shadow-xs',
    addBtnHover: 'hover:bg-white/20 text-white',
    chipBgLL: 'bg-white/20 text-white border border-white/30',
    chipBgRTR: 'bg-white/30 text-white font-extrabold border border-white/40',
  },
  obwi: {
    headerBg: 'bg-gradient-to-r from-rose-600 via-rose-500 to-pink-700 text-white',
    border: 'border-rose-300/80 dark:border-rose-700/80',
    iconBg: 'bg-white/20 text-white shadow-xs',
    addBtnHover: 'hover:bg-white/20 text-white',
    chipBgLL: 'bg-white/20 text-white border border-white/30',
    chipBgRTR: 'bg-white/30 text-white font-extrabold border border-white/40',
  },
  unassigned: {
    headerBg: 'bg-gradient-to-r from-slate-700 via-slate-600 to-slate-800 text-white',
    border: 'border-slate-300 dark:border-slate-700',
    iconBg: 'bg-white/20 text-white shadow-xs',
    addBtnHover: 'hover:bg-white/20 text-white',
    chipBgLL: 'bg-white/20 text-white border border-white/30',
    chipBgRTR: 'bg-white/30 text-white font-extrabold border border-white/40',
  },
};

const CUSTOM_THEMES_BY_COLOR: Record<
  string,
  {
    headerBg: string;
    border: string;
    iconBg: string;
    addBtnHover: string;
    chipBgLL: string;
    chipBgRTR: string;
  }
> = {
  amber: {
    headerBg: 'bg-gradient-to-r from-amber-700/90 via-amber-600/90 to-amber-800/90 text-white',
    border: 'border-dashed border-amber-300/90 dark:border-amber-700/80',
    iconBg: 'bg-white/20 text-white shadow-xs',
    addBtnHover: 'hover:bg-white/20 text-white',
    chipBgLL: 'bg-white/20 text-white border border-white/30',
    chipBgRTR: 'bg-white/30 text-white font-extrabold border border-white/40',
  },
  orange: {
    headerBg: 'bg-gradient-to-r from-orange-700/90 via-orange-600/90 to-orange-800/90 text-white',
    border: 'border-dashed border-orange-300/90 dark:border-orange-700/80',
    iconBg: 'bg-white/20 text-white shadow-xs',
    addBtnHover: 'hover:bg-white/20 text-white',
    chipBgLL: 'bg-white/20 text-white border border-white/30',
    chipBgRTR: 'bg-white/30 text-white font-extrabold border border-white/40',
  },
  teal: {
    headerBg: 'bg-gradient-to-r from-teal-700/90 via-teal-600/90 to-teal-800/90 text-white',
    border: 'border-dashed border-teal-300/90 dark:border-teal-700/80',
    iconBg: 'bg-white/20 text-white shadow-xs',
    addBtnHover: 'hover:bg-white/20 text-white',
    chipBgLL: 'bg-white/20 text-white border border-white/30',
    chipBgRTR: 'bg-white/30 text-white font-extrabold border border-white/40',
  },
  cyan: {
    headerBg: 'bg-gradient-to-r from-cyan-700/90 via-cyan-600/90 to-cyan-800/90 text-white',
    border: 'border-dashed border-cyan-300/90 dark:border-cyan-700/80',
    iconBg: 'bg-white/20 text-white shadow-xs',
    addBtnHover: 'hover:bg-white/20 text-white',
    chipBgLL: 'bg-white/20 text-white border border-white/30',
    chipBgRTR: 'bg-white/30 text-white font-extrabold border border-white/40',
  },
  indigo: {
    headerBg: 'bg-gradient-to-r from-indigo-700/90 via-indigo-600/90 to-indigo-800/90 text-white',
    border: 'border-dashed border-indigo-300/90 dark:border-indigo-700/80',
    iconBg: 'bg-white/20 text-white shadow-xs',
    addBtnHover: 'hover:bg-white/20 text-white',
    chipBgLL: 'bg-white/20 text-white border border-white/30',
    chipBgRTR: 'bg-white/30 text-white font-extrabold border border-white/40',
  },
  slate: {
    headerBg: 'bg-gradient-to-r from-slate-700/90 via-slate-600/90 to-slate-800/90 text-white',
    border: 'border-dashed border-slate-300/90 dark:border-slate-700/80',
    iconBg: 'bg-white/20 text-white shadow-xs',
    addBtnHover: 'hover:bg-white/20 text-white',
    chipBgLL: 'bg-white/20 text-white border border-white/30',
    chipBgRTR: 'bg-white/30 text-white font-extrabold border border-white/40',
  },
};

export const DepartmentColumn: React.FC<DepartmentColumnProps> = ({
  department,
  operators,
  allOperators = [],
  totalOperatorsCount,
  selectedOperatorId = null,
  bulkSelectedIds,
  onToggleBulkSelect,
  onSelectOperator,
  onDeselectOperator,
  onOpenQuickMove,
  onEditOperator,
  onChangeStatus,
  onChangeAbsenceReason,
  onAddOperatorToDept,
  onDropOperator,
  onDeleteDepartment,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [absenceFilter, setAbsenceFilter] = useState<'ALL' | AbsenceReason>('ALL');
  const dragCounter = useRef(0);

  const getDeptIcon = (id: DepartmentId) => {
    if (department.isCustom) {
      return <Wrench className="w-5 h-5 text-white" />;
    }
    switch (id) {
      case 'hovc':
        return <PackageCheck className="w-5 h-5 text-white" />;
      case 'hovs':
        return <Boxes className="w-5 h-5 text-white" />;
      case 'putaway':
        return <ArrowDownToLine className="w-5 h-5 text-white" />;
      case 'vas':
        return <Wrench className="w-5 h-5 text-white" />;
      case 'obwf':
        return <Layers className="w-5 h-5 text-white" />;
      case 'vna':
        return <GitCommitVertical className="w-5 h-5 text-white" />;
      case 'obwi':
        return <Globe className="w-5 h-5 text-white" />;
      default:
        return <UserX className="w-5 h-5 text-white" />;
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    if (dragCounter.current === 1) {
      setIsDragOver(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragOver(false);

    // Use robust multi-strategy operator resolver for single or multi-drag
    const resolvedIds = resolveOperatorIdsFromDrop(
      e,
      allOperators.length > 0 ? allOperators : operators
    );
    const operatorIds =
      resolvedIds.length > 0
        ? resolvedIds
        : getGlobalDragState().operatorIds.length > 0
        ? getGlobalDragState().operatorIds
        : getGlobalDragState().operatorId
        ? [getGlobalDragState().operatorId!]
        : [];

    if (operatorIds.length > 0) {
      onDropOperator(operatorIds, department.id);
    }
  };

  const isAbsence = department.id === 'unassigned';
  const dovoOps = operators.filter((o) => o.absenceReason === 'Dovolená');
  const pnOps = operators.filter((o) => o.absenceReason === 'PN');
  const absenceOps = operators.filter((o) => !o.absenceReason || o.absenceReason === 'Absence');

  const activeCount = isAbsence
    ? 0
    : operators.filter((o) => o.status === 'active').length;
  const llCount = isAbsence
    ? operators.filter((o) => o.machineType === 'LL').length
    : operators.filter((o) => o.machineType === 'LL' && o.status === 'active').length;
  const rtrCount = isAbsence
    ? operators.filter((o) => o.machineType === 'RTR').length
    : operators.filter((o) => o.machineType === 'RTR' && o.status === 'active').length;
  const percentage =
    totalOperatorsCount > 0
      ? Math.round((operators.length / totalOperatorsCount) * 100)
      : 0;

  const displayedOperators =
    isAbsence && absenceFilter !== 'ALL'
      ? operators.filter((o) => (o.absenceReason || 'Absence') === absenceFilter)
      : operators;

  const theme = department.isCustom
    ? CUSTOM_THEMES_BY_COLOR[department.color] || CUSTOM_THEMES_BY_COLOR.amber
    : DEPT_HEADER_THEMES[department.id] || DEPT_HEADER_THEMES.hovc;

  return (
    <div
      id={`dept-col-${department.id}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        // If clicked on column background/header outside any card or button, deselect active operator selection
        if (!target.closest('button') && !target.closest('input') && !target.closest('[id^="operator-card-"]')) {
          if (selectedOperatorId && onDeselectOperator) {
            onDeselectOperator();
          }
        }
      }}
      className={`flex flex-col rounded-2xl border transition-all duration-200 min-w-[280px] sm:min-w-[290px] max-w-[350px] 2xl:max-w-[380px] flex-1 shrink-0 bg-slate-50/90 dark:bg-slate-900/60 shadow-xs ${
        isDragOver
          ? 'ring-4 ring-blue-500/80 border-blue-500 bg-blue-50/60 dark:bg-blue-950/50 scale-[1.01] shadow-xl'
          : theme.border
      }`}
    >
      {/* Colorful Column Header */}
      <div className={`p-3.5 rounded-t-2xl shadow-xs ${theme.headerBg}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`p-2 rounded-xl backdrop-blur-xs shrink-0 ${theme.iconBg}`}>
              {getDeptIcon(department.id)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-black text-base sm:text-lg text-white tracking-tight truncate">
                  {department.name}
                </h3>
                {department.isCustom && (
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-white/20 text-white tracking-wider shrink-0">
                    Vícepráce
                  </span>
                )}
              </div>
              {department.description && (
                <p className="text-[11px] text-white/80 line-clamp-1 mt-0.5" title={department.description}>
                  {department.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {operators.length > 0 && onToggleBulkSelect && (
              <button
                type="button"
                onClick={() => {
                  const allInDeptSelected = operators.every((o) => bulkSelectedIds?.has(o.id));
                  operators.forEach((o) => {
                    if (allInDeptSelected) {
                      if (bulkSelectedIds?.has(o.id)) onToggleBulkSelect(o.id);
                    } else {
                      if (!bulkSelectedIds?.has(o.id)) onToggleBulkSelect(o.id);
                    }
                  });
                }}
                className={`p-1.5 rounded-lg text-white/80 hover:text-white transition-all ${theme.addBtnHover}`}
                title={
                  operators.every((o) => bulkSelectedIds?.has(o.id))
                    ? 'Zrušit označení operátorů v oddělení'
                    : 'Označit všechny operátory v tomto oddělení'
                }
              >
                <CheckSquare className="w-4 h-4" />
              </button>
            )}

            {/* Simple clean + button */}
            <button
              id={`add-op-btn-${department.id}`}
              onClick={() => onAddOperatorToDept(department.id)}
              className={`p-1.5 rounded-lg text-white transition-all hover:scale-110 active:scale-95 ${theme.addBtnHover}`}
              title={`Přidat člověka do ${department.name}`}
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Delete / Close custom department button */}
            {department.isCustom && onDeleteDepartment && (
              <button
                type="button"
                id={`delete-dept-btn-${department.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteDepartment(department.id);
                }}
                className="p-1.5 rounded-lg text-white/80 hover:text-white bg-rose-500/40 hover:bg-rose-600/90 border border-rose-400/40 transition-all cursor-pointer shadow-2xs"
                title="Smazat / zrušit toto oddělení víceprací"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Live Counters & Machine breakdown row */}
        <div className="mt-3 flex items-center justify-between text-xs pt-2.5 border-t border-white/20">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-white font-black">
              <Users className="w-3.5 h-3.5 opacity-80" />
              <span>{operators.length} lidí</span>
            </div>
            {/* Menší text pod tím: v provozu nebo rozdělení absence */}
            {isAbsence ? (
              <span className="text-[10.5px] font-medium text-slate-200/95 flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span>Dovolená: <strong className="text-amber-300 font-bold">{dovoOps.length}</strong></span>
                <span>•</span>
                <span>PN: <strong className="text-rose-300 font-bold">{pnOps.length}</strong></span>
                <span>•</span>
                <span>Absence: <strong className="text-white font-bold">{absenceOps.length}</strong></span>
              </span>
            ) : (
              <span className="text-[10px] font-bold text-emerald-200 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                <span>{activeCount} v provozu</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-bold self-start mt-0.5">
            {llCount > 0 && (
              <span className={`px-2 py-0.5 rounded-md ${theme.chipBgLL}`}>
                {llCount}× LL
              </span>
            )}
            {rtrCount > 0 && (
              <span className={`px-2 py-0.5 rounded-md ${theme.chipBgRTR}`}>
                {rtrCount}× RTR
              </span>
            )}
            {llCount === 0 && rtrCount === 0 && (
              <span className="text-[10px] text-white/60 font-normal">
                {operators.length > 0 ? `${operators.length} op` : '—'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Subcategory Filter Tabs for Nepřítomen */}
      {isAbsence && (
        <div className="px-2 pt-2 pb-1 border-b border-slate-200/80 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/40">
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 text-[10.5px] font-bold">
            <button
              type="button"
              id="absence-filter-all"
              onClick={() => setAbsenceFilter('ALL')}
              className={`flex-1 py-1 rounded-lg transition-all text-center cursor-pointer select-none ${
                absenceFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Vše ({operators.length})
            </button>
            <button
              type="button"
              id="absence-filter-dovolena"
              onClick={() => setAbsenceFilter('Dovolená')}
              className={`flex-1 py-1 rounded-lg transition-all text-center cursor-pointer select-none ${
                absenceFilter === 'Dovolená'
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 shadow-2xs font-black border border-amber-300 dark:border-amber-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Dovolená ({dovoOps.length})
            </button>
            <button
              type="button"
              id="absence-filter-pn"
              onClick={() => setAbsenceFilter('PN')}
              className={`flex-1 py-1 rounded-lg transition-all text-center cursor-pointer select-none ${
                absenceFilter === 'PN'
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 shadow-2xs font-black border border-rose-300 dark:border-rose-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              PN ({pnOps.length})
            </button>
            <button
              type="button"
              id="absence-filter-absence"
              onClick={() => setAbsenceFilter('Absence')}
              className={`flex-1 py-1 rounded-lg transition-all text-center cursor-pointer select-none ${
                absenceFilter === 'Absence'
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Absence ({absenceOps.length})
            </button>
          </div>
        </div>
      )}

      {/* Operator cards list */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="p-2 space-y-1.5 overflow-y-auto max-h-[calc(100vh-240px)] min-h-[140px] flex-1"
      >
        {displayedOperators.length === 0 ? (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white/40 dark:bg-slate-900/30"
          >
            <Users className="w-7 h-7 mb-2 opacity-40" />
            <p className="text-xs font-medium">
              {isAbsence && absenceFilter !== 'ALL'
                ? `Žádný operátor v kategorii "${absenceFilter}"`
                : 'Žádný operátor'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Přetáhněte sem člověka nebo klikněte na "Přesunout".
            </p>
            <button
              id={`empty-add-btn-${department.id}`}
              onClick={() => onAddOperatorToDept(department.id)}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Přidat člověka sem</span>
            </button>
          </div>
        ) : (
          displayedOperators.map((operator) => (
            <OperatorCard
              key={operator.id}
              operator={operator}
              allOperators={allOperators.length > 0 ? allOperators : operators}
              isSelected={selectedOperatorId === operator.id}
              isBulkSelected={bulkSelectedIds?.has(operator.id) ?? false}
              isAnyBulkActive={(bulkSelectedIds?.size ?? 0) > 0}
              bulkSelectedIds={bulkSelectedIds ? Array.from(bulkSelectedIds) : []}
              onToggleBulkSelect={onToggleBulkSelect}
              onSelect={onSelectOperator}
              onOpenQuickMove={onOpenQuickMove}
              onEditOperator={onEditOperator}
              onChangeStatus={onChangeStatus}
              onChangeAbsenceReason={onChangeAbsenceReason}
              onDropOperator={onDropOperator}
            />
          ))
        )}
      </div>

      {/* Column Footer */}
      <div className="p-2.5 px-3 border-t border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between bg-slate-100/50 dark:bg-slate-900/40 rounded-b-2xl">
        <span>{percentage}% ze všech operátorů</span>
        <span className="font-semibold text-slate-600 dark:text-slate-300">
          {activeCount} aktivních
        </span>
      </div>
    </div>
  );
};
