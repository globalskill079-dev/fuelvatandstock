import React from 'react';
import { Company, SalesRecord, PurchaseRecord } from '../types';
import { calculateStationVatSummary, calculateStationStockFlows, formatRs, formatLiters } from '../utils/vatAndStockCalculations';
import { Building2, Plus, Settings2, Fuel, ArrowRight, RefreshCw, KeyRound, Globe, Server } from 'lucide-react';

interface StationsViewProps {
  companies: Company[];
  activeCompanyId: string;
  onSelectCompany: (id: string) => void;
  onEditCompany: (company: Company) => void;
  onOpenAddCompany: () => void;
  onPullRemotePumps?: () => void;
  sales: SalesRecord[];
  purchases: PurchaseRecord[];
}

export const StationsView: React.FC<StationsViewProps> = ({
  companies,
  activeCompanyId,
  onSelectCompany,
  onEditCompany,
  onOpenAddCompany,
  onPullRemotePumps,
  sales,
  purchases,
}) => {
  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-700 dark:text-amber-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              All Companies / Petrol Pumps
            </h2>
            <span className="text-xs text-slate-600 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 px-2.5 py-0.5 rounded-full font-semibold">
              {companies.length} Pumps Configured
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official multi-dealership fuel stock, NOC portal logins, and SPAS / POS software links.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onPullRemotePumps && (
            <button
              onClick={onPullRemotePumps}
              title="Pull petrol pump logins & data from pumpvat-stock.ai.studio"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#fffdf0] hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border-2 border-amber-300 dark:border-amber-700 font-bold rounded-xl text-xs transition shrink-0 shadow-xs cursor-pointer group"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-600 group-hover:rotate-180 transition-transform duration-500" />
              <span>Pull from pumpvat-stock.ai.studio</span>
            </button>
          )}

          <button
            onClick={onOpenAddCompany}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-bold rounded-xl text-xs transition self-start sm:self-auto shrink-0 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Petrol Pump</span>
          </button>
        </div>
      </div>

      {/* Stations Grid */}
      {companies.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Petrol Pumps Configured</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Add your petrol pump dealership with its PAN, NOC dealer code, and tank opening stock to start managing fuel registers.
          </p>
          <button
            onClick={onOpenAddCompany}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition inline-flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Petrol Pump</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((comp) => {
          const isActive = comp.id === activeCompanyId;
          const compSales = sales.filter((s) => s.stationId === comp.id);
          const compPurchases = purchases.filter((p) => p.stationId === comp.id);

          const vatSummary = calculateStationVatSummary(compSales, compPurchases);
          const stockFlows = calculateStationStockFlows(comp, compSales, compPurchases);

          return (
            <div
              key={comp.id}
              className={`bg-white dark:bg-slate-950 border rounded-xl p-5 relative flex flex-col justify-between transition-all shadow-xs ${
                isActive
                  ? 'border-slate-500 dark:border-amber-500 ring-2 ring-slate-400/20 dark:ring-amber-500/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                {/* Station Top Status */}
                <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                  <span
                    className={`font-semibold text-[11px] px-2 py-0.5 rounded ${
                      isActive
                        ? 'bg-slate-100 text-slate-800 border border-slate-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40'
                        : 'bg-slate-100/70 text-slate-600 dark:bg-slate-900 dark:text-slate-400'
                    }`}
                  >
                    {isActive ? 'ACTIVE DEALERSHIP' : 'PUMP DEALER'}
                  </span>

                  <button
                    onClick={() => onEditCompany(comp)}
                    title="Configure station details & tank capacities"
                    className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <Settings2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 leading-snug">{comp.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 truncate">
                  {comp.location} · {comp.depot || 'Central Depot'}
                </p>

                {/* Identifiers */}
                <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 mb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">NOC Dealer Code</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-amber-400">{comp.code}</span>
                  </div>
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">PAN Number</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{comp.pan}</span>
                  </div>
                </div>

                {/* Integration Credentials from pumpvat-stock.ai.studio */}
                <div className="bg-[#fffdf0] dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-xl p-2.5 mb-4 text-[11px] space-y-1.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 dark:text-amber-300 uppercase text-[10px] flex items-center gap-1">
                      <KeyRound className="w-3 h-3 text-amber-600" />
                      <span>NOC Portal Login</span>
                    </span>
                    <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400">eservice.nepaloil.org.np</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-slate-700 dark:text-slate-300">
                    <span>User: <strong className="text-slate-900 dark:text-white">{comp.portalUsername || comp.code}</strong></span>
                    <span>Pass: <strong className="text-amber-800 dark:text-amber-300">{comp.portalPassword || '••••••••'}</strong></span>
                  </div>
                  {comp.softwareHostUrl && (
                    <div className="pt-1 border-t border-amber-100 dark:border-amber-900/40 text-[10px] text-sky-800 dark:text-sky-300 flex items-center gap-1 truncate">
                      <Server className="w-3 h-3 shrink-0 text-sky-600" />
                      <span className="truncate">{comp.softwareHostUrl}</span>
                    </div>
                  )}
                </div>

                {/* 3-Column Metrics */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
                  <div className="bg-slate-50 dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] block">Sales Bills</span>
                    <div className="font-semibold text-slate-800 dark:text-amber-400 font-mono mt-0.5">
                      {compSales.length}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] block">NOC Chalans</span>
                    <div className="font-semibold text-slate-800 dark:text-cyan-400 font-mono mt-0.5">
                      {compPurchases.length}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] block">VAT Balance</span>
                    <div
                      className={`font-semibold font-mono mt-0.5 ${
                        vatSummary.netVatPayable >= 0
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-rose-700 dark:text-rose-400'
                      }`}
                    >
                      {vatSummary.netVatPayable >= 0 ? '+' : ''}
                      {(vatSummary.netVatPayable / 100000).toFixed(1)}L
                    </div>
                  </div>
                </div>

                {/* Fuel Stock Snapshot */}
                <div className="p-3 bg-slate-50/80 dark:bg-slate-900/40 rounded-lg border border-slate-200 dark:border-slate-800/60 space-y-1.5 text-xs mb-5">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Fuel className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                      <span>Petrol (MS) Stock:</span>
                    </span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {formatLiters(stockFlows.ms.closingStockL)} L
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Fuel className="w-3.5 h-3.5 text-slate-600 dark:text-cyan-400" />
                      <span>Diesel (HSD) Stock:</span>
                    </span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {formatLiters(stockFlows.hsd.closingStockL)} L
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onSelectCompany(comp.id)}
                className={`w-full py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition ${
                  isActive
                    ? 'bg-slate-800 dark:bg-amber-500 text-white dark:text-slate-950 hover:bg-slate-700 dark:hover:bg-amber-400 font-bold shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{isActive ? 'Current Active Station' : 'Open Station Registers'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
