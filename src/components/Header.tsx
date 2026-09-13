import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Smartphone,
  LayoutGrid,
  List,
  History,
  UserPlus,
  RotateCcw,
  Camera,
  Undo2,
  ChevronDown,
  Play,
  Pause,
  ArrowRight,
  Bookmark,
  HardDrive,
} from 'lucide-react';
import { UndoOperation } from '../types';
import { getDepartmentById } from '../data/departments';

interface HeaderProps {
  totalCount?: number;
  activeCount?: number;
  llCount?: number;
  rtrCount?: number;
  vnaCount?: number;
  absenceCount?: number;
  searchQuery: string;
  viewMode: 'board' | 'widget' | 'table';
  undoOperations?: UndoOperation[];
  onUndoSingle?: () => void;
  onUndoBulk?: (count: number) => void;
  isAutoScrolling?: boolean;
  onToggleAutoScroll?: () => void;
  onSearchChange: (query: string) => void;
  onViewModeChange: (mode: 'board' | 'widget' | 'table') => void;
  onOpenAddModal: () => void;
  onOpenPhotoImport: () => void;
  onOpenTemplatesModal?: () => void;
  onOpenGoogleDriveModal?: () => void;
  isDriveConnected?: boolean;
  onOpenReportModal?: () => void;
  onOpenHistoryModal: () => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalCount = 65,
  activeCount = 0,
  absenceCount = 0,
  searchQuery,
  viewMode,
  undoOperations = [],
  onUndoSingle,
  onUndoBulk,
  isAutoScrolling = false,
  onToggleAutoScroll,
  onSearchChange,
  onViewModeChange,
  onOpenAddModal,
  onOpenPhotoImport,
  onOpenTemplatesModal,
  onOpenGoogleDriveModal,
  isDriveConnected = false,
  onOpenHistoryModal,
  onResetData,
}) => {
  const [isUndoOpen, setIsUndoOpen] = useState(false);
  const undoDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        undoDropdownRef.current &&
        !undoDropdownRef.current.contains(e.target as Node)
      ) {
        setIsUndoOpen(false);
      }
    };
    if (isUndoOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUndoOpen]);

  const hasUndo = undoOperations.length > 0;
  const undoCount = Math.min(undoOperations.length, 5);

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3">
        {/* Top line: Brand & Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
          {/* Logo & title */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center font-black text-lg tracking-tighter shadow-md shrink-0">
              ZF
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                  ZF Ostrov • Oddělení PICK
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-700">
                  Aftermarket Hub
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">
                Operační řízení směn a přesuny operátorů
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* GLOBAL UNDO BUTTON FOR LAST 5 OPERATIONS */}
            <div className="relative" ref={undoDropdownRef}>
              <div
                className={`inline-flex rounded-xl overflow-hidden border shadow-xs transition-all ${
                  hasUndo
                    ? 'border-amber-400/90 dark:border-amber-600/90 bg-amber-500 ring-2 ring-amber-400/30'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 opacity-60'
                }`}
              >
                {/* Main Undo Button: 1-click revert of the latest operation */}
                <button
                  id="global-undo-main-btn"
                  disabled={!hasUndo}
                  onClick={() => onUndoSingle?.()}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                    hasUndo
                      ? 'text-slate-950 hover:bg-amber-400 cursor-pointer font-black'
                      : 'text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
                  title={
                    hasUndo
                      ? `Vrátit poslední přesun: ${undoOperations[0]?.operatorName} (dostupných ${undoCount}/5 kroků)`
                      : 'Žádné operace k vrácení'
                  }
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Zpět</span>
                  {hasUndo && (
                    <span className="px-1.5 py-0.2 rounded-md bg-slate-900 text-amber-300 font-extrabold text-[10px]">
                      {undoCount}/5
                    </span>
                  )}
                </button>

                {/* Dropdown Chevron: Opens bulk recovery menu for up to 5 operations */}
                <button
                  id="global-undo-dropdown-toggle"
                  disabled={!hasUndo}
                  onClick={() => setIsUndoOpen(!isUndoOpen)}
                  className={`px-1.5 py-1.5 border-l text-xs transition-colors ${
                    hasUndo
                      ? 'border-amber-600/40 text-slate-950 hover:bg-amber-400 cursor-pointer'
                      : 'border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed'
                  }`}
                  title="Otevřít seznam posledních až 5 operací a hromadné obnovení"
                >
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isUndoOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Dropdown Panel for Last 5 Operations and Bulk Recovery */}
              {isUndoOpen && hasUndo && (
                <div
                  id="global-undo-popover"
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-amber-300/80 dark:border-amber-700/80 z-50 p-3.5 animate-in fade-in zoom-in-95 duration-150 space-y-3"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-xs sm:text-sm">
                      <Undo2 className="w-4 h-4 text-amber-500" />
                      <span>Historie posledních {undoCount} přesunů</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      {undoCount}/5 kroků k vrácení
                    </span>
                  </div>

                  {/* List of last up to 5 operations */}
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5 scrollbar-thin">
                    {undoOperations.slice(0, 5).map((op, idx) => {
                      const fromDept = getDepartmentById(op.fromDept);
                      const toDept = getDepartmentById(op.toDept);
                      const isLatest = idx === 0;

                      return (
                        <div
                          key={op.id}
                          className={`p-2.5 rounded-xl border text-xs transition-all ${
                            isLatest
                              ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white truncate">
                                {op.operatorName}
                              </span>
                              <span className="text-[10px] px-1 py-0.2 rounded font-mono font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                                {op.machineType}
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                onUndoBulk?.(idx + 1);
                                setIsUndoOpen(false);
                              }}
                              className="px-2 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-700 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 transition-colors shrink-0 shadow-2xs"
                              title={`Vrátit operaci ${idx + 1}`}
                            >
                              {idx === 0 ? 'Vrátit' : `Vrátit ${idx + 1} kroků`}
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                            <span className="font-medium text-slate-500 dark:text-slate-400">Z:</span>
                            <span className="font-bold">{fromDept.name}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span className="font-medium text-slate-500 dark:text-slate-400">Do:</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400">
                              {toDept.name}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bulk recovery action button */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                    <button
                      id="header-bulk-undo-btn"
                      onClick={() => {
                        onUndoBulk?.(undoCount);
                        setIsUndoOpen(false);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-black text-xs transition-all shadow-xs flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Hromadně vrátit všech {undoCount} operací</span>
                    </button>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center leading-tight">
                      Obnoví operátory zpět do jejich původních oddělení jedním kliknutím.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              id="header-open-templates-btn"
              onClick={onOpenTemplatesModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-all active:scale-95"
              title="Šablony směn - uložit nebo načíst výchozí rozdělení operátorů"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Šablony</span>
            </button>

            <button
              id="header-open-google-drive-btn"
              onClick={onOpenGoogleDriveModal}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 border ${
                isDriveConnected
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
              }`}
              title="Google Disk - ukládání denních hlášení a záloh směny na cloud"
            >
              <HardDrive className={`w-3.5 h-3.5 ${isDriveConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`} />
              <span>Google Disk</span>
              {isDriveConnected && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>

            <button
              id="header-open-photo-btn"
              onClick={onOpenPhotoImport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-all active:scale-95"
              title="Vytáhne jména ze snímku nebo fotky rozpisu docházky"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import z fotky / rozpisu</span>
              <span className="sm:hidden">Foto OCR</span>
            </button>

            <button
              id="header-open-add-btn"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white shadow-xs transition-all active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Přidat</span>
            </button>

            <button
              onClick={onOpenHistoryModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
              title="Historie přesunů"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Historie</span>
            </button>

            <button
              onClick={onResetData}
              className="p-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Obnovit výchozích 65 operátorů ZF PICK"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Controls row: Search, Auto-Scroll toggle & View Switcher */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Vyhledat člověka podle jména..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Controls Right: Auto-scroll toggle and View switcher */}
          <div className="flex items-center gap-2 justify-between sm:justify-end">
            {/* Auto-scroll toggle button for hands-free warehouse monitoring */}
            {viewMode === 'board' && (
              <button
                id="header-auto-scroll-btn"
                onClick={onToggleAutoScroll}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-2xs ${
                  isAutoScrolling
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 animate-pulse'
                    : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
                title={
                  isAutoScrolling
                    ? 'Zastavit automatický posuv sloupců'
                    : 'Spustit plynulý automatický posuv sloupců (ideální pro nástěnné monitory a TV)'
                }
              >
                {isAutoScrolling ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Auto-scroll: Zapnuto</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Auto-scroll</span>
                  </>
                )}
              </button>
            )}

            {/* View switcher: Board / Widget na tapetu / Table */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700 text-xs">
              <button
                id="view-mode-board-btn"
                onClick={() => onViewModeChange('board')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                  viewMode === 'board'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Sloupcové rozložení oddělení PICK"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Oddělení</span>
              </button>

              <button
                id="view-mode-widget-btn"
                onClick={() => onViewModeChange('widget')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                  viewMode === 'widget'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Widget na tapetu & rychlý přehled pro šéfa"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Widget</span>
              </button>

              <button
                id="view-mode-table-btn"
                onClick={() => onViewModeChange('table')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Seznam všech operátorů v tabulce"
              >
                <List className="w-3.5 h-3.5" />
                <span>Seznam</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
