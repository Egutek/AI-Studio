import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Camera,
  FileText,
  Sparkles,
  Check,
  AlertCircle,
  Trash2,
  Plus,
  Lock,
  ArrowRight,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { DepartmentId, MachineType, Operator } from '../types';
import { DEPARTMENTS, getDepartmentById } from '../data/departments';

interface PhotoImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportOperators: (newOperators: Operator[], replaceAll: boolean) => void;
  currentCount: number;
}

interface DraftOperator {
  tempId: string;
  name: string;
  machineType: MachineType;
  departmentId: DepartmentId;
  notes?: string;
}

export const PhotoImportModal: React.FC<PhotoImportModalProps> = ({
  isOpen,
  onClose,
  onImportOperators,
  currentCount,
}) => {
  const [activeTab, setActiveTab] = useState<'photo' | 'text'>('photo');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');
  const [imageFileName, setImageFileName] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractedList, setExtractedList] = useState<DraftOperator[]>([]);
  const [replaceAll, setReplaceAll] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Optimize uploaded photo for OCR (downscale massive smartphone photos to max 1600px to avoid timeouts and 503 errors)
  const processAndSetImage = (file: File) => {
    setImageFileName(file.name);
    setImageMime('image/jpeg');
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const originalDataUrl = ev.target?.result as string;
      if (!originalDataUrl) return;

      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1600;
        let { width, height } = img;
        if (width <= MAX_DIM && height <= MAX_DIM) {
          setSelectedImage(originalDataUrl);
          return;
        }

        if (width > height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.88);
          setSelectedImage(compressed);
        } else {
          setSelectedImage(originalDataUrl);
        }
      };
      img.onerror = () => setSelectedImage(originalDataUrl);
      img.src = originalDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processAndSetImage(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processAndSetImage(file);
  };

  const triggerAnalysis = async () => {
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const payload: any = {};
      if (activeTab === 'photo' && selectedImage) {
        payload.imageBase64 = selectedImage;
        payload.mimeType = imageMime;
      } else if (activeTab === 'text' && rawText.trim()) {
        payload.textInput = rawText.trim();
      } else {
        throw new Error('Vyberte prosím fotografii nebo vložte text se jmény.');
      }

      const response = await fetch('/api/extract-operators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Extrakce se nezdařila.');
      }

      if (!data.operators || data.operators.length === 0) {
        throw new Error('Na snímku nebyla nalezena žádná jména operátorů. Zkontrolujte kvalitu fotky nebo vložte text.');
      }

      const drafts: DraftOperator[] = data.operators.map((op: any, index: number) => ({
        tempId: `draft-${Date.now()}-${index}`,
        name: op.name || `Operátor ${index + 1}`,
        machineType: op.machineType === 'RTR' ? 'RTR' : 'LL',
        departmentId: op.departmentId || 'hovc',
        notes: op.notes || 'Extrahováno ze snímku ZF',
      }));

      setExtractedList(drafts);
    } catch (err: any) {
      console.error(err);
      let msg = err?.message || 'Nastala neočekávaná chyba při vytahování jmen.';
      // Clean JSON if present
      const jsonMatch = msg.match(/\{[\s\S]*"error"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed?.error?.message) msg = parsed.error.message;
        } catch {
          // ignore
        }
      }
      if (/503|high demand|UNAVAILABLE/i.test(msg)) {
        msg = 'Služba Google Gemini má momentálně vysokou poptávku (kód 503). Zkuste to prosím za pár sekund znovu tlačítkem Zkusit znovu, případně zadejte jména textem.';
      }
      setErrorMessage(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateDraft = (tempId: string, patch: Partial<DraftOperator>) => {
    setExtractedList((prev) =>
      prev.map((item) => (item.tempId === tempId ? { ...item, ...patch } : item))
    );
  };

  const removeDraft = (tempId: string) => {
    setExtractedList((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  const addNewRow = () => {
    setExtractedList((prev) => [
      ...prev,
      {
        tempId: `draft-${Date.now()}-${prev.length + 1}`,
        name: 'Nový Operátor',
        machineType: 'LL',
        departmentId: 'hovc',
        notes: 'Ručně přidáno',
      },
    ]);
  };

  const handleApply = () => {
    if (extractedList.length === 0) return;

    const finalOps: Operator[] = extractedList.map((draft, idx) => ({
      id: `op-imported-${Date.now()}-${idx + 1}`,
      name: draft.name.trim(),
      machineType: draft.machineType,
      departmentId: draft.departmentId,
      isVnaOnly: false,
      status: draft.departmentId === 'unassigned' ? 'absence' : 'active',
      notes: draft.notes,
      lastMovedAt: new Date().toISOString(),
    }));

    onImportOperators(finalOps, replaceAll);
    onClose();
  };

  return (
    <div
      id="photo-import-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="photo-import-modal-dialog"
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Vytáhnout jména operátorů z fotek / rozpisu
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automaticky načte jména, kvalifikaci LL / RTR a zařazení do oddělení PICK
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Step 1: Input source */}
          {extractedList.length === 0 ? (
            <div className="space-y-4">
              {/* Tab selector */}
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl max-w-md">
                <button
                  type="button"
                  onClick={() => setActiveTab('photo')}
                  className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'photo'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Fotka / Snímek docházky</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('text')}
                  className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'text'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Vložit textem / Excel</span>
                </button>
              </div>

              {/* Tab 1: Photo upload */}
              {activeTab === 'photo' && (
                <div className="space-y-3">
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                      selectedImage
                        ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/20'
                        : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleFileChange}
                    />

                    {selectedImage ? (
                      <div className="space-y-3 flex flex-col items-center">
                        <div className="relative max-h-48 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 shadow-sm">
                          <img
                            src={selectedImage}
                            alt="Náhled fotky"
                            className="max-h-48 max-w-full object-contain"
                          />
                        </div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {imageFileName || 'Fotka vybrána'} • Klikněte pro změnu
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                          <Upload className="w-7 h-7" />
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">
                          Přetáhněte sem fotku nebo klikněte pro výběr
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                          Podporuje fotky z mobilu, screenshoty rozpisů ze SAP/Excelu nebo vyfocený papír se jmény a stroji (LL/RTR).
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Text input */}
              {activeTab === 'text' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Vložte jména operátorů (jméno na řádek):
                  </label>
                  <textarea
                    rows={7}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder={`Příklad:\nPetr Novák (LL) - Outbound\nJan Svoboda RTR VNA\nMilan Dvořák - Putaway\nTomáš Kučera RTR HOVS`}
                    className="w-full text-xs sm:text-sm font-mono p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                  <p className="text-[11px] text-slate-500">
                    Můžete zkopírovat sloupce z Excelu nebo zprávy. Systém automaticky rozpozná jména, stroje (LL/RTR) i oddělení.
                  </p>
                </div>
              )}

              {errorMessage && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                    <div>
                      <span className="font-semibold">Chyba rozpoznání: </span>
                      {errorMessage}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {activeTab === 'photo' && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('text')}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                      >
                        Vložit textem
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={triggerAnalysis}
                      disabled={isAnalyzing}
                      className="px-3 py-1 text-xs font-bold rounded-lg text-white bg-rose-600 hover:bg-rose-500 flex items-center gap-1.5 shadow-xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                      <span>Zkusit znovu</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  id="start-extraction-btn"
                  onClick={triggerAnalysis}
                  disabled={isAnalyzing || (activeTab === 'photo' && !selectedImage) || (activeTab === 'text' && !rawText.trim())}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Gemini analyzuje snímek a čte jména...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Vytáhnout jména operátorů</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Step 2: Review and edit extracted list */
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Nalezeno {extractedList.length} operátorů</span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                      Připraveno ke kontrole
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Zkontrolujte jména, zařazení do oddělení a stroje (LL / RTR) před importem.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={addNewRow}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Přidat řádek</span>
                  </button>

                  <button
                    onClick={() => {
                      setExtractedList([]);
                      setSelectedImage(null);
                      setRawText('');
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    <span>Nahrát jinou fotku</span>
                  </button>
                </div>
              </div>

              {/* Table of extracted operators */}
              <div className="max-h-72 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {extractedList.map((item, index) => (
                  <div
                    key={item.tempId}
                    className="p-2.5 sm:p-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <span className="text-xs font-mono font-bold text-slate-400 w-6 shrink-0">
                      {index + 1}.
                    </span>

                    {/* Name input */}
                    <div className="flex-1 min-w-[130px]">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateDraft(item.tempId, { name: e.target.value })}
                        className="w-full text-xs sm:text-sm font-semibold px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* Machine Type (LL / RTR only) */}
                    <div className="shrink-0 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateDraft(item.tempId, { machineType: 'LL' })}
                        className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${
                          item.machineType === 'LL'
                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        LL
                      </button>
                      <button
                        type="button"
                        onClick={() => updateDraft(item.tempId, { machineType: 'RTR' })}
                        className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${
                          item.machineType === 'RTR'
                            ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/60 dark:text-blue-200 border border-blue-300 dark:border-blue-700'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        RTR
                      </button>
                    </div>

                    {/* Department Dropdown */}
                    <div className="shrink-0 w-28 sm:w-36">
                      <select
                        value={item.departmentId}
                        onChange={(e) =>
                          updateDraft(item.tempId, {
                            departmentId: e.target.value as DepartmentId,
                          })
                        }
                        className="w-full text-xs font-medium px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      >
                        {DEPARTMENTS.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Delete row */}
                    <button
                      type="button"
                      onClick={() => removeDraft(item.tempId)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                      title="Smazat řádek"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Replace vs Append choice */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Režim uložení do systému:
                  </span>
                  <div className="flex items-center gap-4 mt-1">
                    <label className="inline-flex items-center gap-2 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="importMode"
                        checked={replaceAll}
                        onChange={() => setReplaceAll(true)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>
                        Nahradit celý tým novým seznamem (přepíše současných {currentCount} lidí)
                      </span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="importMode"
                        checked={!replaceAll}
                        onChange={() => setReplaceAll(false)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>Přidat k existujícím operátorům</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Zrušit
          </button>

          {extractedList.length > 0 && (
            <button
              id="confirm-import-btn"
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Použít tyto operátory v aplikaci ({extractedList.length})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
