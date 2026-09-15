import React, { useState, useEffect } from 'react';
import { Copy, Check, MessageSquare, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { Department, Operator } from '../types';
import { DEPARTMENTS } from '../data/departments';

interface BossAnswerCardProps {
  operators: Operator[];
  customDepartments?: Department[];
  onOpenReportModal: () => void;
  onQuickMoveModal?: () => void;
}

export const BossAnswerCard: React.FC<BossAnswerCardProps> = ({
  operators,
  customDepartments = [],
  onOpenReportModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('zf_boss_card_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('zf_boss_card_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

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
  const customDeptIds = new Set(customDepartments.map((d) => d.id));
  const activeExtraOps = activeOps.filter((op) => customDeptIds.has(op.departmentId));

  const copyPickSummary = () => {
    const lines = DEPARTMENTS.filter((d) => d.id !== 'unassigned').map((d) => {
      const opsInDept = operators.filter((o) => o.departmentId === d.id && o.status !== 'absence');
      return `${d.name}: ${opsInDept.length}`;
    });
    const extraLines = customDepartments.map((d) => {
      const opsInDept = operators.filter((o) => o.departmentId === d.id && o.status !== 'absence');
      return `${d.name}: ${opsInDept.length}`;
    });
    const combined = [...lines, ...extraLines];

    const extraNote = activeExtraOps.length > 0 ? `, z toho ${activeExtraOps.length} na vícepracích` : '';
    const text = `Ahoj, aktuální stav oddělení PICK: ${activeOps.length} lidí právě v provozu na hale (z ${operators.length} na směně${extraNote}, ${absenceOps.length} v absenci / doma, ${activeLL}× LL, ${activeRTR}× RTR):\n${combined.join(' | ')}.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // COLLAPSED COMPACT VIEW (Takes minimal vertical space)
  if (isCollapsed) {
    return (
      <div
        id="boss-pick-card-collapsed"
        className="bg-slate-900 border border-blue-500/30 rounded-xl px-3 py-1.5 sm:py-2 text-white shadow-xs flex items-center justify-between gap-2 flex-wrap transition-all"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-md border border-blue-500/30">
            PICK
          </span>

          <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <strong className="text-emerald-400 font-extrabold">{activeOps.length}</strong>
            <span className="text-slate-300">v provozu</span>
            <span className="text-slate-500 text-xs font-normal">/ {operators.length} celkem</span>
          </span>

          {absenceOps.length > 0 && (
            <span className="text-[11px] font-semibold text-rose-300 bg-rose-950/60 border border-rose-800/50 px-2 py-0.5 rounded-md">
              {absenceOps.length} absence
            </span>
          )}

          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
            <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded text-[11px] font-bold">
              {activeLL}× LL
            </span>
            <span className="bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded text-[11px] font-bold">
              {activeRTR}× RTR
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded text-[11px] font-bold">
              {activeVNA}× VNA
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <button
            id="copy-pick-answer-collapsed-btn"
            onClick={copyPickSummary}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/30 transition-colors"
            title="Zkopírovat stav pro WhatsApp / SMS"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Zkopírováno' : 'Zkopírovat'}</span>
          </button>

          <button
            id="open-report-collapsed-btn"
            onClick={onOpenReportModal}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Report</span>
          </button>

          <button
            id="expand-boss-card-btn"
            onClick={toggleCollapse}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
            title="Rozbalit detailní přehled"
          >
            <span className="hidden sm:inline">Rozbalit</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // EXPANDED VIEW (Made compact, clean, with collapse button)
  return (
    <div
      id="boss-pick-card"
      className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 border border-blue-500/30 rounded-2xl p-3.5 sm:p-4 text-white shadow-md relative overflow-hidden transition-all"
    >
      {/* Background soft glow */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 relative z-10">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0 text-blue-400">
            <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded-full border border-blue-500/30">
                Oddělení PICK • ZF Ostrov
              </span>
              <span className="text-xs text-slate-400">Přehled pro směnové vedení</span>
            </div>

            <div className="mt-1 flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-3 flex-wrap">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white flex items-baseline gap-2">
                  <span>V provozu na hale:</span>
                  <span className="text-emerald-400 text-xl sm:text-2xl font-extrabold animate-in fade-in duration-200">
                    {activeOps.length} lidí
                  </span>
                  <span className="text-xs font-normal text-slate-400">
                    / {operators.length} celkem
                  </span>
                </h3>

                {/* Sub-counters showing real-time deductions */}
                <div className="flex items-center gap-2 mt-0.5 text-xs flex-wrap">
                  {absenceOps.length > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500/25 text-rose-300 border border-rose-500/40 font-bold text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block animate-pulse" />
                      <span>Absence: <strong className="text-white font-extrabold">{absenceOps.length}</strong></span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 font-semibold text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>0 absencí</span>
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

              <div className="flex items-center gap-1.5 text-xs font-bold self-start sm:self-center mt-1 sm:mt-0">
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md text-[11px]" title="Aktivní řidiči LL na hale">
                  {activeLL}× LL
                </span>
                <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-md text-[11px]" title="Aktivní řidiči RTR na hale">
                  {activeRTR}× RTR
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md text-[11px]" title="Aktivní VNA operátoři">
                  {activeVNA}× VNA
                </span>
                {activeExtraOps.length > 0 && (
                  <span className="bg-amber-600/30 text-amber-200 border border-amber-500/40 px-2 py-0.5 rounded-md text-[11px] font-bold" title="Operátoři na vícepracích / mimořádných úkolech">
                    {activeExtraOps.length}× Vícepráce
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons + Collapse toggle */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          <button
            id="copy-pick-answer-btn"
            onClick={copyPickSummary}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 transition-colors shadow-2xs"
            title="Zkopíruje rychlý přehled pro WhatsApp nebo SMS"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Zkopírováno!' : 'Zkopírovat pro šéfa'}</span>
          </button>

          <button
            id="open-full-boss-report-btn"
            onClick={onOpenReportModal}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Celý report PICK</span>
          </button>

          <button
            id="collapse-boss-card-btn"
            onClick={toggleCollapse}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title="Zasunout přehled pro více místa"
          >
            <span className="hidden sm:inline">Zasunout</span>
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

