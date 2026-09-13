import React, { useState, useEffect } from 'react';
import {
  X,
  HardDrive,
  Upload,
  Download,
  Trash2,
  ExternalLink,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  Database,
  CheckCircle2,
  AlertCircle,
  FolderPlus,
  Loader2,
  LogOut,
  FolderArchive,
  ShieldCheck,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  googleSignIn,
  logout,
  getAccessToken,
  getCurrentUser,
  initAuth,
} from '../services/googleDriveAuth';
import {
  listDriveFiles,
  getOrCreateFolder,
  uploadFileToDrive,
  downloadFileContent,
  deleteDriveFile,
  DriveFileItem,
  getDriveAbout,
  DriveAboutInfo,
} from '../services/googleDriveApi';
import { Operator } from '../types';
import { DEPARTMENTS } from '../data/departments';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  operators: Operator[];
  onRestoreOperators: (operators: Operator[]) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  operators,
  onRestoreOperators,
  showToast,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(getCurrentUser());
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [aboutInfo, setAboutInfo] = useState<DriveAboutInfo | null>(null);

  // Drive files & folder state
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);

  // Destructive Confirmation Dialog State
  const [confirmDeleteFile, setConfirmDeleteFile] = useState<DriveFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [confirmRestoreFile, setConfirmRestoreFile] = useState<DriveFileItem | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
      },
      () => {
        // Not signed in or token cleared
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch files and folder when access token changes
  useEffect(() => {
    if (isOpen && accessToken) {
      loadDriveData(accessToken);
    }
  }, [isOpen, accessToken]);

  const loadDriveData = async (token: string) => {
    setIsLoadingFiles(true);
    try {
      const [fId, about] = await Promise.all([
        getOrCreateFolder(token).catch((e) => {
          console.warn('Folder creation error:', e);
          return null;
        }),
        getDriveAbout(token).catch(() => null),
      ]);

      if (about) setAboutInfo(about);
      if (fId) setFolderId(fId);

      const fileList = await listDriveFiles(token, fId || undefined);
      setFiles(fileList);
    } catch (err: any) {
      console.error('Error loading Drive data:', err);
      showToast(
        err.message || 'Nepodařilo se načíst soubory z Google Disku. Zkontrolujte oprávnění.',
        'error'
      );
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setAccessToken(result.accessToken);
        showToast('Přihlášení k Google Disku proběhlo úspěšně!', 'success');
        await loadDriveData(result.accessToken);
      }
    } catch (err: any) {
      console.error('Google Sign in failed:', err);
      showToast(
        err.message || 'Přihlášení selhalo. Zkontrolujte, zda máte povolená vyskakovací okna.',
        'error'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setCurrentUser(null);
      setAccessToken(null);
      setFiles([]);
      setFolderId(null);
      setAboutInfo(null);
      showToast('Byli jste odhlášeni z Google Disku.', 'info');
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // 1. Upload Full Shift State (JSON Backup)
  const handleBackupShiftState = async () => {
    if (!accessToken) {
      showToast('Nejprve se přihlaste ke Google Disku.', 'info');
      return;
    }
    setIsUploading('json');
    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      const timeStr = new Date().toTimeString().slice(0, 5).replace(':', '-');
      const fileName = `ZF_Operativa_Zaloha_${dateStr}_${timeStr}.json`;

      const backupPayload = {
        exportedAt: new Date().toISOString(),
        appName: 'ZF Operativa Ostrov',
        version: '1.0',
        totalOperators: operators.length,
        activeCount: operators.filter(
          (o) => o.departmentId !== 'unassigned' && o.status === 'active'
        ).length,
        absenceCount: operators.filter(
          (o) => o.departmentId === 'unassigned' || o.status === 'absence'
        ).length,
        operators,
      };

      const targetFolder = folderId || (await getOrCreateFolder(accessToken));
      const uploaded = await uploadFileToDrive(accessToken, {
        fileName,
        content: JSON.stringify(backupPayload, null, 2),
        mimeType: 'application/json',
        folderId: targetFolder,
        description: 'Záloha operátorů a obsazení směny z aplikace ZF Operativa Ostrov',
      });

      setFiles((prev) => [uploaded, ...prev.filter((f) => f.id !== uploaded.id)]);
      showToast(`Záloha směny uložena na Google Disk (${fileName}).`, 'success');
    } catch (err: any) {
      console.error('Backup failed:', err);
      showToast(err.message || 'Uložení na Google Disk selhalo.', 'error');
    } finally {
      setIsUploading(null);
    }
  };

  // 2. Upload Management Report (TXT)
  const handleUploadBossReport = async () => {
    if (!accessToken) {
      showToast('Nejprve se přihlaste ke Google Disku.', 'info');
      return;
    }
    setIsUploading('report');
    try {
      const now = new Date();
      const dateStr = now.toLocaleDateString('cs-CZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      const timeStr = now.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
      const fileDate = now.toISOString().slice(0, 10);
      const fileTime = now.toTimeString().slice(0, 5).replace(':', '-');
      const fileName = `ZF_PICK_Hlaseni_${fileDate}_${fileTime}.txt`;

      const activeOps = operators.filter(
        (o) => o.departmentId !== 'unassigned' && o.status === 'active'
      );
      const absenceOps = operators.filter(
        (o) => o.departmentId === 'unassigned' || o.status === 'absence'
      );
      const llTotal = activeOps.filter((o) => o.machineType === 'LL').length;
      const rtrTotal = activeOps.filter((o) => o.machineType === 'RTR').length;

      let report = `📋 HLÁŠENÍ ODDĚLENÍ PICK - ZF AFTERMARKET OSTROV\n`;
      report += `Datum a čas: ${dateStr} v ${timeStr}\n`;
      report += `V provozu na hale: ${activeOps.length} lidí (z celkem ${operators.length} | ${llTotal}× LL, ${rtrTotal}× RTR)\n`;
      report += `--------------------------------------------------------\n\n`;

      DEPARTMENTS.filter((d) => d.id !== 'unassigned').forEach((dept) => {
        const deptOps = operators.filter(
          (o) => o.departmentId === dept.id && o.status !== 'absence'
        );
        const ll = deptOps.filter((o) => o.machineType === 'LL').length;
        const rtr = deptOps.filter((o) => o.machineType === 'RTR').length;
        report += `• ${dept.name} (${dept.code}): ${deptOps.length} lidí (${ll}× LL, ${rtr}× RTR)\n`;
        if (deptOps.length > 0) {
          report += `  Operátoři: ${deptOps.map((o) => `${o.name} [${o.machineType}]`).join(', ')}\n`;
        }
      });

      if (absenceOps.length > 0) {
        report += `\n• Absence / Doma: ${absenceOps.length} lidí\n`;
        report += `  ${absenceOps.map((o) => `${o.name} [${o.machineType}]`).join(', ')}\n`;
      }

      report += `\n--------------------------------------------------------\n`;
      report += `Generováno z aplikace ZF Operativa Ostrov • Uloženo na Google Disk uživatele ${
        currentUser?.email || ''
      }\n`;

      const targetFolder = folderId || (await getOrCreateFolder(accessToken));
      const uploaded = await uploadFileToDrive(accessToken, {
        fileName,
        content: report,
        mimeType: 'text/plain',
        folderId: targetFolder,
        description: 'Denní hlášení obsazení oddělení PICK pro vedení ZF Ostrov',
      });

      setFiles((prev) => [uploaded, ...prev.filter((f) => f.id !== uploaded.id)]);
      showToast(`Hlášení pro vedení uloženo na Google Disk (${fileName}).`, 'success');
    } catch (err: any) {
      console.error('Report upload failed:', err);
      showToast(err.message || 'Uložení hlášení na Google Disk selhalo.', 'error');
    } finally {
      setIsUploading(null);
    }
  };

  // 3. Upload CSV Export
  const handleUploadCsvExport = async () => {
    if (!accessToken) {
      showToast('Nejprve se přihlaste ke Google Disku.', 'info');
      return;
    }
    setIsUploading('csv');
    try {
      const now = new Date();
      const fileDate = now.toISOString().slice(0, 10);
      const fileTime = now.toTimeString().slice(0, 5).replace(':', '-');
      const fileName = `ZF_PICK_Soupiska_${fileDate}_${fileTime}.csv`;

      const headers = ['ID', 'Jméno', 'Oddělení', 'Stav', 'Stroj', 'VNA Oprávnění', 'Poznámka'];
      const rows = operators.map((o) => {
        const dept = DEPARTMENTS.find((d) => d.id === o.departmentId)?.name || o.departmentId;
        const statusLabel = o.status === 'active' ? 'V provozu' : 'Absence/Doma';
        return [
          `"${o.id}"`,
          `"${o.name}"`,
          `"${dept}"`,
          `"${statusLabel}"`,
          `"${o.machineType}"`,
          `"${o.canVna ? 'ANO' : 'NE'}"`,
          `"${(o.notes || '').replace(/"/g, '""')}"`,
        ].join(';');
      });

      const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');

      const targetFolder = folderId || (await getOrCreateFolder(accessToken));
      const uploaded = await uploadFileToDrive(accessToken, {
        fileName,
        content: csvContent,
        mimeType: 'text/csv',
        folderId: targetFolder,
        description: 'Soupiska operátorů směny ZF PICK ve formátu CSV pro Excel',
      });

      setFiles((prev) => [uploaded, ...prev.filter((f) => f.id !== uploaded.id)]);
      showToast(`CSV soupiska uložena na Google Disk (${fileName}).`, 'success');
    } catch (err: any) {
      console.error('CSV upload failed:', err);
      showToast(err.message || 'Uložení CSV tabulky na Google Disk selhalo.', 'error');
    } finally {
      setIsUploading(null);
    }
  };

  // 4. Restore Shift State from Drive Backup (Destructive operation with confirmation modal)
  const handleConfirmRestore = async () => {
    if (!confirmRestoreFile || !accessToken) return;
    setIsRestoring(true);
    try {
      const content = await downloadFileContent(accessToken, confirmRestoreFile.id);
      const parsed = JSON.parse(content);

      if (parsed && Array.isArray(parsed.operators) && parsed.operators.length > 0) {
        onRestoreOperators(parsed.operators);
        showToast(
          `Obsazení směny bylo úspěšně obnoveno ze souboru ${confirmRestoreFile.name} (${parsed.operators.length} operátorů).`,
          'success'
        );
        setConfirmRestoreFile(null);
        onClose();
      } else {
        throw new Error('Vybraný soubor neobsahuje platnou strukturu zálohy operátorů.');
      }
    } catch (err: any) {
      console.error('Restore error:', err);
      showToast(err.message || 'Nepodařilo se obnovit data ze zálohy.', 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  // 5. Delete File from Drive (Destructive operation with confirmation modal)
  const handleConfirmDelete = async () => {
    if (!confirmDeleteFile || !accessToken) return;
    setIsDeleting(true);
    try {
      await deleteDriveFile(accessToken, confirmDeleteFile.id);
      setFiles((prev) => prev.filter((f) => f.id !== confirmDeleteFile.id));
      showToast(`Soubor ${confirmDeleteFile.name} byl smazán z Google Disku.`, 'success');
      setConfirmDeleteFile(null);
    } catch (err: any) {
      console.error('Delete error:', err);
      showToast(err.message || 'Smazání souboru selhalo.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="google-drive-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="google-drive-modal-dialog"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Google Disk • ZF Operativa
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-700">
                  Cloud Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ukládání reportů pro vedení, zálohy a načítání stavu směny přímo z Disku
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

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* User Auth Section */}
          {!currentUser || !accessToken ? (
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <HardDrive className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Připojte svůj Google účet pro synchronizaci s Diskem
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Aplikace získá s vaším souhlasem oprávnění bezpečně ukládat zprávy pro vedení,
                  archivovat zálohy rozdělení operátorů a načítat uložené stavy z vaší složky.
                </p>
              </div>

              {/* Official Google Sign In Button */}
              <div className="pt-2 flex justify-center">
                <button
                  id="google-drive-sign-in-btn"
                  disabled={isSigningIn}
                  onClick={handleSignIn}
                  className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all active:scale-98 disabled:opacity-60 cursor-pointer"
                >
                  {isSigningIn ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <span>Připojování ke Google Disku...</span>
                    </>
                  ) : (
                    <>
                      {/* Official Google Icon SVG */}
                      <svg
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 48 48"
                        className="w-5 h-5 block"
                      >
                        <path
                          fill="#EA4335"
                          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                        />
                        <path
                          fill="#4285F4"
                          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                        />
                        <path
                          fill="#34A853"
                          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                        />
                      </svg>
                      <span>Přihlásit se přes Google účet</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Bezpečné ověření přes oficiální Google Workspace API</span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Google Avatar'}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full border-2 border-emerald-400"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {currentUser.displayName || 'Připojený uživatel'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.2 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      Připojeno k Disku
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{currentUser.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  id="google-drive-refresh-btn"
                  onClick={() => accessToken && loadDriveData(accessToken)}
                  disabled={isLoadingFiles}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center gap-1.5 transition-colors"
                  title="Obnovit soubory"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                  <span>Obnovit</span>
                </button>
                <button
                  id="google-drive-sign-out-btn"
                  onClick={handleSignOut}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1.5 transition-colors"
                  title="Odhlásit z Google účtu"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Odhlásit</span>
                </button>
              </div>
            </div>
          )}

          {/* Direct Upload Actions (Enabled when signed in) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                Rychlé uložení na Google Disk
              </h3>
              <span className="text-[11px] text-slate-400">
                Cílová složka:{' '}
                <strong className="text-slate-600 dark:text-slate-300">
                  ZF Operativa Ostrov - Zálohy a reporty
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Button 1: Save JSON Full Backup */}
              <button
                id="drive-backup-json-btn"
                disabled={!accessToken || isUploading !== null}
                onClick={handleBackupShiftState}
                className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 text-left transition-all group disabled:opacity-50 disabled:cursor-not-allowed flex flex-col justify-between"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    {isUploading === 'json' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Database className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-200/60 dark:bg-blue-900/70 px-1.5 py-0.5 rounded">
                    JSON
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                    Záloha stavu směny
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Uloží všech {operators.length} operátorů a jejich aktuální pozice pro možnost
                    pozdějšího obnovení.
                  </p>
                </div>
              </button>

              {/* Button 2: Save Management Report TXT */}
              <button
                id="drive-upload-report-btn"
                disabled={!accessToken || isUploading !== null}
                onClick={handleUploadBossReport}
                className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/40 text-left transition-all group disabled:opacity-50 disabled:cursor-not-allowed flex flex-col justify-between"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    {isUploading === 'report' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-200/60 dark:bg-indigo-900/70 px-1.5 py-0.5 rounded">
                    TXT
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                    Hlášení pro vedení
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Vygeneruje přehledný textový zápis obsazení haly pro archív mistrů a vedení.
                  </p>
                </div>
              </button>

              {/* Button 3: Save CSV Export */}
              <button
                id="drive-upload-csv-btn"
                disabled={!accessToken || isUploading !== null}
                onClick={handleUploadCsvExport}
                className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40 text-left transition-all group disabled:opacity-50 disabled:cursor-not-allowed flex flex-col justify-between"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    {isUploading === 'csv' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-200/60 dark:bg-emerald-900/70 px-1.5 py-0.5 rounded">
                    CSV / Excel
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                    Tabulková soupiska
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Uloží strukturovanou tabulku pro snadné otevření v Google Tabulkách nebo MS Excel.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Files List in Google Drive */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <FolderArchive className="w-4 h-4 text-amber-500" />
                Uložené soubory na Google Disku ({files.length})
              </h3>
              {accessToken && (
                <span className="text-[11px] text-slate-400">
                  {isLoadingFiles ? 'Načítání...' : 'Aktuální obsah složky'}
                </span>
              )}
            </div>

            {!accessToken ? (
              <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-slate-400">
                <HardDrive className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">Po přihlášení se zde zobrazí soubory z vašeho Google Disku.</p>
              </div>
            ) : isLoadingFiles ? (
              <div className="p-8 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span>Načítání souborů z Google Disku...</span>
              </div>
            ) : files.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-slate-400 space-y-2">
                <FolderPlus className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs">Zatím zde nejsou žádné uložené zálohy ani hlášení.</p>
                <p className="text-[11px] text-slate-400">
                  Použijte výše uvedená tlačítka pro uložení první zálohy nebo zprávy.
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800/80 max-h-60 overflow-y-auto">
                {files.map((file) => {
                  const isJson = file.name.endsWith('.json');
                  const isCsv = file.name.endsWith('.csv');
                  const modified = file.modifiedTime
                    ? new Date(file.modifiedTime).toLocaleString('cs-CZ', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Neznámé datum';

                  return (
                    <div
                      key={file.id}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                          {isJson ? (
                            <Database className="w-4 h-4 text-blue-500" />
                          ) : isCsv ? (
                            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <FileText className="w-4 h-4 text-indigo-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {file.name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Upraveno: {modified}
                            {file.size && ` • ${(parseInt(file.size, 10) / 1024).toFixed(1)} KB`}
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Open in Google Drive */}
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                            title="Otevřít na Google Disku"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {/* Restore shift from JSON backup */}
                        {isJson && (
                          <button
                            onClick={() => setConfirmRestoreFile(file)}
                            className="px-2 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors flex items-center gap-1"
                            title="Načíst a obnovit rozdělení směny z tohoto souboru"
                          >
                            <Download className="w-3 h-3" />
                            <span>Obnovit</span>
                          </button>
                        )}

                        {/* Delete from Drive (triggers required confirmation modal) */}
                        <button
                          onClick={() => setConfirmDeleteFile(file)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Smazat soubor z Google Disku"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            ZF Operativa PICK • Integrace s Google Workspace API
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
          >
            Zavřít
          </button>
        </div>
      </div>

      {/* MANDATORY CONFIRMATION DIALOG 1: Deleting File from Google Drive */}
      {confirmDeleteFile && (
        <div
          id="delete-drive-file-dialog-backdrop"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
          onClick={() => !isDeleting && setConfirmDeleteFile(null)}
        >
          <div
            id="delete-drive-file-dialog"
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-rose-200 dark:border-rose-900 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Smazat soubor z Google Disku?
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Opravdu si přejete trvale odstranit soubor{' '}
                  <strong className="text-rose-600 dark:text-rose-400 font-mono">
                    {confirmDeleteFile.name}
                  </strong>{' '}
                  z vašeho Google Disku? Tuto akci nelze vrátit zpět.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                disabled={isDeleting}
                onClick={() => setConfirmDeleteFile(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Zrušit
              </button>
              <button
                id="confirm-delete-drive-file-btn"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition-colors flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mazání...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ano, smazat z Disku</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY CONFIRMATION DIALOG 2: Restoring Shift from Google Drive Backup */}
      {confirmRestoreFile && (
        <div
          id="restore-shift-dialog-backdrop"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
          onClick={() => !isRestoring && setConfirmRestoreFile(null)}
        >
          <div
            id="restore-shift-dialog"
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-blue-200 dark:border-blue-900 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Načíst rozdělení směny ze zálohy?
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Opravdu chcete načíst zálohu{' '}
                  <strong className="text-blue-600 dark:text-blue-400 font-mono">
                    {confirmRestoreFile.name}
                  </strong>
                  ? Aktuální rozdělení operátorů a jejich stavy na ploše budou přepsány daty z této
                  zálohy.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                disabled={isRestoring}
                onClick={() => setConfirmRestoreFile(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Zrušit
              </button>
              <button
                id="confirm-restore-drive-file-btn"
                disabled={isRestoring}
                onClick={handleConfirmRestore}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors flex items-center gap-1.5"
              >
                {isRestoring ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Načítání...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Načíst a přepsat stav</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
