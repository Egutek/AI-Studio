import React from 'react';
import { X, History, ArrowRight, Clock, Trash2 } from 'lucide-react';
import { getDepartmentById } from '../data/departments';
import { MoveHistoryRecord } from '../types';

interface HistoryModalProps {
  history: MoveHistoryRecord[];
  isOpen: boolean;
  onClose: () => void;
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  history,
  isOpen,
  onClose,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div
      id="history-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="history-dialog"
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Historie přesunů na směně
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Přehled všech operativních přesunů mezi odděleními
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

        <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800">
          {history.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Zatím žádné zaznamenané přesuny</p>
              <p className="text-xs text-slate-400 mt-1">
                Jakmile přesunete operátora, zde uvidíte přesný čas a směr přesunu.
              </p>
            </div>
          ) : (
            history.map((item) => {
              const fromDept = getDepartmentById(item.fromDept);
              const toDept = getDepartmentById(item.toDept);

              return (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {item.operatorName}
                      </span>
                      {item.machineType && (
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                            item.machineType === 'RTR'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                          }`}
                        >
                          {item.machineType}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-slate-600 dark:text-slate-300">
                      <span className="font-semibold">{fromDept.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {toDept.name}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                      {formatTime(item.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          {history.length > 0 ? (
            <button
              onClick={onClearHistory}
              className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vymazat historii</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Zavřít
          </button>
        </div>
      </div>
    </div>
  );
};
