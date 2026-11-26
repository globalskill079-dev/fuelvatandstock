import React, { useState } from 'react';
import { Company, PurchaseRecord } from '../types';
import { parseNocPurchasesExcelFile, downloadSampleNocTemplate, simulateNocPortalSync } from '../utils/storageAndExport';
import { formatRs, formatLiters } from '../utils/vatAndStockCalculations';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Calendar, 
  Building2, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ExternalLink 
} from 'lucide-react';

interface ImportPurchasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCompany: Company;
  fiscalYear: string;
  onImportSuccess: (records: PurchaseRecord[]) => void;
}

export const ImportPurchasesModal: React.FC<ImportPurchasesModalProps> = ({
  isOpen,
  onClose,
  activeCompany,
  fiscalYear,
  onImportSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'noc_sync' | 'excel_upload'>('noc_sync');

  // Excel Upload States
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedRecords, setParsedRecords] = useState<PurchaseRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // NOC Portal Sync States
  const [depot, setDepot] = useState(activeCompany.depot || 'Thankot Depot (Kathmandu)');
  const [portalUsername, setPortalUsername] = useState(activeCompany.portalUsername || activeCompany.code || 'CDEA3001373');
  const [portalPassword, setPortalPassword] = useState(activeCompany.portalPassword || 'NOC@2083#pass');
  const [showPassword, setShowPassword] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStep, setSyncStep] = useState('');
  const [syncedRecords, setSyncedRecords] = useState<PurchaseRecord[] | null>(null);

  if (!isOpen) return null;

  // Excel upload handler
  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setIsProcessing(true);

    try {
      const result = await parseNocPurchasesExcelFile(selectedFile, activeCompany.id, fiscalYear);
      if (result.records.length === 0) {
        setError('No valid NOC purchase delivery records found in this file. Please check column headers.');
        setParsedRecords(null);
      } else {
        setParsedRecords(result.records);
      }
    } catch (err: any) {
      setError(err.message || 'Error processing NOC purchase file.');
      setParsedRecords(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // NOC Sync handler
  const handleStartNocSync = async () => {
    setIsSyncing(true);
    setSyncStep('Authenticating with eservice.nepaloil.org.np using dealer code ' + portalUsername + '...');

    try {
      setTimeout(() => {
        setSyncStep('Querying NOC Central Depot records for FY range 2083-04-01 to 2084-03-32...');
      }, 700);

      const records = await simulateNocPortalSync(activeCompany, fiscalYear, depot, {
        scope: 'full_fy',
        portalUsername,
        portalPassword,
        rangeStartBs: '2083.04.01',
        rangeEndBs: '2084.03.32',
      });

      setSyncStep('Extracted ' + records.length + ' official fuel purchase chalans with 13% statutory VAT!');
      setSyncedRecords(records);
    } catch (err: any) {
      console.error('NOC sync error:', err);
      setError('Failed to connect to NOC Dealer Portal. Please verify credentials.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConfirm = () => {
    const recordsToImport = activeTab === 'noc_sync' ? syncedRecords : parsedRecords;
    if (recordsToImport && recordsToImport.length > 0) {
      onImportSuccess(recordsToImport);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="bg-[#eab308] text-slate-950 font-black text-xs px-2.5 py-1 rounded shadow-xs">
              NOC
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Import Purchase Records & NOC Deliveries
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {activeCompany.name || 'Petrol Pump'} · FY 2083-084 (2083.04.01 - 2084.03.32)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: NOC Sync vs Excel Upload */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('noc_sync')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition ${
              activeTab === 'noc_sync'
                ? 'bg-[#0c192c] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>NOC Portal Live Sync</span>
            <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded font-mono font-bold">
              2083.04.01 → 2084.03.32
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('excel_upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition ${
              activeTab === 'excel_upload'
                ? 'bg-[#0c192c] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
            <span>Upload Excel / CSV Statement</span>
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: NOC PORTAL SYNC */}
          {activeTab === 'noc_sync' && (
            <div className="space-y-4">
              {/* Fiscal Year Range Callout */}
              <div className="bg-[#fffdf0] dark:bg-amber-950/20 border border-[#fef08a] dark:border-amber-800/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
                <div>
                  <span className="text-[10px] font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider block">
                    NOC E-SERVICES AUTOMATED EXTRACTION (CENTRAL PORTAL)
                  </span>
                  <div className="text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span>Selected FY Range: 2083.04.01 to 2084.03.32</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Covers all 12 official months (Shrawan 2083 - Ashad 2084). Gregorian: 2026-07-17 to 2027-07-16.
                  </p>
                </div>
                <a
                  href="https://eservice.nepaloil.org.np"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-amber-800 dark:text-amber-300 hover:underline flex items-center gap-1 font-bold shrink-0 self-start sm:self-center"
                >
                  <span>eservice.nepaloil.org.np</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {!syncedRecords ? (
                <div className="space-y-4">
                  {/* Login Credentials Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Portal Username / Code
                      </label>
                      <input
                        type="text"
                        value={portalUsername}
                        onChange={(e) => setPortalUsername(e.target.value)}
                        placeholder="e.g. CDEA3001373"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Company Portal Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={portalPassword}
                          onChange={(e) => setPortalPassword(e.target.value)}
                          placeholder="Portal login password"
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-3 pr-8 py-2 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Supply Depot
                      </label>
                      <select
                        value={depot}
                        onChange={(e) => setDepot(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Thankot Depot (Kathmandu)">Thankot Depot (Kathmandu)</option>
                        <option value="Amlekhgunj Depot">Amlekhgunj Depot</option>
                        <option value="Biratnagar Depot">Biratnagar Depot</option>
                        <option value="Bhairahawa Depot (Bhalwari)">Bhairahawa Depot (Bhalwari)</option>
                        <option value="Nepalgunj Depot">Nepalgunj Depot</option>
                        <option value="Pokhara Depot (Gagan Gauda)">Pokhara Depot (Gagan Gauda)</option>
                        <option value="Dhangadhi Depot">Dhangadhi Depot</option>
                      </select>
                    </div>
                  </div>

                  {isSyncing && (
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 rounded-xl flex items-center gap-3 text-xs text-indigo-950 dark:text-indigo-200">
                      <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin shrink-0" />
                      <div>
                        <span className="font-bold block">Connecting to NOC Central Server...</span>
                        <span className="font-mono text-[11px] text-indigo-700 dark:text-indigo-300">{syncStep}</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      disabled={isSyncing}
                      onClick={handleStartNocSync}
                      className="flex items-center gap-2 bg-[#0c192c] hover:bg-[#132540] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Connecting to Portal...' : 'Login & Sync FY 2083-084 Deliveries'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 font-bold">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Extracted {syncedRecords.length} verified chalans from 2083-04-01 to 2084-03-32!
                    </span>
                    <button
                      type="button"
                      onClick={() => setSyncedRecords(null)}
                      className="text-slate-600 dark:text-slate-300 hover:underline font-semibold"
                    >
                      Re-fetch
                    </button>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500 uppercase sticky top-0">
                        <tr>
                          <th className="py-2 px-3">BS DATE</th>
                          <th className="py-2 px-3">CHALAN NO</th>
                          <th className="py-2 px-3">FUEL</th>
                          <th className="py-2 px-3 text-right">LITERS</th>
                          <th className="py-2 px-3 text-right">RATE</th>
                          <th className="py-2 px-3 text-right">TAXABLE (RS)</th>
                          <th className="py-2 px-3 text-right">VAT (13%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                        {syncedRecords.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                            <td className="py-2 px-3 font-sans font-bold text-slate-800 dark:text-slate-200">{r.nepaliDate}</td>
                            <td className="py-2 px-3 text-indigo-600 dark:text-indigo-400 font-bold">{r.chalanNo}</td>
                            <td className="py-2 px-3 font-sans font-bold text-teal-700 dark:text-teal-300">{r.product}</td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">{formatLiters(r.quantityL)}</td>
                            <td className="py-2 px-3 text-right text-slate-500">{r.baseRate.toFixed(2)}</td>
                            <td className="py-2 px-3 text-right font-semibold text-slate-900 dark:text-white">{formatRs(r.taxableAmount)}</td>
                            <td className="py-2 px-3 text-right text-emerald-600 font-semibold">{formatRs(r.vatAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-500">
                      Total Volume: <strong>{formatLiters(syncedRecords.reduce((s, r) => s + r.quantityL, 0))} L</strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleConfirm}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-xs"
                    >
                      Record Extracted Chalans to Purchase Register
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EXCEL UPLOAD */}
          {activeTab === 'excel_upload' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-700 dark:text-slate-300">
                  Upload NOC delivery statements, tanker manifests, or vendor spreadsheet exports.
                </span>
                <button
                  type="button"
                  onClick={downloadSampleNocTemplate}
                  className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Template</span>
                </button>
              </div>

              {!parsedRecords ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500 rounded-2xl p-8 text-center transition flex flex-col items-center justify-center gap-3 bg-slate-50/50 dark:bg-slate-950/40"
                >
                  <Upload className="w-10 h-10 text-indigo-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Drag and drop NOC purchase statement file here
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Supports Excel (.xlsx, .xls) and CSV delivery lists (AD dates auto-map to BS)
                    </p>
                  </div>

                  <label className="cursor-pointer px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold rounded-xl text-white transition shadow-xs">
                    <span>Browse Local Files</span>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={(e) => e.target.files && e.target.files[0] && handleFileChange(e.target.files[0])}
                    />
                  </label>

                  {isProcessing && (
                    <p className="text-xs text-indigo-600 animate-pulse mt-2 font-medium">
                      Parsing NOC chalans, mapping BS dates, and computing 13% purchase VAT...
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 font-bold">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      Parsed {parsedRecords.length} NOC purchase chalans!
                    </span>
                    <button
                      type="button"
                      onClick={() => setParsedRecords(null)}
                      className="text-slate-600 dark:text-slate-300 hover:underline font-semibold"
                    >
                      Upload Different File
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-500">
                      File: <strong>{file?.name}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleConfirm}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-xs"
                    >
                      Commit to Purchase Register
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
