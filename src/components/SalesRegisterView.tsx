import React, { useState } from 'react';
import { Company, SalesRecord } from '../types';
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
  Layers,
  FileText,
  X,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { exportSalesRegisterToExcel, downloadSampleSalesTemplate } from '../utils/storageAndExport';
import { NepalCalendarModal } from './NepalCalendarModal';
import { ExcelColumnHeader } from './ExcelColumnHeader';

interface SalesRegisterViewProps {
  company: Company;
  records: SalesRecord[];
  fiscalYear: string;
  onOpenManualEntry: () => void;
  onOpenImportModal: () => void;
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
}

export const SalesRegisterView: React.FC<SalesRegisterViewProps> = ({
  company,
  records,
  fiscalYear,
  onOpenManualEntry,
  onOpenImportModal,
  onDeleteRecord,
  onClearAll,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'fuel' | 'other'>('fuel');
  const [viewMode, setViewMode] = useState<'invoices' | 'month' | 'customer'>('invoices');
  const [isGrouped, setIsGrouped] = useState<boolean>(true);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState<boolean>(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState<boolean>(false);

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
  const uniqueBuyers = React.useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach((r) => {
      const c = r.customer || 'Cash Customer';
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts).map(([val, count]) => ({
      value: val,
      label: val,
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

  const uniquePans = React.useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach((r) => {
      const p = r.customerPan || 'No PAN';
      counts[p] = (counts[p] || 0) + 1;
    });
    return Object.entries(counts).map(([val, count]) => ({
      value: val,
      label: val,
      count,
    }));
  }, [records]);

  // Filtered & Sorted records
  const filteredRecords = React.useMemo(() => {
    let result = records.filter((rec) => {
      const isFuelProduct =
        rec.product === 'Petrol' ||
        rec.product === 'Diesel' ||
        rec.product === 'MS' ||
        rec.product === 'HSD';
      if (activeSubTab === 'fuel' && !isFuelProduct) return false;
      if (activeSubTab === 'other' && isFuelProduct) return false;

      // Global search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchBill = rec.billNo.toLowerCase().includes(term);
        const matchCustomer = rec.customer.toLowerCase().includes(term);
        const matchPan = rec.customerPan?.toLowerCase().includes(term);
        const matchNepaliDate = rec.nepaliDate.toLowerCase().includes(term);
        const matchProduct = rec.product.toLowerCase().includes(term);
        if (!matchBill && !matchCustomer && !matchPan && !matchNepaliDate && !matchProduct) return false;
      }

      // Column filters
      if (columnFilters.customer && columnFilters.customer.size > 0) {
        if (!columnFilters.customer.has(rec.customer || 'Cash Customer')) return false;
      }
      if (columnFilters.product && columnFilters.product.size > 0) {
        if (!columnFilters.product.has(rec.product || 'Other')) return false;
      }
      if (columnFilters.customerPan && columnFilters.customerPan.size > 0) {
        if (!columnFilters.customerPan.has(rec.customerPan || 'No PAN')) return false;
      }

      return true;
    });

    // Excel Column Sorting
    if (sortKey && sortDir) {
      result = [...result].sort((a, b) => {
        let cmp = 0;
        if (sortKey === 'sn') {
          cmp = (a.sn || 0) - (b.sn || 0);
        } else if (sortKey === 'nepaliDate') {
          cmp = (a.nepaliDate || '').localeCompare(b.nepaliDate || '');
        } else if (sortKey === 'billNo') {
          cmp = (a.billNo || '').localeCompare(b.billNo || '', undefined, { numeric: true });
        } else if (sortKey === 'customer') {
          cmp = (a.customer || '').localeCompare(b.customer || '');
        } else if (sortKey === 'customerPan') {
          cmp = (a.customerPan || '').localeCompare(b.customerPan || '');
        } else if (sortKey === 'product') {
          cmp = (a.product || '').localeCompare(b.product || '');
        } else if (sortKey === 'quantityL') {
          cmp = a.quantityL - b.quantityL;
        } else if (sortKey === 'rate') {
          cmp = a.rate - b.rate;
        } else if (sortKey === 'taxableAmount') {
          cmp = a.taxableAmount - b.taxableAmount;
        } else if (sortKey === 'vatAmount') {
          cmp = a.vatAmount - b.vatAmount;
        }
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [records, activeSubTab, searchTerm, columnFilters, sortKey, sortDir]);

  // Subtotals for filtered records
  const totalsQuantity = filteredRecords.reduce((s, r) => s + r.quantityL, 0);
  const totalsTaxable = filteredRecords.reduce((s, r) => s + r.taxableAmount, 0);
  const totalsVat = filteredRecords.reduce((s, r) => s + r.vatAmount, 0);
  const totalsGross = totalsTaxable + totalsVat;

  // Dynamic calculation strictly from actual uploaded/entered sales records
  const regularSales = records.filter((r) => !r.isCreditNote);
  const creditNotes = records.filter((r) => r.isCreditNote);

  const grossTaxableSales = regularSales.reduce((s, r) => s + r.taxableAmount, 0);
  const grossReturns = creditNotes.reduce((s, r) => s + Math.abs(r.taxableAmount), 0);
  const netTaxable = grossTaxableSales - grossReturns;

  const dieselSalesVol = regularSales.filter((r) => r.product === 'Diesel' || r.product === 'HSD').reduce((s, r) => s + r.quantityL, 0);
  const dieselReturnVol = creditNotes.filter((r) => r.product === 'Diesel' || r.product === 'HSD').reduce((s, r) => s + r.quantityL, 0);
  const dieselVolume = dieselSalesVol;
  const dieselNet = dieselSalesVol - dieselReturnVol;

  const petrolSalesVol = regularSales.filter((r) => r.product === 'Petrol' || r.product === 'MS').reduce((s, r) => s + r.quantityL, 0);
  const petrolReturnVol = creditNotes.filter((r) => r.product === 'Petrol' || r.product === 'MS').reduce((s, r) => s + r.quantityL, 0);
  const petrolVolume = petrolSalesVol;
  const petrolNet = petrolSalesVol - petrolReturnVol;

  const fuelInvoicesCount = records.filter((r) => r.product === 'Petrol' || r.product === 'Diesel' || r.product === 'MS' || r.product === 'HSD').length;
  const otherInvoicesCount = records.length - fuelInvoicesCount;

  return (
    <div className="space-y-4">
      {/* 5 Pastel KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: GROSS TAXABLE SALES */}
        <div className="bg-[#f4f7fc] dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-800 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
              GROSS TAXABLE SALES
            </span>
            <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <ShoppingCart className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
            Rs. {formatRs(grossTaxableSales)}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            {regularSales.length} Invoices ({regularSales.length} Lines)
          </div>
        </div>

        {/* Card 2: GROSS RETURNS (CN) */}
        <div className="bg-[#fff5f5] dark:bg-slate-900 border border-[#fed7d7] dark:border-rose-950/60 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 tracking-wider uppercase">
              GROSS RETURNS (CN)
            </span>
            <div className="w-7 h-7 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight">
            Rs. {formatRs(grossReturns)}
          </div>
          <div className="text-xs text-rose-500 font-medium mt-1">
            {creditNotes.length} Credit Notes
          </div>
        </div>

        {/* Card 3: NET TAXABLE SALES */}
        <div className="bg-[#f0fdf4] dark:bg-slate-900 border border-[#bbf7d0] dark:border-emerald-950/60 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 tracking-wider uppercase">
              NET TAXABLE SALES
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
            Net: {formatLiters(dieselNet)} Ltr
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
            Net: {formatLiters(petrolNet)} Ltr
          </div>
        </div>
      </div>

      {/* Date Range & Tool Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Date Range selectors */}
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

        {/* Action Buttons: Import, Export, Invoices/Month/Customer, Grouped */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative group">
            <button
              onClick={onOpenImportModal}
              className="flex items-center gap-1.5 bg-[#0c192c] hover:bg-[#132540] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
              <ChevronDown className="w-3 h-3 text-slate-300" />
            </button>
          </div>

          <div className="relative group">
            <button
              onClick={() => exportSalesRegisterToExcel(filteredRecords, company, fiscalYear)}
              className="flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          {/* Group View Switches */}
          <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl flex items-center text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
            <button
              onClick={() => setViewMode('invoices')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                viewMode === 'invoices' ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs font-bold' : ''
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Invoices</span>
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                viewMode === 'month' ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs font-bold' : ''
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>Month</span>
            </button>
            <button
              onClick={() => setViewMode('customer')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                viewMode === 'customer' ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs font-bold' : ''
              }`}
            >
              <span>Customer</span>
            </button>
          </div>

          {/* Grouped Button */}
          <button
            onClick={() => setIsGrouped(!isGrouped)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
              isGrouped
                ? 'bg-[#0c192c] text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Grouped</span>
          </button>
        </div>
      </div>

      {/* Sub-bar: Fuel Sales / Other Sales & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('fuel')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'fuel'
                ? 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>Fuel Sales (Petrol & Diesel)</span>
            <span className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[11px] px-2 py-0.2 rounded-full font-bold">
              {fuelInvoicesCount} Invoices
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('other')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'other'
                ? 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>Other Sales</span>
            <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] px-1.5 py-0.2 rounded-full font-bold">
              {otherInvoicesCount}
            </span>
          </button>
        </div>

        {/* Search & Open Software */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search sales..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-slate-400 shadow-xs"
            />
          </div>

          <button
            onClick={onOpenManualEntry}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs shrink-0"
          >
            <span>+ Record Bill</span>
          </button>

          {records.length > 0 && (
            <button
              type="button"
              onClick={() => setIsClearConfirmOpen(true)}
              title="Delete all vouchers in this station's Sales Register"
              className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs shrink-0 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Register</span>
            </button>
          )}
        </div>
      </div>

      {/* Main High-Density Data Table */}
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
          <div className="flex items-center gap-6 font-mono text-[11px] sm:text-xs">
            <span className="text-slate-700 dark:text-slate-300">
              Qty: <strong className="text-slate-900 dark:text-white">{formatLiters(totalsQuantity)} L</strong>
            </span>
            <span className="text-slate-700 dark:text-slate-300">
              Taxable: <strong className="text-slate-900 dark:text-white">Rs. {formatRs(totalsTaxable)}</strong>
            </span>
            <span className="text-slate-700 dark:text-slate-300">
              VAT: <strong className="text-emerald-600 dark:text-emerald-400">Rs. {formatRs(totalsVat)}</strong>
            </span>
            <span className="text-slate-700 dark:text-slate-300">
              Total: <strong className="text-slate-900 dark:text-white">Rs. {formatRs(totalsGross)}</strong>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="py-2.5 px-3 w-16 text-center">
                  <ExcelColumnHeader
                    title="S.NO."
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
                    title="DATE (BS/AD)"
                    columnKey="nepaliDate"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                  />
                </th>
                <th className="py-2.5 px-3">
                  <ExcelColumnHeader
                    title="BILL / INVOICE NO"
                    columnKey="billNo"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                  />
                </th>
                <th className="py-2.5 px-3">
                  <ExcelColumnHeader
                    title="BUYER NAME (PARTICULARS)"
                    columnKey="customer"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                    uniqueValues={uniqueBuyers}
                    selectedFilterValues={columnFilters.customer}
                    onFilterChange={(v) => handleFilterChange('customer', v)}
                  />
                </th>
                <th className="py-2.5 px-3">
                  <ExcelColumnHeader
                    title="BUYER PAN/VAT"
                    columnKey="customerPan"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                    uniqueValues={uniquePans}
                    selectedFilterValues={columnFilters.customerPan}
                    onFilterChange={(v) => handleFilterChange('customerPan', v)}
                  />
                </th>
                <th className="py-2.5 px-3">
                  <ExcelColumnHeader
                    title="PRODUCT"
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
                    title="QUANTITY (LTR)"
                    columnKey="quantityL"
                    align="right"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                    isNumeric
                  />
                </th>
                <th className="py-2.5 px-3 text-right">
                  <ExcelColumnHeader
                    title="RATE (RS.)"
                    columnKey="rate"
                    align="right"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                    isNumeric
                  />
                </th>
                <th className="py-2.5 px-3 text-right">
                  <ExcelColumnHeader
                    title="TAXABLE AMT (RS.)"
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
                    title="VAT (13%) (RS.)"
                    columnKey="vatAmount"
                    align="right"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                    isNumeric
                  />
                </th>
                <th className="py-2.5 px-2 w-10 text-center">DEL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="max-w-md mx-auto space-y-2">
                      <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                        {hasActiveFilters ? 'No Sales Records Matching Filters' : 'No Sales Records Recorded Yet'}
                      </p>
                      <p className="text-xs">
                        {hasActiveFilters
                          ? 'Try resetting your Excel column filters or search term to see records.'
                          : 'Upload your real billing software Excel/CSV file or click "Record Bill" to enter real invoices.'}
                      </p>
                      <div className="pt-2 flex items-center justify-center gap-2">
                        {hasActiveFilters ? (
                          <button
                            type="button"
                            onClick={handleClearAllFilters}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                          >
                            Reset All Filters
                          </button>
                        ) : (
                          <button
                            onClick={onOpenImportModal}
                            className="bg-[#0c192c] hover:bg-[#132540] text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow-xs transition"
                          >
                            Import Sales Excel
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row, idx) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                  >
                    <td className="py-3 px-3 text-center text-slate-500 font-medium">
                      {row.sn || idx + 1}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      {row.nepaliDate}
                    </td>
                    <td className="py-3 px-3 font-medium italic text-slate-700 dark:text-slate-300">
                      {row.billNo}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      {row.customer}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                      {row.customerPan || '-'}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                          row.product === 'Petrol' || row.product === 'MS'
                            ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                            : row.product === 'Diesel' || row.product === 'HSD'
                            ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                        }`}
                      >
                        {row.product}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatLiters(row.quantityL)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                      {row.rate.toFixed(4)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatRs(row.taxableAmount)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                      {formatRs(row.vatAmount)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => onDeleteRecord(row.id)}
                        title={`Delete voucher ${row.billNo}`}
                        className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clear Sales Register Confirmation Modal */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Delete Sales Register?
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  This will permanently remove all <strong>{records.length}</strong> sales voucher(s) for <strong>{company.name}</strong>. Your Purchase Register and station settings will not be affected.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsClearConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAll();
                  setIsClearConfirmOpen(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition cursor-pointer"
              >
                Yes, Delete All ({records.length})
              </button>
            </div>
          </div>
        </div>
      )}

      <NepalCalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
      />
    </div>
  );
};
