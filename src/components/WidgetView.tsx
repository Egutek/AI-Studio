import React, { useState } from 'react';
import {
  Smartphone,
  PackageCheck,
  Boxes,
  ArrowDownToLine,
  Wrench,
  Layers,
  GitCommitVertical,
  Globe,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Users,
  Lock,
} from 'lucide-react';
import { DEPARTMENTS } from '../data/departments';
import { Department, Operator } from '../types';

interface WidgetViewProps {
  operators: Operator[];
  customDepartments?: Department[];
  onSelectDepartment?: (deptId: string) => void;
}

export const WidgetView: React.FC<WidgetViewProps> = ({ operators, customDepartments = [] }) => {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const getDeptOps = (deptId: string) => operators.filter((o) => o.departmentId === deptId);

  const total = operators.length;
  const activeOps = operators.filter(
    (o) => o.departmentId !== 'unassigned' && o.status === 'active'
  );
  const activeTotal = activeOps.length;
  const breakTotal = operators.filter(
    (o) => o.departmentId !== 'unassigned' && o.status === 'break'
  ).length;
  const absenceTotal = operators.filter(
    (o) => o.departmentId === 'unassigned' || o.status === 'absence'
  ).length;

  const llTotal = activeOps.filter((o) => o.machineType === 'LL').length;
  const rtrTotal = activeOps.filter((o) => o.machineType === 'RTR').length;
  const vnaTotal = activeOps.filter((o) => o.departmentId === 'vna').length;

  const hovcOps = getDeptOps('hovc');
  const hovsOps = getDeptOps('hovs');
  const putawayOps = getDeptOps('putaway');
  const vasOps = getDeptOps('vas');
  const obwfOps = getDeptOps('obwf');
  const vnaOps = getDeptOps('vna');
  const obwiOps = getDeptOps('obwi');

  const now = new Date();
  const timeStr = now.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('cs-CZ', {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
  });

  const copyWidgetText = () => {
    const text = `📊 ZF OSTROV - ODDĚLENÍ PICK (${dateStr} ${timeStr})
👥 Celkem PICK: ${total} lidí (${llTotal}× LL, ${rtrTotal}× RTR)
📦 Outbound: ${hovcOps.length} (${hovcOps.filter((o) => o.machineType === 'LL').length} LL / ${hovcOps.filter((o) => o.machineType === 'RTR').length} RTR)
🏢 HOVS: ${hovsOps.length} (${hovsOps.filter((o) => o.machineType === 'LL').length} LL / ${hovsOps.filter((o) => o.machineType === 'RTR').length} RTR)
📥 Putaway: ${putawayOps.length} (${putawayOps.filter((o) => o.machineType === 'LL').length} LL / ${putawayOps.filter((o) => o.machineType === 'RTR').length} RTR)
🔧 VAS: ${vasOps.length} (${vasOps.filter((o) => o.machineType === 'LL').length} LL / ${vasOps.filter((o) => o.machineType === 'RTR').length} RTR)
🌊 OBWF: ${obwfOps.length} (${obwfOps.filter((o) => o.machineType === 'LL').length} LL / ${obwfOps.filter((o) => o.machineType === 'RTR').length} RTR)
⚡ VNA: ${vnaOps.length} (${vnaOps.filter((o) => o.machineType === 'LL').length} LL / ${vnaOps.filter((o) => o.machineType === 'RTR').length} RTR)
🌐 OBWI: ${obwiOps.length} (${obwiOps.filter((o) => o.machineType === 'LL').length} LL / ${obwiOps.filter((o) => o.machineType === 'RTR').length} RTR)
Aktivně: ${activeTotal} | Pauza: ${breakTotal} | Absence: ${absenceTotal}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Action Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Widget na tapetu & rychlý přehled PICK
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Optimalizovaný responzivní widget pro mobil na směně nebo screenshot pro šéfa.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyWidgetText}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Zkopírováno!' : 'Zkopírovat stav'}</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{isFullscreen ? 'Odejít' : 'Režim celé obrazovky'}</span>
          </button>
        </div>
      </div>

      {/* PHONE MOCKUP / WALLPAPER WIDGET CARD */}
      <div className="flex justify-center">
        <div
          id="mobile-wallpaper-widget"
          className="w-full max-w-md bg-slate-950 text-white rounded-[32px] p-5 sm:p-6 shadow-2xl border-4 border-slate-800 relative overflow-hidden"
        >
          {/* Subtle background glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Phone Top Notch / Header Bar */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="font-extrabold text-slate-200 uppercase tracking-wider text-[11px]">
                ZF OSTROV • ODDĚLENÍ PICK
              </span>
            </div>
            <div className="font-mono text-slate-300 font-semibold">
              {timeStr} • {dateStr}
            </div>
          </div>

          {/* SPOTLIGHT: THE ENTIRE PICK DEPARTMENT TOTAL & LL / RTR BREAKDOWN */}
          <div className="mb-4 bg-gradient-to-r from-blue-950/90 via-slate-900 to-slate-900 border-2 border-blue-500/50 rounded-2xl p-4 relative shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400">
                  HLAVNÍ ODDĚLENÍ
                </span>
                <h3 className="text-base font-black text-white">CELKEM PICK</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded">
                    {llTotal}× LL
                  </span>
                  <span className="text-xs font-bold text-blue-300 bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 rounded">
                    {rtrTotal}× RTR
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div>
                  <span className="text-4xl font-black text-blue-400 tracking-tight">
                    {total}
                  </span>
                  <span className="text-xs text-blue-200/80 ml-1 font-medium">lidí</span>
                </div>
                {/* Menší číslo pod tím: v provozu */}
                <div className="text-[11px] font-bold text-emerald-300 flex items-center justify-end gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>v provozu: <strong className="text-white text-xs">{activeTotal}</strong></span>
                </div>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-blue-500/20 flex items-center justify-between text-[11px] text-slate-300">
              <span className="text-emerald-300 font-semibold">● {activeTotal} aktivních na hale</span>
              <span className="text-slate-400 font-mono">
                {breakTotal > 0 ? `${breakTotal} pauza` : ''} {absenceTotal > 0 ? `• ${absenceTotal} absence` : ''}
              </span>
            </div>
          </div>

          {/* 7 PICK SUB-DEPARTMENTS GRID */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            {/* Outbound */}
            <div className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 rounded-xl p-3 flex flex-col justify-between transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-blue-400" />
                  <span className="font-extrabold text-sm text-white">Outbound</span>
                </div>
                <span className="text-2xl font-black text-blue-400">{hovcOps.length}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                <span>{hovcOps.filter((o) => o.machineType === 'LL').length} LL</span>
                <span>•</span>
                <span>{hovcOps.filter((o) => o.machineType === 'RTR').length} RTR</span>
              </div>
            </div>

            {/* HOVS */}
            <div className="bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 rounded-xl p-3 flex flex-col justify-between transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-sky-400" />
                  <span className="font-extrabold text-sm text-white">HOVS</span>
                </div>
                <span className="text-2xl font-black text-sky-400">{hovsOps.length}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                <span>{hovsOps.filter((o) => o.machineType === 'LL').length} LL</span>
                <span>•</span>
                <span>{hovsOps.filter((o) => o.machineType === 'RTR').length} RTR</span>
              </div>
            </div>

            {/* PUTAWAY */}
            <div className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-3 flex flex-col justify-between transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ArrowDownToLine className="w-4 h-4 text-indigo-400" />
                  <span className="font-extrabold text-sm text-white">Putaway</span>
                </div>
                <span className="text-2xl font-black text-indigo-400">{putawayOps.length}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                <span>{putawayOps.filter((o) => o.machineType === 'LL').length} LL</span>
                <span>•</span>
                <span>{putawayOps.filter((o) => o.machineType === 'RTR').length} RTR</span>
              </div>
            </div>

            {/* VAS */}
            <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-xl p-3 flex flex-col justify-between transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-amber-400" />
                  <span className="font-extrabold text-sm text-white">VAS</span>
                </div>
                <span className="text-2xl font-black text-amber-400">{vasOps.length}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                <span>{vasOps.filter((o) => o.machineType === 'LL').length} LL</span>
                <span>•</span>
                <span>{vasOps.filter((o) => o.machineType === 'RTR').length} RTR</span>
              </div>
            </div>

            {/* OBWF */}
            <div className="bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 rounded-xl p-3 flex flex-col justify-between transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span className="font-extrabold text-sm text-white">OBWF</span>
                </div>
                <span className="text-2xl font-black text-purple-400">{obwfOps.length}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                <span>{obwfOps.filter((o) => o.machineType === 'LL').length} LL</span>
                <span>•</span>
                <span>{obwfOps.filter((o) => o.machineType === 'RTR').length} RTR</span>
              </div>
            </div>

            {/* VNA */}
            <div className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-3 flex flex-col justify-between transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <GitCommitVertical className="w-4 h-4 text-emerald-400" />
                  <span className="font-extrabold text-sm text-white">VNA</span>
                </div>
                <span className="text-2xl font-black text-emerald-400">{vnaOps.length}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                <span>{vnaOps.filter((o) => o.machineType === 'LL').length} LL</span>
                <span>•</span>
                <span>{vnaOps.filter((o) => o.machineType === 'RTR').length} RTR</span>
              </div>
            </div>
          </div>

          {/* OBWI (Full width row) */}
          <div className="bg-slate-900/90 border border-slate-800 hover:border-rose-500/50 rounded-xl p-3 flex items-center justify-between mb-4 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-white">OBWI</div>
                <div className="text-[10px] text-slate-400">
                  {obwiOps.filter((o) => o.machineType === 'LL').length}× LL • {obwiOps.filter((o) => o.machineType === 'RTR').length}× RTR
                </div>
              </div>
            </div>
            <span className="text-2xl font-black text-rose-400">{obwiOps.length}</span>
          </div>

          {/* Custom / Extra Work Departments */}
          {customDepartments.length > 0 && (
            <div className="mb-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" />
                <span>Vícepráce a mimořádné úkoly</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {customDepartments.map((dept) => {
                  const ops = getDeptOps(dept.id);
                  return (
                    <div
                      key={dept.id}
                      className="bg-amber-950/20 border border-amber-500/30 hover:border-amber-500/60 rounded-xl p-2.5 flex flex-col justify-between transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 pr-1">
                          <span className="font-bold text-xs text-white truncate block">
                            {dept.name}
                          </span>
                          <span className="text-[10px] text-amber-400 font-mono">
                            {dept.code}
                          </span>
                        </div>
                        <span className="text-xl font-black text-amber-400 shrink-0">
                          {ops.length}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 font-mono">
                        {ops.filter((o) => o.machineType === 'LL').length} LL • {ops.filter((o) => o.machineType === 'RTR').length} RTR
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* BOTTOM TOTAL SUMMARY STRIP */}
          <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-slate-400">Celkem PICK:</span>
              <span className="font-bold text-white text-sm">{total}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-emerald-400 font-semibold">{activeTotal} na hale</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400 font-semibold">{breakTotal} pauza</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">{absenceTotal} absence</span>
            </div>
          </div>

          {/* Quick instructions hint */}
          <div className="mt-3 text-center text-[10px] text-slate-500">
            Tip: Připněte si tuto stránku na plochu mobilu (Sdílet → Přidat na plochu)
          </div>
        </div>
      </div>
    </div>
  );
};
