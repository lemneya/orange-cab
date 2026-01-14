/**
 * OC-PAY-2: Payroll Calculation Utilities
 * 
 * STANDARDIZED FORMULA (Spreadsheet Parity):
 * net = (miles * rate) + total_dollars + credits - gas - deductions
 * 
 * Where:
 * - miles * rate = gross pay from mileage
 * - total_dollars = MAT/bonus bucket (flat amounts)
 * - credits = advances, bonuses applied
 * - gas = gas expenses deducted
 * - deductions = tickets, tolls, other deductions
 */

// ============ CORE INTERFACES ============

export interface PayrollAdjustment {
  id: number;
  adjustmentType: "gas" | "credit" | "advance" | "deduction";
  amount: number; // in cents
  isApproved: boolean;
}

export interface DriverPayrollData {
  miles: number;
  ratePerMile: number; // in cents (e.g., 150 = $1.50)
  totalDollars?: number; // MAT/bonus bucket in cents
  adjustments: PayrollAdjustment[];
}

export interface PayrollCalculationResult {
  grossPay: number; // in cents (miles * rate)
  totalDollars: number; // in cents (MAT/bonus)
  gas: number; // in cents
  credits: number; // in cents
  deductions: number; // in cents
  totalAdjustments: number; // in cents (credits - gas - deductions)
  netPay: number; // in cents
  hasExceptions: boolean;
  exceptions: string[];
}

// ============ SIMPLE CALCULATION INTERFACE (for tests) ============

export interface SimplePayrollInput {
  miles: number;
  ratePerMile: number; // in dollars (e.g., 1.50)
  totalDollars?: number; // in dollars
  credits?: number; // in dollars
  gas?: number; // in dollars
  deductions?: number; // in dollars
}

export interface SimplePayrollResult {
  gross: number; // in dollars (miles * rate)
  net: number; // in dollars
}

/**
 * Simple calculation function for testing and direct use
 * Uses the STANDARDIZED FORMULA:
 * net = (miles * rate) + total_dollars + credits - gas - deductions
 */
export function calculateNetPay(input: SimplePayrollInput): SimplePayrollResult {
  const {
    miles,
    ratePerMile,
    totalDollars = 0,
    credits = 0,
    gas = 0,
    deductions = 0,
  } = input;

  // Gross = miles * rate
  const gross = miles * ratePerMile;
  
  // Net = gross + total_dollars + credits - gas - deductions
  const net = gross + totalDollars + credits - gas - deductions;

  return { gross, net };
}

// ============ FULL CALCULATION (with adjustments array) ============

/**
 * Full calculation with adjustment breakdown
 * Uses the STANDARDIZED FORMULA:
 * net = (miles * rate) + total_dollars + credits - gas - deductions
 */
export function calculateFullPayroll(data: DriverPayrollData): PayrollCalculationResult {
  const { miles, ratePerMile, totalDollars = 0, adjustments } = data;

  // Calculate gross pay from miles (in cents)
  const grossPay = Math.round(miles * ratePerMile);

  // Sum up adjustments by type (only approved ones)
  let gas = 0;
  let credits = 0;
  let deductions = 0;

  for (const adj of adjustments) {
    if (!adj.isApproved) continue;

    switch (adj.adjustmentType) {
      case "gas":
        gas += adj.amount;
        break;
      case "credit":
      case "advance":
        credits += adj.amount;
        break;
      case "deduction":
        deductions += adj.amount;
        break;
    }
  }

  // Calculate total adjustments (positive = adds to pay, negative = subtracts)
  const totalAdjustments = credits - gas - deductions;

  // Calculate net pay using STANDARDIZED FORMULA:
  // net = (miles * rate) + total_dollars + credits - gas - deductions
  const netPay = grossPay + totalDollars + totalAdjustments;

  // Check for exceptions
  const exceptions: string[] = [];
  
  if (netPay < 0) {
    exceptions.push("Negative net pay");
  }
  
  if (miles === 0) {
    exceptions.push("No miles recorded");
  }
  
  if (grossPay > 0 && deductions > grossPay * 0.5) {
    const deductionPercent = ((deductions / grossPay) * 100).toFixed(1);
    exceptions.push(`High deductions (${deductionPercent}% of gross)`);
  }

  if (gas > grossPay * 0.3) {
    const gasPercent = ((gas / grossPay) * 100).toFixed(1);
    exceptions.push(`High gas expense (${gasPercent}% of gross)`);
  }

  return {
    grossPay,
    totalDollars,
    gas,
    credits,
    deductions,
    totalAdjustments,
    netPay,
    hasExceptions: exceptions.length > 0,
    exceptions,
  };
}

// ============ CURRENCY FORMATTING ============

/**
 * Format cents to dollar string
 * @param cents - Amount in cents
 * @returns Formatted dollar string (e.g., "$1,234.56")
 */
export function formatCurrencyCents(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(dollars);
}

