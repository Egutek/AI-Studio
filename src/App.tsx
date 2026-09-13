import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  DEPARTMENTS,
  getDepartmentById,
} from './data/departments';
import {
  DepartmentId,
  MoveHistoryRecord,
  Operator,
  OperatorStatus,
  UndoOperation,
} from './types';
import {
  loadOperators,
  saveOperators,
  loadHistory,
  saveHistory,
  loadUndoStack,
  saveUndoStack,
  resetToInitialOperators,
} from './utils/storage';
import { Header } from './components/Header';
import { BossAnswerCard } from './components/BossAnswerCard';
import { DepartmentColumn } from './components/DepartmentColumn';
import { TableView } from './components/TableView';
import { WidgetView } from './components/WidgetView';
import { QuickMoveModal } from './components/QuickMoveModal';
import { BossReportModal } from './components/BossReportModal';
import { AddEditOperatorModal } from './components/AddEditOperatorModal';
import { HistoryModal } from './components/HistoryModal';
import { PhotoImportModal } from './components/PhotoImportModal';
import { ShiftTemplatesModal } from './components/ShiftTemplatesModal';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { initAuth } from './services/googleDriveAuth';
import { ShiftTemplate } from './types';
import { applyTemplateToOperators } from './data/templates';
import { CheckCircle2, AlertTriangle, Play, Pause, ArrowDownToLine, Move } from 'lucide-react';
import { resolveOperatorFromDrop, getGlobalDragState } from './utils/dragState';

const JUMP_THEMES: Record<
  DepartmentId,
  {
    border: string;
    activeBorder: string;
    activeBg: string;
    dragHoverBg: string;
    badgeBg: string;
    badgeActive: string;
  }
> = {
  hovc: {
    border: 'hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/30',
    activeBorder: 'border-blue-500 ring-4 ring-blue-500/30',
    activeBg: 'bg-blue-600 text-white',
    dragHoverBg: 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 border-dashed',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300',
    badgeActive: 'bg-white/25 text-white',
  },
  hovs: {
    border: 'hover:border-sky-400 hover:bg-sky-50/50 dark:hover:bg-sky-950/30',
    activeBorder: 'border-sky-500 ring-4 ring-sky-500/30',
    activeBg: 'bg-sky-600 text-white',
    dragHoverBg: 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-400 border-dashed',
    badgeBg: 'bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300',
    badgeActive: 'bg-white/25 text-white',
  },
  putaway: {
    border: 'hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30',
    activeBorder: 'border-indigo-500 ring-4 ring-indigo-500/30',
    activeBg: 'bg-indigo-600 text-white',
    dragHoverBg: 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-400 border-dashed',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300',
    badgeActive: 'bg-white/25 text-white',
  },
  vas: {
    border: 'hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/30',
    activeBorder: 'border-amber-500 ring-4 ring-amber-500/30',
    activeBg: 'bg-amber-600 text-white',
    dragHoverBg: 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 border-dashed',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300',
    badgeActive: 'bg-white/25 text-white',
  },
  obwf: {
    border: 'hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-950/30',
    activeBorder: 'border-purple-500 ring-4 ring-purple-500/30',
    activeBg: 'bg-purple-600 text-white',
    dragHoverBg: 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-400 border-dashed',
    badgeBg: 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300',
    badgeActive: 'bg-white/25 text-white',
  },
  vna: {
    border: 'hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30',
    activeBorder: 'border-emerald-500 ring-4 ring-emerald-500/30',
    activeBg: 'bg-emerald-600 text-white',
    dragHoverBg: 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 border-dashed',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300',
    badgeActive: 'bg-white/25 text-white',
  },
  obwi: {
    border: 'hover:border-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/30',
    activeBorder: 'border-rose-500 ring-4 ring-rose-500/30',
    activeBg: 'bg-rose-600 text-white',
    dragHoverBg: 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-400 border-dashed',
    badgeBg: 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300',
    badgeActive: 'bg-white/25 text-white',
  },
  unassigned: {
    border: 'hover:border-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/30',
    activeBorder: 'border-rose-600 ring-4 ring-rose-600/30',
    activeBg: 'bg-rose-700 text-white',
    dragHoverBg: 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-400 border-dashed',
    badgeBg: 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300',
    badgeActive: 'bg-white/25 text-white',
  },
};

