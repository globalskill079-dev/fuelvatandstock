import React, { useState } from 'react';
import { Company, SalesRecord, PurchaseRecord } from '../types';
import { calculateStationStockFlows, formatLiters, MS_SHORTAGE_RATE_PERCENT, HSD_SHORTAGE_RATE_PERCENT } from '../utils/vatAndStockCalculations';
import { Fuel, CheckCircle2, ShieldCheck, Gauge } from 'lucide-react';

interface FuelStockViewProps {
  company: Company;
  sales: SalesRecord[];
  purchases: PurchaseRecord[];
  onUpdateDipReading: (msDip: number, hsdDip: number) => void;
}

export const FuelStockView: React.FC<FuelStockViewProps> = ({
  company,
  sales,
  purchases,
  onUpdateDipReading,
}) => {
  const stockFlows = calculateStationStockFlows(company, sales, purchases);

  const [msDipInput, setMsDipInput] = useState<string>(
    company.msPhysicalDipL !== undefined ? company.msPhysicalDipL.toString() : stockFlows.ms.closingStockL.toString()
  );
  const [hsdDipInput, setHsdDipInput] = useState<string>(
    company.hsdPhysicalDipL !== undefined ? company.hsdPhysicalDipL.toString() : stockFlows.hsd.closingStockL.toString()
  );
  const [dipSaved, setDipSaved] = useState(false);

  const handleSaveDip = (e: React.FormEvent) => {
    e.preventDefault();
    const msVal = parseFloat(msDipInput) || 0;
    const hsdVal = parseFloat(hsdDipInput) || 0;
    onUpdateDipReading(msVal, hsdVal);
    setDipSaved(true);
    setTimeout(() => setDipSaved(false), 2500);
  };

  const msCapacity = company.msTankCapacityL || 45000;
  const hsdCapacity = company.hsdTankCapacityL || 70000;
  const msPercent = Math.min(100, Math.max(0, (stockFlows.ms.closingStockL / msCapacity) * 100));
  const hsdPercent = Math.min(100, Math.max(0, (stockFlows.hsd.closingStockL / hsdCapacity) * 100));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Fuel className="w-5 h-5 text-slate-700 dark:text-cyan-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Fuel Stock Movement & Working Shortage Allowance
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official Nepal Oil Corporation (NOC) loss norms: Petrol (MS) 0.88% · Diesel (HSD) 0.605%
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Statutory NOC Shortage Norms Active</span>
        </div>
      </div>

      {/* Side-by-side Flow Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PETROL (MS) CARD */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <h3 className="font-bold text-base text-amber-600 dark:text-amber-400">PETROL (MS) STOCK FLOW</h3>
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-md font-mono">
                Allowable Loss: {MS_SHORTAGE_RATE_PERCENT}%
              </span>
            </div>

            {/* Capacity Bar */}
            <div className="mb-5 bg-slate-50 dark:bg-slate-900/90 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-500 dark:text-slate-400">Tank Capacity ({formatLiters(msCapacity)} L)</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{msPercent.toFixed(1)}% Full</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 dark:bg-amber-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${msPercent}%` }}
                />
              </div>
            </div>

            {/* Reconciliation Steps */}
            <ul className="space-y-2.5 text-xs">
              <li className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80 text-slate-600 dark:text-slate-400">
                <span>Opening Stock</span>
                <span className="font-mono text-slate-900 dark:text-slate-200 font-semibold">
                  {formatLiters(stockFlows.ms.openingStockL)} L
                </span>
              </li>

              <li className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80 text-slate-600 dark:text-slate-400">
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">(+) Registered NOC Purchases</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                  +{formatLiters(stockFlows.ms.purchasesL)} L
                </span>
              </li>

              <li className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80 text-slate-600 dark:text-slate-400">
                <span className="text-rose-700 dark:text-rose-400 font-medium">(-) Dispensed Sales</span>
                <span className="font-mono text-rose-700 dark:text-rose-400 font-bold">
                  -{formatLiters(stockFlows.ms.salesL)} L
                </span>
              </li>

              <li className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80 text-slate-600 dark:text-slate-400">
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">(+) Sales Returns (Credit Notes)</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                  +{formatLiters(stockFlows.ms.returnsL)} L
                </span>
              </li>

              <li className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80 text-slate-600 dark:text-slate-400">
                <span className="text-rose-700 dark:text-rose-400 font-medium">
                  (-) Allowable Working Shortage ({MS_SHORTAGE_RATE_PERCENT}%)
                </span>
                <span className="font-mono text-rose-700 dark:text-rose-400 font-bold">
                  -{formatLiters(stockFlows.ms.workingShortageL)} L
                </span>
              </li>

              <li className="flex justify-between pt-3 text-sm font-bold bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-slate-900 dark:text-white">CLOSING PETROL (MS) STOCK</span>
                <span
                  className={`font-mono text-base ${
                    stockFlows.ms.closingStockL < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {formatLiters(stockFlows.ms.closingStockL)} L
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 dark:text-slate-500">
            Purchases ({formatLiters(stockFlows.ms.purchasesL)} L) × 0.88% = {formatLiters(stockFlows.ms.workingShortageL)} L deductible loss
          </div>
        </div>

        {/* DIESEL (HSD) CARD */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-700" />
                <h3 className="font-bold text-base text-slate-800 dark:text-cyan-400">DIESEL (HSD) STOCK FLOW</h3>
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-md font-mono">
                Allowable Loss: {HSD_SHORTAGE_RATE_PERCENT}%
              </span>
            </div>

            {/* Capacity Bar */}
            <div className="mb-5 bg-slate-50 dark:bg-slate-900/90 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-500 dark:text-slate-400">Tank Capacity ({formatLiters(hsdCapacity)} L)</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{hsdPercent.toFixed(1)}% Full</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-slate-700 dark:bg-cyan-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${hsdPercent}%` }}
                />
              </div>
            </div>

            {/* Reconciliation Steps */}
            <ul className="space-y-2.5 text-xs">
              <li className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80 text-slate-600 dark:text-slate-400">
                <span>Opening Stock</span>
                <span className="font-mono text-slate-900 dark:text-slate-200 font-semibold">
                  {formatLiters(stockFlows.hsd.openingStockL)} L
                </span>
              </li>

              <li className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80 text-slate-600 dark:text-slate-400">
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">(+) Registered NOC Purchases</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                  +{formatLiters(stockFlows.hsd.purchasesL)} L
                </span>
              </li>

              <li className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80 text-slate-600 dark:text-slate-400">
                <span className="text-rose-700 dark:text-rose-400 font-medium">(-) Dispensed Sales</span>
                <span className="font-mono text-rose-700 dark:text-rose-400 font-bold">
                  -{formatLiters(stockFlows.hsd.salesL)} L
                </span>
              </li>

              <li className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80 text-slate-600 dark:text-slate-400">
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">(+) Sales Returns (Credit Notes)</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                  +{formatLiters(stockFlows.hsd.returnsL)} L
                </span>
              </li>

              <li className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80 text-slate-600 dark:text-slate-400">
                <span className="text-rose-700 dark:text-rose-400 font-medium">
                  (-) Allowable Working Shortage ({HSD_SHORTAGE_RATE_PERCENT}%)
                </span>
                <span className="font-mono text-rose-700 dark:text-rose-400 font-bold">
                  -{formatLiters(stockFlows.hsd.workingShortageL)} L
                </span>
              </li>

              <li className="flex justify-between pt-3 text-sm font-bold bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-slate-900 dark:text-white">CLOSING DIESEL (HSD) STOCK</span>
                <span
                  className={`font-mono text-base ${
                    stockFlows.hsd.closingStockL < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {formatLiters(stockFlows.hsd.closingStockL)} L
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 dark:text-slate-500">
            Purchases ({formatLiters(stockFlows.hsd.purchasesL)} L) × 0.605% = {formatLiters(stockFlows.hsd.workingShortageL)} L deductible loss
          </div>
        </div>
      </div>

      {/* Physical Dip Reading & Audit Variance Section */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-slate-700 dark:text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Physical Tank Dip Measurement & Audit Variance</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Compare actual physical dip tape readings against theoretical book closing stock.
              </p>
            </div>
          </div>

          {dipSaved && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Dip readings updated!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveDip} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 dark:bg-slate-900/70 p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
            <label className="block text-slate-700 dark:text-slate-300 font-semibold">
              Petrol (MS) Physical Dip Reading (L)
            </label>
            <input
              type="number"
              step="0.01"
              value={msDipInput}
              onChange={(e) => setMsDipInput(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-slate-100 font-mono text-sm"
            />
            <div className="flex justify-between text-[11px] pt-1">
              <span className="text-slate-500 dark:text-slate-400">Book Stock:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{formatLiters(stockFlows.ms.closingStockL)} L</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Dip Discrepancy:</span>
              <span
                className={`font-mono font-bold ${
                  (parseFloat(msDipInput) || 0) - stockFlows.ms.closingStockL >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {((parseFloat(msDipInput) || 0) - stockFlows.ms.closingStockL).toFixed(2)} L
              </span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/70 p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
            <label className="block text-slate-700 dark:text-slate-300 font-semibold">
              Diesel (HSD) Physical Dip Reading (L)
            </label>
            <input
              type="number"
              step="0.01"
              value={hsdDipInput}
              onChange={(e) => setHsdDipInput(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-slate-100 font-mono text-sm"
            />
            <div className="flex justify-between text-[11px] pt-1">
              <span className="text-slate-500 dark:text-slate-400">Book Stock:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{formatLiters(stockFlows.hsd.closingStockL)} L</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Dip Discrepancy:</span>
              <span
                className={`font-mono font-bold ${
                  (parseFloat(hsdDipInput) || 0) - stockFlows.hsd.closingStockL >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {((parseFloat(hsdDipInput) || 0) - stockFlows.hsd.closingStockL).toFixed(2)} L
              </span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <span className="text-slate-800 dark:text-slate-300 font-semibold block mb-1">Audit Reconciliation</span>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Periodic physical dip audits verify no underground tank leakage or calibration deviation exceeds NOC tolerance.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-bold rounded-lg text-xs transition shadow-xs"
            >
              Update Dip Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
