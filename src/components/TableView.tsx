import React from 'react';
import { ArrowRightLeft, Edit3, Trash2 } from 'lucide-react';
import { DEPARTMENTS } from '../data/departments';
import { DepartmentId, Operator, OperatorStatus } from '../types';

interface TableViewProps {
  operators: Operator[];
  onOpenQuickMove: (operator: Operator) => void;
  onEditOperator: (operator: Operator) => void;
  onChangeDepartment: (operatorId: string, deptId: DepartmentId) => void;
  onChangeStatus?: (operatorId: string, status: OperatorStatus) => void;
  onDeleteOperator?: (operatorId: string) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  operators,
  onOpenQuickMove,
  onEditOperator,
  onChangeDepartment,
  onChangeStatus,
  onDeleteOperator,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4">Operátor</th>
              <th className="py-3 px-4">Stroj / Oprávnění</th>
              <th className="py-3 px-4">Oddělení (PICK)</th>
              <th className="py-3 px-4">Stav</th>
              <th className="py-3 px-4">Poznámka</th>
              <th className="py-3 px-4 text-right">Akce</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {operators.map((op) => {
              return (
                <tr
                  key={op.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    <span>{op.name}</span>
                  </td>

                  {/* LL or RTR */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-black tracking-wider ${
                        op.machineType === 'RTR'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                      }`}
                    >
                      {op.machineType}
                    </span>
                  </td>

                  {/* Department selector */}
                  <td className="py-3 px-4">
                    <select
                      value={op.departmentId}
                      onChange={(e) => onChangeDepartment(op.id, e.target.value as DepartmentId)}
                      className="text-xs font-semibold px-2 py-1 rounded-lg border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 focus:ring-2 focus:outline-hidden"
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    {onChangeStatus ? (
                      <select
                        value={op.status}
                        onChange={(e) => onChangeStatus(op.id, e.target.value as OperatorStatus)}
                        className={`text-xs font-semibold px-2 py-1 rounded-lg border focus:ring-2 focus:outline-hidden ${
                          op.status === 'active'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            : op.status === 'break'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                        }`}
                      >
                        <option value="active">🟢 Aktivní</option>
                        <option value="break">🟡 Pauza</option>
                        <option value="absence">🔴 Absence</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          op.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : op.status === 'break'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            op.status === 'active'
                              ? 'bg-emerald-500'
                              : op.status === 'break'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        {op.status === 'active'
                          ? 'Aktivní'
                          : op.status === 'break'
                          ? 'Pauza'
                          : 'Absence'}
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
                        onClick={() => {
                          if (confirm(`Opravdu chcete odebrat operátora ${op.name}?`)) {
                            onDeleteOperator(op.id);
                          }
                        }}
                        className="p-1 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
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
