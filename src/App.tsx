import React, { useState, useEffect } from 'react';
import { Company, SalesRecord, PurchaseRecord } from './types';
import {
  loadStoredCompanies,
  saveStoredCompanies,
  loadStoredSales,
  saveStoredSales,
  loadStoredPurchases,
  saveStoredPurchases,
  loadActiveStationId,
  saveActiveStationId,
  loadActiveFy,
  saveActiveFy,
  clearAllApplicationData,
  pullRemotePumpVatStockData,
} from './utils/storageAndExport';

import { TopHeader, AppTheme } from './components/TopHeader';
import { NavBar, ActiveNavTab } from './components/NavBar';
import { SalesRegisterView } from './components/SalesRegisterView';
import { PurchaseRegisterView } from './components/PurchaseRegisterView';
import { ReturnRegisterView } from './components/ReturnRegisterView';
import { VatStockRegisterView } from './components/VatStockRegisterView';
import { VatSummaryMonthlyView } from './components/VatSummaryMonthlyView';
import { AboveOneLakhView } from './components/AboveOneLakhView';
import { StationsView } from './components/StationsView';
import { SettingsModal } from './components/SettingsModal';

import { AddStationModal } from './components/AddStationModal';
import { NocPortalSyncModal } from './components/NocPortalSyncModal';
import { ImportSalesModal, SalesImportMode } from './components/ImportSalesModal';
import { ImportPurchasesModal } from './components/ImportPurchasesModal';
import { ManualSalesModal } from './components/ManualSalesModal';
import { ManualPurchaseModal } from './components/ManualPurchaseModal';
import { NepalCalendarModal } from './components/NepalCalendarModal';

import { CheckCircle2, Settings, Building2, Plus } from 'lucide-react';

const THEME_STORAGE_KEY = 'autovat_nepal_theme';

const fallbackCompany: Company = {
  id: '',
  name: 'No Petrol Pump Added',
  location: 'Nepal',
  code: '',
  pan: '',
  portalLoginSet: false,
  softwareLinked: false,
  salesCount: 0,
  salesInvoices: 0,
  creditNotesCount: 0,
  purchasesCount: 0,
  vatSummaryRs: 0,
  totalVatStockLiters: 0,
  petrolStockL: 0,
  dieselStockL: 0,
  msOpeningStockL: 0,
  hsdOpeningStockL: 0,
  depot: 'Thankot Depot',
};

