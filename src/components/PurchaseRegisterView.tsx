import React, { useState } from 'react';
import { Company, PurchaseRecord } from '../types';
import { formatRs, formatLiters } from '../utils/vatAndStockCalculations';
import { 
  ShoppingCart, 
  ArrowLeftRight, 
  Fuel, 
  Calendar, 
  Upload, 
  Download, 
  Search, 
  ExternalLink,
  ChevronDown,
  Plus,
  FileText,
  ChevronRight,
  Layers,
  RefreshCw,
  X
} from 'lucide-react';
import { exportPurchaseRegisterToExcel, downloadSampleNocTemplate } from '../utils/storageAndExport';
import { NepalCalendarModal } from './NepalCalendarModal';
import { ExcelColumnHeader } from './ExcelColumnHeader';

interface PurchaseRegisterViewProps {
  company: Company;
  records: PurchaseRecord[];
  fiscalYear: string;
  onOpenNocSync: () => void;
  onOpenManualEntry: () => void;
  onOpenImportModal: () => void;
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
}

export const PurchaseRegisterView: React.FC<PurchaseRegisterViewProps> = ({
  company,
  records,
  fiscalYear,
  onOpenNocSync,
  onOpenManualEntry,
  onOpenImportModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'fuel' | 'excel' | 'other' | 'all'>('fuel');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  // Excel-style interactive sorting and column filtering state
  const [sortKey, setSortKey] = useState<string | null>('sn');
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>('asc');
  const [columnFilters, setColumnFilters] = useState<Record<string, Set<string> | null>>({});

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') {
        setSortKey(null);
        setSortDir(null);
      } else {
        setSortDir('asc');
      }
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleFilterChange = (key: string, values: Set<string> | null) => {
    setColumnFilters((prev) => ({
      ...prev,
      [key]: values,
    }));
  };

  const hasActiveFilters = Object.values(columnFilters).some((f) => f !== null && f.size > 0) || searchTerm.trim().length > 0;

  const handleClearAllFilters = () => {
    setColumnFilters({});
    setSearchTerm('');
    setSortKey('sn');
    setSortDir('asc');
  };

  // Distinct filter values derived from the dataset
  const uniqueMonths = React.useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach((r) => {
      const m = (r.month || 'Other').toUpperCase();
      counts[m] = (counts[m] || 0) + 1;
    });
    return Object.entries(counts).map(([val, count]) => ({
      value: val,
      label: val,
      count,
    }));
  }, [records]);

  const uniqueSuppliers = React.useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach((r) => {
      const s = r.supplier || 'Nepal Oil Corporation';
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts).map(([val, count]) => ({
      value: val,
      label: val,
      count,
    }));
  }, [records]);

  const uniqueRates = React.useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach((r) => {
      const rateStr = r.baseRate ? r.baseRate.toFixed(2) : '0.00';
      counts[rateStr] = (counts[rateStr] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
      .map(([val, count]) => ({
        value: val,
        label: `Rs. ${val}`,
        count,
      }));
  }, [records]);

  const uniqueProducts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach((r) => {
      const p = r.product || 'Other';
      counts[p] = (counts[p] || 0) + 1;
    });
    return Object.entries(counts).map(([val, count]) => ({
      value: val,
      label: val,
      count,
    }));
  }, [records]);

  const NEPAL_MONTH_ORDER: Record<string, number> = {
    'SHRAWAN': 1, 'BHADRA': 2, 'ASHOJ': 3, 'KARTIK': 4,
    'MANGSIR': 5, 'POUSH': 6, 'MAGH': 7, 'FALGUN': 8,
    'CHAITRA': 9, 'BAISAKH': 10, 'JESTHA': 11, 'ASHAD': 12,
  };

  // Filtered & Sorted Records
  const filteredRecords = React.useMemo(() => {
    let result = records.filter((rec) => {
      if (activeSubTab === 'fuel' && rec.category !== 'fuel') return false;
      if (activeSubTab === 'excel' && rec.category !== 'excel_upload') return false;
      if (activeSubTab === 'other' && rec.category !== 'other') return false;

      // Global search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchSupplier = rec.supplier ? rec.supplier.toLowerCase().includes(term) : false;
        const matchMonth = rec.month ? rec.month.toLowerCase().includes(term) : false;
        const matchProduct = rec.product ? rec.product.toLowerCase().includes(term) : false;
        const matchRate = rec.baseRate ? String(rec.baseRate).includes(term) : false;
        const matchChalan = rec.chalanNo ? rec.chalanNo.toLowerCase().includes(term) : false;
        if (!matchSupplier && !matchMonth && !matchProduct && !matchRate && !matchChalan) return false;
      }

      // Column filters
      if (columnFilters.month && columnFilters.month.size > 0) {
        if (!columnFilters.month.has((rec.month || 'Other').toUpperCase())) return false;
      }
      if (columnFilters.supplier && columnFilters.supplier.size > 0) {
        if (!columnFilters.supplier.has(rec.supplier || 'Nepal Oil Corporation')) return false;
      }
      if (columnFilters.baseRate && columnFilters.baseRate.size > 0) {
        const rateStr = rec.baseRate ? rec.baseRate.toFixed(2) : '0.00';
        if (!columnFilters.baseRate.has(rateStr)) return false;
      }
      if (columnFilters.product && columnFilters.product.size > 0) {
        if (!columnFilters.product.has(rec.product || 'Other')) return false;
      }

      return true;
    });

    // Excel Column Sorting
    if (sortKey && sortDir) {
      result = [...result].sort((a, b) => {
        let cmp = 0;
        if (sortKey === 'month') {
          const ma = NEPAL_MONTH_ORDER[(a.month || '').toUpperCase()] || 99;
          const mb = NEPAL_MONTH_ORDER[(b.month || '').toUpperCase()] || 99;
          cmp = ma - mb;
        } else if (sortKey === 'baseRate') {
          cmp = (a.baseRate || 0) - (b.baseRate || 0);
        } else if (sortKey === 'taxableAmount') {
          cmp = (a.taxableAmount || 0) - (b.taxableAmount || 0);
        } else if (sortKey === 'vatAmount') {
          cmp = (a.vatAmount || 0) - (b.vatAmount || 0);
        } else if (sortKey === 'grossPurchase') {
          cmp = (a.grossPurchase || 0) - (b.grossPurchase || 0);
        } else if (sortKey === 'supplier') {
          cmp = (a.supplier || '').localeCompare(b.supplier || '');
        } else if (sortKey === 'product') {
          cmp = (a.product || '').localeCompare(b.product || '');
        } else if (sortKey === 'sn') {
          cmp = (a.sn || 0) - (b.sn || 0);
        }
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [records, activeSubTab, searchTerm, columnFilters, sortKey, sortDir]);

  // Dynamic calculation strictly from actual uploaded/entered purchase records
  const grossTaxablePurchases = records.reduce((s, r) => s + r.taxableAmount, 0);
  const grossReturns = 0;
  const netTaxable = grossTaxablePurchases - grossReturns;
  const dieselVolume = records.filter(r => r.product === 'Diesel' || r.product === 'HSD').reduce((s, r) => s + r.quantityL, 0);
  const petrolVolume = records.filter(r => r.product === 'Petrol' || r.product === 'MS').reduce((s, r) => s + r.quantityL, 0);

  // Dynamic totals for visible/filtered records (Subtotal in Excel)
  const totalsTaxable = filteredRecords.reduce((s, r) => s + r.taxableAmount, 0);
  const totalsVat = filteredRecords.reduce((s, r) => s + r.vatAmount, 0);
  const totalsGross = filteredRecords.reduce((s, r) => s + r.grossPurchase, 0);

  const fuelPurchasesCount = records.filter(r => r.category === 'fuel' || r.product === 'MS' || r.product === 'HSD' || r.product === 'Petrol' || r.product === 'Diesel').length;
  const excelPurchasesCount = records.filter(r => r.category === 'excel_upload').length;
  const otherPurchasesCount = records.filter(r => r.category === 'other').length;


  return (
    <div className="space-y-4">
      {/* 5 Pastel KPI Summary Cards from Screenshot 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: GROSS TAXABLE PURCHASES */}
        <div className="bg-[#f4f7fc] dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-800 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
              GROSS TAXABLE PURCHASES
            </span>
            <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <ShoppingCart className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
            Rs. {formatRs(grossTaxablePurchases)}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            {records.length} Invoices Filed
          </div>
        </div>

        {/* Card 2: GROSS RETURNS (DN) */}
        <div className="bg-[#fff5f5] dark:bg-slate-900 border border-[#fed7d7] dark:border-rose-950/60 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 tracking-wider uppercase">
              GROSS RETURNS (DN)
            </span>
            <div className="w-7 h-7 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight">
            Rs. 0
          </div>
          <div className="text-xs text-rose-500 font-medium mt-1">
            0 Debit Notes
          </div>
        </div>

        {/* Card 3: NET TAXABLE PURCHASES */}
        <div className="bg-[#f0fdf4] dark:bg-slate-900 border border-[#bbf7d0] dark:border-emerald-950/60 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 tracking-wider uppercase">
              NET TAXABLE PURCHASES
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">
              VAT SYNC
            </span>
          </div>
          <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono tracking-tight">
            Rs. {formatRs(netTaxable)}
          </div>
          <div className="text-xs text-emerald-600/90 dark:text-emerald-400 font-medium mt-1">
            Matches Monthly VAT Register (Net)
          </div>
        </div>

        {/* Card 4: DIESEL VOLUME */}
        <div className="bg-[#fefce8] dark:bg-slate-900 border border-[#fef08a] dark:border-amber-950/60 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 tracking-wider uppercase">
              DIESEL VOLUME
            </span>
            <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <Fuel className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
            {formatLiters(dieselVolume)} Ltr
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Net: {formatLiters(dieselVolume)} Ltr
          </div>
        </div>

        {/* Card 5: PETROL VOLUME */}
        <div className="bg-[#f0f9ff] dark:bg-slate-900 border border-[#bae6fd] dark:border-sky-950/60 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-sky-800 dark:text-sky-300 tracking-wider uppercase">
              PETROL VOLUME
            </span>
            <div className="w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Fuel className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
            {formatLiters(petrolVolume)} Ltr
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Net: {formatLiters(petrolVolume)} Ltr
          </div>
        </div>
      </div>

      {/* Date Range Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">
            DATE RANGE (AD):
          </span>
          <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1">
            <span>2026-07-17</span>
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <span className="text-slate-400">-</span>
          <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1">
            <span>2027-07-16</span>
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

          <span className="text-slate-500 font-semibold">BS:</span>
          <button
            onClick={() => setIsCalendarModalOpen(true)}
            title="Click to view official 12-month BS ↔ AD conversion table"
            className="flex items-center gap-1.5 font-mono text-slate-800 dark:text-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 font-bold transition cursor-pointer group"
          >
            <span>2083.04.01 - 2084.03.32</span>
            <Calendar className="w-3.5 h-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
          </button>

          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded font-bold">
            Full FY 2083-084
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Import Dropdown with NOC Portal Sync */}
          <div className="relative">
            <button
              onClick={() => setIsImportMenuOpen(!isImportMenuOpen)}
              className="flex items-center gap-1.5 bg-[#0c192c] hover:bg-[#132540] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
              <ChevronDown className={`w-3 h-3 text-slate-300 transition-transform ${isImportMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isImportMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsImportMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-30 p-2 space-y-1.5 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                  {/* NOC Portal Sync option */}
                  <button
                    onClick={() => {
                      setIsImportMenuOpen(false);
                      onOpenNocSync();
                    }}
                    className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/40 text-left transition group border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20"
                  >
                    <div className="p-2 rounded-lg bg-[#eab308] text-slate-950 font-black text-xs shrink-0 mt-0.5 shadow-xs">
                      <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-300" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>NOC Portal Sync</span>
                        <span className="text-[9px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 px-1.5 py-0.2 rounded font-black">
                          2083-04-01 → 2084-03-32
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                        Login to eservice.nepaloil.org.np and auto-extract fuel purchases for selected fiscal year.
                      </p>
                    </div>
                  </button>

                  {/* Excel Upload option */}
                  <button
                    onClick={() => {
                      setIsImportMenuOpen(false);
                      onOpenImportModal();
                    }}
                    className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition"
                  >
                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                      <Upload className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        Upload Excel / CSV Statements
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Import local billing software or vendor delivery sheets
                      </p>
                    </div>
                  </button>

                  {/* Download Template */}
                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setIsImportMenuOpen(false);
                        downloadSampleNocTemplate();
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-semibold"
                    >
                      <span>Download Sample NOC Template</span>
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => exportPurchaseRegisterToExcel(filteredRecords, company, fiscalYear)}
            className="flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Sub-tabs Row from Screenshot 2 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-2 shadow-xs flex flex-wrap items-center gap-2 text-xs">
        <button
          onClick={() => setActiveSubTab('fuel')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold transition ${
            activeSubTab === 'fuel'
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-emerald-600" />
          <span>Fuel Purchases (Petrol & Diesel)</span>
          <span className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[10px] px-2 py-0.2 rounded-full font-bold">
            {fuelPurchasesCount} Invoices
          </span>
          <span className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[9px] px-1.5 py-0.2 rounded uppercase font-black tracking-wide">
            OFFICIAL VAT REGISTER
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('excel')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold transition ${
            activeSubTab === 'excel'
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <span className="text-purple-600">📊</span>
          <span>Excel Uploaded Purchases</span>
          <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] px-2 py-0.2 rounded-full font-bold">
            {excelPurchasesCount} Invoices
          </span>
          <span className="bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 text-[9px] px-1.5 py-0.2 rounded uppercase font-black tracking-wide">
            DIVYA & VENDOR EXCEL
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('other')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold transition ${
            activeSubTab === 'other'
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-amber-600" />
          <span>Other Purchases</span>
          <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
            {otherPurchasesCount}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('all')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold transition ${
            activeSubTab === 'all'
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span>All Purchases ({records.length})</span>
        </button>
      </div>

      {/* Filter bar with Search, Open Software, Add Fuel Purchase */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[260px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search purchases..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-slate-400 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert(`Opening ${company.softwareType || 'SPAS'} integration link...`)}
            className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs"
          >
            <span>Open Software</span>
            <ExternalLink className="w-3 h-3" />
          </button>

          <button
            onClick={onOpenNocSync}
            className="flex items-center gap-1.5 bg-[#059669] hover:bg-[#047857] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Fuel Purchase</span>
          </button>
        </div>
      </div>

      {/* Statutory Notice Banner from Screenshot 2 */}
      <div className="bg-[#f0fdf4] dark:bg-slate-900 border border-[#bbf7d0] dark:border-emerald-950/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
              Statutory VAT Purchase Register — Fuel Purchases (Petrol & Diesel)
            </h3>
            <p className="text-[11px] text-emerald-800/90 dark:text-emerald-400 mt-0.5">
              Official VAT registered fuel purchases (MS Petrol, HSD Diesel, SKO Kerosene) uploaded or recorded for statutory returns, stock calculations, and Annex registers.
            </p>
          </div>
        </div>

        <span className="bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded shrink-0 self-start sm:self-center">
          OFFICIAL VAT REGISTER
        </span>
      </div>

      {/* Data Table with Totals Row */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Totals Strip (Excel Subtotal Bar) */}
        <div className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
          <div className="flex items-center gap-3">
            <span className="text-slate-900 dark:text-white uppercase tracking-wider">TOTALS</span>
            <span className="text-[11px] font-normal text-slate-500 font-sans">
              ({filteredRecords.length} of {records.length} records shown)
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Reset Excel Filters</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-8 font-mono">
            <span className="text-slate-900 dark:text-white">Rs. {formatRs(totalsTaxable)}</span>
            <span className="text-slate-700 dark:text-slate-300">Rs. {formatRs(totalsVat)}</span>
            <span className="text-slate-900 dark:text-white">Rs. {formatRs(totalsGross)}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="py-2.5 px-3 w-16 text-center">
                  <ExcelColumnHeader
                    title="S.N."
                    columnKey="sn"
                    align="center"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                    isNumeric
                  />
                </th>
                <th className="py-2.5 px-3">
                  <ExcelColumnHeader
                    title="MONTH"
                    columnKey="month"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                    uniqueValues={uniqueMonths}
                    selectedFilterValues={columnFilters.month}
                    onFilterChange={(v) => handleFilterChange('month', v)}
                  />
                </th>
                <th className="py-2.5 px-3">
                  <ExcelColumnHeader
                    title="SUPPLIER"
                    columnKey="supplier"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                    uniqueValues={uniqueSuppliers}
                    selectedFilterValues={columnFilters.supplier}
                    onFilterChange={(v) => handleFilterChange('supplier', v)}
                  />
                </th>
                <th className="py-2.5 px-3 text-right">
                  <ExcelColumnHeader
                    title="RATE (RS)"
                    columnKey="baseRate"
                    align="right"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                    uniqueValues={uniqueRates}
                    selectedFilterValues={columnFilters.baseRate}
                    onFilterChange={(v) => handleFilterChange('baseRate', v)}
                    isNumeric
                  />
                </th>
                <th className="py-2.5 px-3">
                  <ExcelColumnHeader
                    title="PRODUCT / ITEM"
                    columnKey="product"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                    uniqueValues={uniqueProducts}
                    selectedFilterValues={columnFilters.product}
                    onFilterChange={(v) => handleFilterChange('product', v)}
                  />
                </th>
                <th className="py-2.5 px-3 text-right">
                  <ExcelColumnHeader
                    title="TAXABLE AMT"
                    columnKey="taxableAmount"
                    align="right"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                    isNumeric
                  />
                </th>
                <th className="py-2.5 px-3 text-right">
                  <ExcelColumnHeader
                    title="VAT (13%)"
                    columnKey="vatAmount"
                    align="right"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                    isNumeric
                  />
                </th>
                <th className="py-2.5 px-3 text-right">
                  <ExcelColumnHeader
                    title="TOTAL AMT"
                    columnKey="grossPurchase"
                    align="right"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                    isNumeric
                  />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 px-4 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <ShoppingCart className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        No purchase records matching filters
                      </div>
                      <p className="text-xs text-slate-500">
                        Try resetting your Excel column filters or search term to see records.
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-1">
                        {hasActiveFilters && (
                          <button
                            type="button"
                            onClick={handleClearAllFilters}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                          >
                            Reset All Filters
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={onOpenNocSync}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                        >
                          + Add Fuel Purchase
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row, idx) => {
                const isExpanded = expandedRow === row.id;
                return (
                  <React.Fragment key={row.id}>
                    <tr
                      onClick={() => setExpandedRow(isExpanded ? null : row.id)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group cursor-pointer"
                    >
                      <td className="py-3 px-3 text-center text-slate-500 font-medium">
                        <div className="flex items-center justify-center gap-1">
                          <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90 text-indigo-500' : 'text-slate-400'}`} />
                          <span>{row.sn || idx + 1}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white uppercase whitespace-nowrap">
                        {row.month}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span>{row.supplier}</span>
                          {row.invoicesCount && (
                            <span className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 text-[10px] px-2 py-0.2 rounded-full font-bold">
                              {row.invoicesCount} invoices
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                        {row.baseRate ? `Rs. ${row.baseRate.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                            row.product === 'Petrol'
                              ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {row.product}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                        Rs. {formatRs(row.taxableAmount)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                        Rs. {formatRs(row.vatAmount)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                        Rs. {formatRs(row.grossPurchase)}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                        <td colSpan={8} className="p-3 text-xs">
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 text-slate-600 dark:text-slate-300">
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">INVOICE / CHALAN REF</span>
                              <span className="font-mono font-bold text-slate-900 dark:text-white">{row.chalanNo || 'NOC Sales Invoice'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">BRANCH / DEPOT</span>
                              <span>{row.depot || 'Bagmati Provincial Office'}</span>
                            </div>
                            {row.tankerNo ? (
                              <div>
                                <span className="text-slate-400 block text-[10px] uppercase font-bold">TANKER VEHICLE NO</span>
                                <span className="font-mono font-bold">{row.tankerNo}</span>
                              </div>
                            ) : null}
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">DELIVERED VOLUME</span>
                              <span className="font-mono font-bold text-emerald-600">{row.quantityL.toLocaleString()} Liters</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NepalCalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
      />
    </div>
  );
};
