/**
 * OC-PAY-2 & OC-PAY-3: Payroll Calculations
 * 
 * Spreadsheet-parity formula:
 * net = (miles × rate) + total_dollars + credits − gas − deductions
 * 
 * Where deductions includes tolls and other deductions
 */

export interface PayrollInput {
  miles: number;
  ratePerMile: number;
  totalDollars: number;  // MAT/bonus bucket in cents
  credits: number;       // in cents
  gas: number;           // in cents
  deductions: number;    // in cents (includes tolls + other)
}

export interface PayrollResult {
  grossPay: number;      // in cents
  netPay: number;        // in cents
  breakdown: {
    milesEarnings: number;
    totalDollars: number;
    credits: number;
    gas: number;
    deductions: number;
  };
}

/**
 * Calculate net pay using the spreadsheet-parity formula
 * net = (miles × rate) + total_dollars + credits − gas − deductions
 */
export function calculateNetPay(input: PayrollInput): number {
  const milesEarnings = Math.round(input.miles * input.ratePerMile * 100); // Convert to cents
  const netPay = milesEarnings + input.totalDollars + input.credits - input.gas - input.deductions;
  return netPay;
}

/**
 * Calculate full payroll breakdown
 */
export function calculatePayroll(input: PayrollInput): PayrollResult {
  const milesEarnings = Math.round(input.miles * input.ratePerMile * 100);
  const grossPay = milesEarnings + input.totalDollars;
  const netPay = grossPay + input.credits - input.gas - input.deductions;
  
  return {
    grossPay,
    netPay,
    breakdown: {
      milesEarnings,
      totalDollars: input.totalDollars,
      credits: input.credits,
      gas: input.gas,
      deductions: input.deductions,
    },
  };
}

/**
 * Export payroll data to CSV format
 */
export interface PayrollExportRow {
  driverName: string;
  driverId: string;
  trips: number;
  miles: number;
  ratePerMile: number;
  totalDollars: number;  // in cents
  credits: number;       // in cents
  gas: number;           // in cents
  tolls: number;         // in cents
  otherDeductions: number; // in cents
}

export function exportPayrollToCSV(data: PayrollExportRow[]): string {
  const headers = [
    'Driver Name',
    'Driver ID',
    'Trips',
    'Miles',
    'Rate/Mile',
    'Gross ($)',
    'Total Dollars ($)',
    'Credits ($)',
    'Gas ($)',
    'Tolls ($)',
    'Other Deductions ($)',
    'Total Deductions ($)',
    'Net Pay ($)',
  ];

  const rows = data.map(row => {
    const grossPay = (row.miles * row.ratePerMile) + (row.totalDollars / 100);
    const totalDeductions = (row.gas + row.tolls + row.otherDeductions) / 100;
    const netPay = grossPay + (row.credits / 100) - totalDeductions;

    return [
      row.driverName,
      row.driverId,
      row.trips.toString(),
      row.miles.toFixed(1),
      row.ratePerMile.toFixed(2),
      grossPay.toFixed(2),
      (row.totalDollars / 100).toFixed(2),
      (row.credits / 100).toFixed(2),
      (row.gas / 100).toFixed(2),
      (row.tolls / 100).toFixed(2),
      (row.otherDeductions / 100).toFixed(2),
      totalDeductions.toFixed(2),
      netPay.toFixed(2),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Auto-suggest deductions from tickets/tolls
 */
export interface TicketTollSuggestion {
  type: 'ticket' | 'toll';
  amount: number;  // in cents
  description: string;
  date: string;
  sourceRef: string;
}

export function suggestDeductionsFromTicketsTolls(
  driverId: number,
  payPeriodStart: string,
  payPeriodEnd: string,
  ticketsTolls: TicketTollSuggestion[]
): { totalSuggested: number; items: TicketTollSuggestion[] } {
  // Filter tickets/tolls for this driver and pay period
  const relevantItems = ticketsTolls.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= new Date(payPeriodStart) && itemDate <= new Date(payPeriodEnd);
  });

  const totalSuggested = relevantItems.reduce((sum, item) => sum + item.amount, 0);

  return {
    totalSuggested,
    items: relevantItems,
  };
}

/**
 * Validate payroll data before processing
 */
export interface PayrollValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validatePayrollData(input: PayrollInput): PayrollValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (input.miles < 0) {
    errors.push('Miles cannot be negative');
  }

  if (input.ratePerMile <= 0) {
    errors.push('Rate per mile must be positive');
  }

  if (input.gas < 0 || input.deductions < 0 || input.credits < 0) {
    errors.push('Amounts cannot be negative');
  }

  const netPay = calculateNetPay(input);
  if (netPay < 0) {
    warnings.push('Net pay is negative - driver owes money');
  }

  if (input.miles === 0 && (input.gas > 0 || input.deductions > 0)) {
    warnings.push('Zero miles but has gas/deductions - verify this is correct');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
