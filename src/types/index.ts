export type FuelType = 'Petrol' | 'Diesel' | 'MS' | 'HSD' | 'Bike' | 'Lube' | 'Speed' | 'Lubricants' | 'Other';

export interface Company {
  id: string;
  name: string;
  location: string;
  code: string; // e.g., CDEA3001373
  pan: string;
  depot: string; // e.g., Thankot Depot, Amlekhgunj Depot
  portalLoginSet: boolean;
  portalUsername?: string;
  portalPassword?: string;
  portalUrl?: string; // defaults to eservice.nepaloil.org.np
  softwareLinked: boolean;
  softwareType?: string;
  softwareHostUrl?: string;
  softwareUsername?: string;
  softwarePassword?: string;
  isActive?: boolean;
  salesCount?: number;
  salesInvoices?: number;
  creditNotesCount?: number;
  purchasesCount?: number;
  vatSummaryRs?: number;
  totalVatStockLiters?: number;
  petrolStockL?: number;
  dieselStockL?: number;
  msOpeningStockL: number;
  hsdOpeningStockL: number;
  msTankCapacityL?: number;
  hsdTankCapacityL?: number;
  msPhysicalDipL?: number;
  hsdPhysicalDipL?: number;
}

export interface StockFlow {
  product: FuelType;
  shortageRatePercent: number;
  openingStockL: number;
  purchasesL: number;
  salesL: number;
  returnsL: number;
  workingShortageL: number;
  closingStockL: number;
  tankCapacityL?: number;
  physicalDipStockL?: number;
  varianceL?: number;
}

export interface VatSummary {
  grossPurchases: number;
  grossPurchasesRs: number;
  taxablePurchases: number;
  taxablePurchasesRs: number;
  purchaseVat: number;
  purchaseVatRs: number;
  grossSales: number;
  grossSalesRs: number;
  taxableSales: number;
  taxableSalesRs: number;
  salesVat: number;
  salesVatRs: number;
  salesReturns: number;
  salesReturnsRs: number;
  taxableReturns: number;
  taxableReturnsRs: number;
  returnsVat: number;
  returnsVatRs: number;
  netTaxableSales: number;
  netSalesTaxableRs: number;
  netSalesVat: number;
  netSalesVatRs: number;
  netVatPayable: number;
  netVatPayableRs: number;
}

export interface MonthlyStockRow {
  month: string;
  monthIndex: number;
  isLocked?: boolean;
  petrol: {
    opening: number;
    purchase: number;
    sales: number;
    returns: number;
    shortage: number;
    stock: number;
  };
  diesel: {
    opening: number;
    purchase: number;
    sales: number;
    returns: number;
    shortage: number;
    stock: number;
  };
}

export interface MonthlyVatRow {
  month: string;
  monthIndex: number;
  isLocked?: boolean;
  taxablePurchase: number;
  purchaseVat: number;
  taxableSalesNet: number;
  salesVatNet: number;
  vatPayable: number;
  drCrAdjustment?: number; // negative number in parentheses e.g. (69,47,111.66)
  netPayable?: number;
}

export interface SalesRecord {
  id: string;
  sn?: number;
  stationId: string;
  fiscalYear: string;
  billNo: string;
  date: string;
  nepaliDate: string; // e.g., Shrawan 2083 or 2083.04.15
  customer: string;
  customerPan?: string;
  product: FuelType;
  quantityL: number;
  rate: number;
  grossSales: number;
  taxableAmount: number;
  vatAmount: number;
  isCreditNote: boolean;
  originalInvoiceRef?: string;
  isGrouped?: boolean;
  groupedCount?: number;
  notes?: string;
}

export interface PurchaseRecord {
  id: string;
  sn?: number;
  stationId: string;
  fiscalYear: string;
  chalanNo: string;
  nocInvoiceNo?: string;
  month?: string;
  supplier?: string;
  pan?: string;
  date: string;
  nepaliDate: string;
  depot: string;
  product: FuelType;
  category?: 'fuel' | 'excel_upload' | 'other';
  quantityKl?: number;
  quantityL: number;
  baseRate: number;
  grossPurchase: number;
  taxableAmount: number;
  vatAmount: number;
  isDebitNote?: boolean;
  originalInvoiceRef?: string;
  tankerNo?: string;
  invoicesCount?: number;
  source?: string;
  notes?: string;
}

export interface HighValueRecord {
  id: string;
  sn: number;
  dateMonth: string;
  billNo: string;
  pan: string;
  taxPayerName: string;
  tradeNameType: string;
  type: 'Purchase' | 'Sale';
  taxableAmount: number;
  exemptedAmount: number;
  nonTaxableAmount: number;
}
