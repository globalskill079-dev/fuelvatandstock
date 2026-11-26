import React from 'react';
import { Company } from '../types';
import { ChevronDown, Building2, Calendar, Settings } from 'lucide-react';

export type AppTheme = 'blue-light' | 'dark' | 'grey-light';

interface TopHeaderProps {
  companies: Company[];
  activeCompany: Company;
  onSelectCompany: (id: string) => void;
  selectedFy: string;
  onSelectFy: (fy: string) => void;
  onOpenSettings: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  companies,
  activeCompany,
  onSelectCompany,
  selectedFy,
  onSelectFy,
  onOpenSettings,
}) => {
  return (
    <header className="bg-[#0b1523] border-b border-slate-800/80 px-6 py-3.5 sticky top-0 z-40 shadow-md">
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand Wordmark & Active Station Indicator */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* NOC Golden Badge */}
          <div className="flex items-center gap-3">
            <div className="bg-[#eab308] hover:bg-[#f59e0b] text-[#0b1523] font-black text-sm px-3.5 py-1.5 rounded-lg tracking-wider flex items-center justify-center shadow-xs">
              NOC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white">
                  AUTO-VAT
                </span>
                <span className="text-[11px] font-semibold text-slate-300 bg-[#1e293b] border border-slate-700/80 px-2 py-0.5 rounded-md">
                  Nepal
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                VAT & Fuel Stock Automation
              </div>
            </div>
          </div>

          <div className="h-7 w-px bg-slate-800 hidden md:block" />

          {/* Active Pump Selector Card */}
          <div className="relative group">
            <div className="bg-[#101c2e] hover:bg-[#132238] border border-slate-700/70 hover:border-slate-600 rounded-xl px-3.5 py-1.5 flex items-center gap-3 cursor-pointer transition shadow-xs">
              <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white tracking-tight">
                    {activeCompany.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition" />
                </div>
                <div className="text-[11px] font-mono text-[#f59e0b] font-semibold">
                  PAN: {activeCompany.pan}
                </div>
              </div>

              {/* Native select overlay for accessibility */}
              <select
                value={activeCompany?.id || ''}
                onChange={(e) => onSelectCompany(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                title="Switch Station / Dealership"
                disabled={companies.length === 0}
              >
                {companies.length === 0 ? (
                  <option value="">No Pumps Added</option>
                ) : (
                  companies.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                      {c.name} (PAN: {c.pan})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Right Section: FY Selector, Cloud Status, Settings */}
        <div className="flex items-center gap-3">
          {/* Fiscal Year Selector */}
          <div className="relative">
            <div className="bg-[#101c2e] hover:bg-[#132238] border border-slate-700/70 rounded-xl px-3 py-1.5 text-xs flex items-center gap-2 cursor-pointer shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-300 font-medium">FY:</span>
              <span className="font-bold text-white tracking-tight">{selectedFy}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <select
              value={selectedFy}
              onChange={(e) => onSelectFy(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              title="Select Fiscal Year"
            >
              <option value="FY 2083-084 (Current)" className="bg-slate-900 text-white">FY 2083-084 (Current)</option>
              <option value="FY 2082-083" className="bg-slate-900 text-white">FY 2082-083</option>
              <option value="FY 2081-082" className="bg-slate-900 text-white">FY 2081-082</option>
              <option value="FY 2080-081" className="bg-slate-900 text-white">FY 2080-081</option>
            </select>
          </div>

          {/* Cloud Active Pill */}
          <div className="bg-[#101c2e] border border-slate-700/70 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-200">Cloud Active</span>
          </div>

          {/* Settings Gear Icon Button */}
          <button
            onClick={onOpenSettings}
            title="System Settings & Data Management"
            className="bg-[#101c2e] hover:bg-[#132238] border border-slate-700/70 hover:border-slate-600 text-slate-300 hover:text-white p-2 rounded-xl transition shadow-xs flex items-center justify-center"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