/**
 * Format dollars to string (for simple interface)
 * @param dollars - Amount in dollars
 * @returns Formatted dollar string (e.g., "$1,234.56")
 */
export function formatCurrency(dollars: number): string {
  if (dollars < 0) {
    return `-$${Math.abs(dollars).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${dollars.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Parse dollar string to number
 * @param dollarString - Dollar string (e.g., "$1,234.56" or "1234.56")
 * @returns Amount in dollars
 */
export function parseCurrency(dollarString: string): number {
  if (!dollarString || dollarString.trim() === "") return 0;
  const cleaned = dollarString.replace(/[$,]/g, "");
  const dollars = parseFloat(cleaned);
  if (isNaN(dollars)) return 0;
  return dollars;
}

/**
 * Parse dollar string to cents
 * @param dollarString - Dollar string (e.g., "$1,234.56" or "1234.56")
 * @returns Amount in cents
 */
export function parseCurrencyToCents(dollarString: string): number {
  return Math.round(parseCurrency(dollarString) * 100);
}

// ============ CSV EXPORT ============

export interface DriverForCsv {
  id: number;
  name: string;
  driverId: string;
  trips: number;
  miles: number;
  rate: number; // in dollars
  totalDollars: number; // in dollars (MAT/bonus)
  gas: number; // in dollars
  credits: number; // in dollars
  deductions: number; // in dollars
}

/**
 * OC-PAY-2 Acceptance Criteria:
 * Export payroll CSV includes: driver, trips, miles, gross, deductions, net.
 * 
 * Generate full CSV content for payroll export with all required fields
 * Including Total$/MAT column for spreadsheet parity
 */
export function generatePayrollCsv(drivers: DriverForCsv[], weekEnding: string): string {
  // CSV Headers - includes Total$/MAT for spreadsheet parity
  const headers = [
    "Driver Name",
    "Driver ID",
    "Trips",
    "Miles",
    "Rate/Mile",
    "Gross",
    "Total$/MAT",
    "Gas",
    "Credits",
    "Deductions",
    "Net",
  ];

  const rows = drivers.map(driver => {
    const { gross, net } = calculateNetPay({
      miles: driver.miles,
      ratePerMile: driver.rate,
      totalDollars: driver.totalDollars,
      credits: driver.credits,
      gas: driver.gas,
      deductions: driver.deductions,
    });

    return [
      driver.name.includes(",") ? `"${driver.name}"` : driver.name,
      driver.driverId,
      driver.trips.toString(),
      driver.miles.toFixed(2),
      driver.rate.toFixed(2),
      gross.toFixed(2),
      driver.totalDollars.toFixed(2),
      driver.gas.toFixed(2),
      driver.credits.toFixed(2),
      driver.deductions.toFixed(2),
      net.toFixed(2),
    ];
  });

  // Build CSV
  const csvLines: string[] = [];
  csvLines.push(`# Orange Cab Payroll Export`);
  csvLines.push(`# Week Ending: ${weekEnding}`);
  csvLines.push(`# Generated: ${new Date().toISOString()}`);
  csvLines.push(`# Formula: Net = (Miles × Rate) + Total$/MAT + Credits − Gas − Deductions`);
  csvLines.push("");
  csvLines.push(headers.join(","));
  csvLines.push(...rows.map(row => row.join(",")));

  // Add summary
  const summary = calculatePayrollSummary(drivers.map(d => ({
    net: calculateNetPay({
      miles: d.miles,
      ratePerMile: d.rate,
      totalDollars: d.totalDollars,
      credits: d.credits,
      gas: d.gas,
      deductions: d.deductions,
    }).net,
    status: "pending",
    hasException: false,
  })));

  csvLines.push("");
  csvLines.push(`# Summary`);
  csvLines.push(`# Total Drivers: ${drivers.length}`);
  csvLines.push(`# Total Payout: $${summary.totalPayout.toFixed(2)}`);

  return csvLines.join("\n");
}

/**
 * Generate a downloadable CSV file
 */
export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============ PAYROLL SUMMARY ============

export interface PayrollSummaryInput {
  net: number;
  status: string;
  hasException: boolean;
}

export interface PayrollSummary {
  totalDrivers: number;
  totalPayout: number;
  pendingCount: number;
  exceptionsCount: number;
}

/**
 * Calculate payroll summary statistics
 */
export function calculatePayrollSummary(drivers: PayrollSummaryInput[]): PayrollSummary {
  return {
    totalDrivers: drivers.length,
    totalPayout: drivers.reduce((sum, d) => sum + d.net, 0),
    pendingCount: drivers.filter(d => d.status === "pending").length,
    exceptionsCount: drivers.filter(d => d.hasException).length,
  };
}

// ============ AUTO-SUGGEST DEDUCTIONS FROM TICKETS/TOLLS ============

export interface TicketToll {
  id: number;
  ticketType: "toll" | "parking" | "traffic" | "other";
  ticketNumber: string | null;
  amount: number; // in cents
  issueDate: string;
  dueDate: string | null;
  status: "pending" | "paid" | "disputed" | "waived";
  vehicleId: number | null;
  driverId: number | null;
}

export interface SuggestedDeduction {
  ticketId: number;
  ticketType: string;
  ticketNumber: string;
  amount: number; // in cents
  issueDate: string;
  suggestedAdjustment: {
    adjustmentType: "deduction";
    amount: number;
    memo: string;
    sourceRef: string;
    sourceType: "ticket";
    sourceId: number;
  };
}

/**
 * OC-PAY-2 Auto-suggest feature:
 * If Tickets/Tolls exist for the driver+period → prefill deductions
 */
export function getSuggestedDeductionsFromTickets(
  tickets: TicketToll[],
  periodStart: Date,
  periodEnd: Date,
  existingAdjustmentSourceIds: Set<number> = new Set()
): SuggestedDeduction[] {
  return tickets
    .filter(ticket => {
      // Only pending tickets
      if (ticket.status !== "pending") return false;
      
      // Only tickets within the pay period
      const issueDate = new Date(ticket.issueDate);
      if (issueDate < periodStart || issueDate > periodEnd) return false;
      
      // Not already added as adjustment
      if (existingAdjustmentSourceIds.has(ticket.id)) return false;
      
      return true;
    })
    .map(ticket => ({
      ticketId: ticket.id,
      ticketType: ticket.ticketType,
      ticketNumber: ticket.ticketNumber || `${ticket.ticketType.toUpperCase()}-${ticket.id}`,
      amount: ticket.amount,
      issueDate: ticket.issueDate,
      suggestedAdjustment: {
        adjustmentType: "deduction" as const,
        amount: ticket.amount,
        memo: `${ticket.ticketType.toUpperCase()} - ${ticket.ticketNumber || `#${ticket.id}`}`,
        sourceRef: ticket.ticketNumber || `TICKET-${ticket.id}`,
        sourceType: "ticket" as const,
        sourceId: ticket.id,
      },
    }));
}

/**
 * Calculate total suggested deductions for a driver
 */
export function calculateTotalSuggestedDeductions(
  suggestions: SuggestedDeduction[]
): number {
  return suggestions.reduce((sum, s) => sum + s.amount, 0);
}

/**
 * Format ticket type for display
 */
export function formatTicketType(type: string): string {
  const typeMap: Record<string, string> = {
    toll: "Toll Violation",
    parking: "Parking Ticket",
    traffic: "Traffic Ticket",
    other: "Other",
  };
  return typeMap[type] || type;
}

// ============ VALIDATION ============

/**
 * Validate payroll data before submission
 */
export function validatePayrollData(data: DriverPayrollData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (data.miles < 0) {
    errors.push("Miles cannot be negative");
  }

  if (data.ratePerMile <= 0) {
    errors.push("Rate per mile must be positive");
  }

  for (const adj of data.adjustments) {
    if (adj.amount < 0) {
      errors.push(`Adjustment amount cannot be negative (ID: ${adj.id})`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============ EXCEPTION FLAGS ============

export interface ExceptionFlag {
  type: "missing_contract" | "zero_miles" | "unconfirmed_deduction" | "import_error" | "high_deduction" | "negative_pay";
  message: string;
  severity: "warning" | "error";
}

/**
 * Generate exception flags for a driver
 */
export function getDriverExceptionFlags(driver: {
  hasContract: boolean;
  miles: number;
  hasSuggestedDeductions: boolean;
  hasImportErrors: boolean;
  deductions: number;
  gross: number;
  net: number;
}): ExceptionFlag[] {
  const flags: ExceptionFlag[] = [];

  if (!driver.hasContract) {
    flags.push({
      type: "missing_contract",
      message: "Driver missing contract/rate",
      severity: "error",
    });
  }

  if (driver.miles === 0 && driver.gross === 0) {
    flags.push({
      type: "zero_miles",
      message: "Imported trips but 0 payable miles",
      severity: "warning",
    });
  }

  if (driver.hasSuggestedDeductions) {
    flags.push({
      type: "unconfirmed_deduction",
      message: "Deductions suggested but not confirmed",
      severity: "warning",
    });
  }

  if (driver.hasImportErrors) {
    flags.push({
      type: "import_error",
      message: "Import row errors",
      severity: "error",
    });
  }

  if (driver.gross > 0 && driver.deductions > driver.gross * 0.5) {
    flags.push({
      type: "high_deduction",
      message: `High deductions (${((driver.deductions / driver.gross) * 100).toFixed(0)}% of gross)`,
      severity: "warning",
    });
  }

  if (driver.net < 0) {
    flags.push({
      type: "negative_pay",
      message: "Negative net pay",
      severity: "error",
    });
  }

  return flags;
}
