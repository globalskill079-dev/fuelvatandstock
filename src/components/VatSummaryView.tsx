import React from 'react';
import { Company, SalesRecord, PurchaseRecord, FuelType } from '../types';
import { calculateStationVatSummary, formatRs } from '../utils/vatAndStockCalculations';
import { FileText, Download, Calculator } from 'lucide-react';
import { exportVatAndStockReconciliationExcel } from '../utils/storageAndExport';

interface VatSummaryViewProps {
  company: Company;
  sales: SalesRecord[];
  purchases: PurchaseRecord[];
  fiscalYear: string;
}

export const VatSummaryView: React.FC<VatSummaryViewProps> = ({
  company,
  sales,
  purchases,
  fiscalYear,
}) => {
  const summary = calculateStationVatSummary(sales, purchases);

  const products: FuelType[] = ['Petrol', 'Diesel', 'MS', 'HSD', 'Speed', 'Lubricants'];

  const productBreakdown = products.map((prod) => {
    const prodSales = sales.filter((s) => s.product === prod && !s.isCreditNote);
    const prodReturns = sales.filter((s) => s.product === prod && s.isCreditNote);
    const prodPurchases = purchases.filter((p) => p.product === prod);

    const grossS = prodSales.reduce((sum, s) => sum + s.grossSales, 0);
    const vatS = prodSales.reduce((sum, s) => sum + s.vatAmount, 0);

    const grossR = prodReturns.reduce((sum, s) => sum + s.grossSales, 0);
    const vatR = prodReturns.reduce((sum, s) => sum + s.vatAmount, 0);

    const grossP = prodPurchases.reduce((sum, p) => sum + p.grossPurchase, 0);
    const vatP = prodPurchases.reduce((sum, p) => sum + p.vatAmount, 0);

    const netVat = vatS - vatR - vatP;

    return {
      product: prod,
      grossSales: grossS,
      salesVat: vatS,
      returnsVat: vatR,
      grossPurchases: grossP,
      purchaseVat: vatP,
      netVat,
    };
  }).filter((p) => p.grossSales > 0 || p.grossPurchases > 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-700 dark:text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              VAT Reconciliation & IRD Tax Ledger
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Compliant with Nepal Inland Revenue Department (IRD) 13% VAT rules for fuel dealers.
          </p>
        </div>

        <button
          onClick={() => exportVatAndStockReconciliationExcel(company, sales, purchases, fiscalYear)}
          className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold rounded-lg text-xs transition self-start sm:self-auto shadow-xs"
        >
          <Download className="w-4 h-4 text-slate-700 dark:text-amber-400" />
          <span>Export IRD VAT Statement (.xlsx)</span>
        </button>
      </div>

      {/* 4 Primary VAT Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Purchases */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold text-slate-700 dark:text-cyan-400 uppercase tracking-wider block mb-1">
              TOTAL NOC PURCHASES
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              Rs. {formatRs(summary.grossPurchases)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 space-y-1">
              <div className="flex justify-between">
                <span>Taxable (Gross/1.13):</span>
                <span className="font-mono text-slate-800 dark:text-slate-300 font-semibold">
                  Rs. {formatRs(summary.taxablePurchases)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-slate-800 dark:text-cyan-300">
                <span>Purchase VAT (13%):</span>
                <span className="font-mono">Rs. {formatRs(summary.purchaseVat)}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500">
            From {purchases.length} registered NOC chalans
          </div>
        </div>

        {/* Gross Sales */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-1">
              GROSS SALES (INVOICES)
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              Rs. {formatRs(summary.grossSales)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 space-y-1">
              <div className="flex justify-between">
                <span>Taxable (Gross/1.13):</span>
                <span className="font-mono text-slate-800 dark:text-slate-300 font-semibold">
                  Rs. {formatRs(summary.taxableSales)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-amber-600 dark:text-amber-300">
                <span>Sales VAT (13%):</span>
                <span className="font-mono">Rs. {formatRs(summary.salesVat)}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500">
            From {sales.filter((s) => !s.isCreditNote).length} billing invoices
          </div>
        </div>

        {/* Sales Returns */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block mb-1">
              SALES RETURNS (CREDIT NOTES)
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              Rs. {formatRs(summary.salesReturns)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 space-y-1">
              <div className="flex justify-between">
                <span>Taxable Returns:</span>
                <span className="font-mono text-slate-800 dark:text-slate-300 font-semibold">
                  Rs. {formatRs(summary.taxableReturns)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-rose-600 dark:text-rose-300">
                <span>Credit Note VAT:</span>
                <span className="font-mono">Rs. {formatRs(summary.returnsVat)}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500">
            From {sales.filter((s) => s.isCreditNote).length} issued credit notes
          </div>
        </div>

        {/* Net VAT Payable */}
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-amber-500/30 rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold text-slate-800 dark:text-amber-400 uppercase tracking-wider block mb-1">
              NET VAT PAYABLE TO IRD
            </span>
            <div
              className={`text-2xl font-bold font-mono ${
                summary.netVatPayable >= 0
                  ? 'text-slate-900 dark:text-amber-400'
                  : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              Rs. {formatRs(summary.netVatPayable)}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 mt-2 space-y-1">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Net Sales VAT:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                  Rs. {formatRs(summary.netSalesVat)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Less Purchase VAT:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                  -Rs. {formatRs(summary.purchaseVat)}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-700 dark:text-amber-300/80 font-medium">
            {summary.netVatPayable >= 0
              ? 'Tax Liability Payable to Government Treasury'
              : 'VAT Credit Carry Forward for Next Period'}
          </div>
        </div>
      </div>

      {/* Legal & Calculation Norms Card */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
          <Calculator className="w-4 h-4 text-slate-700 dark:text-amber-400" />
          <span>Statutory Formulas Applied (Nepal VAT Act, 2052)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800/80">
            <span className="text-slate-800 dark:text-amber-400 font-bold block mb-1">1. Taxable Amount</span>
            <code className="text-slate-900 dark:text-slate-100 font-mono block mb-1 font-semibold">
              Taxable Amount = Gross Sales / 1.13
            </code>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              Extracts the pre-tax base amount from inclusive retail dispensing prices.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800/80">
            <span className="text-slate-800 dark:text-cyan-400 font-bold block mb-1">2. VAT Amount</span>
            <code className="text-slate-900 dark:text-slate-100 font-mono block mb-1 font-semibold">
              VAT Amount = Gross Sales - Taxable Amount
            </code>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              Calculates the exact 13% tax portion collected on behalf of the Inland Revenue Department.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800/80">
            <span className="text-emerald-700 dark:text-emerald-400 font-bold block mb-1">3. Net VAT Payable</span>
            <code className="text-slate-900 dark:text-slate-100 font-mono block mb-1 font-semibold">
              (Sales VAT - Return VAT) - Purchase VAT
            </code>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              Net liability after taking full input tax credit on verified NOC purchases.
            </p>
          </div>
        </div>
      </div>

      {/* Fuel Product Breakdown Table */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">VAT Breakdown by Fuel Category</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">{fiscalYear}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              <tr>
                <th className="px-4 py-3">Fuel Product</th>
                <th className="px-4 py-3 text-right">Gross Sales (Rs)</th>
                <th className="px-4 py-3 text-right">Sales VAT (Rs)</th>
                <th className="px-4 py-3 text-right">Credit Notes VAT (Rs)</th>
                <th className="px-4 py-3 text-right">NOC Purchases (Rs)</th>
                <th className="px-4 py-3 text-right">Purchase VAT (Rs)</th>
                <th className="px-4 py-3 text-right">Net VAT Liability (Rs)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {productBreakdown.map((row) => (
                <tr key={row.product} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                    {row.product === 'MS'
                      ? 'Petrol (MS)'
                      : row.product === 'HSD'
                      ? 'Diesel (HSD)'
                      : row.product}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">Rs. {formatRs(row.grossSales)}</td>
                  <td className="px-4 py-3 text-right font-mono text-amber-600 dark:text-amber-400 font-semibold">
                    Rs. {formatRs(row.salesVat)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-rose-600 dark:text-rose-400 font-semibold">
                    Rs. {formatRs(row.returnsVat)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">Rs. {formatRs(row.grossPurchases)}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-800 dark:text-cyan-400 font-semibold">
                    Rs. {formatRs(row.purchaseVat)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono font-bold ${
                      row.netVat >= 0 ? 'text-slate-900 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    Rs. {formatRs(row.netVat)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100/80 dark:bg-slate-900/90 border-t-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold">
              <tr>
                <td className="px-4 py-3">Total Reconciled</td>
                <td className="px-4 py-3 text-right font-mono">Rs. {formatRs(summary.grossSales)}</td>
                <td className="px-4 py-3 text-right font-mono text-amber-600 dark:text-amber-400">Rs. {formatRs(summary.salesVat)}</td>
                <td className="px-4 py-3 text-right font-mono text-rose-600 dark:text-rose-400">Rs. {formatRs(summary.returnsVat)}</td>
                <td className="px-4 py-3 text-right font-mono">Rs. {formatRs(summary.grossPurchases)}</td>
                <td className="px-4 py-3 text-right font-mono text-slate-800 dark:text-cyan-400">Rs. {formatRs(summary.purchaseVat)}</td>
                <td className={`px-4 py-3 text-right font-mono ${summary.netVatPayable >= 0 ? 'text-slate-900 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                  Rs. {formatRs(summary.netVatPayable)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
