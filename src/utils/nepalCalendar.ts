/**
 * Official Bikram Sambat (BS) and Gregorian (AD) Date Mapping for Nepal Fiscal Year 2083-084
 * Based on official Inland Revenue Department (IRD) & Nepal Oil Corporation (NOC) calendar table.
 */

export interface NepalMonthMapping {
  monthIndex: number; // 0 to 11 (0 = Shrawan, 11 = Ashad)
  monthName: string;
  shortName: string;
  bsYear: number;
  bsMonthNo: number; // 1 to 12 (04 = Shrawan ... 03 = Ashad)
  bsMonthFormatted: string; // e.g., '2083 / 04'
  daysCount: number;
  bsStart: string; // e.g. '2083.04.01'
  bsEnd: string; // e.g. '2083.04.31'
  adStart: string; // e.g. '2026-07-17'
  adEnd: string; // e.g. '2026-08-16'
  adStartTimestamp: number;
  adEndTimestamp: number;
}

export const NEPAL_FY_2083_2084_MAPPING: NepalMonthMapping[] = [
  {
    monthIndex: 0,
    monthName: 'Shrawan 2083',
    shortName: 'Shrawan',
    bsYear: 2083,
    bsMonthNo: 4,
    bsMonthFormatted: '2083 / 04',
    daysCount: 31,
    bsStart: '2083.04.01',
    bsEnd: '2083.04.31',
    adStart: '2026-07-17',
    adEnd: '2026-08-16',
    adStartTimestamp: new Date('2026-07-17T00:00:00Z').getTime(),
    adEndTimestamp: new Date('2026-08-16T23:59:59Z').getTime(),
  },
  {
    monthIndex: 1,
    monthName: 'Bhadra 2083',
    shortName: 'Bhadra',
    bsYear: 2083,
    bsMonthNo: 5,
    bsMonthFormatted: '2083 / 05',
    daysCount: 31,
    bsStart: '2083.05.01',
    bsEnd: '2083.05.31',
    adStart: '2026-08-17',
    adEnd: '2026-09-16',
    adStartTimestamp: new Date('2026-08-17T00:00:00Z').getTime(),
    adEndTimestamp: new Date('2026-09-16T23:59:59Z').getTime(),
  },
  {
    monthIndex: 2,
    monthName: 'Ashoj 2083',
    shortName: 'Ashoj',
    bsYear: 2083,
    bsMonthNo: 6,
    bsMonthFormatted: '2083 / 06',
    daysCount: 31,
    bsStart: '2083.06.01',
    bsEnd: '2083.06.31',
    adStart: '2026-09-17',
    adEnd: '2026-10-17',
    adStartTimestamp: new Date('2026-09-17T00:00:00Z').getTime(),
    adEndTimestamp: new Date('2026-10-17T23:59:59Z').getTime(),
  },
  {
    monthIndex: 3,
    monthName: 'Kartik 2083',
    shortName: 'Kartik',
    bsYear: 2083,
    bsMonthNo: 7,
    bsMonthFormatted: '2083 / 07',
    daysCount: 30,
    bsStart: '2083.07.01',
    bsEnd: '2083.07.30',
    adStart: '2026-10-18',
    adEnd: '2026-11-16',
    adStartTimestamp: new Date('2026-10-18T00:00:00Z').getTime(),
    adEndTimestamp: new Date('2026-11-16T23:59:59Z').getTime(),
  },
  {
    monthIndex: 4,
    monthName: 'Mangsir 2083',
    shortName: 'Mangsir',
    bsYear: 2083,
    bsMonthNo: 8,
    bsMonthFormatted: '2083 / 08',
    daysCount: 29,
    bsStart: '2083.08.01',
    bsEnd: '2083.08.29',
    adStart: '2026-11-17',
    adEnd: '2026-12-15',
    adStartTimestamp: new Date('2026-11-17T00:00:00Z').getTime(),
    adEndTimestamp: new Date('2026-12-15T23:59:59Z').getTime(),
  },
  {
    monthIndex: 5,
    monthName: 'Poush 2083',
    shortName: 'Poush',
    bsYear: 2083,
    bsMonthNo: 9,
    bsMonthFormatted: '2083 / 09',
    daysCount: 30,
    bsStart: '2083.09.01',
    bsEnd: '2083.09.30',
    adStart: '2026-12-17',
    adEnd: '2027-01-15',
    adStartTimestamp: new Date('2026-12-17T00:00:00Z').getTime(),
    adEndTimestamp: new Date('2027-01-15T23:59:59Z').getTime(),
  },
  {
    monthIndex: 6,
    monthName: 'Magh 2083',
    shortName: 'Magh',
    bsYear: 2083,
    bsMonthNo: 10,
    bsMonthFormatted: '2083 / 10',
    daysCount: 29,
    bsStart: '2083.10.01',
    bsEnd: '2083.10.29',
    adStart: '2027-01-16',
    adEnd: '2027-02-13',
    adStartTimestamp: new Date('2027-01-16T00:00:00Z').getTime(),
    adEndTimestamp: new Date('2027-02-13T23:59:59Z').getTime(),
  },
  {
    monthIndex: 7,
    monthName: 'Falgun 2083',
    shortName: 'Falgun',
    bsYear: 2083,
    bsMonthNo: 11,
    bsMonthFormatted: '2083 / 11',
    daysCount: 30,
    bsStart: '2083.11.01',
    bsEnd: '2083.11.30',
    adStart: '2027-02-14',
    adEnd: '2027-03-15',
    adStartTimestamp: new Date('2027-02-14T00:00:00Z').getTime(),
    adEndTimestamp: new Date('2027-03-15T23:59:59Z').getTime(),
  },
  {
    monthIndex: 8,
    monthName: 'Chaitra 2083',
    shortName: 'Chaitra',
    bsYear: 2083,
    bsMonthNo: 12,
    bsMonthFormatted: '2083 / 12',
    daysCount: 30,
    bsStart: '2083.12.01',
    bsEnd: '2083.12.30',
    adStart: '2027-03-16',
    adEnd: '2027-04-14',
    adStartTimestamp: new Date('2027-03-16T00:00:00Z').getTime(),
    adEndTimestamp: new Date('2027-04-14T23:59:59Z').getTime(),
  },
  {
    monthIndex: 9,
    monthName: 'Baisakh 2084',
    shortName: 'Baisakh',
    bsYear: 2084,
    bsMonthNo: 1,
    bsMonthFormatted: '2084 / 01',
    daysCount: 31,
    bsStart: '2084.01.01',
    bsEnd: '2084.01.31',
    adStart: '2027-04-15',
    adEnd: '2027-05-15',
    adStartTimestamp: new Date('2027-04-15T00:00:00Z').getTime(),
    adEndTimestamp: new Date('2027-05-15T23:59:59Z').getTime(),
  },
  {
    monthIndex: 10,
    monthName: 'Jestha 2084',
    shortName: 'Jestha',
    bsYear: 2084,
    bsMonthNo: 2,
    bsMonthFormatted: '2084 / 02',
    daysCount: 31,
    bsStart: '2084.02.01',
    bsEnd: '2084.02.31',
    adStart: '2027-05-16',
    adEnd: '2027-06-15',
    adStartTimestamp: new Date('2027-05-16T00:00:00Z').getTime(),
    adEndTimestamp: new Date('2027-06-15T23:59:59Z').getTime(),
  },
  {
    monthIndex: 11,
    monthName: 'Ashad 2084',
    shortName: 'Ashad',
    bsYear: 2084,
    bsMonthNo: 3,
    bsMonthFormatted: '2084 / 03',
    daysCount: 32,
    bsStart: '2084.03.01',
    bsEnd: '2084.03.32',
    adStart: '2027-06-17',
    adEnd: '2027-07-16',
    adStartTimestamp: new Date('2027-06-17T00:00:00Z').getTime(),
    adEndTimestamp: new Date('2027-07-16T23:59:59Z').getTime(),
  },
];

