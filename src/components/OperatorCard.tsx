import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowRightLeft,
  Clock,
  MoreVertical,
  FileText,
  UserCheck,
  Coffee,
  UserX,
  Edit2,
  GripVertical,
} from 'lucide-react';
import { Operator, OperatorStatus, DepartmentId } from '../types';
import { startGlobalDrag, endGlobalDrag, resolveOperatorFromDrop, getGlobalDragState } from '../utils/dragState';

interface OperatorCardProps {
  operator: Operator;
  allOperators?: Operator[];
  isSelected?: boolean;
  onSelect?: (operator: Operator) => void;
  onOpenQuickMove: (operator: Operator) => void;
  onEditOperator: (operator: Operator) => void;
  onChangeStatus: (operatorId: string, newStatus: OperatorStatus) => void;
  onDropOperator?: (operatorId: string, targetDeptId: DepartmentId) => void;
}

export const OperatorCard: React.FC<OperatorCardProps> = ({
  operator,
  allOperators = [],
  isSelected = false,
  onSelect,
  onOpenQuickMove,
  onEditOperator,
  onChangeStatus,
  onDropOperator,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const getStatusDot = (status: OperatorStatus) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500 ring-2 ring-emerald-500/20';
      case 'break':
        return 'bg-amber-500 ring-2 ring-amber-500/20';
      case 'absence':
        return 'bg-rose-500 ring-2 ring-rose-500/20';
      default:
        return 'bg-slate-400';
    }
  };

  const getStatusLabel = (status: OperatorStatus) => {
    switch (status) {
      case 'active':
        return 'Aktivní v provozu';
      case 'break':
        return 'Pauza';
      case 'absence':
        return 'Absence / Doma';
      default:
        return status;
    }
  };

  // Cycle status on dot click
  const cycleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (operator.status === 'active') onChangeStatus(operator.id, 'break');
    else if (operator.status === 'break') onChangeStatus(operator.id, 'absence');
    else onChangeStatus(operator.id, 'active');
  };

  // Time since last assignment formatted
  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diffMs / (1000 * 60));
      if (mins < 60) return `${mins} min`;
      const hours = Math.floor(mins / 60);
      return `${hours} hod`;
    } catch {
      return '';
    }
  };

  return (
    <div
      id={`operator-card-${operator.id}`}
      draggable={true}
      onClick={(e) => {
        // Only select if not clicking an interactive element
        const target = e.target as HTMLElement;
        if (!target.closest('button') && onSelect) {
          onSelect(operator);
        }
      }}
      onDragStart={(e) => {
        setIsDragging(true);
        startGlobalDrag(operator);
        try {
          e.dataTransfer.setData('application/x-operator-id', operator.id);
          e.dataTransfer.setData('text/plain', operator.id);
          e.dataTransfer.effectAllowed = 'move';
        } catch {
          // In some restricted browser modes setData may be prevented
        }
      }}
      onDragEnd={() => {
        setIsDragging(false);
        endGlobalDrag();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onDropOperator) {
          const resolved = resolveOperatorFromDrop(e, allOperators);
          const droppedId =
            resolved?.id ||
            e.dataTransfer.getData('application/x-operator-id') ||
            e.dataTransfer.getData('text/plain') ||
            getGlobalDragState().operatorId;

          if (droppedId) {
            onDropOperator(droppedId, operator.departmentId);
          }
        }
      }}
      className={`group relative rounded-xl border p-3 shadow-2xs transition-all cursor-grab active:cursor-grabbing select-none ${
        isDragging
          ? 'opacity-35 ring-2 ring-blue-500 border-dashed border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-none'
          : isSelected
          ? 'ring-3 ring-blue-600 dark:ring-blue-400 border-blue-500 bg-blue-50/60 dark:bg-blue-950/60 shadow-md'
          : operator.status === 'absence'
          ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/60 opacity-80 hover:opacity-100 hover:border-rose-300'
          : 'bg-white dark:bg-slate-800/95 border-slate-200/80 dark:border-slate-700/80 hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500'
      }`}
    >
      {/* Top row: Name & Function (LL / RTR) */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {/* Grip handle visual indicator */}
            <GripVertical className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 shrink-0 transition-colors pointer-events-none" />

            {/* Interactive Status Dot with tooltip */}
            <button
              type="button"
              draggable={false}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={cycleStatus}
              className={`w-2.5 h-2.5 rounded-full shrink-0 transition-transform hover:scale-125 cursor-pointer ${getStatusDot(
                operator.status
              )}`}
              title={`Kliknutím přepnete stav (${getStatusLabel(operator.status)})`}
            />
            <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate pointer-events-none">
              {operator.name}
            </h4>
          </div>

          {/* Machine qualification tag: ONLY LL or RTR */}
          <div className="flex items-center gap-1.5 mt-1.5 pl-5">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-black tracking-wider pointer-events-none ${
                operator.machineType === 'RTR'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 border border-blue-200 dark:border-blue-700'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-200 dark:border-amber-700'
              }`}
              title={operator.machineType === 'RTR' ? 'Retrak (vysokozdvižný vozík)' : 'LL (nízkozdvižný vozík)'}
            >
              {operator.machineType}
            </span>

            {operator.status !== 'active' && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded pointer-events-none ${
                  operator.status === 'break'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'
                }`}
              >
                {operator.status === 'break' ? 'Pauza' : 'Absence / Doma'}
              </span>
            )}
          </div>
        </div>

        {/* Action / Menu dropdown */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            draggable={false}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Možnosti a stav operátora"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-6 z-30 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 text-xs animate-in fade-in zoom-in-95">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100 dark:border-slate-700">
                Stav operátora
              </div>
              <button
                onClick={() => {
                  onChangeStatus(operator.id, 'active');
                  setMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-750 font-medium ${
                  operator.status === 'active' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>🟢 V provozu (aktivní)</span>
              </button>

              <button
                onClick={() => {
                  onChangeStatus(operator.id, 'break');
                  setMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-750 font-medium ${
                  operator.status === 'break' ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                <Coffee className="w-3.5 h-3.5 text-amber-500" />
                <span>🟡 Na pauze</span>
              </button>

              <button
                onClick={() => {
                  onChangeStatus(operator.id, 'absence');
                  setMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-750 font-medium ${
                  operator.status === 'absence' ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                <UserX className="w-3.5 h-3.5 text-rose-500" />
                <span>🔴 Odešel domů / Absence</span>
              </button>

              <div className="border-t border-slate-100 dark:border-slate-700 my-1" />

              <button
                onClick={() => {
                  onEditOperator(operator);
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 font-medium"
              >
                <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                <span>Upravit údaje</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Note preview if any */}
      {operator.notes && (
        <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded border border-slate-150 dark:border-slate-800 line-clamp-1 flex items-center gap-1.5 pointer-events-none">
          <FileText className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate">{operator.notes}</span>
        </div>
      )}

      {/* Bottom row: Time + Action button */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-[10px] text-slate-400 pointer-events-none">
          <Clock className="w-3 h-3" />
          <span>{formatTimeAgo(operator.lastMovedAt)}</span>
        </div>

        <button
          id={`move-btn-${operator.id}`}
          draggable={false}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onOpenQuickMove(operator);
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 hover:text-white text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:border-blue-600 transition-all shadow-2xs active:scale-95 cursor-pointer"
          title="Přesunout tohoto operátora na jiné oddělení"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Přesunout</span>
        </button>
      </div>
    </div>
  );
};
