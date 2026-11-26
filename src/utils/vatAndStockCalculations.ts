import { 
  Company, 
  SalesRecord, 
  PurchaseRecord, 
  StockFlow, 
  VatSummary, 
  MonthlyStockRow, 
  MonthlyVatRow, 
  HighValueRecord 
} from '../types';
import { mapAdDateToBs } from './nepalCalendar';

export const VAT_RATE = 0.13; // 13% Standard Rate in Nepal
export const MS_SHORTAGE_RATE_PERCENT = 0.88; // 0.88% Petrol Working Shortage
export const HSD_SHORTAGE_RATE_PERCENT = 0.605; // 0.605% Diesel Working Shortage

/**
 * Calculates Taxable Amount and VAT Amount from Gross value under Nepal 13% VAT rules
 * Taxable Amount = Gross / 1.13
 * VAT Amount = Gross - Taxable Amount
 */
export function calculateVatBreakdown(grossAmount: number): { taxableAmount: number; vatAmount: number } {
  const taxableAmount = grossAmount / (1 + VAT_RATE);
  const vatAmount = grossAmount - taxableAmount;
  return {
    taxableAmount: Number(taxableAmount.toFixed(2)),
    vatAmount: Number(vatAmount.toFixed(2)),
  };
}

/**
 * Calculates fuel working shortage in liters
 * Working Shortage (Liters) = Purchases (L) * (Shortage Rate / 100)
 */
export function calculateShortageLiters(purchasesL: number, product: 'MS' | 'HSD'): number {
  const ratePercent = product === 'MS' ? MS_SHORTAGE_RATE_PERCENT : HSD_SHORTAGE_RATE_PERCENT;
  return Number(((purchasesL * ratePercent) / 100).toFixed(2));
}

/**
 * Calculates closing stock in liters
 * Closing Stock (L) = Opening Stock + Purchases - Sales + Sales Returns - Working Shortage
 */
export function calculateClosingStockLiters(
  openingL: number,
  purchasesL: number,
  salesL: number,
  returnsL: number,
  shortageL: number
): number {
  return Number((openingL + purchasesL - salesL + returnsL - shortageL).toFixed(2));
}

/**
 * Calculates aggregated VAT figures for a station's sales and purchases
 */
export function calculateStationVatSummary(
  sales: SalesRecord[],
  purchases: PurchaseRecord[]
): VatSummary {
  let grossPurchases = 0;
  let taxablePurchases = 0;
  let purchaseVat = 0;

  purchases.forEach((p) => {
    grossPurchases += p.grossPurchase;
    taxablePurchases += p.taxableAmount;
    purchaseVat += p.vatAmount;
  });

  let grossSales = 0;
  let taxableSales = 0;
  let salesVat = 0;

  let salesReturns = 0;
  let taxableReturns = 0;
  let returnsVat = 0;

  sales.forEach((s) => {
    if (s.isCreditNote) {
      salesReturns += s.grossSales;
      taxableReturns += s.taxableAmount;
      returnsVat += s.vatAmount;
    } else {
      grossSales += s.grossSales;
      taxableSales += s.taxableAmount;
      salesVat += s.vatAmount;
    }
  });

  const netTaxableSales = taxableSales - taxableReturns;
  const netSalesVat = salesVat - returnsVat;
  const netVatPayable = netSalesVat - purchaseVat;

  return {
    grossPurchases: Number(grossPurchases.toFixed(2)),
    grossPurchasesRs: Number(grossPurchases.toFixed(2)),
    taxablePurchases: Number(taxablePurchases.toFixed(2)),
    taxablePurchasesRs: Number(taxablePurchases.toFixed(2)),
    purchaseVat: Number(purchaseVat.toFixed(2)),
    purchaseVatRs: Number(purchaseVat.toFixed(2)),
    grossSales: Number(grossSales.toFixed(2)),
    grossSalesRs: Number(grossSales.toFixed(2)),
    taxableSales: Number(taxableSales.toFixed(2)),
    taxableSalesRs: Number(taxableSales.toFixed(2)),
    salesVat: Number(salesVat.toFixed(2)),
    salesVatRs: Number(salesVat.toFixed(2)),
    salesReturns: Number(salesReturns.toFixed(2)),
    salesReturnsRs: Number(salesReturns.toFixed(2)),
    taxableReturns: Number(taxableReturns.toFixed(2)),
    taxableReturnsRs: Number(taxableReturns.toFixed(2)),
    returnsVat: Number(returnsVat.toFixed(2)),
    returnsVatRs: Number(returnsVat.toFixed(2)),
    netTaxableSales: Number(netTaxableSales.toFixed(2)),
    netSalesTaxableRs: Number(netTaxableSales.toFixed(2)),
    netSalesVat: Number(netSalesVat.toFixed(2)),
    netSalesVatRs: Number(netSalesVat.toFixed(2)),
    netVatPayable: Number(netVatPayable.toFixed(2)),
    netVatPayableRs: Number(netVatPayable.toFixed(2)),
  };
}

