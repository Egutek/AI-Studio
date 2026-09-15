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
  Cloud,
  CloudOff,
  LogOut,
  LogIn,
  ShieldCheck,
  RefreshCw,
  Wrench,
} from 'lucide-react';
import { ShiftCode, UndoOperation } from '../types';
import { getDepartmentById } from '../data/departments';
import { User } from 'firebase/auth';

interface HeaderProps {
  totalCount?: number;
  activeCount?: number;
  llCount?: number;
  rtrCount?: number;
  vnaCount?: number;
  absenceCount?: number;
  activeShift?: ShiftCode;
  onShiftChange?: (shift: ShiftCode) => void;
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
  onOpenAddCustomDept?: () => void;
  onOpenPhotoImport: () => void;
  onOpenTemplatesModal?: () => void;
  onOpenReportModal?: () => void;
  onOpenHistoryModal: () => void;
  onResetData: () => void;
  currentUser?: User | null;
  isCloudConnected?: boolean;
  isCloudSyncing?: boolean;
  isGoogleSigningIn?: boolean;
  onGoogleSignIn?: () => void;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalCount = 65,
  activeCount = 0,
  absenceCount = 0,
  activeShift = 'A',
  onShiftChange,
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
  onOpenAddCustomDept,
  onOpenPhotoImport,
  onOpenTemplatesModal,
  onOpenHistoryModal,
  onResetData,
  currentUser,
  isCloudConnected = false,
  isCloudSyncing = false,
  isGoogleSigningIn = false,
  onGoogleSignIn,
  onSignOut,
}) => {
  const [isUndoOpen, setIsUndoOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const undoDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        undoDropdownRef.current &&
        !undoDropdownRef.current.contains(e.target as Node)
      ) {
        setIsUndoOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUndoOpen || isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUndoOpen, isUserMenuOpen]);

  const hasUndo = undoOperations.length > 0;
  const undoCount = Math.min(undoOperations.length, 5);

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 relative z-20 shadow-2xs w-full">
      <div className="w-full px-3 sm:px-6 2xl:px-8 py-2.5 sm:py-3">
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
                {isCloudConnected ? (
                  <span
                    className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60 shadow-2xs"
                    title={
                      currentUser
                        ? `Přihlášen jako ${currentUser.email} • Živá online synchronizace se všemi zařízeními`
                        : 'Živá online synchronizace aktivní • Jakákoliv změna se ihned projeví na všech zařízeních s odkazem'
                    }
                  >
                    {isCloudSyncing ? (
                      <RefreshCw className="w-2.5 h-2.5 text-emerald-600 animate-spin" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                    <Cloud className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold">Online:</span>
                    <span>
                      {currentUser
                        ? currentUser.email === 'hemzacekl@gmail.com'
                          ? 'Admin'
                          : currentUser.displayName || 'Přihlášen'
                        : 'Živě synchronizováno'}
                    </span>
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1.5 text-[10px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/60"
                    title="Připojování k online databázi..."
                  >
                    <RefreshCw className="w-2.5 h-2.5 text-amber-600 animate-spin" />
                    <span>Připojování k online směně...</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">
                Operační řízení směn a přesuny operátorů
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* SUBTLE / SMALL UNDO BUTTON */}
            <div className="relative" ref={undoDropdownRef}>
              <div
                className={`inline-flex items-center rounded-lg border text-xs transition-colors ${
                  hasUndo
                    ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    : 'border-slate-200 dark:border-slate-800 bg-transparent text-slate-400 dark:text-slate-600 opacity-50'
                }`}
              >
                {/* Main Undo Button: 1-click revert */}
                <button
                  id="global-undo-main-btn"
                  disabled={!hasUndo}
                  onClick={() => onUndoSingle?.()}
                  className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium transition-all ${
                    hasUndo
                      ? 'hover:text-slate-950 dark:hover:text-white cursor-pointer active:scale-95'
                      : 'cursor-not-allowed'
                  }`}
                  title={
                    hasUndo
                      ? `Vrátit poslední přesun: ${undoOperations[0]?.operatorName} (${undoCount}/5 kroků)`
                      : 'Žádné operace k vrácení'
                  }
                >
                  <Undo2 className="w-3 h-3 text-slate-400" />
                  <span>Zpět</span>
                  {hasUndo && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({undoCount})
                    </span>
                  )}
                </button>

                {/* Subtle Dropdown Chevron */}
                {hasUndo && (
                  <button
                    id="global-undo-dropdown-toggle"
                    onClick={() => setIsUndoOpen(!isUndoOpen)}
                    className="px-1 py-1 border-l border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    title="Historie vrácení kroků"
                  >
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-150 ${
                        isUndoOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                )}
              </div>

              {/* Dropdown Panel for Last 5 Operations and Bulk Recovery */}
              {isUndoOpen && hasUndo && (
                <div
                  id="global-undo-popover"
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 p-3 animate-in fade-in zoom-in-95 duration-150 space-y-2.5"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold text-xs">
                      <Undo2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Historie posledních {undoCount} přesunů</span>
                    </div>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {undoCount}/5 kroků
                    </span>
                  </div>

                  {/* List of last up to 5 operations */}
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5 scrollbar-thin">
                    {undoOperations.slice(0, 5).map((op, idx) => {
                      const fromDept = getDepartmentById(op.fromDept);
                      const toDept = getDepartmentById(op.toDept);
                      const isLatest = idx === 0;

                      return (
                        <div
                          key={op.id}
                          className={`p-2 rounded-lg border text-xs transition-all ${
                            isLatest
                              ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/60'
                              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[9px] font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="font-semibold text-slate-900 dark:text-white truncate">
                                {op.operatorName}
                              </span>
                              {op.machineType && op.machineType !== 'NONE' && (
                                <span className="text-[9px] px-1 py-0.2 rounded font-mono font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                                  {op.machineType}
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => {
                                onUndoBulk?.(idx + 1);
                                setIsUndoOpen(false);
                              }}
                              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white dark:bg-slate-700 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 transition-colors shrink-0 shadow-2xs"
                              title={`Vrátit operaci ${idx + 1}`}
                            >
                              {idx === 0 ? 'Vrátit' : `Vrátit ${idx + 1}`}
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                            <span>Z:</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">{fromDept.name}</span>
                            <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                            <span>Do:</span>
                            <span className="font-medium text-blue-600 dark:text-blue-400">
                              {toDept.name}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bulk recovery action button */}
                  <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <button
                      id="header-bulk-undo-btn"
                      onClick={() => {
                        onUndoBulk?.(undoCount);
                        setIsUndoOpen(false);
                      }}
                      className="w-full py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-500" />
                      <span>Vrátit všech {undoCount} kroků</span>
                    </button>
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

            {onOpenAddCustomDept && (
              <button
                id="header-open-add-custom-dept-btn"
                onClick={onOpenAddCustomDept}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700/60 shadow-2xs transition-all active:scale-95"
                title="Vytvořit oddělení pro vícepráce mimo standardní tabulku"
              >
                <Wrench className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="hidden sm:inline">+ Vícepráce</span>
                <span className="sm:hidden">+ Úkol</span>
              </button>
            )}

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

            {/* Firebase Auth Profile or Sign-In Button */}
            {currentUser ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  id="header-user-profile-btn"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
                  title={`Přihlášený uživatel: ${currentUser.displayName || currentUser.email}`}
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'Uživatel'}
                      referrerPolicy="no-referrer"
                      className="w-4 h-4 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                      {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[75px] sm:max-w-[110px] truncate text-[11px]">
                    {currentUser.displayName?.split(' ')[0] || currentUser.email?.split('@')[0]}
                  </span>
                  {currentUser.email === 'hemzacekl@gmail.com' && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold">
                      Admin
                    </span>
                  )}
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 p-3 animate-in fade-in zoom-in-95 duration-150 space-y-2.5">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                      {currentUser.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt="Avatar"
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {currentUser.displayName || 'Přihlášený dispečer'}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-mono">
                          {currentUser.email}
                        </p>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[10px]">Cloud Firestore:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-[10px] flex items-center gap-1">
                          <Cloud className="w-2.5 h-2.5" />
                          Živá synchronizace
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[10px]">Role:</span>
                        <span className="font-bold text-[10px] text-slate-700 dark:text-slate-200">
                          {currentUser.email === 'hemzacekl@gmail.com' ? 'Správce (Admin)' : 'Dispečer'}
                        </span>
                      </div>
                    </div>

                    <button
                      id="header-sign-out-btn"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onSignOut?.();
                      }}
                      className="w-full py-1.5 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Odhlásit z Firebase</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="header-google-signin-btn"
                onClick={onGoogleSignIn}
                disabled={isGoogleSigningIn}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isGoogleSigningIn
                    ? 'opacity-70 cursor-not-allowed bg-amber-100 dark:bg-amber-900/60 text-amber-800'
                    : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/80 shadow-2xs active:scale-95 cursor-pointer'
                }`}
                title="Přihlásit se přes Google pro sdílení operátorů a změn v reálném čase"
              >
                {isGoogleSigningIn ? (
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-spin" />
                ) : (
                  <LogIn className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                )}
                <span className="hidden sm:inline">
                  {isGoogleSigningIn ? 'Přihlašování...' : 'Google Přihlášení'}
                </span>
                <span className="sm:hidden">
                  {isGoogleSigningIn ? '...' : 'Přihlásit'}
                </span>
              </button>
            )}
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

          {/* Controls Right: Shift Switcher (A, B, C), Auto-scroll toggle and View switcher */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
            {/* Shift Switcher Segmented Control (Směna A, B, C) */}
            <div
              id="header-shift-switcher"
              className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700 text-xs"
            >
              {(['A', 'B', 'C'] as const).map((shift) => {
                const isActive = activeShift === shift;
                return (
                  <button
                    key={shift}
                    type="button"
                    id={`header-shift-${shift.toLowerCase()}-btn`}
                    onClick={() => onShiftChange?.(shift)}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold transition-all cursor-pointer select-none ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title={`Přepnout na Směnu ${shift}`}
                  >
                    <span>Směna {shift}</span>
                  </button>
                );
              })}
            </div>

            {/* Auto-scroll toggle button for hands-free warehouse monitoring */}
            {viewMode === 'board' && (
              <button
                id="header-auto-scroll-btn"
                onClick={onToggleAutoScroll}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-2xs ${
                  isAutoScrolling
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 animate-pulse'
                    : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
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
