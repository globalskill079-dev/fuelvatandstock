import React, { useState } from 'react';
import { Company, SalesRecord } from '../types';
import { parseSalesExcelFile, downloadSampleSalesTemplate } from '../utils/storageAndExport';
import { formatRs, formatLiters } from '../utils/vatAndStockCalculations';
import { X, Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle } from 'lucide-react';

export type SalesImportMode = 'merge' | 'replace' | 'append';

interface ImportSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCompany: Company;
  fiscalYear: string;
  existingRecords: SalesRecord[];
  onImportSuccess: (records: SalesRecord[], mode: SalesImportMode) => void;
}

export const ImportSalesModal: React.FC<ImportSalesModalProps> = ({
  isOpen,
  onClose,
  activeCompany,
  fiscalYear,
  existingRecords,
  onImportSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedRecords, setParsedRecords] = useState<SalesRecord[] | null>(null);
  const [importMode, setImportMode] = useState<SalesImportMode>('merge');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const getVoucherSignature = (r: SalesRecord) =>
    `${(r.billNo || '').trim().toLowerCase()}|${(r.nepaliDate || r.date || '').trim()}|${(r.product || '').trim().toLowerCase()}`;

  const existingSignatures = new Set(existingRecords.map(getVoucherSignature));
  const duplicateCount = parsedRecords
    ? parsedRecords.filter((r) => existingSignatures.has(getVoucherSignature(r))).length
    : 0;
  const newCount = parsedRecords ? parsedRecords.length - duplicateCount : 0;

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setIsProcessing(true);

    try {
      const result = await parseSalesExcelFile(selectedFile, activeCompany.id, fiscalYear);
      if (result.records.length === 0) {
        setError('No valid sales invoice records found in this file. Please check column headers.');
        setParsedRecords(null);
      } else {
        setParsedRecords(result.records);
      }
    } catch (err: any) {
      setError(err.message || 'Error processing spreadsheet file.');
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

  const handleConfirm = () => {
    if (parsedRecords && parsedRecords.length > 0) {
      onImportSuccess(parsedRecords, existingRecords.length > 0 ? importMode : 'append');
      setParsedRecords(null);
      setFile(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Import Invoicing Sales Data</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{activeCompany.name} · {fiscalYear}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Sample Template Callout */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-700 dark:text-slate-300">
              Supports <strong>IRD बिक्री खाता / DetailSalesVatRegister (.xls)</strong>, SPAS, Swastik, Tally (.xlsx, .xls, .csv).
            </span>
            <button
              onClick={downloadSampleSalesTemplate}
              className="flex items-center gap-1.5 text-blue-700 dark:text-amber-400 hover:text-blue-800 dark:hover:text-amber-300 font-semibold px-2.5 py-1 rounded bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 shrink-0 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Template</span>
            </button>
          </div>

          {!parsedRecords ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-blue-500 dark:hover:border-amber-500/60 rounded-xl p-8 text-center transition flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-950/40"
            >
              <Upload className="w-10 h-10 text-blue-600/80 dark:text-amber-400/80" />
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Drag and drop your sales billing file here
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports standard Excel (.xlsx, .xls) and CSV files
                </p>
              </div>

              <label className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold rounded-lg text-white dark:text-slate-200 transition shadow-xs">
                <span>Browse Local Computer</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => e.target.files && e.target.files[0] && handleFileChange(e.target.files[0])}
                />
              </label>

              {isProcessing && (
                <p className="text-xs text-blue-600 dark:text-amber-400 animate-pulse mt-2 font-medium">
                  Parsing invoices and computing 13% Nepal VAT breakdowns...
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Successfully parsed {parsedRecords.length} sales line items!
                </span>
                <button
                  onClick={() => setParsedRecords(null)}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Choose different file
                </button>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block font-medium">Total Volume</span>
                  <strong className="text-slate-900 dark:text-slate-100 font-mono text-sm">
                    {formatLiters(parsedRecords.reduce((s, r) => s + r.quantityL, 0))} L
                  </strong>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block font-medium">Gross Sales</span>
                  <strong className="text-blue-700 dark:text-amber-400 font-mono text-sm">
                    Rs. {formatRs(parsedRecords.reduce((s, r) => s + r.grossSales, 0))}
                  </strong>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block font-medium">VAT (13%)</span>
                  <strong className="text-slate-900 dark:text-slate-100 font-mono text-sm">
                    Rs. {formatRs(parsedRecords.reduce((s, r) => s + r.vatAmount, 0))}
                  </strong>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950 max-h-56 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                    <tr>
                      <th className="px-3 py-2">Date (BS)</th>
                      <th className="px-3 py-2">Bill No</th>
                      <th className="px-3 py-2">Customer</th>
                      <th className="px-3 py-2">Product</th>
                      <th className="px-3 py-2 text-right">Liters</th>
                      <th className="px-3 py-2 text-right">Taxable (Rs)</th>
                      <th className="px-3 py-2 text-right">Gross (Rs)</th>
                      <th className="px-3 py-2 text-right">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                    {parsedRecords.slice(0, 10).map((r) => (
                      <tr key={r.id}>
                        <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-400">{r.nepaliDate}</td>
                        <td className="px-3 py-2 font-mono text-blue-700 dark:text-amber-400 font-bold">{r.billNo}</td>
                        <td className="px-3 py-2 truncate max-w-[140px]">{r.customer}</td>
                        <td className="px-3 py-2 font-semibold">{r.product}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatLiters(r.quantityL)}</td>
                        <td className="px-3 py-2 text-right font-mono">Rs. {formatRs(r.taxableAmount)}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold">Rs. {formatRs(r.grossSales)}</td>
                        <td className="px-3 py-2 text-right">
                          <span className={r.isCreditNote ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-500 dark:text-slate-400'}>
                            {r.isCreditNote ? 'Return (CN)' : 'Invoice'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {parsedRecords.length > 10 && (
                <p className="text-[11px] text-slate-500 text-center">
                  Showing first 10 preview rows of {parsedRecords.length} total items.
                </p>
              )}

              {/* Existing Vouchers Conflict Handling */}
              {existingRecords.length > 0 && (
                <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-2.5 text-xs">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-amber-900 dark:text-amber-200">
                        {existingRecords.length} voucher(s) already exist in {activeCompany.name}&apos;s Sales Register
                      </div>
                      <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 mt-0.5">
                        {duplicateCount > 0
                          ? `Detected ${duplicateCount} matching voucher(s) already in register and ${newCount} new voucher(s). Choose how to import:`
                          : `All ${parsedRecords.length} voucher(s) in this file are new. Choose how to combine them:`}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5 pl-6">
                    <label className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition ${
                      importMode === 'merge'
                        ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-xs'
                        : 'border-amber-200/70 dark:border-slate-700 hover:bg-white/60 dark:hover:bg-slate-900/50'
                    }`}>
                      <input
                        type="radio"
                        name="salesImportMode"
                        checked={importMode === 'merge'}
                        onChange={() => setImportMode('merge')}
                        className="mt-0.5 text-indigo-600"
                      />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">
                          Keep existing &amp; skip duplicates (Recommended)
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Adds {newCount} new voucher(s) and skips {duplicateCount} duplicate(s) to prevent double-counting.
                        </span>
                      </div>
                    </label>

                    <label className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition ${
                      importMode === 'replace'
                        ? 'bg-white dark:bg-slate-900 border-rose-500 shadow-xs'
                        : 'border-amber-200/70 dark:border-slate-700 hover:bg-white/60 dark:hover:bg-slate-900/50'
                    }`}>
                      <input
                        type="radio"
                        name="salesImportMode"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="mt-0.5 text-rose-600"
                      />
                      <div>
                        <span className="font-bold text-rose-700 dark:text-rose-400 block">
                          Replace entire Sales Register
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Deletes all {existingRecords.length} existing voucher(s) and saves only these {parsedRecords.length} voucher(s).
                        </span>
                      </div>
                    </label>

                    <label className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition ${
                      importMode === 'append'
                        ? 'bg-white dark:bg-slate-900 border-amber-500 shadow-xs'
                        : 'border-amber-200/70 dark:border-slate-700 hover:bg-white/60 dark:hover:bg-slate-900/50'
                    }`}>
                      <input
                        type="radio"
                        name="salesImportMode"
                        checked={importMode === 'append'}
                        onChange={() => setImportMode('append')}
                        className="mt-0.5 text-amber-600"
                      />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">
                          Append all rows (Allow duplicates)
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Adds all {parsedRecords.length} row(s) on top of the {existingRecords.length} existing voucher(s).
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="px-5 py-2 rounded-lg text-xs font-bold text-white dark:text-slate-950 bg-blue-600 dark:bg-amber-500 hover:bg-blue-700 dark:hover:bg-amber-400 transition shadow-xs cursor-pointer"
                >
                  {existingRecords.length > 0 && importMode === 'replace'
                    ? `Replace with ${parsedRecords.length} Voucher(s)`
                    : existingRecords.length > 0 && importMode === 'merge'
                    ? `Add ${newCount} New Voucher(s)`
                    : 'Save to Sales Register'}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