/**
 * Calculates fuel stock flow (Petrol MS & Diesel HSD) for a specific station
 */
export function calculateStationStockFlows(
  station: Company,
  sales: SalesRecord[],
  purchases: PurchaseRecord[]
): { ms: StockFlow; hsd: StockFlow } {
  // Petrol (MS)
  const msPurchasesL = purchases
    .filter((p) => p.product === 'MS' || p.product === 'Petrol')
    .reduce((sum, p) => sum + p.quantityL, 0);

  const msSalesRegular = sales
    .filter((s) => (s.product === 'MS' || s.product === 'Petrol') && !s.isCreditNote)
    .reduce((sum, s) => sum + s.quantityL, 0);

  const msReturns = sales
    .filter((s) => (s.product === 'MS' || s.product === 'Petrol') && s.isCreditNote)
    .reduce((sum, s) => sum + s.quantityL, 0);

  const msShortageL = calculateShortageLiters(msPurchasesL, 'MS');
  const msClosingL = calculateClosingStockLiters(
    station.msOpeningStockL,
    msPurchasesL,
    msSalesRegular,
    msReturns,
    msShortageL
  );

  const msPhysicalDip = station.msPhysicalDipL ?? msClosingL;
  const msVarianceL = Number((msPhysicalDip - msClosingL).toFixed(2));

  const msFlow: StockFlow = {
    product: 'MS',
    shortageRatePercent: MS_SHORTAGE_RATE_PERCENT,
    openingStockL: station.msOpeningStockL,
    purchasesL: Number(msPurchasesL.toFixed(2)),
    salesL: Number(msSalesRegular.toFixed(2)),
    returnsL: Number(msReturns.toFixed(2)),
    workingShortageL: msShortageL,
    closingStockL: msClosingL,
    physicalDipStockL: msPhysicalDip,
    varianceL: msVarianceL,
  };

  // Diesel (HSD)
  const hsdPurchasesL = purchases
    .filter((p) => p.product === 'HSD' || p.product === 'Diesel')
    .reduce((sum, p) => sum + p.quantityL, 0);

  const hsdSalesRegular = sales
    .filter((s) => (s.product === 'HSD' || s.product === 'Diesel') && !s.isCreditNote)
    .reduce((sum, s) => sum + s.quantityL, 0);

  const hsdReturns = sales
    .filter((s) => (s.product === 'HSD' || s.product === 'Diesel') && s.isCreditNote)
    .reduce((sum, s) => sum + s.quantityL, 0);

  const hsdShortageL = calculateShortageLiters(hsdPurchasesL, 'HSD');
  const hsdClosingL = calculateClosingStockLiters(
    station.hsdOpeningStockL,
    hsdPurchasesL,
    hsdSalesRegular,
    hsdReturns,
    hsdShortageL
  );

  const hsdPhysicalDip = station.hsdPhysicalDipL ?? hsdClosingL;
  const hsdVarianceL = Number((hsdPhysicalDip - hsdClosingL).toFixed(2));

  const hsdFlow: StockFlow = {
    product: 'HSD',
    shortageRatePercent: HSD_SHORTAGE_RATE_PERCENT,
    openingStockL: station.hsdOpeningStockL,
    purchasesL: Number(hsdPurchasesL.toFixed(2)),
    salesL: Number(hsdSalesRegular.toFixed(2)),
    returnsL: Number(hsdReturns.toFixed(2)),
    workingShortageL: hsdShortageL,
    closingStockL: hsdClosingL,
    physicalDipStockL: hsdPhysicalDip,
    varianceL: hsdVarianceL,
  };

  return { ms: msFlow, hsd: hsdFlow };
}

