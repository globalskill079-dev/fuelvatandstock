import React, { useState } from 'react';
import { Company, SalesRecord, PurchaseRecord, HighValueRecord } from '../types';
import { formatRs, calculateDynamicHighValueRecords } from '../utils/vatAndStockCalculations';
import { exportAboveOneLakhExcel } from '../utils/storageAndExport';
import { 
  FileText, 
  Download, 
  Search, 
  ShoppingCart, 
  Layers, 
  ChevronDown,
  X
} from 'lucide-react';
import { ExcelColumnHeader } from './ExcelColumnHeader';

interface AboveOneLakhViewProps {
  company: Company;
  sales: SalesRecord[];
  purchases: PurchaseRecord[];
  fiscalYear: string;
}

export const AboveOneLakhView: React.FC<AboveOneLakhViewProps> = ({
  company,
  sales,
  purchases,
  fiscalYear,
}) => {
  const [threshold, setThreshold] = useState<number>(100000);
  const [registerType, setRegisterType] = useState<'All' | 'Purchase' | 'Sale'>('All');
  const [selectedMonth, setSelectedMonth] = useState<string>('All Months');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [tradeTypeOverrides, setTradeTypeOverrides] = useState<Record<string, string>>({});

  // Excel-style interactive sorting and column filtering state
  const [sortKey, setSortKey] = useState<string | null>('taxableAmount');
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>('desc');
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

  const handleClearAllFilters = () => {
    setColumnFilters({});
    setSearchTerm('');
    setRegisterType('All');
    setSelectedMonth('All Months');
    setSortKey('taxableAmount');
    setSortDir('desc');
  };

  // Dynamically extract high-value records exceeding the threshold from actual data
  const dynamicHighValueRecords = calculateDynamicHighValueRecords(sales, purchases, threshold);

  // Distinct values for column filters
  const uniqueTaxPayers = React.useMemo(() => {
    const counts: Record<string, number> = {};
    dynamicHighValueRecords.forEach((r) => {
      const name = r.taxPayerName || 'Unknown';
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).map(([val, count]) => ({
      value: val,
      label: val,
      count,
    }));
  }, [dynamicHighValueRecords]);

  const uniquePans = React.useMemo(() => {
    const counts: Record<string, number> = {};
    dynamicHighValueRecords.forEach((r) => {
      const pan = r.pan || 'No PAN';
      counts[pan] = (counts[pan] || 0) + 1;
    });
    return Object.entries(counts).map(([val, count]) => ({
      value: val,
      label: val,
      count,
    }));
  }, [dynamicHighValueRecords]);

  const uniqueTypes = React.useMemo(() => [
    { value: 'Purchase', label: 'Purchase' },
    { value: 'Sale', label: 'Sale' },
  ], []);

  // Apply UI filters and Excel column filters
  const filteredRecords = React.useMemo(() => {
    let result = dynamicHighValueRecords.filter((rec) => {
      if (registerType === 'Purchase' && rec.type !== 'Purchase') return false;
      if (registerType === 'Sale' && rec.type !== 'Sale') return false;
      if (selectedMonth !== 'All Months' && !rec.dateMonth.toLowerCase().includes(selectedMonth.toLowerCase())) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = rec.taxPayerName ? rec.taxPayerName.toLowerCase().includes(term) : false;
        const matchPan = rec.pan ? rec.pan.toLowerCase().includes(term) : false;
        const matchBill = rec.billNo ? rec.billNo.toLowerCase().includes(term) : false;
        if (!matchName && !matchPan && !matchBill) return false;
      }

      // Column filters
      if (columnFilters.taxPayerName && columnFilters.taxPayerName.size > 0) {
        if (!columnFilters.taxPayerName.has(rec.taxPayerName || 'Unknown')) return false;
      }
      if (columnFilters.pan && columnFilters.pan.size > 0) {
        if (!columnFilters.pan.has(rec.pan || 'No PAN')) return false;
      }
      if (columnFilters.type && columnFilters.type.size > 0) {
        if (!columnFilters.type.has(rec.type)) return false;
      }

      return true;
    });

    // Excel column sorting
    if (sortKey && sortDir) {
      result = [...result].sort((a, b) => {
        let cmp = 0;
        if (sortKey === 'sn') {
          cmp = (a.sn || 0) - (b.sn || 0);
        } else if (sortKey === 'dateMonth') {
          cmp = (a.dateMonth || '').localeCompare(b.dateMonth || '');
        } else if (sortKey === 'billNo') {
          cmp = (a.billNo || '').localeCompare(b.billNo || '', undefined, { numeric: true });
        } else if (sortKey === 'pan') {
          cmp = (a.pan || '').localeCompare(b.pan || '');
        } else if (sortKey === 'taxPayerName') {
          cmp = (a.taxPayerName || '').localeCompare(b.taxPayerName || '');
        } else if (sortKey === 'type') {
          cmp = a.type.localeCompare(b.type);
        } else if (sortKey === 'taxableAmount') {
          cmp = a.taxableAmount - b.taxableAmount;
        } else if (sortKey === 'exemptedAmount') {
          cmp = (a.exemptedAmount || 0) - (b.exemptedAmount || 0);
        } else if (sortKey === 'nonTaxableAmount') {
          cmp = (a.nonTaxableAmount || 0) - (b.nonTaxableAmount || 0);
        }
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [dynamicHighValueRecords, registerType, selectedMonth, searchTerm, columnFilters, sortKey, sortDir]);

  const hasActiveFilters = Object.values(columnFilters).some((f) => f !== null && f.size > 0) || 
    searchTerm.trim().length > 0 || 
    registerType !== 'All' || 
    selectedMonth !== 'All Months';

  const purchaseCount = filteredRecords.filter((r) => r.type === 'Purchase').length;
  const salesCount = filteredRecords.filter((r) => r.type === 'Sale').length;
  const totalTaxable = filteredRecords.reduce((s, r) => s + r.taxableAmount, 0);

  const handleExportExcel = () => {
    const finalRecordsWithOverrides = filteredRecords.map((r) => ({
      ...r,
      tradeNameType: tradeTypeOverrides[r.id] || r.tradeNameType || 'E',
    }));
    exportAboveOneLakhExcel(finalRecordsWithOverrides, company, fiscalYear);
  };

  const handleTradeTypeChange = (id: string, val: string) => {
    setTradeTypeOverrides((prev) => ({ ...prev, [id]: val }));
  };

  return (
    <div className="space-y-4">
      {/* Dark Header Banner from Screenshot 6 */}
      <div className="bg-[#0b1523] border border-slate-800 rounded-2xl p-5 shadow-sm text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Above Rs. 1 Lakh Transactions Analyzer
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Extracts, groups, and categorizes high-value purchase and sales records exceeding the 1 Lakh (Rs. 100,000) threshold baseline per party per month. Prepared and styled according to official Nepal IRD compliance declaration guidelines.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 bg-[#059669] hover:bg-[#047857] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm shrink-0 self-start md:self-center"
        >
          <Download className="w-4 h-4" />
          <span>Export High-Value Excel</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Threshold Filter */}
          <div>
            <label className="block font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase text-[10px] tracking-wider">
              THRESHOLD (RS.)
            </label>
            <div className="relative">
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>

          {/* Register Type Filter */}
          <div>
            <label className="block font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase text-[10px] tracking-wider">
              REGISTER TYPE
            </label>
            <div className="relative">
              <select
                value={registerType}
                onChange={(e) => setRegisterType(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white appearance-none cursor-pointer focus:outline-none focus:border-slate-400"
              >
                <option value="All">All Registers</option>
                <option value="Purchase">Purchase Only</option>
                <option value="Sale">Sale Only</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Reporting Month Filter */}
          <div>
            <label className="block font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase text-[10px] tracking-wider">
              REPORTING MONTH
            </label>
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white appearance-none cursor-pointer focus:outline-none focus:border-slate-400"
              >
                <option value="All Months">All Months</option>
                <option value="Shrawan">Shrawan</option>
                <option value="Bhadra">Bhadra</option>
                <option value="Ashoj">Ashoj</option>
                <option value="Kartik">Kartik</option>
                <option value="Mangsir">Mangsir</option>
                <option value="Poush">Poush</option>
                <option value="Magh">Magh</option>
                <option value="Falgun">Falgun</option>
                <option value="Chaitra">Chaitra</option>
                <option value="Baisakh">Baisakh</option>
                <option value="Jestha">Jestha</option>
                <option value="Ashadh">Ashadh</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Quick Search */}
          <div>
            <label className="block font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase text-[10px] tracking-wider">
              QUICK SEARCH
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Name, PAN or Bill..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 5 KPI Metric Cards from Screenshot 6 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: High-Value Purchases */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/50 border border-orange-200/80 dark:border-orange-900/60 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              HIGH-VALUE PURCHASES
            </span>
            <div className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              {purchaseCount} entries
            </div>
          </div>
        </div>

        {/* Card 2: High-Value Sales */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              HIGH-VALUE SALES
            </span>
            <div className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              {salesCount} entries
            </div>
          </div>
        </div>

        {/* Card 3: Total Taxable Amount */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shrink-0 text-xs">
            Rs.
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              TOTAL TAXABLE AMOUNT
            </span>
            <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
              Rs. {formatRs(totalTaxable)}
            </div>
          </div>
        </div>

        {/* Card 4: Total Exempted Amount */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-500 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              TOTAL EXEMPTED AMOUNT
            </span>
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono tracking-tight">
              Rs. 0.00
            </div>
          </div>
        </div>

        {/* Card 5: Total Non-Taxable Amount */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200/80 dark:border-teal-900/60 flex items-center justify-center text-teal-600 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              TOTAL NON-TAXABLE AMOUNT
            </span>
            <div className="text-sm font-bold text-teal-700 dark:text-teal-400 font-mono tracking-tight">
              Rs. 0.00
            </div>
          </div>
        </div>
      </div>

      {/* Filtered Declaration Records Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Totals Strip (Excel Subtotal Bar) */}
        <div className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
          <div className="flex items-center gap-3">
            <span className="text-slate-900 dark:text-white uppercase tracking-wider">TOTALS</span>
            <span className="text-[11px] font-normal text-slate-500 font-sans">
              ({filteredRecords.length} of {dynamicHighValueRecords.length} lines shown)
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
              Taxable: <strong className="text-emerald-600 dark:text-emerald-400">Rs. {formatRs(totalTaxable)}</strong>
            </span>
            <span className="text-slate-700 dark:text-slate-300">
              Purchases: <strong className="text-orange-600 dark:text-orange-400">{purchaseCount}</strong>
            </span>
            <span className="text-slate-700 dark:text-slate-300">
              Sales: <strong className="text-blue-600 dark:text-blue-400">{salesCount}</strong>
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
                    title="DATE (MONTH)"
                    columnKey="dateMonth"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                  />
                </th>
                <th className="py-2.5 px-3">
                  <ExcelColumnHeader
                    title="BILL NO."
                    columnKey="billNo"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                  />
                </th>
                <th className="py-2.5 px-3">
                  <ExcelColumnHeader
                    title="PAN"
                    columnKey="pan"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                    uniqueValues={uniquePans}
                    selectedFilterValues={columnFilters.pan}
                    onFilterChange={(v) => handleFilterChange('pan', v)}
                  />
                </th>
                <th className="py-2.5 px-3">
                  <ExcelColumnHeader
                    title="NAME OF TAX PAYER"
                    columnKey="taxPayerName"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                    uniqueValues={uniqueTaxPayers}
                    selectedFilterValues={columnFilters.taxPayerName}
                    onFilterChange={(v) => handleFilterChange('taxPayerName', v)}
                  />
                </th>
                <th className="py-2.5 px-3">
                  <ExcelColumnHeader
                    title="TRADE NAME TYPE"
                    columnKey="tradeNameType"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                  />
                </th>
                <th className="py-2.5 px-3">
                  <ExcelColumnHeader
                    title="PURCHASE/SALE"
                    columnKey="type"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                    uniqueValues={uniqueTypes}
                    selectedFilterValues={columnFilters.type}
                    onFilterChange={(v) => handleFilterChange('type', v)}
                  />
                </th>
                <th className="py-2.5 px-3 text-right">
                  <ExcelColumnHeader
                    title="TAXABLE AMOUNT (RS.)"
                    columnKey="taxableAmount"
                    align="right"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                    isNumeric
                  />
                </th>
                <th className="py-2.5 px-3 text-center">
                  <ExcelColumnHeader
                    title="EXEMPTED AMOUNT"
                    columnKey="exemptedAmount"
                    align="center"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                    isNumeric
                  />
                </th>
                <th className="py-2.5 px-3 text-center">
                  <ExcelColumnHeader
                    title="NON-TAXABLE AMOUNT"
                    columnKey="nonTaxableAmount"
                    align="center"
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
                  <td colSpan={10} className="py-12 px-4 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {hasActiveFilters ? 'No transactions matching filters' : `No transactions exceeding Rs. ${threshold.toLocaleString()}`}
                      </div>
                      <p className="text-xs text-slate-500">
                        {hasActiveFilters
                          ? 'Try resetting your Excel column filters or adjusting the threshold.'
                          : 'Transactions exceeding the threshold per party per month will be automatically grouped and categorized here for IRD Annex compliance reporting.'}
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleClearAllFilters}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          Reset All Filters
                        </button>
                      )}
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
                      {row.dateMonth}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                      {row.billNo}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {row.pan}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {row.taxPayerName}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="relative inline-block">
                        <select
                          value={tradeTypeOverrides[row.id] || row.tradeNameType || 'E'}
                          onChange={(e) => handleTradeTypeChange(row.id, e.target.value)}
                          className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
                        >
                          <option value="E">E (English)</option>
                          <option value="N">N (Nepali)</option>
                          <option value="B">B (Both)</option>
                        </select>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold ${
                          row.type === 'Purchase'
                            ? 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800'
                            : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        {row.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-slate-900 dark:text-white tabular-nums">
                      {formatRs(row.taxableAmount)}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-400 font-mono">
                      {row.exemptedAmount ? formatRs(row.exemptedAmount) : '-'}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-400 font-mono">
                      {row.nonTaxableAmount ? formatRs(row.nonTaxableAmount) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
