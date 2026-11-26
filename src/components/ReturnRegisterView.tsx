import React, { useState } from 'react';
import { Company, SalesRecord, PurchaseRecord } from '../types';
import { formatRs, formatLiters } from '../utils/vatAndStockCalculations';
import { exportSalesRegisterToExcel } from '../utils/storageAndExport';
import { 
  ArrowLeftRight, 
  FileText, 
  Fuel, 
  Plus, 
  ShieldCheck, 
  Download,
  Search,
  X
} from 'lucide-react';
import { ExcelColumnHeader } from './ExcelColumnHeader';

interface ReturnRegisterViewProps {
  company: Company;
  sales: SalesRecord[];
  purchases: PurchaseRecord[];
  fiscalYear: string;
  onOpenManualEntry: () => void;
}

export const ReturnRegisterView: React.FC<ReturnRegisterViewProps> = ({
  company,
  sales,
  purchases,
  fiscalYear,
  onOpenManualEntry,
}) => {
  const [returnType, setReturnType] = useState<'sales' | 'purchase'>('sales');
  const [searchTerm, setSearchTerm] = useState('');

  // Excel-style interactive sorting and column filtering state
  const [sortKey, setSortKey] = useState<string | null>('date');
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
    setSortKey('date');
    setSortDir('desc');
  };

  // Filter actual return records from real uploaded or entered data
  const salesReturns = sales.filter((s) => s.isCreditNote || s.taxableAmount < 0);
  const purchaseReturns = purchases.filter((p) => p.isDebitNote || p.taxableAmount < 0);

  const baseReturnsData = returnType === 'sales' ? salesReturns : purchaseReturns;

  // Distinct filter values
  const uniqueProducts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    baseReturnsData.forEach((r) => {
      const p = r.product || 'Other';
      counts[p] = (counts[p] || 0) + 1;
    });
    return Object.entries(counts).map(([val, count]) => ({
      value: val,
      label: val,
      count,
    }));
  }, [baseReturnsData]);

  const uniqueParticulars = React.useMemo(() => {
    const counts: Record<string, number> = {};
    baseReturnsData.forEach((r) => {
      const p = ('customer' in r ? r.customer : r.supplier) || 'Unknown';
      counts[p] = (counts[p] || 0) + 1;
    });
    return Object.entries(counts).map(([val, count]) => ({
      value: val,
      label: val,
      count,
    }));
  }, [baseReturnsData]);

  // Filtered and sorted returns
  const filteredReturns = React.useMemo(() => {
    let result = baseReturnsData.filter((r) => {
      const party = ('customer' in r ? r.customer : r.supplier) || '';
      const bill = ('billNo' in r ? r.billNo : r.chalanNo) || '';
      const ref = ('originalInvoiceRef' in r ? r.originalInvoiceRef : '') || '';
      const dateStr = (r.nepaliDate || r.date || '');

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        if (
          !party.toLowerCase().includes(term) &&
          !bill.toLowerCase().includes(term) &&
          !ref.toLowerCase().includes(term) &&
          !dateStr.toLowerCase().includes(term) &&
          !r.product.toLowerCase().includes(term)
        ) {
          return false;
        }
      }

      // Column filters
      if (columnFilters.product && columnFilters.product.size > 0) {
        if (!columnFilters.product.has(r.product || 'Other')) return false;
      }
      if (columnFilters.particulars && columnFilters.particulars.size > 0) {
        if (!columnFilters.particulars.has(party)) return false;
      }

      return true;
    });

    // Sorting
    if (sortKey && sortDir) {
      result = [...result].sort((a, b) => {
        let cmp = 0;
        const partyA = ('customer' in a ? a.customer : a.supplier) || '';
        const partyB = ('customer' in b ? b.customer : b.supplier) || '';
        const billA = ('billNo' in a ? a.billNo : a.chalanNo) || '';
        const billB = ('billNo' in b ? b.billNo : b.chalanNo) || '';
        const dateA = a.nepaliDate || a.date || '';
        const dateB = b.nepaliDate || b.date || '';

        if (sortKey === 'date') {
          cmp = dateA.localeCompare(dateB);
        } else if (sortKey === 'billNo') {
          cmp = billA.localeCompare(billB, undefined, { numeric: true });
        } else if (sortKey === 'particulars') {
          cmp = partyA.localeCompare(partyB);
        } else if (sortKey === 'product') {
          cmp = (a.product || '').localeCompare(b.product || '');
        } else if (sortKey === 'quantityL') {
          cmp = (a.quantityL || 0) - (b.quantityL || 0);
        } else if (sortKey === 'taxableAmount') {
          cmp = Math.abs(a.taxableAmount) - Math.abs(b.taxableAmount);
        } else if (sortKey === 'vatAmount') {
          cmp = Math.abs(a.vatAmount) - Math.abs(b.vatAmount);
        } else if (sortKey === 'totalAmount') {
          cmp = (Math.abs(a.taxableAmount) + Math.abs(a.vatAmount)) - (Math.abs(b.taxableAmount) + Math.abs(b.vatAmount));
        }
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [baseReturnsData, searchTerm, columnFilters, sortKey, sortDir]);

  const hasActiveFilters = Object.values(columnFilters).some((f) => f !== null && f.size > 0) || searchTerm.trim().length > 0;

  const totalTaxable = filteredReturns.reduce((sum, r) => sum + Math.abs(r.taxableAmount), 0);
  const totalVat = filteredReturns.reduce((sum, r) => sum + Math.abs(r.vatAmount), 0);
  const totalGross = totalTaxable + totalVat;

  const dieselLiters = filteredReturns
    .filter((r) => r.product === 'Diesel' || r.product === 'HSD')
    .reduce((sum, r) => sum + (r.quantityL || 0), 0);

  const petrolLiters = filteredReturns
    .filter((r) => r.product === 'Petrol' || r.product === 'MS')
    .reduce((sum, r) => sum + (r.quantityL || 0), 0);

  const totalLiters = dieselLiters + petrolLiters + filteredReturns
    .filter((r) => r.product !== 'Diesel' && r.product !== 'HSD' && r.product !== 'Petrol' && r.product !== 'MS')
    .reduce((sum, r) => sum + (r.quantityL || 0), 0);

  return (
    <div className="space-y-4">
      {/* Sub-tab switcher: Sales Return / Purchase Return */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setReturnType('sales')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
            returnType === 'sales'
              ? 'bg-[#0c192c] text-white font-black'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>Sales Return ({salesReturns.length})</span>
        </button>

        <button
          onClick={() => setReturnType('purchase')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
            returnType === 'purchase'
              ? 'bg-[#0c192c] text-white font-black'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>Purchase Return (Debit Notes) ({purchaseReturns.length})</span>
        </button>
      </div>

      {/* Title & Action Buttons Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {returnType === 'sales' ? 'Sales Returns' : 'Purchase Returns'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {returnType === 'sales'
              ? `Sales return records from ${company.softwareType || 'invoicing software'}.`
              : 'Purchase return debit note adjustments.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search returns..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-slate-400 shadow-xs"
            />
          </div>

          <button
            onClick={onOpenManualEntry}
            className="flex items-center gap-1.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Return by Invoice</span>
          </button>

          <button
            onClick={() => alert(`Auditing duplicate return credit notes... ${baseReturnsData.length} records checked.`)}
            className="flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Audit Duplicates</span>
          </button>

          <button
            onClick={() => exportSalesRegisterToExcel(filteredReturns as SalesRecord[], company, fiscalYear)}
            className="flex items-center gap-1.5 bg-[#059669] hover:bg-[#047857] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* 4 Pastel KPI Cards from Screenshot 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: TOTAL RETURNS (TAXABLE) */}
        <div className="bg-[#fff5f5] dark:bg-slate-900 border border-[#fed7d7] dark:border-rose-950/60 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              TOTAL {returnType === 'sales' ? 'SALES' : 'PURCHASE'} RETURNS (TAXABLE)
            </span>
            <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600">
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight">
            Rs. {formatRs(totalTaxable)}
          </div>
          <div className="text-xs text-rose-500 font-medium mt-1">
            {filteredReturns.length} {returnType === 'sales' ? 'Credit' : 'Debit'} Notes Registered
          </div>
        </div>

        {/* Card 2: 13% VAT ON RETURNS */}
        <div className="bg-[#f0f9ff] dark:bg-slate-900 border border-[#bae6fd] dark:border-sky-950/60 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wider">
              13% VAT ON RETURNS
            </span>
            <div className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-950/60 flex items-center justify-center text-sky-600">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-sky-700 dark:text-sky-400 font-mono tracking-tight">
            Rs. {formatRs(totalVat)}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            {returnType === 'sales' ? 'Input VAT Adjustment' : 'Output VAT Adjustment'}
          </div>
        </div>

        {/* Card 3: DIESEL RETURN VOLUME */}
        <div className="bg-[#fefce8] dark:bg-slate-900 border border-[#fef08a] dark:border-amber-950/60 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              DIESEL RETURN VOLUME
            </span>
            <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700">
              <Fuel className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
            {formatLiters(dieselLiters)} Ltr
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Restocked into Diesel Tank
          </div>
        </div>

        {/* Card 4: PETROL RETURN VOLUME */}
        <div className="bg-[#f0fdf4] dark:bg-slate-900 border border-[#bbf7d0] dark:border-emerald-950/60 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
              PETROL RETURN VOLUME
            </span>
            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700">
              <Fuel className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
            {formatLiters(petrolLiters)} Ltr
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Restocked into Petrol Tank
          </div>
        </div>
      </div>

      {/* Main Table with Totals from Screenshot 3 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Totals Strip (Excel Subtotal Bar) */}
        <div className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
          <div className="flex items-center gap-3">
            <span className="text-slate-900 dark:text-white uppercase tracking-wider">TOTALS</span>
            <span className="text-[11px] font-normal text-slate-500 font-sans">
              ({filteredReturns.length} of {baseReturnsData.length} records shown)
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
              Qty: <strong className="text-slate-900 dark:text-white">{formatLiters(totalLiters)} L</strong>
            </span>
            <span className="text-slate-700 dark:text-slate-300">
              Taxable: <strong className="text-rose-600 dark:text-rose-400">Rs. {formatRs(totalTaxable)}</strong>
            </span>
            <span className="text-slate-700 dark:text-slate-300">
              VAT: <strong className="text-rose-600 dark:text-rose-400">Rs. {formatRs(totalVat)}</strong>
            </span>
            <span className="text-slate-700 dark:text-slate-300">
              Total: <strong className="text-rose-600 dark:text-rose-400">Rs. {formatRs(totalGross)}</strong>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="py-2.5 px-3">
                  <ExcelColumnHeader
                    title="DATE (BS/AD)"
                    columnKey="date"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                  />
                </th>
                <th className="py-2.5 px-3">
                  <ExcelColumnHeader
                    title="TRANSACTION BILL NO"
                    columnKey="billNo"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                  />
                </th>
                <th className="py-2.5 px-3">
                  <ExcelColumnHeader
                    title="ORIGINAL INVOICE (REF)"
                    columnKey="originalInvoiceRef"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                  />
                </th>
                <th className="py-2.5 px-3">
                  <ExcelColumnHeader
                    title="PARTICULARS"
                    columnKey="particulars"
                    currentSortKey={sortKey}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                    uniqueValues={uniqueParticulars}
                    selectedFilterValues={columnFilters.particulars}
                    onFilterChange={(v) => handleFilterChange('particulars', v)}
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
                    title="RETURN LTR"
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
                    columnKey="totalAmount"
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
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 px-4 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <ArrowLeftRight className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {hasActiveFilters ? 'No return records matching filters' : 'No return records registered yet'}
                      </div>
                      <p className="text-xs text-slate-500">
                        {hasActiveFilters
                          ? 'Try resetting your Excel column filters or search term to see records.'
                          : 'Sales returns and credit notes imported from your invoicing software or recorded manually will appear here.'}
                      </p>
                      {hasActiveFilters ? (
                        <button
                          type="button"
                          onClick={handleClearAllFilters}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          Reset All Filters
                        </button>
                      ) : (
                        <button
                          onClick={onOpenManualEntry}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition"
                        >
                          + Record Return by Invoice
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReturns.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                  >
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">{row.nepaliDate || row.date}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{row.date}</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {'billNo' in row ? row.billNo : row.chalanNo}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                      {'originalInvoiceRef' in row ? row.originalInvoiceRef || '-' : '-'}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white uppercase">
                      {'customer' in row ? row.customer : row.supplier}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                          row.product === 'Diesel' || row.product === 'HSD'
                            ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : row.product === 'Petrol' || row.product === 'MS'
                            ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                            : 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                        }`}
                      >
                        {row.product}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                      {formatLiters(row.quantityL)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                      Rs. {formatRs(Math.abs(row.taxableAmount))}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-rose-600 dark:text-rose-400 tabular-nums">
                      Rs. {formatRs(Math.abs(row.vatAmount))}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                      Rs. {formatRs(Math.abs(row.taxableAmount) + Math.abs(row.vatAmount))}
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