/**
 * Currency formatter for Nepali Rupees (NPR)
 */
export function formatRs(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Liters number formatter
 */
export function formatLiters(liters: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(liters);
}

export const NEPALI_MONTHS = [
  'Shrawan',
  'Bhadra',
  'Ashoj',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
  'Baisakh',
  'Jestha',
  'Ashadh',
] as const;

/**
 * Extracts normalized Nepali Month name from available record date fields
 */
export function getNepaliMonthFromRecord(
  monthField?: string,
  nepaliDateField?: string,
  adDateField?: string
): string {
  // 1. Direct month field check
  if (monthField) {
    const clean = monthField.trim().toLowerCase();
    const found = NEPALI_MONTHS.find((m) => clean.includes(m.toLowerCase()));
    if (found) return found;
  }

  // 2. Check Nepali Date string (e.g., 'Shrawan 2083' or '2083.04.15' or '2083-05-12')
  if (nepaliDateField) {
    const clean = nepaliDateField.trim().toLowerCase();
    const found = NEPALI_MONTHS.find((m) => clean.includes(m.toLowerCase()));
    if (found) return found;

    // Pattern 2083.04.15 or 2083-04-15
    const match = nepaliDateField.match(/\d{4}[.\/-](\d{1,2})/);
    if (match) {
      const monthNum = parseInt(match[1], 10);
      // Nepali months: 4: Shrawan, 5: Bhadra, 6: Ashoj, 7: Kartik, 8: Mangsir, 9: Poush, 10: Magh, 11: Falgun, 12: Chaitra, 1: Baisakh, 2: Jestha, 3: Ashadh
      const monthMap: Record<number, string> = {
        4: 'Shrawan',
        5: 'Bhadra',
        6: 'Ashoj',
        7: 'Kartik',
        8: 'Mangsir',
        9: 'Poush',
        10: 'Magh',
        11: 'Falgun',
        12: 'Chaitra',
        1: 'Baisakh',
        2: 'Jestha',
        3: 'Ashadh',
      };
      if (monthMap[monthNum]) return monthMap[monthNum];
    }
  }

  // 3. Exact official mapping from AD Date
  if (adDateField) {
    try {
      const mapped = mapAdDateToBs(adDateField);
      if (mapped.shortMonth) return mapped.shortMonth;
    } catch {
      // ignore parse error
    }
  }

  return 'Shrawan'; // default to beginning of fiscal year
}

/**
 * Dynamically computes month-by-month fuel stock movements for all 12 Nepali months from real records
 */
export function calculateDynamicMonthlyStock(
  company: Company,
  sales: SalesRecord[],
  purchases: PurchaseRecord[]
): MonthlyStockRow[] {
  let rollingPetrolOpening = company.msOpeningStockL || 0;
  let rollingDieselOpening = company.hsdOpeningStockL || 0;

  return NEPALI_MONTHS.map((monthName, index) => {
    // Filter purchases belonging to this month
    const monthPurchases = purchases.filter((p) => {
      const recMonth = getNepaliMonthFromRecord(p.month, p.nepaliDate, p.date);
      return recMonth.toLowerCase() === monthName.toLowerCase();
    });

    // Filter sales belonging to this month
    const monthSales = sales.filter((s) => {
      const recMonth = getNepaliMonthFromRecord(undefined, s.nepaliDate, s.date);
      return recMonth.toLowerCase() === monthName.toLowerCase();
    });

    // Petrol (MS)
    const pPurchasesL = monthPurchases
      .filter((p) => p.product === 'MS' || p.product === 'Petrol')
      .reduce((sum, p) => sum + p.quantityL, 0);

    const pSalesL = monthSales
      .filter((s) => (s.product === 'MS' || s.product === 'Petrol') && !s.isCreditNote)
      .reduce((sum, s) => sum + s.quantityL, 0);

    const pReturnsL = monthSales
      .filter((s) => (s.product === 'MS' || s.product === 'Petrol') && s.isCreditNote)
      .reduce((sum, s) => sum + s.quantityL, 0);

    const pShortageL = (pPurchasesL * MS_SHORTAGE_RATE_PERCENT) / 100;
    const pClosingL = rollingPetrolOpening + pPurchasesL - pSalesL + pReturnsL - pShortageL;

    // Diesel (HSD)
    const dPurchasesL = monthPurchases
      .filter((p) => p.product === 'HSD' || p.product === 'Diesel')
      .reduce((sum, p) => sum + p.quantityL, 0);

    const dSalesL = monthSales
      .filter((s) => (s.product === 'HSD' || s.product === 'Diesel') && !s.isCreditNote)
      .reduce((sum, s) => sum + s.quantityL, 0);

    const dReturnsL = monthSales
      .filter((s) => (s.product === 'HSD' || s.product === 'Diesel') && s.isCreditNote)
      .reduce((sum, s) => sum + s.quantityL, 0);

    const dShortageL = (dPurchasesL * HSD_SHORTAGE_RATE_PERCENT) / 100;
    const dClosingL = rollingDieselOpening + dPurchasesL - dSalesL + dReturnsL - dShortageL;

    const row: MonthlyStockRow = {
      month: monthName,
      monthIndex: index + 1,
      isLocked: index < 6,
      petrol: {
        opening: Number(rollingPetrolOpening.toFixed(3)),
        purchase: Number(pPurchasesL.toFixed(3)),
        sales: Number(pSalesL.toFixed(3)),
        returns: Number(pReturnsL.toFixed(3)),
        shortage: Number(pShortageL.toFixed(2)),
        stock: Number(pClosingL.toFixed(3)),
      },
      diesel: {
        opening: Number(rollingDieselOpening.toFixed(3)),
        purchase: Number(dPurchasesL.toFixed(3)),
        sales: Number(dSalesL.toFixed(3)),
        returns: Number(dReturnsL.toFixed(3)),
        shortage: Number(dShortageL.toFixed(2)),
        stock: Number(dClosingL.toFixed(3)),
      },
    };

    // Update rolling openings for subsequent month
    rollingPetrolOpening = pClosingL;
    rollingDieselOpening = dClosingL;

    return row;
  });
}

/**
 * Dynamically computes month-by-month VAT reconciliation for all 12 Nepali months from real records
 */
export function calculateDynamicMonthlyVat(
  sales: SalesRecord[],
  purchases: PurchaseRecord[],
  drCrAdjustments: Record<string, number> = {}
): MonthlyVatRow[] {
  let cumulativeCredit = 0;

  return NEPALI_MONTHS.map((monthName, index) => {
    // Filter purchases belonging to this month
    const monthPurchases = purchases.filter((p) => {
      const recMonth = getNepaliMonthFromRecord(p.month, p.nepaliDate, p.date);
      return recMonth.toLowerCase() === monthName.toLowerCase();
    });

    // Filter sales belonging to this month
    const monthSales = sales.filter((s) => {
      const recMonth = getNepaliMonthFromRecord(undefined, s.nepaliDate, s.date);
      return recMonth.toLowerCase() === monthName.toLowerCase();
    });

    const taxablePurchase = monthPurchases.reduce((s, p) => s + p.taxableAmount, 0);
    const purchaseVat = monthPurchases.reduce((s, p) => s + p.vatAmount, 0);

    const regularSalesTaxable = monthSales
      .filter((s) => !s.isCreditNote)
      .reduce((sum, s) => sum + s.taxableAmount, 0);

    const regularSalesVat = monthSales
      .filter((s) => !s.isCreditNote)
      .reduce((sum, s) => sum + s.vatAmount, 0);

    const returnSalesTaxable = monthSales
      .filter((s) => s.isCreditNote)
      .reduce((sum, s) => sum + Math.abs(s.taxableAmount), 0);

    const returnSalesVat = monthSales
      .filter((s) => s.isCreditNote)
      .reduce((sum, s) => sum + Math.abs(s.vatAmount), 0);

    const taxableSalesNet = regularSalesTaxable - returnSalesTaxable;
    const salesVatNet = regularSalesVat - returnSalesVat;

    const vatPayable = salesVatNet - purchaseVat;

    let drCrAdjustment = drCrAdjustments[monthName];
    if (drCrAdjustment === undefined) {
      if (vatPayable < 0) {
        cumulativeCredit += Math.abs(vatPayable);
        drCrAdjustment = -cumulativeCredit;
      } else if (cumulativeCredit > 0) {
        drCrAdjustment = -cumulativeCredit;
      }
    }

    let netPayable = 0;
    if (vatPayable > 0) {
      if (cumulativeCredit > 0) {
        const offset = Math.min(vatPayable, cumulativeCredit);
        cumulativeCredit -= offset;
        netPayable = vatPayable - offset;
      } else {
        netPayable = vatPayable;
      }
    }

    return {
      month: monthName,
      monthIndex: index + 1,
      isLocked: index < 6,
      taxablePurchase: Number(taxablePurchase.toFixed(2)),
      purchaseVat: Number(purchaseVat.toFixed(2)),
      taxableSalesNet: Number(taxableSalesNet.toFixed(2)),
      salesVatNet: Number(salesVatNet.toFixed(2)),
      vatPayable: Number(vatPayable.toFixed(2)),
      drCrAdjustment: drCrAdjustment ? Number(drCrAdjustment.toFixed(2)) : undefined,
      netPayable: netPayable > 0 ? Number(netPayable.toFixed(2)) : undefined,
    };
  });
}

/**
 * Dynamically computes Above 1 Lakh (or custom threshold) transactions from real sales and purchases
 */
export function calculateDynamicHighValueRecords(
  sales: SalesRecord[],
  purchases: PurchaseRecord[],
  threshold = 100000
): HighValueRecord[] {
  const highValueList: HighValueRecord[] = [];
  let sn = 1;

  // 1. Process Purchases
  purchases.forEach((p) => {
    if (p.taxableAmount >= threshold) {
      const monthName = getNepaliMonthFromRecord(p.month, p.nepaliDate, p.date);
      highValueList.push({
        id: `hv-p-${p.id}`,
        sn: sn++,
        dateMonth: p.nepaliDate || monthName,
        billNo: p.chalanNo || p.nocInvoiceNo || 'NOC Chalan',
        pan: p.pan || '300047060',
        taxPayerName: p.supplier || 'Nepal Oil Corporation',
        tradeNameType: 'E',
        type: 'Purchase',
        taxableAmount: Number(p.taxableAmount.toFixed(2)),
        exemptedAmount: 0.00,
        nonTaxableAmount: 0.00,
      });
    }
  });

  // 2. Process Sales
  sales.forEach((s) => {
    if (!s.isCreditNote && s.taxableAmount >= threshold) {
      const monthName = getNepaliMonthFromRecord(undefined, s.nepaliDate, s.date);
      highValueList.push({
        id: `hv-s-${s.id}`,
        sn: sn++,
        dateMonth: s.nepaliDate || monthName,
        billNo: s.billNo,
        pan: s.customerPan && s.customerPan.trim() ? s.customerPan.trim() : 'N/A',
        taxPayerName: s.customer,
        tradeNameType: 'E',
        type: 'Sale',
        taxableAmount: Number(s.taxableAmount.toFixed(2)),
        exemptedAmount: 0.00,
        nonTaxableAmount: 0.00,
      });
    }
  });

  return highValueList;
}
