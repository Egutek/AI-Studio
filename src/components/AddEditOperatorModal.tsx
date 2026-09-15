import React, { useState, useEffect } from 'react';
import { X, UserPlus, UserCheck, Trash2 } from 'lucide-react';
import { DEPARTMENTS } from '../data/departments';
import { Department, DepartmentId, MachineType, Operator, OperatorStatus, ShiftCode, AbsenceReason } from '../types';

interface AddEditOperatorModalProps {
  operator: Operator | null;
  defaultDeptId?: DepartmentId;
  customDepartments?: Department[];
  activeShift?: ShiftCode;
  isOpen: boolean;
  onClose: () => void;
  onSave: (operatorData: Partial<Operator>) => void;
  onDelete?: (operatorId: string) => void;
}

export const AddEditOperatorModal: React.FC<AddEditOperatorModalProps> = ({
  operator,
  defaultDeptId = 'hovc',
  customDepartments = [],
  activeShift = 'A',
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [machineType, setMachineType] = useState<MachineType>('NONE');
  const [departmentId, setDepartmentId] = useState<DepartmentId>(defaultDeptId);
  const [shift, setShift] = useState<ShiftCode>(activeShift);
  const [status, setStatus] = useState<OperatorStatus>('active');
  const [absenceReason, setAbsenceReason] = useState<AbsenceReason>('Absence');
  const [notes, setNotes] = useState('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    setIsConfirmingDelete(false);
    if (operator) {
      setName(operator.name);
      setMachineType(operator.machineType || 'NONE');
      setDepartmentId(operator.departmentId);
      setShift(operator.shift || activeShift);
      setStatus(operator.status);
      setAbsenceReason(operator.absenceReason || 'Absence');
      setNotes(operator.notes || '');
    } else {
      setName('');
      setMachineType('NONE');
      setDepartmentId(defaultDeptId);
      setShift(activeShift);
      setStatus(defaultDeptId === 'unassigned' ? 'absence' : 'active');
      setAbsenceReason('Absence');
      setNotes('');
    }
  }, [operator, defaultDeptId, activeShift, isOpen]);

  if (!isOpen) return null;

  const handleDepartmentChange = (newDeptId: DepartmentId) => {
    setDepartmentId(newDeptId);
    if (newDeptId === 'unassigned') {
      setStatus('absence');
    } else if (status === 'absence') {
      setStatus('active');
    }
  };

  const handleStatusChange = (newStatus: OperatorStatus) => {
    setStatus(newStatus);
    if (newStatus === 'absence' && departmentId !== 'unassigned') {
      setDepartmentId('unassigned');
    } else if (newStatus !== 'absence' && departmentId === 'unassigned') {
      setDepartmentId(defaultDeptId === 'unassigned' ? 'hovc' : defaultDeptId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: operator ? operator.id : `op-${Date.now()}`,
      name: name.trim(),
      shift,
      machineType,
      departmentId,
      isVnaOnly: false,
      status,
      absenceReason: (status === 'absence' || departmentId === 'unassigned') ? absenceReason : undefined,
      notes: notes.trim(),
      lastMovedAt: operator ? operator.lastMovedAt : new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div
      id="add-edit-operator-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="add-edit-operator-dialog"
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              {operator ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {operator ? 'Upravit operátora' : 'Přidat operátora do PICK'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {operator ? operator.name : 'Rychlé zadání do systému'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Name only */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Jméno a příjmení *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="např. Jan Novák"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Machine qualification: LL, RTR or NONE */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Stroj / Oprávnění
              </label>
              <span className="text-[11px] text-slate-400">
                Volitelné (lze ignorovat)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMachineType(machineType === 'LL' ? 'NONE' : 'LL')}
                className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                  machineType === 'LL'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-extrabold ring-2 ring-amber-500/30'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className="text-sm font-black">LL</div>
                <div className="text-[10px] opacity-75">Nízkozdvih</div>
              </button>

              <button
                type="button"
                onClick={() => setMachineType(machineType === 'RTR' ? 'NONE' : 'RTR')}
                className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                  machineType === 'RTR'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-extrabold ring-2 ring-blue-500/30'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className="text-sm font-black">RTR</div>
                <div className="text-[10px] opacity-75">Retrak</div>
              </button>

              <button
                type="button"
                onClick={() => setMachineType('NONE')}
                className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                  machineType === 'NONE'
                    ? 'border-slate-500 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-extrabold ring-2 ring-slate-400/30'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                <div className="text-sm font-bold">Žádný</div>
                <div className="text-[10px] opacity-75">Ignorovat</div>
              </button>
            </div>
            {machineType === 'NONE' && (
              <p className="mt-1 text-[10px] text-slate-400 italic">
                U tohoto operátora se nebude zobrazovat žádný štítek stroje LL ani RTR.
              </p>
            )}
          </div>

          {/* Shift (Směna A / B / C) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Přiřazená směna *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['A', 'B', 'C'] as ShiftCode[]).map((sc) => (
                <button
                  key={sc}
                  type="button"
                  onClick={() => setShift(sc)}
                  className={`py-1.5 px-3 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs ${
                    shift === sc
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/30'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Směna {sc}
                </button>
              ))}
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Oddělení v rámci PICK *
            </label>
            <select
              value={departmentId}
              onChange={(e) => handleDepartmentChange(e.target.value as DepartmentId)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold"
            >
              <optgroup label="Hlavní oddělení PICK">
                {DEPARTMENTS.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </optgroup>
              {customDepartments.length > 0 && (
                <optgroup label="Vícepráce a mimořádné úkoly">
                  {customDepartments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Status (Active / Break / Absence) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Stav operátora
            </label>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value as OperatorStatus)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">🟢 Aktivní (na hale)</option>
              <option value="break">🟡 Pauza</option>
              <option value="absence">🔴 Nepřítomen</option>
            </select>
          </div>

          {/* Důvod nepřítomnosti (Absence / Dovolená / PN) */}
          {(status === 'absence' || departmentId === 'unassigned') && (
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Důvod nepřítomnosti *
                </label>
                <span className="text-[11px] text-slate-400">Podkategorie</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['Absence', 'Dovolená', 'PN'] as AbsenceReason[]).map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setAbsenceReason(reason)}
                    className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                      absenceReason === reason
                        ? reason === 'Dovolená'
                          ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 font-bold ring-2 ring-amber-400/30'
                          : reason === 'PN'
                          ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 font-bold ring-2 ring-rose-400/30'
                          : 'border-slate-400 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-bold ring-2 ring-slate-400/30'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-xs font-bold">{reason}</div>
                    <div className="text-[9.5px] opacity-75">
                      {reason === 'Dovolená' ? 'Plánované volno' : reason === 'PN' ? 'Nemoc / PN' : 'Absence'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Poznámka (volitelné)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="např. zástup, školení..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {operator && onDelete ? (
              isConfirmingDelete ? (
                <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(operator.id);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ano, smazat!</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg"
                  >
                    Zpět
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Smazat operátora</span>
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Zrušit
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors shadow-sm"
              >
                {operator ? 'Uložit' : 'Přidat'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
