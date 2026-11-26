import React, { useState } from 'react';
import { Company, PurchaseRecord } from '../types';
import { calculateVatBreakdown, formatRs } from '../utils/vatAndStockCalculations';
import { X, PlusCircle } from 'lucide-react';

interface ManualPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCompany: Company;
  fiscalYear: string;
  onSave: (record: PurchaseRecord) => void;
}

export const ManualPurchaseModal: React.FC<ManualPurchaseModalProps> = ({
  isOpen,
  onClose,
  activeCompany,
  fiscalYear,
  onSave,
}) => {
  const [chalanNo, setChalanNo] = useState('');
  const [nocInvoiceNo, setNocInvoiceNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [nepaliDate, setNepaliDate] = useState('');
  const [depot, setDepot] = useState(activeCompany.depot || 'Thankot Depot');
  const [product, setProduct] = useState<'MS' | 'HSD'>('MS');
  const [quantityL, setQuantityL] = useState('20000');
  const [baseRate, setBaseRate] = useState('173.50');
  const [tankerNo, setTankerNo] = useState('BA 2 KHA 7890');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const liters = parseFloat(quantityL) || 0;
  const rate = parseFloat(baseRate) || 0;
  const gross = liters * rate;
  const { taxableAmount, vatAmount } = calculateVatBreakdown(gross);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chalanNo.trim()) return;

    const record: PurchaseRecord = {
      id: `purchases-manual-${Date.now()}`,
      stationId: activeCompany.id,
      fiscalYear,
      chalanNo: chalanNo.trim(),
      nocInvoiceNo: nocInvoiceNo.trim() || `NOC-${chalanNo.trim()}`,
      date,
      nepaliDate: nepaliDate.trim() || date,
      depot,
      product,
      quantityKl: Number((liters / 1000).toFixed(3)),
      quantityL: Number(liters.toFixed(2)),
      baseRate: Number(rate.toFixed(2)),
      grossPurchase: Number(gross.toFixed(2)),
      taxableAmount,
      vatAmount,
      tankerNo: tankerNo.trim() || undefined,
      source: 'manual',
      notes: notes.trim() || undefined,
    };

    onSave(record);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full flex flex-col shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Record NOC Purchase Chalan</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">NOC Chalan No *</label>
              <input
                type="text"
                required
                value={chalanNo}
                onChange={(e) => setChalanNo(e.target.value)}
                placeholder="e.g. CH-9501"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">NOC Invoice No</label>
              <input
                type="text"
                value={nocInvoiceNo}
                onChange={(e) => setNocInvoiceNo(e.target.value)}
                placeholder="e.g. NOC-TK-2083-1450"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">Fuel Product *</label>
              <select
                value={product}
                onChange={(e) => {
                  const p = e.target.value as 'MS' | 'HSD';
                  setProduct(p);
                  if (p === 'MS') setBaseRate('173.50');
                  else setBaseRate('154.20');
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-slate-100 font-semibold"
              >
                <option value="MS">Petrol (MS)</option>
                <option value="HSD">Diesel (HSD)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">Dispatch Depot</label>
              <input
                type="text"
                value={depot}
                onChange={(e) => setDepot(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">Date (AD)</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">Nepali Date (Miti)</label>
              <input
                type="text"
                value={nepaliDate}
                onChange={(e) => setNepaliDate(e.target.value)}
                placeholder="e.g. 2083-02-18"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">Quantity (Liters) *</label>
              <input
                type="number"
                step="100"
                required
                value={quantityL}
                onChange={(e) => setQuantityL(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">Base Rate per Liter (Rs.) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={baseRate}
                onChange={(e) => setBaseRate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">Tanker Plate Number</label>
              <input
                type="text"
                value={tankerNo}
                onChange={(e) => setTankerNo(e.target.value)}
                placeholder="e.g. BA 2 KHA 7890"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Automatic Calculation Preview */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1">
            <div className="flex justify-between text-slate-700 dark:text-slate-300 font-medium">
              <span>Gross Purchase:</span>
              <strong className="font-mono text-blue-700 dark:text-cyan-400">Rs. {formatRs(gross)}</strong>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Taxable Purchase (Gross / 1.13):</span>
              <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">Rs. {formatRs(taxableAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>13% Purchase VAT:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">Rs. {formatRs(vatAmount)}</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-xs font-bold text-white dark:text-slate-950 bg-blue-600 dark:bg-amber-500 hover:bg-blue-700 dark:hover:bg-amber-400 transition shadow-xs"
            >
              Save Chalan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
