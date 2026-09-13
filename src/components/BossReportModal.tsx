import React, { useState } from 'react';
import { X, Copy, Check, MessageSquare, HardDrive } from 'lucide-react';
import { DEPARTMENTS } from '../data/departments';
import { Operator } from '../types';

interface BossReportModalProps {
  operators: Operator[];
  isOpen: boolean;
  onClose: () => void;
  onOpenGoogleDrive?: () => void;
}

export const BossReportModal: React.FC<BossReportModalProps> = ({
  operators,
  isOpen,
  onClose,
  onOpenGoogleDrive,
}) => {
  const [includeNames, setIncludeNames] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });

  const total = operators.length;
  const activeOps = operators.filter(
    (o) => o.departmentId !== 'unassigned' && o.status === 'active'
  );
  const absenceOps = operators.filter(
    (o) => o.departmentId === 'unassigned' || o.status === 'absence'
  );
  const activeTotal = activeOps.length;
  const llTotal = activeOps.filter((o) => o.machineType === 'LL').length;
  const rtrTotal = activeOps.filter((o) => o.machineType === 'RTR').length;

  const getDeptOps = (id: string) => operators.filter((o) => o.departmentId === id);

  const generateReportText = () => {
    let report = `📋 HLÁŠENÍ ODDĚLENÍ PICK - ZF AFTERMARKET OSTROV\n`;
    report += `Datum a čas: ${dateStr} v ${timeStr}\n`;
    report += `V provozu na hale: ${activeTotal} lidí (z ${total} na směně | ${llTotal}× LL, ${rtrTotal}× RTR)\n`;
    report += `----------------------------------------\n`;

    DEPARTMENTS.filter((d) => d.id !== 'unassigned').forEach((dept) => {
      const ops = getDeptOps(dept.id).filter((o) => o.status !== 'absence');
      const ll = ops.filter((o) => o.machineType === 'LL').length;
      const rtr = ops.filter((o) => o.machineType === 'RTR').length;

      report += `• ${dept.name}: ${ops.length} lidí (${ll}× LL, ${rtr}× RTR)\n`;

      if (includeNames && ops.length > 0) {
        report += `  ${ops.map((o) => `${o.name} (${o.machineType})`).join(', ')}\n`;
      }
    });

    if (absenceOps.length > 0) {
      report += `• Absence / Doma: ${absenceOps.length} lidí\n`;
      if (includeNames) {
        report += `  ${absenceOps.map((o) => `${o.name} (${o.machineType})`).join(', ')}\n`;
      }
    }

    report += `----------------------------------------\n`;
    report += `Generováno z aplikace ZF Operativa PICK`;
    return report;
  };

  const reportText = generateReportText();

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      id="boss-report-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="boss-report-dialog"
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Kompletní report oddělení PICK
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Připraveno ke zkopírování do WhatsAppu, Teams nebo SMS pro vedení
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeNames}
              onChange={(e) => setIncludeNames(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span className="font-medium text-slate-700 dark:text-slate-200">
              Zahrnout do zprávy i konkrétní jména a stroje (LL/RTR)
            </span>
          </label>
          <span className="text-slate-400 font-mono">
            {dateStr} {timeStr}
          </span>
        </div>

        {/* Preview text */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-950">
          <pre className="text-xs sm:text-sm font-mono bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 whitespace-pre-wrap select-all leading-relaxed">
            {reportText}
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 sm:gap-3 bg-white dark:bg-slate-900 flex-wrap sm:flex-nowrap">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Zavřít
          </button>

          <div className="flex items-center gap-2">
            {onOpenGoogleDrive && (
              <button
                id="boss-report-save-drive-btn"
                onClick={() => {
                  onClose();
                  onOpenGoogleDrive();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 transition-colors shadow-2xs"
                title="Otevřít Google Disk a uložit toto hlášení"
              >
                <HardDrive className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Uložit na Disk</span>
              </button>
            )}

            <button
              id="copy-boss-report-text-btn"
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Zkopírováno!' : 'Zkopírovat zprávu pro šéfa'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