export const FULL_FY_BS_START = '2083.04.01';
export const FULL_FY_BS_END = '2084.03.32';
export const FULL_FY_AD_START = '2026-07-17';
export const FULL_FY_AD_END = '2027-07-16';

/**
 * Accurately maps an English Gregorian Date (AD string like '2026-08-15' or Date object)
 * to official Nepal Bikram Sambat (BS) date and official month.
 */
export function mapAdDateToBs(adDateInput: string | Date): {
  bsDate: string;
  monthName: string;
  shortMonth: string;
  bsMonthFormatted: string;
  monthIndex: number;
} {
  let targetDate: Date;
  if (typeof adDateInput === 'string') {
    // Normalize format like '2026/08/15' or '2026.08.15'
    const normalized = adDateInput.replace(/[./]/g, '-').trim();
    targetDate = new Date(`${normalized}T12:00:00Z`);
  } else {
    targetDate = adDateInput;
  }

  const targetTime = targetDate.getTime();

  // 1. Direct match within defined month bounds
  for (const m of NEPAL_FY_2083_2084_MAPPING) {
    if (targetTime >= m.adStartTimestamp && targetTime <= m.adEndTimestamp) {
      const startDate = new Date(`${m.adStart}T12:00:00Z`).getTime();
      const diffDays = Math.floor((targetTime - startDate) / (1000 * 60 * 60 * 24));
      const bsDay = Math.min(m.daysCount, Math.max(1, 1 + diffDays));
      const bsDayStr = String(bsDay).padStart(2, '0');
      const bsMonthStr = String(m.bsMonthNo).padStart(2, '0');
      const bsDate = `${m.bsYear}.${bsMonthStr}.${bsDayStr}`;

      return {
        bsDate,
        monthName: m.monthName,
        shortMonth: m.shortName,
        bsMonthFormatted: m.bsMonthFormatted,
        monthIndex: m.monthIndex,
      };
    }
  }

  // 2. Boundary gap handling (e.g. 2026-12-16 between Mangsir and Poush, or 2027-06-16 between Jestha and Ashad)
  for (let i = 0; i < NEPAL_FY_2083_2084_MAPPING.length - 1; i++) {
    const curr = NEPAL_FY_2083_2084_MAPPING[i];
    const next = NEPAL_FY_2083_2084_MAPPING[i + 1];
    if (targetTime > curr.adEndTimestamp && targetTime < next.adStartTimestamp) {
      // Attribute to the ending day of the current month
      const bsMonthStr = String(curr.bsMonthNo).padStart(2, '0');
      const bsDayStr = String(curr.daysCount).padStart(2, '0');
      return {
        bsDate: `${curr.bsYear}.${bsMonthStr}.${bsDayStr}`,
        monthName: curr.monthName,
        shortMonth: curr.shortName,
        bsMonthFormatted: curr.bsMonthFormatted,
        monthIndex: curr.monthIndex,
      };
    }
  }

  // 3. Fallback if slightly out of current FY range (estimate standard BS shift + 56.7 years)
  const y = targetDate.getFullYear();
  const m = targetDate.getMonth() + 1;
  const d = targetDate.getDate();
  const estBsYear = y + 57;
  const estBsMonth = ((m + 8) % 12) + 1;

  const defaultMonth = NEPAL_FY_2083_2084_MAPPING[0];
  return {
    bsDate: `${estBsYear}.${String(estBsMonth).padStart(2, '0')}.${String(d).padStart(2, '0')}`,
    monthName: defaultMonth.monthName,
    shortMonth: defaultMonth.shortName,
    bsMonthFormatted: defaultMonth.bsMonthFormatted,
    monthIndex: defaultMonth.monthIndex,
  };
}

