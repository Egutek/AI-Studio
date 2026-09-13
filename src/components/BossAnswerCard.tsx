import React, { useState } from 'react';
import { Copy, Check, MessageSquare, Layers, Lock } from 'lucide-react';
import { Operator } from '../types';
import { DEPARTMENTS } from '../data/departments';

interface BossAnswerCardProps {
  operators: Operator[];
  onOpenReportModal: () => void;
  onQuickMoveModal?: () => void;
}

export const BossAnswerCard: React.FC<BossAnswerCardProps> = ({
  operators,
  onOpenReportModal,
}) => {
  const [copied, setCopied] = useState(false);

  const activeOps = operators.filter(
    (op) => op.departmentId !== 'unassigned' && op.status === 'active'
  );
  const absenceOps = operators.filter(
    (op) => op.departmentId === 'unassigned' || op.status === 'absence'
  );
  const breakOps = operators.filter(
    (op) => op.departmentId !== 'unassigned' && op.status === 'break'
  );
  const activeLL = activeOps.filter((op) => op.machineType === 'LL').length;
  const activeRTR = activeOps.filter((op) => op.machineType === 'RTR').length;
  const activeVNA = activeOps.filter((op) => op.departmentId === 'vna').length;

  const copyPickSummary = () => {
    const lines = DEPARTMENTS.filter((d) => d.id !== 'unassigned').map((d) => {
      const opsInDept = operators.filter((o) => o.departmentId === d.id && o.status !== 'absence');
      return `${d.name}: ${opsInDept.length}`;
    });

    const text = `Ahoj, aktuální stav oddělení PICK: ${activeOps.length} lidí právě v provozu na hale (z ${operators.length} na směně, ${absenceOps.length} v absenci / doma, ${activeLL}× LL, ${activeRTR}× RTR):\n${lines.join(' | ')}.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      id="boss-pick-card"
      className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 border border-blue-500/30 rounded-2xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden"
    >
      {/* Background soft glow */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0 text-blue-400">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-400 bg-blue-500/15 px-2.5 py-0.5 rounded-full border border-blue-500/30">
                Oddělení PICK • ZF Aftermarket
              </span>
              <span className="text-xs text-slate-400">Okamžitý přehled pro vedení</span>
            </div>

            <div className="mt-1 flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 flex-wrap">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white flex items-baseline gap-2">
                  <span>V provozu na hale:</span>
                  <span className="text-emerald-400 text-2xl sm:text-3xl font-extrabold animate-in fade-in duration-200">
                    {activeOps.length} lidí
                  </span>
                  <span className="text-sm font-normal text-slate-400">
                    / {operators.length} celkem na směně
                  </span>
                </h3>

                {/* Sub-counters showing real-time deductions */}
                <div className="flex items-center gap-2 mt-1 text-xs flex-wrap">
                  {absenceOps.length > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-rose-500/25 text-rose-300 border border-rose-500/40 font-bold">
                      <span className="w-2 h-2 rounded-full bg-rose-400 inline-block animate-pulse" />
                      <span>Absence / doma: <strong className="text-white font-extrabold text-sm">{absenceOps.length}</strong></span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 font-semibold text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Všichni přítomni (0 absencí)</span>
                    </span>
                  )}
                  {breakOps.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>{breakOps.length} pauza</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold self-start sm:self-center mt-1">
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-md" title="Aktivní řidiči LL na hale">
                  {activeLL}× LL na hale
                </span>
                <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-md" title="Aktivní řidiči RTR na hale">
                  {activeRTR}× RTR na hale
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-md" title="Aktivní VNA operátoři">
                  {activeVNA}× VNA
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap sm:flex-nowrap">
          <button
            id="copy-pick-answer-btn"
            onClick={copyPickSummary}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 transition-colors shadow-2xs"
            title="Zkopíruje rychlý přehled pro WhatsApp nebo SMS"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Zkopírováno!' : 'Zkopírovat stav pro šéfa'}</span>
          </button>

          <button
            id="open-full-boss-report-btn"
            onClick={onOpenReportModal}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Celý report PICK</span>
          </button>
        </div>
      </div>
    </div>
  );
};
