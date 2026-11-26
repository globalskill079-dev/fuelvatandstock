import React, { useState } from 'react';
import { Company, SalesRecord, FuelType } from '../types';
import { calculateVatBreakdown, formatRs } from '../utils/vatAndStockCalculations';
import { X, PlusCircle } from 'lucide-react';

interface ManualSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCompany: Company;
  fiscalYear: string;
  onSave: (record: SalesRecord) => void;
}

export const ManualSalesModal: React.FC<ManualSalesModalProps> = ({
  isOpen,
  onClose,
  activeCompany,
  fiscalYear,
  onSave,
}) => {
  const [billNo, setBillNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [nepaliDate, setNepaliDate] = useState('');
  const [customer, setCustomer] = useState('Counter Cash Sales');
  const [customerPan, setCustomerPan] = useState('');
  const [product, setProduct] = useState<FuelType>('MS');
  const [quantityL, setQuantityL] = useState('100');
  const [rate, setRate] = useState('181.00');
  const [isCreditNote, setIsCreditNote] = useState(false);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const qty = parseFloat(quantityL) || 0;
  const unitRate = parseFloat(rate) || 0;
  const gross = qty * unitRate;
  const { taxableAmount, vatAmount } = calculateVatBreakdown(gross);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billNo.trim()) return;

    const record: SalesRecord = {
      id: `sales-manual-${Date.now()}`,
      stationId: activeCompany.id,
      fiscalYear,
      billNo: billNo.trim(),
      date,
      nepaliDate: nepaliDate.trim() || date,
      customer: customer.trim() || 'Counter Cash Sales',
      customerPan: customerPan.trim() || undefined,
      product,
      quantityL: Number(qty.toFixed(2)),
      rate: Number(unitRate.toFixed(2)),
      grossSales: Number(gross.toFixed(2)),
      taxableAmount,
      vatAmount,
      isCreditNote,
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
            <PlusCircle className="w-5 h-5 text-blue-600 dark:text-amber-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Record Single Sales Invoice / Return</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Transaction Type:</span>
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="radio"
                checked={!isCreditNote}
                onChange={() => setIsCreditNote(false)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-800 dark:text-slate-200">Standard Sales Invoice</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="radio"
                checked={isCreditNote}
                onChange={() => setIsCreditNote(true)}
                className="text-rose-600 focus:ring-rose-500"
              />
              <span className="text-rose-600 dark:text-rose-400">Credit Note (Sales Return)</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">
                {isCreditNote ? 'Credit Note No *' : 'Bill / Invoice No *'}
              </label>
              <input
                type="text"
                required
                value={billNo}
                onChange={(e) => setBillNo(e.target.value)}
                placeholder={isCreditNote ? 'CN-2083-001' : 'INV-2083-001'}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">Fuel Product *</label>
              <select
                value={product}
                onChange={(e) => {
                  const p = e.target.value as FuelType;
                  setProduct(p);
                  if (p === 'MS') setRate('181.00');
                  else if (p === 'HSD') setRate('168.00');
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-slate-100 font-semibold"
              >
                <option value="MS">Petrol (MS)</option>
                <option value="HSD">Diesel (HSD)</option>
                <option value="Speed">Speed Premium</option>
                <option value="Lubricants">Lubricants / Engine Oil</option>
              </select>
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
                placeholder="e.g. 2083-01-25"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">Customer / Fleet Name</label>
              <input
                type="text"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">Quantity (Liters) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={quantityL}
                onChange={(e) => setQuantityL(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-400 font-medium mb-1">Rate per Liter (Rs.) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
          </div>

          {/* Automatic Calculation Preview */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1">
            <div className="flex justify-between text-slate-700 dark:text-slate-300 font-medium">
              <span>Gross Sales:</span>
              <strong className="font-mono text-blue-700 dark:text-amber-400">Rs. {formatRs(gross)}</strong>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Taxable Amount (Gross / 1.13):</span>
              <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">Rs. {formatRs(taxableAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>13% VAT Amount:</span>
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
              {isCreditNote ? 'Save Credit Note' : 'Save Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