export default function App() {
  const [theme, setTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem(THEME_STORAGE_KEY) as AppTheme) || 'blue-light';
  });

  const [companies, setCompanies] = useState<Company[]>(() => {
    return loadStoredCompanies();
  });

  const [activeCompanyId, setActiveCompanyId] = useState<string>(() => {
    const stored = loadActiveStationId();
    if (stored && companies.some((c) => c.id === stored)) return stored;
    return companies[0]?.id || '';
  });

  const [selectedFy, setSelectedFy] = useState<string>(loadActiveFy);
  const [currentTab, setCurrentTab] = useState<ActiveNavTab>('sales');

  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>(loadStoredSales);
  const [purchaseRecords, setPurchaseRecords] = useState<PurchaseRecord[]>(loadStoredPurchases);

  // Apply theme class to html root
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Active Station
  const activeCompany = companies.find((c) => c.id === activeCompanyId) || companies[0] || fallbackCompany;

  // Filtered station datasets
  const currentSales = activeCompany.id ? salesRecords.filter((s) => s.stationId === activeCompany.id) : [];
  const currentPurchases = activeCompany.id ? purchaseRecords.filter((p) => p.stationId === activeCompany.id) : [];

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddStationOpen, setIsAddStationOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<Company | null>(null);
  const [isNocSyncOpen, setIsNocSyncOpen] = useState(false);
  const [isImportSalesOpen, setIsImportSalesOpen] = useState(false);
  const [isImportPurchasesOpen, setIsImportPurchasesOpen] = useState(false);
  const [isManualSalesOpen, setIsManualSalesOpen] = useState(false);
  const [isManualPurchaseOpen, setIsManualPurchaseOpen] = useState(false);
  const [isGlobalCalendarOpen, setIsGlobalCalendarOpen] = useState(false);

  // Station Management Handlers
  const handleSelectCompany = (id: string) => {
    setActiveCompanyId(id);
    saveActiveStationId(id);
    const matched = companies.find((c) => c.id === id);
    if (matched) {
      showToast(`Switched active pump to ${matched.name}`);
    }
  };

  const handleSelectFy = (fy: string) => {
    setSelectedFy(fy);
    saveActiveFy(fy);
    showToast(`Fiscal Year set to ${fy}`);
  };

  const handleSaveCompany = (station: Company) => {
    const existingIndex = companies.findIndex((c) => c.id === station.id);
    let updated: Company[];
    if (existingIndex >= 0) {
      updated = [...companies];
      updated[existingIndex] = station;
      showToast(`Updated settings for ${station.name}`);
    } else {
      updated = [...companies, station];
      setActiveCompanyId(station.id);
      saveActiveStationId(station.id);
      showToast(`Added new petrol pump: ${station.name}`);
    }
    setCompanies(updated);
    saveStoredCompanies(updated);
  };

  const handleDeleteCompany = (stationId: string) => {
    const filtered = companies.filter((c) => c.id !== stationId);
    setCompanies(filtered);
    saveStoredCompanies(filtered);

    if (activeCompanyId === stationId) {
      const nextId = filtered[0]?.id || '';
      setActiveCompanyId(nextId);
      saveActiveStationId(nextId);
    }
    showToast('Station removed.');
  };

  // Sales Handlers
  const handleAddSalesRecords = (records: SalesRecord[], mode: SalesImportMode = 'append') => {
    let updated: SalesRecord[];
    if (mode === 'replace' && activeCompany.id) {
      const otherStations = salesRecords.filter((s) => s.stationId !== activeCompany.id);
      updated = [...records, ...otherStations];
      showToast(`Replaced Sales Register with ${records.length} invoice(s).`);
    } else if (mode === 'merge') {
      const getSig = (r: SalesRecord) =>
        `${(r.billNo || '').trim().toLowerCase()}|${(r.nepaliDate || r.date || '').trim()}|${(r.product || '').trim().toLowerCase()}`;
      const existingSigs = new Set(currentSales.map(getSig));
      const uniqueNew = records.filter((r) => !existingSigs.has(getSig(r)));
      const skipped = records.length - uniqueNew.length;
      updated = [...uniqueNew, ...salesRecords];
      showToast(
        skipped > 0
          ? `Added ${uniqueNew.length} new voucher(s); skipped ${skipped} duplicate(s).`
          : `Added ${uniqueNew.length} new sales invoice(s) in Sales Register.`
      );
    } else {
      updated = [...records, ...salesRecords];
      showToast(`Recorded ${records.length} sales invoice(s) in Sales Register.`);
    }
    setSalesRecords(updated);
    saveStoredSales(updated);
  };

  const handleDeleteSalesRecord = (id: string) => {
    const updated = salesRecords.filter((s) => s.id !== id);
    setSalesRecords(updated);
    saveStoredSales(updated);
    showToast('Deleted invoice from Sales Register.');
  };

  const handleClearSalesForStation = () => {
    if (!activeCompany.id) return;
    const updated = salesRecords.filter((s) => s.stationId !== activeCompany.id);
    setSalesRecords(updated);
    saveStoredSales(updated);
    showToast(`Cleared Sales Register for ${activeCompany.name}.`);
  };

  // Purchase Handlers
  const handleAddPurchaseRecords = (records: PurchaseRecord[]) => {
    const updated = [...records, ...purchaseRecords];
    setPurchaseRecords(updated);
    saveStoredPurchases(updated);
    showToast(`Committed ${records.length} NOC chalan(s) to Purchase Register.`);
  };

  const handleDeletePurchaseRecord = (id: string) => {
    const updated = purchaseRecords.filter((p) => p.id !== id);
    setPurchaseRecords(updated);
    saveStoredPurchases(updated);
    showToast('Deleted chalan from Purchase Register.');
  };

  const handleClearPurchasesForStation = () => {
    if (!activeCompany.id) return;
    const updated = purchaseRecords.filter((p) => p.stationId !== activeCompany.id);
    setPurchaseRecords(updated);
    saveStoredPurchases(updated);
    showToast(`Cleared Purchase Register for ${activeCompany.name}.`);
  };

  const handleResetData = () => {
    clearAllApplicationData();
    setCompanies([]);
    setSalesRecords([]);
    setPurchaseRecords([]);
    setActiveCompanyId('');
    showToast('All registers reset. You can now add your petrol pump and import real data.');
  };

  const handlePullRemoteData = () => {
    const { companies: remoteCompanies, sales: remoteSales } = pullRemotePumpVatStockData();
    setCompanies(remoteCompanies);
    setSalesRecords(remoteSales);
    setActiveCompanyId('co-1');
    showToast('Successfully pulled 5 petrol pumps with logins and real data from pumpvat-stock.ai.studio!');
  };

  // Canvas background matching the subtle blue-grey theme in the screenshots
  const canvasBgClass =
    theme === 'dark'
      ? 'bg-[#060d17] text-slate-100'
      : theme === 'grey-light'
      ? 'bg-[#f4f4f5] text-slate-900'
      : 'bg-[#f1f5f9] text-slate-900';

  return (
    <div className={`min-h-screen ${canvasBgClass} font-sans flex flex-col transition-colors duration-150`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-20 z-50 bg-white dark:bg-slate-900 border border-slate-300 dark:border-amber-500/50 shadow-xl rounded-xl px-4 py-3 text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header from Screenshot 1 */}
      <TopHeader
        companies={companies}
        activeCompany={activeCompany}
        onSelectCompany={handleSelectCompany}
        selectedFy={selectedFy}
        onSelectFy={handleSelectFy}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Sub-bar / Workspace container */}
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 w-full flex-1 space-y-4">
        {/* Onboarding Banner if no companies configured */}
        {companies.length === 0 && (
          <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 rounded-3xl p-6 sm:p-8 text-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Welcome to AutoVAT Nepal
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto mt-1 mb-5 leading-relaxed">
              Clean state ready for your real data. Add your Petrol Pump dealership with its PAN, NOC dealer code, and initial tank opening stock to record fuel deliveries, sales invoices, VAT reconciliation, and IRD compliance.
            </p>
            <button
              onClick={() => {
                setEditingStation(null);
                setIsAddStationOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Your Petrol Pump Dealership</span>
            </button>
          </div>
        )}

        {/* Navigation Bar matching screenshot white rounded container */}
        <NavBar
          currentTab={currentTab}
          onChangeTab={(tab) => setCurrentTab(tab)}
          onOpenDashboard={() => setCurrentTab('dashboard')}
        />

        {/* Tab Views */}
        {currentTab === 'sales' && (
          <SalesRegisterView
            company={activeCompany}
            records={currentSales}
            fiscalYear={selectedFy}
            onOpenManualEntry={() => setIsManualSalesOpen(true)}
            onOpenImportModal={() => setIsImportSalesOpen(true)}
            onDeleteRecord={handleDeleteSalesRecord}
            onClearAll={handleClearSalesForStation}
          />
        )}

        {currentTab === 'purchases' && (
          <PurchaseRegisterView
            company={activeCompany}
            records={currentPurchases}
            fiscalYear={selectedFy}
            onOpenNocSync={() => setIsNocSyncOpen(true)}
            onOpenManualEntry={() => setIsManualPurchaseOpen(true)}
            onOpenImportModal={() => setIsImportPurchasesOpen(true)}
            onDeleteRecord={handleDeletePurchaseRecord}
            onClearAll={handleClearPurchasesForStation}
          />
        )}

        {currentTab === 'returns' && (
          <ReturnRegisterView
            company={activeCompany}
            sales={currentSales}
            purchases={currentPurchases}
            fiscalYear={selectedFy}
            onOpenManualEntry={() => setIsManualSalesOpen(true)}
          />
        )}

        {currentTab === 'vat-stock' && (
          <VatStockRegisterView
            company={activeCompany}
            sales={currentSales}
            purchases={currentPurchases}
            fiscalYear={selectedFy}
            onUpdateCompanyOpeningStock={(ms, hsd) => {
              if (activeCompany.id) {
                handleSaveCompany({
                  ...activeCompany,
                  msOpeningStockL: ms,
                  hsdOpeningStockL: hsd,
                });
              }
            }}
          />
        )}

        {currentTab === 'vat-summary' && (
          <VatSummaryMonthlyView
            company={activeCompany}
            sales={currentSales}
            purchases={currentPurchases}
            fiscalYear={selectedFy}
          />
        )}

        {currentTab === 'above-1l' && (
          <AboveOneLakhView
            company={activeCompany}
            sales={currentSales}
            purchases={currentPurchases}
            fiscalYear={selectedFy}
          />
        )}

        {currentTab === 'dashboard' && (
          <StationsView
            companies={companies}
            activeCompanyId={activeCompany.id}
            onSelectCompany={(id) => {
              handleSelectCompany(id);
              setCurrentTab('sales');
            }}
            onEditCompany={(comp) => {
              setEditingStation(comp);
              setIsAddStationOpen(true);
            }}
            onOpenAddCompany={() => {
              setEditingStation(null);
              setIsAddStationOpen(true);
            }}
            onPullRemotePumps={handlePullRemoteData}
            sales={salesRecords}
            purchases={purchaseRecords}
          />
        )}
      </div>

      {/* Floating Action Button (Settings Gear from all screenshots) */}
      <button
        onClick={() => setIsSettingsOpen(true)}
        title="Settings, Theme & IRD Norms"
        className="fixed bottom-6 right-6 z-40 bg-[#0c1523] hover:bg-[#132238] text-white p-3.5 rounded-full shadow-2xl border border-slate-700/80 transition-transform hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
      >
        <Settings className="w-5 h-5 text-slate-200" />
      </button>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onChangeTheme={(newTheme) => {
          setTheme(newTheme);
          showToast(`Theme switched to ${newTheme === 'blue-light' ? 'Subtle Blue-Grey' : newTheme === 'grey-light' ? 'Grey & White' : 'Dark Slate'}`);
        }}
        companies={companies}
        activeCompany={activeCompany}
        onSelectCompany={handleSelectCompany}
        onOpenAddStation={() => {
          setEditingStation(null);
          setIsAddStationOpen(true);
        }}
        onEditStation={(comp) => {
          setEditingStation(comp);
          setIsAddStationOpen(true);
        }}
        onOpenCalendarModal={() => setIsGlobalCalendarOpen(true)}
        onPullRemotePumps={handlePullRemoteData}
        onResetData={handleResetData}
      />

      <AddStationModal
        isOpen={isAddStationOpen}
        onClose={() => setIsAddStationOpen(false)}
        onSave={handleSaveCompany}
        onDelete={handleDeleteCompany}
        initialStation={editingStation}
      />

      <NocPortalSyncModal
        isOpen={isNocSyncOpen}
        onClose={() => setIsNocSyncOpen(false)}
        activeCompany={activeCompany}
        fiscalYear={selectedFy}
        onSyncComplete={handleAddPurchaseRecords}
      />

      <ImportSalesModal
        isOpen={isImportSalesOpen}
        onClose={() => setIsImportSalesOpen(false)}
        activeCompany={activeCompany}
        fiscalYear={selectedFy}
        existingRecords={currentSales}
        onImportSuccess={handleAddSalesRecords}
      />

      <ImportPurchasesModal
        isOpen={isImportPurchasesOpen}
        onClose={() => setIsImportPurchasesOpen(false)}
        activeCompany={activeCompany}
        fiscalYear={selectedFy}
        onImportSuccess={handleAddPurchaseRecords}
      />

      <ManualSalesModal
        isOpen={isManualSalesOpen}
        onClose={() => setIsManualSalesOpen(false)}
        activeCompany={activeCompany}
        fiscalYear={selectedFy}
        onSave={(rec) => handleAddSalesRecords([rec])}
      />

      <ManualPurchaseModal
        isOpen={isManualPurchaseOpen}
        onClose={() => setIsManualPurchaseOpen(false)}
        activeCompany={activeCompany}
        fiscalYear={selectedFy}
        onSave={(rec) => handleAddPurchaseRecords([rec])}
      />

      <NepalCalendarModal
        isOpen={isGlobalCalendarOpen}
        onClose={() => setIsGlobalCalendarOpen(false)}
      />

      {/* Clean quiet footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-6 py-4 text-center text-xs text-slate-500 transition-colors">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AutoVAT Nepal · Nepal Oil Corporation Dealership Fuel Stock & VAT Automation</span>
          <span>Inland Revenue Department (IRD) 13% VAT & NOC Shortage Norms (MS 0.88% / HSD 0.605%)</span>
        </div>
      </footer>
    </div>
  );
}
