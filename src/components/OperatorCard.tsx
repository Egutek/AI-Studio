import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Clock,
  Edit2,
  GripVertical,
  Users,
} from 'lucide-react';
import { Operator, OperatorStatus, DepartmentId, AbsenceReason } from '../types';
import {
  startGlobalDrag,
  endGlobalDrag,
  resolveOperatorIdsFromDrop,
  getGlobalDragState,
} from '../utils/dragState';

interface OperatorCardProps {
  operator: Operator;
  allOperators?: Operator[];
  isSelected?: boolean;
  isBulkSelected?: boolean;
  isAnyBulkActive?: boolean;
  bulkSelectedIds?: string[];
  onSelect?: (operator: Operator) => void;
  onOpenQuickMove: (operator: Operator) => void;
  onEditOperator: (operator: Operator) => void;
  onToggleBulkSelect?: (operatorId: string) => void;
  onChangeStatus?: (operatorId: string, newStatus: OperatorStatus) => void;
  onChangeAbsenceReason?: (operatorId: string, reason: AbsenceReason) => void;
  onDropOperator?: (operatorIds: string[], targetDeptId: DepartmentId) => void;
}

export const OperatorCard: React.FC<OperatorCardProps> = ({
  operator,
  allOperators = [],
  isSelected = false,
  isBulkSelected = false,
  isAnyBulkActive = false,
  bulkSelectedIds = [],
  onSelect,
  onOpenQuickMove,
  onEditOperator,
  onToggleBulkSelect,
  onChangeAbsenceReason,
  onDropOperator,
}) => {
  const [isDragging, setIsDragging] = useState(false);

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

  const isAbsence = operator.departmentId === 'unassigned' || operator.status === 'absence';
  const isMultiDragCandidate = isBulkSelected && bulkSelectedIds.length > 1;

  return (
    <div
      id={`operator-card-${operator.id}`}
      draggable={true}
      onClick={(e) => {
        // Only select if not clicking an interactive button
        const target = e.target as HTMLElement;
        if (target.closest('button')) return;

        // If bulk mode is active, clicking anywhere on the card toggles bulk selection!
        if (isAnyBulkActive || isBulkSelected) {
          onToggleBulkSelect?.(operator.id);
        } else if (onSelect) {
          onSelect(operator);
        }
      }}
      onDragStart={(e) => {
        setIsDragging(true);
        const dragIds = isMultiDragCandidate ? bulkSelectedIds : [operator.id];
        startGlobalDrag(operator, dragIds);
        try {
          e.dataTransfer.setData('application/x-operator-id', operator.id);
          if (isMultiDragCandidate) {
            e.dataTransfer.setData('application/x-bulk-operator-ids', JSON.stringify(dragIds));
          }
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
          const resolvedIds = resolveOperatorIdsFromDrop(e, allOperators);
          const droppedIds =
            resolvedIds.length > 0
              ? resolvedIds
              : getGlobalDragState().operatorIds.length > 0
              ? getGlobalDragState().operatorIds
              : getGlobalDragState().operatorId
              ? [getGlobalDragState().operatorId!]
              : [];

          if (droppedIds.length > 0) {
            onDropOperator(droppedIds, operator.departmentId);
          }
        }
      }}
      className={`group relative rounded-xl border px-2 py-1.5 shadow-2xs transition-all cursor-grab active:cursor-grabbing select-none ${
        isDragging
          ? 'opacity-35 ring-2 ring-blue-500 border-dashed border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-none'
          : isBulkSelected
          ? 'ring-2 ring-blue-500 border-blue-400 bg-blue-50/70 dark:bg-blue-950/50 shadow-xs'
          : isSelected
          ? 'ring-2 ring-blue-600 dark:ring-blue-400 border-blue-500 bg-blue-50/70 dark:bg-blue-950/60 shadow-md'
          : isAbsence
          ? 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-300 dark:border-slate-800 opacity-80 hover:opacity-100'
          : 'bg-white dark:bg-slate-800/95 border-slate-200/80 dark:border-slate-700/80 hover:shadow-sm hover:border-blue-400 dark:hover:border-blue-500'
      }`}
    >
      {/* Visual pill when multi-selected */}
      {isMultiDragCandidate && (
        <div className="absolute -top-2 -right-1 z-10 bg-blue-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full shadow-xs flex items-center gap-0.5 pointer-events-none">
          <Users className="w-2.5 h-2.5" />
          <span>{bulkSelectedIds.length}</span>
        </div>
      )}

      {/* Top Line: Checkbox, Grip, Status, Name, Machine Badge & Direct Edit */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {/* Subtle checkbox for bulk selection */}
          <input
            type="checkbox"
            checked={isBulkSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleBulkSelect?.(operator.id);
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-3.5 h-3.5 rounded-xs border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-0 focus:outline-hidden cursor-pointer shrink-0 opacity-50 hover:opacity-100 checked:opacity-100 transition-opacity"
            title="Označit pro hromadný výběr"
          />

          {/* Grip handle visual indicator */}
          <GripVertical className="w-2.5 h-2.5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 shrink-0 transition-colors pointer-events-none" />

          {/* Department status indicator */}
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              isAbsence ? 'bg-slate-400 dark:bg-slate-500' : 'bg-emerald-500'
            }`}
          />

          <h4
            className={`font-bold text-xs sm:text-[13px] truncate pointer-events-none ${
              isAbsence
                ? 'text-slate-600 dark:text-slate-400 line-through decoration-slate-300 dark:decoration-slate-600'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            {operator.name}
          </h4>

          {/* Machine qualification tag: ONLY IF LL or RTR (ignored if NONE) */}
          {operator.machineType && operator.machineType !== 'NONE' && (
            <span
              className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-black tracking-wider pointer-events-none shrink-0 ${
                operator.machineType === 'RTR'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 border border-blue-200 dark:border-blue-700'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-200 dark:border-amber-700'
              }`}
              title={operator.machineType === 'RTR' ? 'Retrak (vysokozdvih)' : 'LL (nízkozdvih)'}
            >
              {operator.machineType}
            </span>
          )}

          {/* Absence Reason badge (Dovolená / PN / Absence) */}
          {isAbsence && (
            <button
              type="button"
              draggable={false}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                if (onChangeAbsenceReason) {
                  const current = operator.absenceReason || 'Absence';
                  const next: AbsenceReason =
                    current === 'Dovolená'
                      ? 'PN'
                      : current === 'PN'
                      ? 'Absence'
                      : 'Dovolená';
                  onChangeAbsenceReason(operator.id, next);
                }
              }}
              className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold tracking-tight transition-colors cursor-pointer shrink-0 border ${
                operator.absenceReason === 'Dovolená'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/60 hover:bg-amber-100'
                  : operator.absenceReason === 'PN'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700/60 hover:bg-rose-100'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
              }`}
              title={`Důvod: ${operator.absenceReason || 'Absence'}. Kliknutím přepnout na další.`}
            >
              <span>{operator.absenceReason || 'Absence'}</span>
            </button>
          )}
        </div>

        {/* Direct Edit Button (Pencil) */}
        <button
          draggable={false}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onEditOperator(operator);
          }}
          className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
          title="Upravit údaje operátora"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Compact Row: Time, Notes & Move Button */}
      <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between gap-1 text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5 truncate flex-1 min-w-0 pointer-events-none">
          <span className="flex items-center gap-0.5 shrink-0">
            <Clock className="w-2.5 h-2.5 text-slate-400" />
            <span>{formatTimeAgo(operator.lastMovedAt)}</span>
          </span>

          {operator.notes && (
            <span className="truncate text-slate-500 dark:text-slate-400 italic">
              • {operator.notes}
            </span>
          )}
        </div>

        {/* Classic Transfer to Department (including Absence) */}
        <button
          id={`move-btn-${operator.id}`}
          draggable={false}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onOpenQuickMove(operator);
          }}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-600 transition-colors shadow-2xs active:scale-95 cursor-pointer shrink-0"
          title="Převést operátora do jiného oddělení nebo do Absence"
        >
          <ArrowRightLeft className="w-2.5 h-2.5" />
          <span>Přesun</span>
        </button>
      </div>
    </div>
  );
};
