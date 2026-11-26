import React, { useState } from 'react';
import { Company, SalesRecord, PurchaseRecord, MonthlyStockRow } from '../types';
import { formatLiters, calculateDynamicMonthlyStock } from '../utils/vatAndStockCalculations';
import { 
  ArrowLeftRight, 
  Fuel, 
  Download, 
  Lock, 
  Edit3, 
  Check, 
  X 
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface VatStockRegisterViewProps {
  company: Company;
  sales: SalesRecord[];
  purchases: PurchaseRecord[];
  fiscalYear: string;
  onUpdateCompanyOpeningStock?: (msOpening: number, hsdOpening: number) => void;
}

export const VatStockRegisterView: React.FC<VatStockRegisterViewProps> = ({
  company,
  sales,
  purchases,
  fiscalYear,
  onUpdateCompanyOpeningStock,
}) => {
  // Dynamically calculate 12-month stock flows from real sales and purchases
  const stockRows: MonthlyStockRow[] = calculateDynamicMonthlyStock(company, sales, purchases);

  // Show only months that have sales, purchases, or returns (hide blank future/inactive months)
  const visibleStockRows: MonthlyStockRow[] = stockRows.filter(
    (r) =>
      r.petrol.purchase !== 0 ||
      r.petrol.sales !== 0 ||
      r.petrol.returns !== 0 ||
      r.diesel.purchase !== 0 ||
      r.diesel.sales !== 0 ||
      r.diesel.returns !== 0
  );

  const [isEditingOpening, setIsEditingOpening] = useState(false);
  const [editPetrolOpening, setEditPetrolOpening] = useState<number>(company.msOpeningStockL || 0);
  const [editDieselOpening, setEditDieselOpening] = useState<number>(company.hsdOpeningStockL || 0);

  // Compute total returns and closing stock dynamically
  const petrolReturn = visibleStockRows.reduce((sum, r) => sum + r.petrol.returns, 0);
  const dieselReturn = visibleStockRows.reduce((sum, r) => sum + r.diesel.returns, 0);

  const petrolFinalStock = visibleStockRows.length > 0
    ? visibleStockRows[visibleStockRows.length - 1].petrol.stock
    : (company.msOpeningStockL || 0);

  const dieselFinalStock = visibleStockRows.length > 0
    ? visibleStockRows[visibleStockRows.length - 1].diesel.stock
    : (company.hsdOpeningStockL || 0);

  const handleExportExcel = () => {
    const rowsToExport = visibleStockRows.length > 0 ? visibleStockRows : stockRows;
    const formattedData = rowsToExport.map((r) => ({
      Month: r.month,
      'Petrol Opening': r.petrol.opening,
      'Petrol Purchase': r.petrol.purchase,
      'Petrol Sales': r.petrol.sales,
      'Petrol Return': r.petrol.returns,
      'Petrol Shortage (0.88%)': r.petrol.shortage,
      'Petrol Closing Stock': r.petrol.stock,
      'Diesel Opening': r.diesel.opening,
      'Diesel Purchase': r.diesel.purchase,
      'Diesel Sales': r.diesel.sales,
      'Diesel Return': r.diesel.returns,
      'Diesel Shortage (0.605%)': r.diesel.shortage,
      'Diesel Closing Stock': r.diesel.stock,
    }));

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'VAT Stock Register');
    XLSX.writeFile(
      wb,
      `VAT_Stock_Register_${(company.name || 'Station').replace(/[^a-zA-Z0-9]/g, '_')}_${fiscalYear.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`
    );
  };

  const handleSaveOpening = () => {
    if (onUpdateCompanyOpeningStock) {
      onUpdateCompanyOpeningStock(editPetrolOpening, editDieselOpening);
    }
    setIsEditingOpening(false);
  };

  return (
    <div className="space-y-4">
      {/* Title & Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            VAT Stock Register
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monthly reconciliation of Diesel and Petrol stock including statutory working shortage (MS 0.88%, HSD 0.605%).
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="flex items-center gap-1.5 bg-[#059669] hover:bg-[#047857] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs self-start sm:self-center"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>

      {/* 4 Pastel KPI Summary Cards from Screenshot 4 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: PETROL SALES RETURN */}
        <div className="bg-[#fff5f5] dark:bg-slate-900 border border-[#fed7d7] dark:border-rose-950/60 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              PETROL SALES RETURN
            </span>
            <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600">
              <ArrowLeftRight className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight">
            {formatLiters(petrolReturn)} Ltr
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Returned to pump stock
          </div>
        </div>

        {/* Card 2: DIESEL SALES RETURN */}
        <div className="bg-[#fff5f5] dark:bg-slate-900 border border-[#fed7d7] dark:border-rose-950/60 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              DIESEL SALES RETURN
            </span>
            <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600">
              <ArrowLeftRight className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight">
            {formatLiters(dieselReturn)} Ltr
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Returned to pump stock
          </div>
        </div>

        {/* Card 3: PETROL FINAL STOCK */}
        <div className="bg-[#f0fdf4] dark:bg-slate-900 border border-[#bbf7d0] dark:border-emerald-950/60 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
              PETROL FINAL STOCK
            </span>
            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700">
              <Fuel className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono tracking-tight">
            {formatLiters(petrolFinalStock)} Ltr
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Book closing balance
          </div>
        </div>

        {/* Card 4: DIESEL FINAL STOCK */}
        <div className="bg-[#fefce8] dark:bg-slate-900 border border-[#fef08a] dark:border-amber-950/60 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              DIESEL FINAL STOCK
            </span>
            <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700">
              <Fuel className="w-3 h-3" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-700 dark:text-amber-400 font-mono tracking-tight">
            {formatLiters(dieselFinalStock)} Ltr
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Book closing balance
          </div>
        </div>
      </div>

      {/* Opening Stock Inline Editor */}
      {isEditingOpening && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-bold text-amber-900 dark:text-amber-200">
              Edit Opening Stock for Shrawan (Initial FY Baseline):
            </span>
            <div className="flex items-center gap-2">
              <label className="text-slate-600 dark:text-slate-300 font-medium">Petrol (L):</label>
              <input
                type="number"
                value={editPetrolOpening}
                onChange={(e) => setEditPetrolOpening(Number(e.target.value))}
                className="w-28 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-slate-600 dark:text-slate-300 font-medium">Diesel (L):</label>
              <input
                type="number"
                value={editDieselOpening}
                onChange={(e) => setEditDieselOpening(Number(e.target.value))}
                className="w-28 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveOpening}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Recompute</span>
            </button>
            <button
              onClick={() => setIsEditingOpening(false)}
              className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg font-semibold"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* 12-Month Dual Fuel Flow Table from Screenshot 4 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              {/* Primary Dual Fuel Header Band */}
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th
                  rowSpan={2}
                  className="py-3 px-3 w-32 bg-slate-50/70 dark:bg-slate-900/60 text-[11px] font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800"
                >
                  <div className="flex items-center gap-1">
                    <span>Month ({visibleStockRows.length})</span>
                  </div>
                </th>
                <th
                  colSpan={6}
                  className="py-2.5 px-3 text-center bg-[#f0fdf4] dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold border-r border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider"
                >
                  Petrol (MS - Shortage 0.88%)
                </th>
                <th
                  colSpan={6}
                  className="py-2.5 px-3 text-center bg-[#fffbeb] dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-bold text-xs uppercase tracking-wider"
                >
                  Diesel (HSD - Shortage 0.605%)
                </th>
              </tr>

              {/* Sub-Column Header Band */}
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {/* Petrol Sub-Columns */}
                <th className="py-2.5 px-2.5 text-right bg-[#f0fdf4]/50 dark:bg-emerald-950/20">
                  <div className="flex items-center justify-end gap-1">
                    <span>Opening</span>
                    <button
                      onClick={() => setIsEditingOpening(true)}
                      title="Edit opening stock"
                      className="text-emerald-600 hover:text-emerald-800"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                </th>
                <th className="py-2.5 px-2.5 text-right bg-[#f0fdf4]/50 dark:bg-emerald-950/20">Purchase</th>
                <th className="py-2.5 px-2.5 text-right bg-[#f0fdf4]/50 dark:bg-emerald-950/20">Sales</th>
                <th className="py-2.5 px-2.5 text-right bg-[#f0fdf4]/50 dark:bg-emerald-950/20">Return</th>
                <th className="py-2.5 px-2.5 text-right bg-[#f0fdf4]/50 dark:bg-emerald-950/20">Shortage</th>
                <th className="py-2.5 px-2.5 text-right font-black bg-[#f0fdf4]/70 dark:bg-emerald-950/30 border-r border-slate-200 dark:border-slate-800">
                  Stock
                </th>

                {/* Diesel Sub-Columns */}
                <th className="py-2.5 px-2.5 text-right bg-[#fffbeb]/50 dark:bg-amber-950/20">
                  <div className="flex items-center justify-end gap-1">
                    <span>Opening</span>
                    <button
                      onClick={() => setIsEditingOpening(true)}
                      title="Edit opening stock"
                      className="text-amber-600 hover:text-amber-800"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                </th>
                <th className="py-2.5 px-2.5 text-right bg-[#fffbeb]/50 dark:bg-amber-950/20">Purchase</th>
                <th className="py-2.5 px-2.5 text-right bg-[#fffbeb]/50 dark:bg-amber-950/20">Sales</th>
                <th className="py-2.5 px-2.5 text-right bg-[#fffbeb]/50 dark:bg-amber-950/20">Return</th>
                <th className="py-2.5 px-2.5 text-right bg-[#fffbeb]/50 dark:bg-amber-950/20">Shortage</th>
                <th className="py-2.5 px-2.5 text-right font-black bg-[#fffbeb]/70 dark:bg-amber-950/30">
                  Stock
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {visibleStockRows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-10 px-4 text-center text-xs text-slate-500 dark:text-slate-400">
                    No monthly sales or purchase entries yet. Periods will appear automatically once sales or purchase data is entered or imported.
                  </td>
                </tr>
              ) : (
                visibleStockRows.map((row) => (
                <tr
                  key={row.month}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                >
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <span>{row.month}</span>
                      {row.isLocked && <Lock className="w-3 h-3 text-slate-300 dark:text-slate-600" />}
                    </div>
                  </td>

                  {/* Petrol Values */}
                  <td className="py-2.5 px-2.5 text-right font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                    {row.petrol.opening ? formatLiters(row.petrol.opening) : '-'}
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                    {row.petrol.purchase ? formatLiters(row.petrol.purchase) : '-'}
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                    {row.petrol.sales ? formatLiters(row.petrol.sales) : '-'}
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                    {row.petrol.returns ? formatLiters(row.petrol.returns) : '-'}
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono text-slate-500 tabular-nums">
                    {row.petrol.shortage ? formatLiters(row.petrol.shortage) : '-'}
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono font-black text-slate-900 dark:text-white bg-[#f0fdf4]/40 dark:bg-emerald-950/20 border-r border-slate-200 dark:border-slate-800 tabular-nums">
                    {row.petrol.stock ? formatLiters(row.petrol.stock) : '-'}
                  </td>

                  {/* Diesel Values */}
                  <td className="py-2.5 px-2.5 text-right font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                    {row.diesel.opening ? formatLiters(row.diesel.opening) : '-'}
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                    {row.diesel.purchase ? formatLiters(row.diesel.purchase) : '-'}
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                    {row.diesel.sales ? formatLiters(row.diesel.sales) : '-'}
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                    {row.diesel.returns ? formatLiters(row.diesel.returns) : '-'}
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono text-slate-500 tabular-nums">
                    {row.diesel.shortage ? formatLiters(row.diesel.shortage) : '-'}
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono font-black text-slate-900 dark:text-white bg-[#fffbeb]/40 dark:bg-amber-950/20 tabular-nums">
                    {row.diesel.stock ? formatLiters(row.diesel.stock) : '-'}
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
