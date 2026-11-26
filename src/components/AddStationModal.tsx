import React, { useState, useEffect } from 'react';
import { Company } from '../types';
import { X, Building2, Trash2, Eye, EyeOff, Globe, Server, KeyRound, ShieldCheck } from 'lucide-react';

interface AddStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (station: Company) => void;
  onDelete?: (stationId: string) => void;
  initialStation?: Company | null;
}

const DEPOT_OPTIONS = [
  'Thankot Depot (Kathmandu)',
  'Amlekhgunj Depot',
  'Biratnagar Depot',
  'Bhairahawa Depot (Bhalwari)',
  'Nepalgunj Depot',
  'Pokhara Depot (Gagan Gauda)',
  'Dhangadhi Depot',
  'Janakpur Depot (Dhanusha)',
];

const SOFTWARE_OPTIONS = [
  'SPAS Invoicing System',
  'Swastik Petrol Billing',
  'Tally Prime Fuel Module',
  'Standard Excel Invoicing',
  'Busy Accounting',
];

export const AddStationModal: React.FC<AddStationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialStation,
}) => {
  const isEditing = Boolean(initialStation);

  // Basic Information
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [code, setCode] = useState('');
  const [pan, setPan] = useState('');
  const [depot, setDepot] = useState(DEPOT_OPTIONS[0]);
  const [softwareType, setSoftwareType] = useState(SOFTWARE_OPTIONS[0]);

  // Company Portal Login Credentials (from screenshot)
  const [portalUsername, setPortalUsername] = useState('');
  const [portalPassword, setPortalPassword] = useState('');
  const [showPortalPassword, setShowPortalPassword] = useState(false);

  // Software Link & API Access (from screenshot)
  const [softwareHostUrl, setSoftwareHostUrl] = useState('');
  const [softwareUsername, setSoftwareUsername] = useState('admin');
  const [softwarePassword, setSoftwarePassword] = useState('admin');
  const [showSoftwarePassword, setShowSoftwarePassword] = useState(false);

  // Opening Stocks & Capacities
  const [msOpeningStockL, setMsOpeningStockL] = useState('0');
  const [hsdOpeningStockL, setHsdOpeningStockL] = useState('0');
  const [msTankCapacityL, setMsTankCapacityL] = useState('45000');
  const [hsdTankCapacityL, setHsdTankCapacityL] = useState('70000');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialStation) {
      setName(initialStation.name || '');
      setLocation(initialStation.location || '');
      setCode(initialStation.code || '');
      setPan(initialStation.pan || '');
      setDepot(initialStation.depot || DEPOT_OPTIONS[0]);
      setSoftwareType(initialStation.softwareType || SOFTWARE_OPTIONS[0]);

      setPortalUsername(initialStation.portalUsername || initialStation.code || '');
      setPortalPassword(initialStation.portalPassword || 'NOC@2083#pass');
      setSoftwareHostUrl(
        initialStation.softwareHostUrl ||
          `http://spas.taradigitalsolution.com.np:1176/${(initialStation.name || 'pump')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')}ui`
      );
      setSoftwareUsername(initialStation.softwareUsername || 'admin');
      setSoftwarePassword(initialStation.softwarePassword || 'admin');

      setMsOpeningStockL((initialStation.msOpeningStockL ?? 0).toString());
      setHsdOpeningStockL((initialStation.hsdOpeningStockL ?? 0).toString());
      setMsTankCapacityL((initialStation.msTankCapacityL ?? 45000).toString());
      setHsdTankCapacityL((initialStation.hsdTankCapacityL ?? 70000).toString());
    } else {
      setName('');
      setLocation('');
      setCode('CDEA');
      setPan('');
      setDepot(DEPOT_OPTIONS[0]);
      setSoftwareType(SOFTWARE_OPTIONS[0]);

      setPortalUsername('CDEA');
      setPortalPassword('');
      setSoftwareHostUrl('http://spas.taradigitalsolution.com.np:1176/pumpui');
      setSoftwareUsername('admin');
      setSoftwarePassword('admin');

      setMsOpeningStockL('0');
      setHsdOpeningStockL('0');
      setMsTankCapacityL('45000');
      setHsdTankCapacityL('70000');
    }
    setError('');
  }, [initialStation, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide the station/petrol pump name.');
      return;
    }
    if (!pan.trim()) {
      setError('Please provide the station PAN number.');
      return;
    }
    if (!code.trim()) {
      setError('Please provide the NOC Dealer Code.');
      return;
    }

    const station: Company = {
      id: initialStation ? initialStation.id : `station-${Date.now()}`,
      name: name.trim(),
      location: location.trim() || 'Nepal',
      code: code.trim(),
      pan: pan.trim(),
      depot,
      portalLoginSet: Boolean(portalUsername && portalPassword),
      portalUsername: portalUsername.trim() || code.trim(),
      portalPassword: portalPassword.trim(),
      portalUrl: 'eservice.nepaloil.org.np',
      softwareLinked: Boolean(softwareHostUrl),
      softwareType,
      softwareHostUrl: softwareHostUrl.trim(),
      softwareUsername: softwareUsername.trim(),
      softwarePassword: softwarePassword.trim(),
      isActive: initialStation ? initialStation.isActive : false,
      msOpeningStockL: parseFloat(msOpeningStockL) || 0,
      hsdOpeningStockL: parseFloat(hsdOpeningStockL) || 0,
      msTankCapacityL: parseFloat(msTankCapacityL) || 45000,
      hsdTankCapacityL: parseFloat(hsdTankCapacityL) || 70000,
      msPhysicalDipL: initialStation?.msPhysicalDipL,
      hsdPhysicalDipL: initialStation?.hsdPhysicalDipL,
    };

    onSave(station);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/60">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600 dark:text-amber-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isEditing ? name || 'Configure Petrol Pump' : 'Add New Petrol Pump Station'}
              </h3>
            </div>
            {isEditing && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                PAN: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{pan || '-'}</span> · Location: {location || '-'}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Section 1: Basic Station Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Petrol Pump Identity & Tax Registration
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Petrol Pump / Dealership Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Phatkeshwori Oil Store"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Location / Address *
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Kavre Panchkhal 0 Kilo"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  PAN Number (Nepal IRD) *
                </label>
                <input
                  type="text"
                  required
                  value={pan}
                  onChange={(e) => setPan(e.target.value)}
                  placeholder="e.g. 300047060"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  NOC Dealer Customer Code *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    if (!portalUsername || portalUsername === code) {
                      setPortalUsername(e.target.value);
                    }
                  }}
                  placeholder="e.g. CDEA3001373"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Supply Depot
                </label>
                <select
                  value={depot}
                  onChange={(e) => setDepot(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-medium"
                >
                  {DEPOT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: THE TWO AUTHENTIC INTEGRATION CARDS (From User's Attached Screenshot) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Card 1: COMPANY PORTAL LOGIN (DATA SOURCE) */}
            <div className="bg-[#fffdf0] dark:bg-amber-950/20 border-2 border-[#fef08a] dark:border-amber-800/60 rounded-2xl p-4 space-y-3 relative shadow-xs">
              <div className="flex items-center justify-between gap-2 border-b border-amber-200/60 dark:border-amber-800/40 pb-2">
                <span className="text-[11px] font-black text-amber-900 dark:text-amber-200 tracking-wider uppercase">
                  COMPANY PORTAL LOGIN (DATA SOURCE)
                </span>
                <span className="text-[10px] font-mono font-semibold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer">
                  eservice.nepaloil.org.np
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Portal Username / Customer Code
                </label>
                <input
                  type="text"
                  value={portalUsername}
                  onChange={(e) => setPortalUsername(e.target.value)}
                  placeholder="e.g. CDEA3001373"
                  className="w-full bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Company Portal Password (where data will be logged in)
                </label>
                <div className="relative">
                  <input
                    type={showPortalPassword ? 'text' : 'password'}
                    value={portalPassword}
                    onChange={(e) => setPortalPassword(e.target.value)}
                    placeholder="Enter NOC portal login password"
                    className="w-full bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-xl pl-3 pr-9 py-2 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPortalPassword(!showPortalPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5"
                    title={showPortalPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPortalPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="text-[10px] text-amber-800/80 dark:text-amber-400/80 flex items-center gap-1.5 pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Used for automated FY 2083-084 purchase chalan sync from NOC central e-services</span>
              </div>
            </div>

            {/* Card 2: SOFTWARE LINK & API ACCESS (SPAS / POS) */}
            <div className="bg-[#f0f9ff] dark:bg-sky-950/20 border-2 border-[#bae6fd] dark:border-sky-800/60 rounded-2xl p-4 space-y-3 relative shadow-xs">
              <div className="flex items-center justify-between gap-2 border-b border-sky-200/60 dark:border-sky-800/40 pb-2">
                <span className="text-[11px] font-black text-sky-900 dark:text-sky-200 tracking-wider uppercase">
                  SOFTWARE LINK & API ACCESS (SPAS / POS)
                </span>
                <span className="text-[10px] font-mono font-semibold text-sky-700 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/60 px-1.5 py-0.5 rounded">
                  SPAS ERP / Pump Link
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Software Link / Host URL
                </label>
                <input
                  type="text"
                  value={softwareHostUrl}
                  onChange={(e) => setSoftwareHostUrl(e.target.value)}
                  placeholder="http://spas.taradigitalsolution.com.np:1176/phatkeshworioilstoreui"
                  className="w-full bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Software Link Username
                  </label>
                  <input
                    type="text"
                    value={softwareUsername}
                    onChange={(e) => setSoftwareUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Software Link Password
                  </label>
                  <div className="relative">
                    <input
                      type={showSoftwarePassword ? 'text' : 'password'}
                      value={softwarePassword}
                      onChange={(e) => setSoftwarePassword(e.target.value)}
                      placeholder="admin"
                      className="w-full bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 rounded-xl pl-3 pr-8 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSoftwarePassword(!showSoftwarePassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5"
                      title={showSoftwarePassword ? 'Hide password' : 'Show password'}
                    >
                      {showSoftwarePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-sky-800/80 dark:text-sky-400/80 flex items-center gap-1.5 pt-0.5">
                <Server className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span>Enables live daily fuel sales invoice synchronization from POS/ERP</span>
              </div>
            </div>
          </div>

          {/* Section 3: Tank Capacities & FY Initial Opening Stock */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
              Initial Fuel Stocks & Storage Capacities
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1 font-medium">
                  Petrol (MS) Opening (L)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={msOpeningStockL}
                  onChange={(e) => setMsOpeningStockL(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1 font-medium">
                  Diesel (HSD) Opening (L)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={hsdOpeningStockL}
                  onChange={(e) => setHsdOpeningStockL(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1 font-medium">
                  MS Tank Capacity (L)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={msTankCapacityL}
                  onChange={(e) => setMsTankCapacityL(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1 font-medium">
                  HSD Tank Capacity (L)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={hsdTankCapacityL}
                  onChange={(e) => setHsdTankCapacityL(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            {isEditing && onDelete && initialStation ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to remove ${initialStation.name}?`)) {
                    onDelete(initialStation.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Pump</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-xs"
              >
                {isEditing ? 'Save Changes' : 'Save & Register Pump'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
