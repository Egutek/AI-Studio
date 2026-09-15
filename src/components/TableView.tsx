import React from 'react';
import { ArrowRightLeft, Edit3, Trash2 } from 'lucide-react';
import { DEPARTMENTS } from '../data/departments';
import { Department, DepartmentId, Operator, OperatorStatus } from '../types';

interface TableViewProps {
  operators: Operator[];
  customDepartments?: Department[];
  bulkSelectedIds?: Set<string>;
  onToggleBulkSelect?: (operatorId: string) => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onOpenQuickMove: (operator: Operator) => void;
  onEditOperator: (operator: Operator) => void;
  onChangeDepartment: (operatorId: string, deptId: DepartmentId) => void;
  onChangeStatus?: (operatorId: string, status: OperatorStatus) => void;
  onDeleteOperator?: (operatorId: string) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  operators,
  customDepartments = [],
  bulkSelectedIds,
  onToggleBulkSelect,
  onSelectAll,
  onClearSelection,
  onOpenQuickMove,
  onEditOperator,
  onChangeDepartment,
  onDeleteOperator,
}) => {
  const isAllSelected = operators.length > 0 && operators.every((o) => bulkSelectedIds?.has(o.id));
  const isSomeSelected = operators.some((o) => bulkSelectedIds?.has(o.id));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
              <th className="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = !isAllSelected && isSomeSelected;
                  }}
                  onChange={() => {
                    if (isAllSelected) {
                      onClearSelection?.();
                    } else {
                      onSelectAll?.();
                    }
                  }}
                  className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-blue-600 cursor-pointer"
                  title="Označit vše pro hromadný výběr"
                />
              </th>
              <th className="py-3 px-4">Operátor</th>
              <th className="py-3 px-3 text-center">Směna</th>
              <th className="py-3 px-4">Stroj / Oprávnění</th>
              <th className="py-3 px-4">Oddělení (PICK)</th>
              <th className="py-3 px-4">Stav / Důvod</th>
              <th className="py-3 px-4">Poznámka</th>
              <th className="py-3 px-4 text-right">Akce</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {operators.map((op) => {
              const isSelected = bulkSelectedIds?.has(op.id) ?? false;
              return (
                <tr
                  key={op.id}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (
                      !target.closest('button') &&
                      !target.closest('select') &&
                      !target.closest('input')
                    ) {
                      onToggleBulkSelect?.(op.id);
                    }
                  }}
                  className={`transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/70 dark:bg-blue-950/40'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-3 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleBulkSelect?.(op.id)}
                      className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-blue-600 cursor-pointer"
                    />
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    <span>{op.name}</span>
                  </td>

                  {/* Směna A, B, C */}
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-black bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      Směna {op.shift || 'A'}
                    </span>
                  </td>

                  {/* LL or RTR */}
                  <td className="py-3 px-4">
                    {op.machineType && op.machineType !== 'NONE' ? (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-black tracking-wider ${
                          op.machineType === 'RTR'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                        }`}
                      >
                        {op.machineType}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>

                  {/* Department selector */}
                  <td className="py-3 px-4">
                    <select
                      value={op.departmentId}
                      onChange={(e) => onChangeDepartment(op.id, e.target.value as DepartmentId)}
                      className="text-xs font-semibold px-2 py-1 rounded-lg border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 focus:ring-2 focus:outline-hidden"
                    >
                      <optgroup label="Hlavní oddělení">
                        {DEPARTMENTS.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </optgroup>
                      {customDepartments.length > 0 && (
                        <optgroup label="Vícepráce">
                          {customDepartments.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name} ({d.code})
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </td>

                  {/* Status & Absence subcategory */}
                  <td className="py-3 px-4">
                    {op.departmentId === 'unassigned' || op.status === 'absence' ? (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          op.absenceReason === 'Dovolená'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                            : op.absenceReason === 'PN'
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            op.absenceReason === 'Dovolená'
                              ? 'bg-amber-500'
                              : op.absenceReason === 'PN'
                              ? 'bg-rose-500'
                              : 'bg-slate-400'
                          }`}
                        />
                        <span>{op.absenceReason || 'Absence'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>V provozu</span>
                      </span>
                    )}
                  </td>

                  {/* Note */}
                  <td className="py-3 px-4 text-slate-500 text-xs truncate max-w-[160px]">
                    {op.notes || '—'}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                    <button
                      onClick={() => onOpenQuickMove(op)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 hover:text-white text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors"
                      title="Rychlý přesun na jiné oddělení"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Přesun</span>
                    </button>
                    <button
                      onClick={() => onEditOperator(op)}
                      className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Upravit operátora"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {onDeleteOperator && (
                      <button
                        onClick={() => onDeleteOperator(op.id)}
                        className="p-1 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Smazat operátora"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