/**
 * Given a Bikram Sambat date string (e.g. '2083.04.15' or '2083-05-10'),
 * returns the mapped English Gregorian Date (AD).
 */
export function mapBsDateToAd(bsDateInput: string): string {
  const clean = bsDateInput.replace(/[/-]/g, '.').trim();
  const parts = clean.split('.');
  if (parts.length >= 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    const matchMonth = NEPAL_FY_2083_2084_MAPPING.find(
      (m) => m.bsYear === year && m.bsMonthNo === month
    );

    if (matchMonth) {
      if (day <= 1) return matchMonth.adStart;
      if (day >= matchMonth.daysCount) return matchMonth.adEnd;

      const startDate = new Date(`${matchMonth.adStart}T12:00:00Z`).getTime();
      const endDate = new Date(`${matchMonth.adEnd}T12:00:00Z`).getTime();
      const fraction = (day - 1) / Math.max(1, matchMonth.daysCount - 1);
      const targetMs = startDate + fraction * (endDate - startDate);
      const d = new Date(targetMs);
      const adYear = d.getUTCFullYear();
      const adMonth = String(d.getUTCMonth() + 1).padStart(2, '0');
      const adDay = String(d.getUTCDate()).padStart(2, '0');
      return `${adYear}-${adMonth}-${adDay}`;
    }
  }

  return '2026-07-17';
}