export default function App() {
  const [operators, setOperators] = useState<Operator[]>(() => loadOperators());
  const [history, setHistory] = useState<MoveHistoryRecord[]>(() => loadHistory());
  const [undoStack, setUndoStack] = useState<UndoOperation[]>(() => loadUndoStack());

  // Search & View Mode
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'board' | 'widget' | 'table'>('board');

  // Auto-scroll state & container ref
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);

  // Modals state
  const [quickMoveOperator, setQuickMoveOperator] = useState<Operator | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isPhotoImportOpen, setIsPhotoImportOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isGoogleDriveModalOpen, setIsGoogleDriveModalOpen] = useState(false);
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [addEditOperator, setAddEditOperator] = useState<{
    operator: Operator | null;
    defaultDeptId?: DepartmentId;
  } | null>(null);

  // Monitor Google Drive authentication state for Header badge
  useEffect(() => {
    const unsub = initAuth(
      () => setIsDriveConnected(true),
      () => setIsDriveConnected(false)
    );
    return () => unsub();
  }, []);

  // Drag-and-drop hover state for quick top bar drop zones
  const [dragOverJumpDept, setDragOverJumpDept] = useState<DepartmentId | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    isWarning?: boolean;
    undoAction?: () => void;
  } | null>(null);

  // Persist operators, history & undo stack
  useEffect(() => {
    saveOperators(operators);
  }, [operators]);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  useEffect(() => {
    saveUndoStack(undoStack);
  }, [undoStack]);

  // Show auto-dismissing toast
  const showToast = (text: string, isWarning?: boolean, undoAction?: () => void) => {
    setToastMessage({ text, isWarning, undoAction });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // Smoothly scroll and highlight a department column
  const scrollToDepartment = useCallback((deptId: DepartmentId) => {
    const el = document.getElementById(`dept-col-${deptId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      el.classList.add('ring-4', 'ring-amber-400', 'dark:ring-amber-400', 'transition-all', 'duration-300');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-amber-400', 'dark:ring-amber-400');
      }, 1600);
    }
  }, []);

  // Single Undo operation (reverts the latest move)
  const handleUndoSingle = useCallback(() => {
    setUndoStack((currentStack) => {
      if (currentStack.length === 0) return currentStack;
      const [lastOp, ...remainingStack] = currentStack;

      setOperators((prevOperators) =>
        prevOperators.map((o) =>
          o.id === lastOp.operatorId
            ? {
                ...o,
                departmentId: lastOp.fromDept,
                status:
                  lastOp.fromStatus ??
                  (lastOp.fromDept === 'unassigned' ? 'absence' : 'active'),
                lastMovedAt: new Date().toISOString(),
              }
            : o
        )
      );

      const fromDept = getDepartmentById(lastOp.fromDept);
      const toDept = getDepartmentById(lastOp.toDept);

      const historyItem: MoveHistoryRecord = {
        id: `hist-undo-${Date.now()}`,
        operatorId: lastOp.operatorId,
        operatorName: lastOp.operatorName,
        machineType: lastOp.machineType,
        fromDept: lastOp.toDept,
        toDept: lastOp.fromDept,
        timestamp: new Date().toISOString(),
        reason: `Vrácení zpět: ${lastOp.operatorName} vrácen z ${toDept.name} do ${fromDept.name}`,
      };
      setHistory((prev) => [historyItem, ...prev]);

      scrollToDepartment(lastOp.fromDept);
      showToast(`Krok vrácen: ${lastOp.operatorName} je zpět v ${fromDept.name}`);

      return remainingStack;
    });
  }, [scrollToDepartment]);

  // Bulk Undo operation (reverts the last count operations, up to 5)
  const handleUndoBulk = useCallback((count: number) => {
    setUndoStack((currentStack) => {
      if (currentStack.length === 0) return currentStack;
      const countToRevert = Math.min(count, currentStack.length);
      const opsToRevert = currentStack.slice(0, countToRevert);
      const remainingStack = currentStack.slice(countToRevert);

      // Apply reversions in order from newest to oldest
      setOperators((prevOperators) => {
        let updated = [...prevOperators];
        for (const op of opsToRevert) {
          updated = updated.map((o) =>
            o.id === op.operatorId
              ? {
                  ...o,
                  departmentId: op.fromDept,
                  status:
                    op.fromStatus ??
                    (op.fromDept === 'unassigned' ? 'absence' : 'active'),
                  lastMovedAt: new Date().toISOString(),
                }
              : o
          );
        }
        return updated;
      });

      // Record bulk undo in history
      const historyEntries: MoveHistoryRecord[] = opsToRevert.map((op, i) => ({
        id: `hist-bulk-undo-${Date.now()}-${i}`,
        operatorId: op.operatorId,
        operatorName: op.operatorName,
        machineType: op.machineType,
        fromDept: op.toDept,
        toDept: op.fromDept,
        timestamp: new Date().toISOString(),
        reason: `Hromadné vrácení: obnoveno zpět do ${getDepartmentById(op.fromDept).name}`,
      }));
      setHistory((prev) => [...historyEntries, ...prev]);

      if (opsToRevert.length > 0) {
        scrollToDepartment(opsToRevert[0].fromDept);
      }

      showToast(`Hromadné vrácení dokončeno: ${countToRevert} operací vráceno zpět do původních oddělení.`);

      return remainingStack;
    });
  }, [scrollToDepartment]);

  // Keyboard shortcut: Ctrl+Z / Cmd+Z for quick undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        handleUndoSingle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndoSingle]);

  // Move operator handler with strict VNA rule & undo tracking
  const handleMoveOperator = (
    operatorId: string,
    targetDeptId: DepartmentId,
    reason?: string
  ) => {
    // Robust find: by id or full name
    const targetOp =
      operators.find((o) => o.id === operatorId) ||
      operators.find((o) => o.name.toLowerCase() === operatorId.trim().toLowerCase());
    if (!targetOp) return;

    const resolvedId = targetOp.id;

    // Auto-update status when moving to/from Absence department
    const newStatus: OperatorStatus =
      targetDeptId === 'unassigned'
        ? 'absence'
        : targetOp.departmentId === 'unassigned' || targetOp.status === 'absence'
        ? 'active'
        : targetOp.status;

    if (targetOp.departmentId === targetDeptId && targetOp.status === newStatus) return;

    const previousDeptId = targetOp.departmentId;
    const fromDept = getDepartmentById(previousDeptId);
    const toDept = getDepartmentById(targetDeptId);

    // Update operator
    const updatedOperators = operators.map((op) => {
      if (op.id === resolvedId) {
        return {
          ...op,
          departmentId: targetDeptId,
          status: newStatus,
          isVnaOnly: false,
          lastMovedAt: new Date().toISOString(),
        };
      }
      return op;
    });

    setOperators(updatedOperators);

    // Push into undo stack (capped at last 5 operations)
    const undoOp: UndoOperation = {
      id: `undo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      operatorId: resolvedId,
      operatorName: targetOp.name,
      machineType: targetOp.machineType,
      fromDept: previousDeptId,
      toDept: targetDeptId,
      fromStatus: targetOp.status,
      toStatus: newStatus,
      timestamp: new Date().toISOString(),
    };
    setUndoStack((prev) => [undoOp, ...prev.slice(0, 4)]);

    // Append to history
    const historyItem: MoveHistoryRecord = {
      id: `hist-${Date.now()}`,
      operatorId: resolvedId,
      operatorName: targetOp.name,
      machineType: targetOp.machineType,
      fromDept: previousDeptId,
      toDept: targetDeptId,
      timestamp: new Date().toISOString(),
      reason: reason || `Přesun z ${fromDept.name} do ${toDept.name}`,
    };
    setHistory((prev) => [historyItem, ...prev]);

    // Auto scroll to target department
    scrollToDepartment(targetDeptId);

    // Toast feedback with direct undo
    const msg = `Operátor ${targetOp.name} přesunut z ${fromDept.name} ➔ ${toDept.name}`;
    showToast(msg, false, () => {
      handleUndoSingle();
    });
  };

  // Jump bar drag-and-drop quick-move handlers
  const handleJumpPillDragOver = (e: React.DragEvent, deptId: DepartmentId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverJumpDept !== deptId) {
      setDragOverJumpDept(deptId);
    }
  };

  const handleJumpPillDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverJumpDept(null);
    }
  };

  const handleJumpPillDrop = (e: React.DragEvent, targetDeptId: DepartmentId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverJumpDept(null);

    const resolved = resolveOperatorFromDrop(e, operators);
    const operatorId =
      resolved?.id ||
      e.dataTransfer.getData('application/x-operator-id') ||
      e.dataTransfer.getData('text/plain') ||
      getGlobalDragState().operatorId;

    if (operatorId) {
      handleMoveOperator(operatorId, targetDeptId);
    }
  };

  // Edge auto-scrolling when dragging near horizontal board boundaries
  const handleBoardContainerDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!boardContainerRef.current) return;
    const container = boardContainerRef.current;
    const rect = container.getBoundingClientRect();
    const x = e.clientX;
    const edgeThreshold = 90;

    if (x > rect.right - edgeThreshold) {
      const scrollStep = Math.min(25, Math.max(8, (x - (rect.right - edgeThreshold)) / 2));
      container.scrollLeft += scrollStep;
    } else if (x < rect.left + edgeThreshold) {
      const scrollStep = Math.min(25, Math.max(8, (rect.left + edgeThreshold - x) / 2));
      container.scrollLeft -= scrollStep;
    }
  };

  // Change operator status (active, break, absence)
  const handleChangeStatus = (operatorId: string, newStatus: OperatorStatus) => {
    const targetOp = operators.find((o) => o.id === operatorId);
    if (!targetOp) return;

    // Moving to absence also moves to unassigned (Absence) department
    // Moving from absence to active/break moves back to previous department or hovc
    const targetDeptId: DepartmentId =
      newStatus === 'absence'
        ? 'unassigned'
        : targetOp.departmentId === 'unassigned'
        ? 'hovc'
        : targetOp.departmentId;

    const previousDeptId = targetOp.departmentId;
    const previousStatus = targetOp.status;

    setOperators((prev) =>
      prev.map((op) => {
        if (op.id === operatorId) {
          return {
            ...op,
            status: newStatus,
            departmentId: targetDeptId,
            lastMovedAt: new Date().toISOString(),
          };
        }
        return op;
      })
    );

    if (previousDeptId !== targetDeptId || previousStatus !== newStatus) {
      const undoOp: UndoOperation = {
        id: `undo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        operatorId,
        operatorName: targetOp.name,
        machineType: targetOp.machineType,
        fromDept: previousDeptId,
        toDept: targetDeptId,
        fromStatus: previousStatus,
        toStatus: newStatus,
        timestamp: new Date().toISOString(),
      };
      setUndoStack((prev) => [undoOp, ...prev.slice(0, 4)]);
    }

    const statusLabel =
      newStatus === 'active'
        ? 'aktivní v provozu na hale'
        : newStatus === 'break'
        ? 'na pauze'
        : 'v absenci / doma (odečteno z provozu)';
    showToast(`Stav operátora ${targetOp.name} byl změněn na: ${statusLabel}`);
  };

  // Apply shift template
  const handleApplyTemplate = (template: ShiftTemplate) => {
    const updated = applyTemplateToOperators(template, operators);
    setOperators(updated);
    showToast(`Šablona „${template.name}“ byla načtena do směny (${updated.length} lidí).`);
  };

  // Save (add or edit) operator
  const handleSaveOperator = (opData: Partial<Operator>) => {
    if (!opData.id) return;

    const finalStatus: OperatorStatus =
      opData.departmentId === 'unassigned'
        ? 'absence'
        : opData.status || 'active';
    const finalDeptId: DepartmentId =
      finalStatus === 'absence'
        ? 'unassigned'
        : opData.departmentId === 'unassigned'
        ? 'hovc'
        : (opData.departmentId || 'hovc');

    const sanitizedOpData = {
      ...opData,
      status: finalStatus,
      departmentId: finalDeptId,
    };

    const isNew = !operators.some((o) => o.id === sanitizedOpData.id);

    setOperators((prev) => {
      const exists = prev.some((o) => o.id === sanitizedOpData.id);
      if (exists) {
        return prev.map((o) => (o.id === sanitizedOpData.id ? ({ ...o, ...sanitizedOpData } as Operator) : o));
      } else {
        return [sanitizedOpData as Operator, ...prev];
      }
    });

    if (sanitizedOpData.departmentId) {
      scrollToDepartment(sanitizedOpData.departmentId);
    }

    if (isNew) {
      showToast(`Operátor ${sanitizedOpData.name} byl úspěšně přidán do oddělení.`);
    } else {
      showToast(`Údaje operátora ${sanitizedOpData.name} uloženy.`);
    }
  };

  // Import operators from photo OCR or text list
  const handleImportOperators = (newOps: Operator[], replaceAll: boolean) => {
    if (replaceAll) {
      setOperators(newOps);
      showToast(`Načteno ${newOps.length} operátorů ze snímku. Seznam byl přepsán.`);
    } else {
      setOperators((prev) => [...newOps, ...prev]);
      showToast(`Přidáno ${newOps.length} operátorů ze snímku k existujícímu týmu.`);
    }
    setIsPhotoImportOpen(false);
  };

  // Delete operator
  const handleDeleteOperator = (operatorId: string) => {
    const op = operators.find((o) => o.id === operatorId);
    setOperators((prev) => prev.filter((o) => o.id !== operatorId));
    if (op) {
      showToast(`Operátor ${op.name} byl odebrán.`);
    }
  };

  // Reset to initial 65 operators
  const handleResetData = () => {
    if (
      confirm(
        'Opravdu chcete obnovit stav na původních 65 operátorů ZF PICK? Všechny úpravy budou resetovány.'
      )
    ) {
      const reset = resetToInitialOperators();
      setOperators(reset);
      setHistory([]);
      setUndoStack([]);
      showToast('Data obnovena na 65 operátorů oddělení PICK.');
    }
  };

  // Drag-and-drop auto-scroll: automatically scrolls horizontal columns when dragging near edge
  useEffect(() => {
    if (viewMode !== 'board') return;

    const container = boardContainerRef.current;
    if (!container) return;

    let animationFrameId: number | null = null;
    let scrollSpeed = 0;

    const stopScroll = () => {
      scrollSpeed = 0;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };

    const step = () => {
      if (container && scrollSpeed !== 0) {
        container.scrollLeft += scrollSpeed;
        animationFrameId = requestAnimationFrame(step);
      } else {
        animationFrameId = null;
      }
    };

    const handleDragOver = (e: DragEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX;
      const edgeThreshold = 110; // px distance from left/right container edge

      if (x >= rect.left - 20 && x <= rect.left + edgeThreshold) {
        // Dragging near left edge: scroll left
        const distance = Math.max(0, x - rect.left);
        const ratio = 1 - distance / edgeThreshold;
        scrollSpeed = -Math.max(4, ratio * 24);
      } else if (x <= rect.right + 20 && x >= rect.right - edgeThreshold) {
        // Dragging near right edge: scroll right
        const distance = Math.max(0, rect.right - x);
        const ratio = 1 - distance / edgeThreshold;
        scrollSpeed = Math.max(4, ratio * 24);
      } else {
        scrollSpeed = 0;
      }

      if (scrollSpeed !== 0 && animationFrameId === null) {
        animationFrameId = requestAnimationFrame(step);
      } else if (scrollSpeed === 0 && animationFrameId !== null) {
        stopScroll();
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragend', stopScroll);
    window.addEventListener('drop', stopScroll);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragend', stopScroll);
      window.removeEventListener('drop', stopScroll);
      stopScroll();
    };
  }, [viewMode]);

  // Continuous hands-free auto-scroll (e.g. for TV display or warehouse dashboard wallboards)
  useEffect(() => {
    if (!isAutoScrolling || viewMode !== 'board') return;

    const container = boardContainerRef.current;
    if (!container) return;

    let rafId: number | null = null;
    let pauseUntil = 0;
    let direction = 1; // 1 = right, -1 = left

    const tick = (now: number) => {
      if (now < pauseUntil) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      if (container) {
        const maxScroll = container.scrollWidth - container.clientWidth;
        if (maxScroll > 10) {
          container.scrollLeft += direction * 0.9;

          if (direction === 1 && container.scrollLeft >= maxScroll - 3) {
            direction = -1;
            pauseUntil = now + 2500; // pause for 2.5s at right end
          } else if (direction === -1 && container.scrollLeft <= 3) {
            direction = 1;
            pauseUntil = now + 2500; // pause for 2.5s at left end
          }
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [isAutoScrolling, viewMode]);

  // Filtered operators by search (name, machineType, department, notes)
  const filteredOperators = useMemo(() => {
    if (!searchQuery.trim()) return operators;

    const q = searchQuery.toLowerCase().trim();
    return operators.filter((op) => {
      const matchesName = op.name.toLowerCase().includes(q);
      const matchesMachine = op.machineType.toLowerCase() === q;
      const matchesNotes = op.notes?.toLowerCase().includes(q);
      const dept = getDepartmentById(op.departmentId);
      const matchesDept = dept.name.toLowerCase().includes(q);

      return matchesName || matchesMachine || matchesNotes || matchesDept;
    });
  }, [operators, searchQuery]);

  // Key metrics - accurate calculations for floor operation and absence
  const isOperatorInOperation = (o: Operator) =>
    o.departmentId !== 'unassigned' && o.status === 'active';
  const isOperatorInAbsence = (o: Operator) =>
    o.departmentId === 'unassigned' || o.status === 'absence';

  const totalCount = operators.length;
  const activeCount = operators.filter(isOperatorInOperation).length;
  const absenceCount = operators.filter(isOperatorInAbsence).length;
  const breakCount = operators.filter(
    (o) => o.departmentId !== 'unassigned' && o.status === 'break'
  ).length;
  const llCount = operators.filter((o) => o.machineType === 'LL' && isOperatorInOperation(o)).length;
  const rtrCount = operators.filter((o) => o.machineType === 'RTR' && isOperatorInOperation(o)).length;
  const vnaCount = operators.filter((o) => o.departmentId === 'vna' && isOperatorInOperation(o)).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Application Header with Global Undo & Auto-scroll */}
      <Header
        totalCount={totalCount}
        activeCount={activeCount}
        llCount={llCount}
        rtrCount={rtrCount}
        vnaCount={vnaCount}
        absenceCount={absenceCount}
        searchQuery={searchQuery}
        viewMode={viewMode}
        undoOperations={undoStack}
        onUndoSingle={handleUndoSingle}
        onUndoBulk={handleUndoBulk}
        isAutoScrolling={isAutoScrolling}
        onToggleAutoScroll={() => setIsAutoScrolling((prev) => !prev)}
        onSearchChange={setSearchQuery}
        onViewModeChange={setViewMode}
        onOpenAddModal={() => setAddEditOperator({ operator: null, defaultDeptId: 'hovc' })}
        onOpenPhotoImport={() => setIsPhotoImportOpen(true)}
        onOpenTemplatesModal={() => setIsTemplatesModalOpen(true)}
        onOpenGoogleDriveModal={() => setIsGoogleDriveModalOpen(true)}
        isDriveConnected={isDriveConnected}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
        onResetData={handleResetData}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* PICK Overview & Quick Report for Boss */}
        <BossAnswerCard
          operators={operators}
          onOpenReportModal={() => setIsReportModalOpen(true)}
        />

        {/* View Mode 1: Department Columns (Board) */}
        {viewMode === 'board' && (
          <div className="space-y-3">
            {/* Quick jump & Drag-to-move pills bar (Sticky drop target) */}
            <div
              className={`sticky top-2 z-20 transition-all rounded-2xl py-2 px-3 border shadow-xs backdrop-blur-md ${
                dragOverJumpDept
                  ? 'bg-blue-50/95 dark:bg-slate-900/95 border-blue-400 dark:border-blue-600 ring-2 ring-blue-400/30 shadow-md'
                  : 'bg-white/95 dark:bg-slate-900/95 border-slate-200/80 dark:border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 scrollbar-none">
                <span className="text-xs font-bold shrink-0 flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mr-0.5">
                  <Move className="w-3 h-3 hidden sm:inline" />
                  <span>Přesun / Skok:</span>
                </span>

                {DEPARTMENTS.map((dept) => {
                  const count = filteredOperators.filter((o) => o.departmentId === dept.id).length;
                  const isHovered = dragOverJumpDept === dept.id;
                  const theme = JUMP_THEMES[dept.id];

                  return (
                    <button
                      key={dept.id}
                      id={`jump-btn-${dept.id}`}
                      onClick={() => {
                        scrollToDepartment(dept.id);
                      }}
                      onDragOver={(e) => handleJumpPillDragOver(e, dept.id)}
                      onDragLeave={handleJumpPillDragLeave}
                      onDrop={(e) => handleJumpPillDrop(e, dept.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all border shadow-2xs flex items-center gap-1.5 cursor-pointer select-none ${
                        isHovered
                          ? `${theme.activeBg} ${theme.activeBorder} scale-110 shadow-lg z-30 ring-4`
                          : `bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700/80 ${theme.border} active:scale-95`
                      }`}
                      title={`Kliknutím přeskočit na ${dept.name} • Přetažením operátora sem jej okamžitě přesunete`}
                    >
                      <span className="pointer-events-none flex items-center gap-1">
                        {isHovered && <ArrowDownToLine className="w-3.5 h-3.5 animate-bounce" />}
                        <span>{dept.name}</span>
                      </span>
                      <span
                        className={`pointer-events-none text-[11px] px-1.5 py-0.2 rounded-full font-extrabold transition-colors ${
                          isHovered ? theme.badgeActive : theme.badgeBg
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}

                {/* Quick Auto-scroll toggle in Jump bar */}
                <button
                  id="jump-bar-autoscroll-btn"
                  onClick={() => setIsAutoScrolling((prev) => !prev)}
                  className={`ml-auto px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all border flex items-center gap-1.5 active:scale-95 ${
                    isAutoScrolling
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm animate-pulse'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300'
                  }`}
                  title={
                    isAutoScrolling
                      ? 'Zastavit plynulý posuv sloupců'
                      : 'Plynulý automatický posuv sloupců (hands-free pro TV/nástěnku)'
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
              </div>
            </div>

            {/* Notice bar */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Pododdělení PICK:
                </span>
                <span>
                  Přetáhněte kartu operátora <strong>přímo na horní tlačítko oddělení (HOVC, HOVS, OBWF...)</strong> pro okamžitý přesun, nebo na samotný sloupec. K dispozici je také tlačítko „Přesunout“ a klávesová zkratka <strong>Ctrl+Z</strong> pro vrácení zpět.
                </span>
              </div>
              {searchQuery && (
                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded">
                  Filtrováno: {filteredOperators.length} z {operators.length} operátorů
                </span>
              )}
            </div>

            {/* Horizontal scrollable columns: HOVC, HOVS, Putaway, VAS, OBWF, VNA, OBWI */}
            <div
              id="board-columns-container"
              ref={boardContainerRef}
              onDragOver={handleBoardContainerDragOver}
              className="flex gap-4 overflow-x-auto pb-4 pt-1 items-start scrollbar-thin scroll-smooth"
            >
              {DEPARTMENTS.map((dept) => {
                const deptOps = filteredOperators.filter((o) => o.departmentId === dept.id);

                return (
                  <DepartmentColumn
                    key={dept.id}
                    department={dept}
                    operators={deptOps}
                    allOperators={operators}
                    totalOperatorsCount={filteredOperators.length}
                    onOpenQuickMove={(op) => setQuickMoveOperator(op)}
                    onEditOperator={(op) => setAddEditOperator({ operator: op })}
                    onChangeStatus={handleChangeStatus}
                    onAddOperatorToDept={(deptId) =>
                      setAddEditOperator({ operator: null, defaultDeptId: deptId })
                    }
                    onDropOperator={(operatorId, targetDeptId) =>
                      handleMoveOperator(operatorId, targetDeptId)
                    }
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* View Mode 2: Phone Wallpaper Widget View */}
        {viewMode === 'widget' && (
          <WidgetView
            operators={filteredOperators}
            onSelectDepartment={() => {
              setViewMode('board');
            }}
          />
        )}

        {/* View Mode 3: Table View */}
        {viewMode === 'table' && (
          <TableView
            operators={filteredOperators}
            onOpenQuickMove={(op) => setQuickMoveOperator(op)}
            onEditOperator={(op) => setAddEditOperator({ operator: op })}
            onChangeDepartment={(operatorId, targetDeptId) =>
              handleMoveOperator(operatorId, targetDeptId)
            }
            onChangeStatus={handleChangeStatus}
            onDeleteOperator={handleDeleteOperator}
          />
        )}
      </main>

      {/* Floating Bottom Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-medium ${
              toastMessage.isWarning
                ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800'
                : 'bg-slate-900/95 dark:bg-white text-white dark:text-slate-900 border-slate-700/60 dark:border-slate-300'
            }`}
          >
            {toastMessage.isWarning ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-emerald-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
            {toastMessage.undoAction && (
              <button
                onClick={toastMessage.undoAction}
                className="ml-2 px-2.5 py-1 text-xs font-black rounded-lg bg-white/20 dark:bg-slate-900/20 hover:bg-white/30 dark:hover:bg-slate-900/30 transition-colors"
              >
                Vrátit zpět
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick Move Operator Modal */}
      {quickMoveOperator && (
        <QuickMoveModal
          isOpen={Boolean(quickMoveOperator)}
          operator={quickMoveOperator}
          operators={operators}
          onClose={() => setQuickMoveOperator(null)}
          onMove={(targetDeptId) => {
            handleMoveOperator(quickMoveOperator.id, targetDeptId);
            setQuickMoveOperator(null);
          }}
        />
      )}

      {/* Boss Shift Report Export Modal */}
      {isReportModalOpen && (
        <BossReportModal
          isOpen={isReportModalOpen}
          operators={operators}
          onClose={() => setIsReportModalOpen(false)}
          onOpenGoogleDrive={() => setIsGoogleDriveModalOpen(true)}
        />
      )}

      {/* Move Audit History Modal */}
      {isHistoryModalOpen && (
        <HistoryModal
          isOpen={isHistoryModalOpen}
          history={history}
          onClose={() => setIsHistoryModalOpen(false)}
          onClearHistory={() => setHistory([])}
        />
      )}

      {/* Add / Edit Operator Modal */}
      {addEditOperator && (
        <AddEditOperatorModal
          isOpen={Boolean(addEditOperator)}
          operator={addEditOperator.operator}
          defaultDeptId={addEditOperator.defaultDeptId}
          onClose={() => setAddEditOperator(null)}
          onSave={handleSaveOperator}
          onDelete={handleDeleteOperator}
        />
      )}

      {/* Photo OCR Import Modal */}
      {isPhotoImportOpen && (
        <PhotoImportModal
          isOpen={isPhotoImportOpen}
          onClose={() => setIsPhotoImportOpen(false)}
          onImportOperators={handleImportOperators}
          currentCount={operators.length}
        />
      )}

      {/* Shift Templates Modal */}
      {isTemplatesModalOpen && (
        <ShiftTemplatesModal
          isOpen={isTemplatesModalOpen}
          onClose={() => setIsTemplatesModalOpen(false)}
          currentOperators={operators}
          onApplyTemplate={handleApplyTemplate}
        />
      )}

      {/* Google Drive Integration Modal (Backups, Reports, Cloud Sync) */}
      <GoogleDriveModal
        isOpen={isGoogleDriveModalOpen}
        onClose={() => setIsGoogleDriveModalOpen(false)}
        operators={operators}
        onRestoreOperators={(restoredOps) => {
          setOperators(restoredOps);
          saveOperators(restoredOps);
          showToast(`Obsazení směny obnoveno z Google Disku (${restoredOps.length} operátorů).`);
        }}
        showToast={(msg, type) => showToast(msg, type === 'error')}
      />
    </div>
  );
}
