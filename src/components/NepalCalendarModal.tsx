import React from 'react';
import { NEPAL_FY_2083_2084_MAPPING, FULL_FY_BS_START, FULL_FY_BS_END, FULL_FY_AD_START, FULL_FY_AD_END } from '../utils/nepalCalendar';
import { X, Calendar, Download, CheckCircle2 } from 'lucide-react';

interface NepalCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NepalCalendarModal: React.FC<NepalCalendarModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const totalDays = NEPAL_FY_2083_2084_MAPPING.reduce((acc, m) => acc + m.daysCount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Official Nepal BS & AD Date Mapping Table
                </h3>
                <span className="text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                  FY 2083-084 Official
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Statutory Bikram Sambat (BS) to Gregorian English (AD) calendar conversion table
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Summary Strip */}
          <div className="bg-[#f0f9ff] dark:bg-sky-950/20 border border-[#bae6fd] dark:border-sky-800/60 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wider block">
                FULL STATUTORY FISCAL YEAR COVERAGE
              </span>
              <div className="text-sm font-black font-mono text-slate-900 dark:text-white">
                BS: {FULL_FY_BS_START} → {FULL_FY_BS_END}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                AD: {FULL_FY_AD_START} → {FULL_FY_AD_END} · Total: {totalDays} Days across 12 Nepali Months
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold px-2.5 py-1 rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ashad 2084: 32 Days</span>
              </span>
              <span className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold px-2.5 py-1 rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mangsir 2083: 29 Days</span>
              </span>
            </div>
          </div>

          {/* Exact Replica of User's Uploaded Calendar Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-900/80 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">MONTH NAME</th>
                    <th className="py-3 px-4 text-center">BS MONTH NO.</th>
                    <th className="py-3 px-4 text-center">NO. OF DAYS</th>
                    <th className="py-3 px-4 font-mono">BS START - CLOSING DATE</th>
                    <th className="py-3 px-4 font-mono">AD START - CLOSING DATE RANGE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {NEPAL_FY_2083_2084_MAPPING.map((m, idx) => (
                    <tr
                      key={m.monthIndex}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                    >
                      <td className="py-3 px-4 text-center text-slate-400 font-mono font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {m.monthName}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {m.bsMonthFormatted}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-bold bg-[#e6fcf5] text-[#0ca678] border border-[#b2f2bb] dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400">
                          {m.daysCount} Days
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        <span>{m.bsStart}</span>
                        <span className="mx-2 text-slate-400 font-normal">→</span>
                        <span>{m.bsEnd}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                        <span>{m.adStart.replace(/-/g, '.')}</span>
                        <span className="mx-2 text-slate-400 font-normal">→</span>
                        <span>{m.adEnd.replace(/-/g, '.')}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>All sales invoice imports & NOC purchase syncs automatically convert with this exact calendar table.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-xs"
          >
            Close Table
          </button>
        </div>
      </div>
    </div>
  );
};
