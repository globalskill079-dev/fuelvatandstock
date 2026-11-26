import React from 'react';
import { 
  FileText, 
  ShoppingCart, 
  ArrowLeftRight, 
  Database, 
  FileSpreadsheet, 
  Layers, 
  ArrowLeft 
} from 'lucide-react';

export type ActiveNavTab = 
  | 'sales' 
  | 'purchases' 
  | 'returns' 
  | 'vat-stock' 
  | 'vat-summary' 
  | 'above-1l' 
  | 'dashboard';

interface NavBarProps {
  currentTab: ActiveNavTab;
  onChangeTab: (tab: ActiveNavTab) => void;
  onOpenDashboard: () => void;
}

export const NavBar: React.FC<NavBarProps> = ({
  currentTab,
  onChangeTab,
  onOpenDashboard,
}) => {
  const tabs = [
    { id: 'sales' as ActiveNavTab, label: 'Sales Register', icon: FileText },
    { id: 'purchases' as ActiveNavTab, label: 'Purchase Register', icon: ShoppingCart },
    { id: 'returns' as ActiveNavTab, label: 'Return Register', icon: ArrowLeftRight },
    { id: 'vat-stock' as ActiveNavTab, label: 'VAT Stock', icon: Database },
    { id: 'vat-summary' as ActiveNavTab, label: 'VAT Summary', icon: FileSpreadsheet },
    { id: 'above-1l' as ActiveNavTab, label: 'Above 1L Report', icon: Layers },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-1.5 shadow-xs flex flex-wrap items-center justify-between gap-2">
      <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none py-0.5">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = currentTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChangeTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#0c192c] text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </nav>

      <button
        onClick={onOpenDashboard}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border shrink-0 ${
          currentTab === 'dashboard'
            ? 'bg-[#0c192c] text-white border-transparent'
            : 'text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
        }`}
      >
        <ArrowLeft className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        <span>Dashboard</span>
      </button>
    </div>
  );
};
