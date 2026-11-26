import React, { useState, useEffect } from 'react';
import { Company } from '../types';
import { AppTheme } from './TopHeader';
import { 
  X, 
  Palette, 
  Percent, 
  Building2, 
  RotateCcw, 
  Check, 
  Fuel, 
  ExternalLink,
  Settings2,
  Calendar,
  RefreshCw
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: AppTheme;
  onChangeTheme: (theme: AppTheme) => void;
  companies: Company[];
  activeCompany: Company;
  onSelectCompany: (id: string) => void;
  onOpenAddStation: () => void;
  onEditStation?: (company: Company) => void;
  onOpenCalendarModal?: () => void;
  onPullRemotePumps?: () => void;
  onResetData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  onChangeTheme,
  companies,
  activeCompany,
  onSelectCompany,
  onOpenAddStation,
  onEditStation,
  onOpenCalendarModal,
  onPullRemotePumps,
  onResetData,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setConfirmReset(false);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden"
      >
        {/* Header (Pinned) */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 shrink-0 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-xl">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Application Settings & Preferences
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure visual theme, petrol pump stations, and Nepal IRD norms
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Settings"
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">

        {/* Section 1: Color Theme Selector */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Visual Theme Selection
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => onChangeTheme('blue-light')}
              className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                theme === 'blue-light'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Subtle Blue-Grey</span>
                {theme === 'blue-light' && <Check className="w-4 h-4 text-indigo-600" />}
              </div>
              <div className="flex gap-1.5 mt-1">
                <div className="w-4 h-4 rounded-full bg-[#0b1523]" />
                <div className="w-4 h-4 rounded-full bg-[#f1f5f9]" />
                <div className="w-4 h-4 rounded-full bg-[#f4f7fc]" />
              </div>
              <span className="text-[10px] text-slate-500 mt-2">Exact match to software screenshots</span>
            </button>

            <button
              onClick={() => onChangeTheme('grey-light')}
              className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                theme === 'grey-light'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Grey & White</span>
                {theme === 'grey-light' && <Check className="w-4 h-4 text-indigo-600" />}
              </div>
              <div className="flex gap-1.5 mt-1">
                <div className="w-4 h-4 rounded-full bg-[#27272a]" />
                <div className="w-4 h-4 rounded-full bg-[#ffffff]" />
                <div className="w-4 h-4 rounded-full bg-[#f4f4f5]" />
              </div>
              <span className="text-[10px] text-slate-500 mt-2">Classic light high-contrast layout</span>
            </button>

            <button
              onClick={() => onChangeTheme('dark')}
              className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                theme === 'dark'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Dark Slate</span>
                {theme === 'dark' && <Check className="w-4 h-4 text-indigo-600" />}
              </div>
              <div className="flex gap-1.5 mt-1">
                <div className="w-4 h-4 rounded-full bg-[#020617]" />
                <div className="w-4 h-4 rounded-full bg-[#0f172a]" />
                <div className="w-4 h-4 rounded-full bg-[#1e293b]" />
              </div>
              <span className="text-[10px] text-slate-500 mt-2">Low-light dark environment</span>
            </button>
          </div>
        </div>

        {/* Section 2: Statutory Norms Display */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Statutory Rates & Norms (Inland Revenue Department & NOC)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Standard VAT Rate</span>
              <span className="text-base font-black text-slate-900 dark:text-white font-mono">13.0%</span>
              <span className="block text-[10px] text-slate-400 mt-0.5">Taxable = Gross / 1.13</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Petrol (MS) Shortage</span>
              <span className="text-base font-black text-teal-600 font-mono">0.88%</span>
              <span className="block text-[10px] text-slate-400 mt-0.5">Allowable evaporation norm</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Diesel (HSD) Shortage</span>
              <span className="text-base font-black text-amber-600 font-mono">0.605%</span>
              <span className="block text-[10px] text-slate-400 mt-0.5">Working shortage rate</span>
            </div>
          </div>

          {onOpenCalendarModal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCalendarModal();
              }}
              className="w-full flex items-center justify-between p-3 bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800/60 rounded-xl text-xs font-semibold text-indigo-950 dark:text-indigo-200 transition group"
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <div className="text-left">
                  <span className="font-bold block">View Official Nepal BS ↔ AD Date Mapping (FY 2083-084)</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                    12-Month IRD/NOC statutory calendar: Shrawan 2083 to Ashad 2084 (32 Days)
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                Open Table →
              </span>
            </button>
          )}
        </div>

        {/* Section 3: Active Pump Management */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Registered Petrol Pumps ({companies.length})
            </label>
            <button
              onClick={() => {
                onClose();
                onOpenAddStation();
              }}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
            >
              + Add New Pump
            </button>
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {companies.map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectCompany(c.id)}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition ${
                  c.id === activeCompany.id
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 font-bold'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-900 dark:text-white">{c.name}</span>
                  <span className="text-[11px] text-[#f59e0b] font-mono font-semibold">PAN: {c.pan}</span>
                </div>
                <div className="flex items-center gap-2">
                  {c.id === activeCompany.id && (
                    <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded font-black">
                      ACTIVE
                    </span>
                  )}
                  {onEditStation && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                        onEditStation(c);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
                      title="Edit NOC Portal Login & Software Credentials"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {onPullRemotePumps && (
            <button
              type="button"
              onClick={() => {
                onPullRemotePumps();
                onClose();
              }}
              className="w-full flex items-center justify-between p-2.5 bg-amber-50/70 hover:bg-amber-100/80 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 border border-amber-300 dark:border-amber-700/80 rounded-xl text-xs font-bold text-amber-950 dark:text-amber-200 transition group shadow-xs"
            >
              <div className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 group-hover:rotate-180 transition-transform duration-500" />
                <span>Pull 5 Petrol Pumps & Logins from pumpvat-stock.ai.studio</span>
              </div>
              <span className="text-[10px] bg-amber-200/80 dark:bg-amber-900/60 px-2 py-0.5 rounded text-amber-900 dark:text-amber-200 font-mono font-bold">
                5 Stations
              </span>
            </button>
          )}
        </div>

        </div>

        {/* Footer Actions (Pinned) */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/70 dark:bg-slate-900/90">
          {confirmReset ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Reset all data?</span>
              <button
                type="button"
                onClick={() => {
                  onResetData();
                  setConfirmReset(false);
                  onClose();
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Baseline Data</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="bg-[#0c192c] hover:bg-[#132540] text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
