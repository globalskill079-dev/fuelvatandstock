import React, { useState } from 'react';
import { Company, SalesRecord, PurchaseRecord, MonthlyVatRow } from '../types';
import { formatRs, formatLiters, calculateDynamicMonthlyVat, getNepaliMonthFromRecord } from '../utils/vatAndStockCalculations';
import { 
  Eye, 
  Fuel, 
  Download, 
  Lock, 
  Upload, 
  Check, 
  Edit3,
  ShoppingBag,
  TrendingUp,
  ArrowLeftRight,
  Landmark
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface VatSummaryMonthlyViewProps {
  company: Company;
  sales: SalesRecord[];
  purchases: PurchaseRecord[];
  fiscalYear: string;
}

export const VatSummaryMonthlyView: React.FC<VatSummaryMonthlyViewProps> = ({
  company,
  sales,
  purchases,
  fiscalYear,
}) => {
  const [drCrAdjustments, setDrCrAdjustments] = useState<Record<string, number>>({});
  const [showReturnDetails, setShowReturnDetails] = useState<boolean>(false);
  const [showFuelQuantities, setShowFuelQuantities] = useState<boolean>(false);
  const [editingDrCrMonth, setEditingDrCrMonth] = useState<string | null>(null);
  const [tempDrCrValue, setTempDrCrValue] = useState<string>('');

  // Dynamically calculate 12-month VAT reconciliation from real sales and purchase records
  const vatRows: MonthlyVatRow[] = calculateDynamicMonthlyVat(sales, purchases, drCrAdjustments);

  // Track months that actually contain sales or purchase transactions
  const activeMonths = React.useMemo(() => {
    const set = new Set<string>();
    const normalize = (m: string) => (m === 'Ashad' ? 'Ashadh' : m).toLowerCase();
    sales.forEach((s) => set.add(normalize(getNepaliMonthFromRecord(undefined, s.nepaliDate, s.date))));
    purchases.forEach((p) => set.add(normalize(getNepaliMonthFromRecord(p.month, p.nepaliDate, p.date))));
    return set;
  }, [sales, purchases]);

  // Hide blank rows for periods with no sales or purchase data
  const visibleVatRows: MonthlyVatRow[] = vatRows.filter(
    (r) =>
      activeMonths.has(r.month.toLowerCase()) ||
      r.taxablePurchase !== 0 ||
      r.purchaseVat !== 0 ||
      r.taxableSalesNet !== 0 ||
      r.salesVatNet !== 0 ||
      r.vatPayable !== 0 ||
      drCrAdjustments[r.month] !== undefined
  );

  // Summary totals across active periods
  const totalTaxablePurchase = visibleVatRows.reduce((sum, r) => sum + (r.taxablePurchase || 0), 0);
  const totalPurchaseVat = visibleVatRows.reduce((sum, r) => sum + (r.purchaseVat || 0), 0);
  const totalTaxableSalesNet = visibleVatRows.reduce((sum, r) => sum + (r.taxableSalesNet || 0), 0);
  const totalSalesVatNet = visibleVatRows.reduce((sum, r) => sum + (r.salesVatNet || 0), 0);
  const totalNetPayable = visibleVatRows.reduce((sum, r) => sum + (r.netPayable || 0), 0);
  const payableMonthsCount = visibleVatRows.filter((r) => (r.netPayable || 0) > 0).length;

  const latestActiveRow = visibleVatRows.length > 0 ? visibleVatRows[visibleVatRows.length - 1] : null;
  const closingVatCredit =
    latestActiveRow && !(latestActiveRow.netPayable && latestActiveRow.netPayable > 0) && latestActiveRow.drCrAdjustment && latestActiveRow.drCrAdjustment < 0
      ? Math.abs(latestActiveRow.drCrAdjustment)
      : 0;

  // Dynamic drawer stats
  const returnRecords = sales.filter((s) => s.isCreditNote || s.taxableAmount < 0);
  const totalReturnTaxable = returnRecords.reduce((sum, r) => sum + Math.abs(r.taxableAmount), 0);
  const totalReturnVat = returnRecords.reduce((sum, r) => sum + Math.abs(r.vatAmount), 0);

  const petrolDispensed = sales
    .filter((s) => (s.product === 'Petrol' || s.product === 'MS') && !s.isCreditNote && s.taxableAmount >= 0)
    .reduce((sum, s) => sum + (s.quantityL || 0), 0);

  const dieselDispensed = sales
    .filter((s) => (s.product === 'Diesel' || s.product === 'HSD') && !s.isCreditNote && s.taxableAmount >= 0)
    .reduce((sum, s) => sum + (s.quantityL || 0), 0);

  const petrolPurchased = purchases
    .filter((p) => p.product === 'Petrol' || p.product === 'MS')
    .reduce((sum, p) => sum + (p.quantityL || 0), 0);

  const dieselPurchased = purchases
    .filter((p) => p.product === 'Diesel' || p.product === 'HSD')
    .reduce((sum, p) => sum + (p.quantityL || 0), 0);

  const handleExportExcel = () => {
    const rowsToExport = visibleVatRows.length > 0 ? visibleVatRows : vatRows;
    const formattedData = rowsToExport.map((r) => ({
      Month: r.month,
      'Taxable Purchase': r.taxablePurchase || 0,
      'Purchase VAT (13%)': r.purchaseVat || 0,
      'Taxable Sales (Net)': r.taxableSalesNet || 0,
      'Sales VAT (Net)': r.salesVatNet || 0,
      'VAT Payable': r.vatPayable || 0,
      'Dr/Cr (Adjustment)': r.drCrAdjustment ? `(${formatRs(Math.abs(r.drCrAdjustment))})` : '-',
      'Net Payable': r.netPayable || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly VAT Returns');
    XLSX.writeFile(
      wb,
      `Nepal_Monthly_VAT_Return_${(company.name || 'Station').replace(/[^a-zA-Z0-9]/g, '_')}_${fiscalYear.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`
    );
  };

  const handleSaveDrCr = (month: string) => {
    const val = parseFloat(tempDrCrValue);
    setDrCrAdjustments((prev) => ({
      ...prev,
      [month]: isNaN(val) ? 0 : val,
    }));
    setEditingDrCrMonth(null);
  };

  return (
    <div className="space-y-4">
      {/* Title & Action Buttons Row from Screenshot 5 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Monthly VAT Return Register
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Nepal Monthly VAT Return Summary (Reconciles Gross Sales, Returns, Net VAT & Fuel Volumes)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowReturnDetails(!showReturnDetails)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition border shadow-xs ${
              showReturnDetails
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Show Return Details</span>
          </button>

          <button
            onClick={() => setShowFuelQuantities(!showFuelQuantities)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition border shadow-xs ${
              showFuelQuantities
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            <Fuel className="w-3.5 h-3.5 text-amber-600" />
            <span>Show Fuel Quantities (Ltr)</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 bg-[#059669] hover:bg-[#047857] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export to Excel</span>
          </button>
        </div>
      </div>

      {/* 4 Pastel KPI Summary Cards matching VAT Stock Register */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: TOTAL TAXABLE PURCHASE */}
        <div className="bg-[#f4f7fc] dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
              TOTAL TAXABLE PURCHASE
            </span>
            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <ShoppingBag className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
            Rs. {formatRs(totalTaxablePurchase)}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1 font-mono">
            Purchase VAT: Rs. {formatRs(totalPurchaseVat)}
          </div>
        </div>

        {/* Card 2: NET TAXABLE SALES */}
        <div className="bg-[#f0fdf4] dark:bg-slate-900 border border-[#bbf7d0] dark:border-emerald-950/60 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
              NET TAXABLE SALES
            </span>
            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <TrendingUp className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono tracking-tight">
            Rs. {formatRs(totalTaxableSalesNet)}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1 font-mono">
            Sales VAT (Net): Rs. {formatRs(totalSalesVatNet)}
          </div>
        </div>

        {/* Card 3: VAT CREDIT CARRY-FWD */}
        <div className="bg-[#fefce8] dark:bg-slate-900 border border-[#fef08a] dark:border-amber-950/60 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              VAT CREDIT (DR/CR BAL)
            </span>
            <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <ArrowLeftRight className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-700 dark:text-amber-400 font-mono tracking-tight">
            Rs. {formatRs(closingVatCredit)}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            {closingVatCredit > 0
              ? `Carried forward from ${latestActiveRow?.month}`
              : 'No carried-forward input credit'}
          </div>
        </div>

        {/* Card 4: TOTAL NET VAT PAYABLE */}
        <div className="bg-[#fff5f5] dark:bg-slate-900 border border-[#fed7d7] dark:border-rose-950/60 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              TOTAL NET VAT PAYABLE
            </span>
            <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Landmark className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight">
            Rs. {formatRs(totalNetPayable)}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            {payableMonthsCount > 0
              ? `Across ${payableMonthsCount} payable month(s)`
              : 'No net VAT payable due'}
          </div>
        </div>
      </div>

      {/* Return Details Drawer if toggled */}
      {showReturnDetails && (
        <div className="bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl p-4 text-xs text-indigo-950 dark:text-indigo-200">
          <div className="font-bold mb-1 flex items-center gap-2">
            <span>Sales & Purchase Returns Integrated in Monthly VAT:</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            {returnRecords.length > 0 ? (
              <>Credit notes ({returnRecords.length} entries) reduce output VAT liability by <strong>Rs. {formatRs(totalReturnVat)}</strong> (Taxable Rs. {formatRs(totalReturnTaxable)}). Debit notes adjust purchase input tax credit according to Inland Revenue Department (IRD) Nepal standard format.</>
            ) : (
              <>No sales returns or credit notes recorded yet. When credit notes are recorded, they automatically adjust output VAT liability.</>
            )}
          </p>
        </div>
      )}

      {/* Fuel Quantities Drawer if toggled */}
      {showFuelQuantities && (
        <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 text-xs text-amber-950 dark:text-amber-200">
          <div className="font-bold mb-1">Fuel Dispensing & Purchase Volume Snapshot:</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700 dark:text-slate-300 mt-2 font-mono">
            <div>Petrol Dispensed: <strong className="text-slate-900 dark:text-white">{formatLiters(petrolDispensed)} L</strong></div>
            <div>Diesel Dispensed: <strong className="text-slate-900 dark:text-white">{formatLiters(dieselDispensed)} L</strong></div>
            <div>Petrol Purchases: <strong className="text-slate-900 dark:text-white">{formatLiters(petrolPurchased)} L</strong></div>
            <div>Diesel Purchases: <strong className="text-slate-900 dark:text-white">{formatLiters(dieselPurchased)} L</strong></div>
          </div>
        </div>
      )}

      {/* 12-Month IRD Table from Screenshot 5 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3 w-36">
                  <div className="flex items-center gap-1">
                    <span>Month ({visibleVatRows.length})</span>
                  </div>
                </th>
                <th className="py-3 px-3 text-right">Taxable Purchase</th>
                <th className="py-3 px-3 text-right">Purchase VAT</th>
                <th className="py-3 px-3 text-right bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300">
                  Taxable Sales (Net)
                </th>
                <th className="py-3 px-3 text-right bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300">
                  Sales VAT (Net)
                </th>
                <th className="py-3 px-3 text-right">VAT Payable</th>
                <th className="py-3 px-3 text-center text-amber-700 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-950/20">
                  <div className="flex items-center justify-center gap-1">
                    <span>Dr/Cr</span>
                    <span className="text-[9px] text-amber-600 font-bold uppercase">EDITABLE ✏</span>
                  </div>
                </th>
                <th className="py-3 px-3 text-right text-sky-700 dark:text-sky-400 bg-sky-50/30 dark:bg-sky-950/20">
                  <div className="flex items-center justify-end gap-1">
                    <span>Net Payable</span>
                    <span className="text-[9px] text-sky-600 font-bold uppercase">EDITABLE ✏</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {visibleVatRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 px-4 text-center text-xs text-slate-500 dark:text-slate-400">
                    No monthly sales or purchase entries yet. Periods will appear automatically once sales or purchase data is entered or imported.
                  </td>
                </tr>
              ) : (
                visibleVatRows.map((row) => {
                  const isEditingDrCr = editingDrCrMonth === row.month;
                  return (
                  <tr
                    key={row.month}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                  >
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      <div className="flex items-center justify-between">
                        <span>{row.month}</span>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <button
                            title="Upload/Import specific monthly invoices"
                            className="hover:text-slate-700 dark:hover:text-white"
                          >
                            <Upload className="w-3 h-3" />
                          </button>
                          {row.isLocked && <Lock className="w-3 h-3 text-slate-300 dark:text-slate-600" />}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                      {row.taxablePurchase ? formatRs(row.taxablePurchase) : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                      {row.purchaseVat ? formatRs(row.purchaseVat) : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white bg-emerald-50/20 dark:bg-emerald-950/10 tabular-nums">
                      {row.taxableSalesNet ? formatRs(row.taxableSalesNet) : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white bg-emerald-50/20 dark:bg-emerald-950/10 tabular-nums">
                      {row.salesVatNet ? formatRs(row.salesVatNet) : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black tabular-nums">
                      {row.vatPayable ? (
                        <span className={row.vatPayable < 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                          {row.vatPayable < 0 ? `-${formatRs(Math.abs(row.vatPayable))}` : formatRs(row.vatPayable)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Dr/Cr Column (Editable) */}
                    <td className="py-3 px-3 text-center font-mono text-amber-700 dark:text-amber-400 bg-amber-50/20 dark:bg-amber-950/10 tabular-nums">
                      {isEditingDrCr ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="text"
                            value={tempDrCrValue}
                            onChange={(e) => setTempDrCrValue(e.target.value)}
                            placeholder="-6947111.66"
                            className="w-28 text-center text-xs py-0.5 px-1 border border-amber-400 rounded bg-white dark:bg-slate-900 font-mono"
                          />
                          <button
                            onClick={() => handleSaveDrCr(row.month)}
                            className="text-emerald-600 hover:text-emerald-800"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setEditingDrCrMonth(row.month);
                            setTempDrCrValue(row.drCrAdjustment ? String(row.drCrAdjustment) : '');
                          }}
                          className="cursor-pointer hover:underline flex items-center justify-center gap-1"
                        >
                          {row.drCrAdjustment ? (
                            <span>({formatRs(Math.abs(row.drCrAdjustment))})</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                          <Edit3 className="w-2.5 h-2.5 text-slate-300 dark:text-slate-600 group-hover:text-amber-500 transition" />
                        </div>
                      )}
                    </td>

                    {/* Net Payable Column */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white bg-sky-50/20 dark:bg-sky-950/10 tabular-nums">
                      {row.netPayable ? formatRs(row.netPayable) : '-'}
                    </td>
                  </tr>
                );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
