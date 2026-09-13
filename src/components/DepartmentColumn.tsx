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
} from 'lucide-react';
import { Department, DepartmentId, Operator, OperatorStatus } from '../types';
import { OperatorCard } from './OperatorCard';
import { resolveOperatorFromDrop, getGlobalDragState } from '../utils/dragState';

interface DepartmentColumnProps {
  department: Department;
  operators: Operator[];
  allOperators?: Operator[];
  totalOperatorsCount: number;
  selectedOperatorId?: string | null;
  onSelectOperator?: (operator: Operator) => void;
  onColumnClickToMove?: (deptId: DepartmentId) => void;
  onOpenQuickMove: (operator: Operator) => void;
  onEditOperator: (operator: Operator) => void;
  onChangeStatus: (operatorId: string, newStatus: OperatorStatus) => void;
  onAddOperatorToDept: (deptId: DepartmentId) => void;
  onDropOperator: (operatorId: string, targetDeptId: DepartmentId) => void;
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

export const DepartmentColumn: React.FC<DepartmentColumnProps> = ({
  department,
  operators,
  allOperators = [],
  totalOperatorsCount,
  selectedOperatorId = null,
  onSelectOperator,
  onColumnClickToMove,
  onOpenQuickMove,
  onEditOperator,
  onChangeStatus,
  onAddOperatorToDept,
  onDropOperator,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);

  const getDeptIcon = (id: DepartmentId) => {
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

    // Use robust multi-strategy operator resolver
    const resolved = resolveOperatorFromDrop(e, allOperators.length > 0 ? allOperators : operators);
    const operatorId =
      resolved?.id ||
      e.dataTransfer.getData('application/x-operator-id') ||
      e.dataTransfer.getData('text/plain') ||
      getGlobalDragState().operatorId;

    if (operatorId) {
      onDropOperator(operatorId, department.id);
    }
  };

  const isAbsence = department.id === 'unassigned';
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

  const theme = DEPT_HEADER_THEMES[department.id] || DEPT_HEADER_THEMES.hovc;

  const hasSelectionToMove = Boolean(selectedOperatorId);

  return (
    <div
      id={`dept-col-${department.id}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (!target.closest('button') && selectedOperatorId && onColumnClickToMove) {
          onColumnClickToMove(department.id);
        }
      }}
      className={`flex flex-col rounded-2xl border transition-all duration-200 min-w-[280px] sm:min-w-[290px] max-w-[340px] flex-1 bg-slate-50/90 dark:bg-slate-900/60 shadow-xs ${
        isDragOver
          ? 'ring-4 ring-blue-500/80 border-blue-500 bg-blue-50/60 dark:bg-blue-950/50 scale-[1.01] shadow-xl'
          : hasSelectionToMove
          ? 'border-blue-400 dark:border-blue-600 ring-2 ring-blue-400/30 cursor-pointer hover:ring-blue-500 hover:border-blue-500'
          : theme.border
      }`}
    >
      {/* Colorful Column Header */}
      <div className={`p-3.5 rounded-t-2xl shadow-xs ${theme.headerBg}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl backdrop-blur-xs ${theme.iconBg}`}>
              {getDeptIcon(department.id)}
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-white tracking-tight">
                {department.name}
              </h3>
            </div>
          </div>

          {/* Simple clean + button */}
          <button
            id={`add-op-btn-${department.id}`}
            onClick={() => onAddOperatorToDept(department.id)}
            className={`p-1.5 rounded-lg text-white transition-all hover:scale-110 active:scale-95 ${theme.addBtnHover}`}
            title={`Přidat člověka do ${department.name}`}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Live Counters & Machine breakdown row */}
        <div className="mt-3 flex items-center justify-between text-xs pt-2.5 border-t border-white/20">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-white font-black">
              <Users className="w-3.5 h-3.5 opacity-80" />
              <span>{operators.length} lidí</span>
            </div>
            {/* Menší číslo pod tím: v provozu nebo mimo směnu */}
            {isAbsence ? (
              <span className="text-[10px] font-bold text-rose-200/90 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>{operators.length} mimo halu / absence</span>
              </span>
            ) : (
              <span className="text-[10px] font-bold text-emerald-200 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                <span>{activeCount} v provozu</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-bold self-start mt-0.5">
            <span className={`px-2 py-0.5 rounded-md ${theme.chipBgLL}`}>
              {llCount}× LL
            </span>
            <span className={`px-2 py-0.5 rounded-md ${theme.chipBgRTR}`}>
              {rtrCount}× RTR
            </span>
          </div>
        </div>
      </div>

      {/* Operator cards list */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="p-3 space-y-2.5 overflow-y-auto max-h-[calc(100vh-320px)] min-h-[140px] flex-1"
      >
        {operators.length === 0 ? (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white/40 dark:bg-slate-900/30"
          >
            <Users className="w-7 h-7 mb-2 opacity-40" />
            <p className="text-xs font-medium">Žádný operátor</p>
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
          operators.map((operator) => (
            <OperatorCard
              key={operator.id}
              operator={operator}
              allOperators={allOperators.length > 0 ? allOperators : operators}
              isSelected={selectedOperatorId === operator.id}
              onSelect={onSelectOperator}
              onOpenQuickMove={onOpenQuickMove}
              onEditOperator={onEditOperator}
              onChangeStatus={onChangeStatus}
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
