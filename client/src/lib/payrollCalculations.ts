/**
 * OC-PAY-2: Payroll Calculation Utilities
 * 
 * This module implements the spreadsheet parity formula for calculating driver net pay:
 * net = (miles * rate) + total_dollars + credits - gas - deductions
 */

export interface PayrollAdjustment {
  id: number;
  adjustmentType: "gas" | "credit" | "advance" | "deduction";
  amount: number; // in cents
  isApproved: boolean;
}

export interface DriverPayrollData {
  miles: number;
  ratePerMile: number; // in cents (e.g., 150 = $1.50)
  totalDollars?: number; // additional flat amounts in cents
  adjustments: PayrollAdjustment[];
}

export interface PayrollCalculationResult {
  grossPay: number; // in cents
  gas: number; // in cents
  credits: number; // in cents
  deductions: number; // in cents
  totalAdjustments: number; // in cents (credits - gas - deductions)
  netPay: number; // in cents
  hasExceptions: boolean;
  exceptions: string[];
}

/**
 * Calculate net pay using the spreadsheet formula:
 * net = (miles * rate) + total_dollars + credits - gas - deductions
 * 
 * @param data - Driver payroll data including miles, rate, and adjustments
 * @returns Calculation result with gross, net, and breakdown
 */
export function calculateNetPay(data: DriverPayrollData): PayrollCalculationResult {
  const { miles, ratePerMile, totalDollars = 0, adjustments } = data;

  // Calculate gross pay from miles
  const grossFromMiles = Math.round(miles * ratePerMile);
  const grossPay = grossFromMiles + totalDollars;

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

  // Calculate net pay using spreadsheet formula
  const netPay = grossPay + totalAdjustments;

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
    gas,
    credits,
    deductions,
    totalAdjustments,
    netPay,
    hasExceptions: exceptions.length > 0,
    exceptions,
  };
}

/**
 * Format cents to dollar string
 * @param cents - Amount in cents
 * @returns Formatted dollar string (e.g., "$1,234.56")
 */
export function formatCurrency(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(dollars);
}

/**
 * Parse dollar string to cents
 * @param dollarString - Dollar string (e.g., "$1,234.56" or "1234.56")
 * @returns Amount in cents
 */
export function parseCurrency(dollarString: string): number {
  const cleaned = dollarString.replace(/[$,]/g, "");
  const dollars = parseFloat(cleaned);
  if (isNaN(dollars)) return 0;
  return Math.round(dollars * 100);
}

/**
 * Calculate suggested deduction amount from tickets/tolls
 * @param tickets - Array of ticket/toll records
 * @returns Total suggested deduction in cents
 */
export function calculateSuggestedDeductions(
  tickets: Array<{ amount: number; status: string }>
): number {
  return tickets
    .filter(t => t.status === "pending")
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Validate payroll data before submission
 * @param data - Driver payroll data
 * @returns Validation result with errors if any
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

/**
 * Generate CSV row for payroll export
 * @param driver - Driver payment data
 * @param calculation - Calculation result
 * @returns CSV row as array of strings
 */
export function generateCsvRow(
  driver: {
    name: string;
    driverId: string;
    trips: number;
    miles: number;
  },
  calculation: PayrollCalculationResult
): string[] {
  return [
    driver.name,
    driver.driverId,
    driver.trips.toString(),
    driver.miles.toString(),
    (calculation.grossPay / 100).toFixed(2),
    (calculation.gas / 100).toFixed(2),
    (calculation.credits / 100).toFixed(2),
    (calculation.deductions / 100).toFixed(2),
    (calculation.netPay / 100).toFixed(2),
  ];
}

/**
 * OC-PAY-2 Acceptance Criteria:
 * Export payroll CSV includes: driver, trips, miles, gross, deductions, net.
 * 
 * Generate full CSV content for payroll export with all required fields
 * @param payments - Array of driver payments with calculations
 * @param periodInfo - Pay period information
 * @returns CSV content as string
 */
export function generatePayrollCsv(
  payments: Array<{
    driver: {
      name: string;
      driverId: string;
      trips: number;
      miles: number;
      ratePerMile?: number;
    };
    calculation: PayrollCalculationResult;
    status: string;
  }>,
  periodInfo?: {
    periodStart: string;
    periodEnd: string;
    payDate: string;
  }
): string {
  // CSV Headers as per acceptance criteria
  const headers = [
    "Driver Name",
    "Driver ID",
    "Trips",
    "Miles",
    "Rate/Mile",
    "Gross Pay",
    "Gas",
    "Credits",
    "Deductions",
    "Net Pay",
    "Status",
  ];

  const rows = payments.map(({ driver, calculation, status }) => [
    // Escape driver name if it contains commas
    driver.name.includes(",") ? `"${driver.name}"` : driver.name,
    driver.driverId,
    driver.trips.toString(),
    driver.miles.toFixed(2),
    driver.ratePerMile ? (driver.ratePerMile / 100).toFixed(2) : "1.50",
    (calculation.grossPay / 100).toFixed(2),
    (calculation.gas / 100).toFixed(2),
    (calculation.credits / 100).toFixed(2),
    (calculation.deductions / 100).toFixed(2),
    (calculation.netPay / 100).toFixed(2),
    status,
  ]);

  // Build CSV with optional period header
  const csvLines: string[] = [];
  
  if (periodInfo) {
    csvLines.push(`# Payroll Export`);
    csvLines.push(`# Period: ${periodInfo.periodStart} to ${periodInfo.periodEnd}`);
    csvLines.push(`# Pay Date: ${periodInfo.payDate}`);
    csvLines.push(`# Generated: ${new Date().toISOString()}`);
    csvLines.push("");
  }
  
  csvLines.push(headers.join(","));
  csvLines.push(...rows.map(row => row.join(",")));
  
  // Add summary row
  const summary = calculatePayrollSummary(payments.map(p => p.calculation));
  csvLines.push("");
  csvLines.push(`# Summary`);
  csvLines.push(`# Total Drivers: ${payments.length}`);
  csvLines.push(`# Total Gross: $${(summary.totalGross / 100).toFixed(2)}`);
  csvLines.push(`# Total Deductions: $${(summary.totalDeductions / 100).toFixed(2)}`);
  csvLines.push(`# Total Net: $${(summary.totalNet / 100).toFixed(2)}`);
  csvLines.push(`# Exceptions: ${summary.exceptionsCount}`);

  return csvLines.join("\n");
}

/**
 * Generate a downloadable CSV file
 * @param csvContent - CSV content string
 * @param filename - Filename for download
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

/**
 * Calculate payroll summary statistics
 * @param payments - Array of payment calculations
 * @returns Summary statistics
 */
export function calculatePayrollSummary(
  payments: PayrollCalculationResult[]
): {
  totalGross: number;
  totalGas: number;
  totalCredits: number;
  totalDeductions: number;
  totalNet: number;
  averageNet: number;
  exceptionsCount: number;
} {
  const summary = payments.reduce(
    (acc, p) => ({
      totalGross: acc.totalGross + p.grossPay,
      totalGas: acc.totalGas + p.gas,
      totalCredits: acc.totalCredits + p.credits,
      totalDeductions: acc.totalDeductions + p.deductions,
      totalNet: acc.totalNet + p.netPay,
      exceptionsCount: acc.exceptionsCount + (p.hasExceptions ? 1 : 0),
    }),
    {
      totalGross: 0,
      totalGas: 0,
      totalCredits: 0,
      totalDeductions: 0,
      totalNet: 0,
      exceptionsCount: 0,
    }
  );

  return {
    ...summary,
    averageNet: payments.length > 0 ? summary.totalNet / payments.length : 0,
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
 * 
 * Get suggested deductions from tickets/tolls for a driver in a pay period
 * @param tickets - Array of ticket/toll records
 * @param periodStart - Pay period start date
 * @param periodEnd - Pay period end date
 * @param existingAdjustmentSourceIds - Set of ticket IDs already added as adjustments
 * @returns Array of suggested deductions
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
 * @param suggestions - Array of suggested deductions
 * @returns Total amount in cents
 */
export function calculateTotalSuggestedDeductions(
  suggestions: SuggestedDeduction[]
): number {
  return suggestions.reduce((sum, s) => sum + s.amount, 0);
}

/**
 * Format ticket type for display
 * @param type - Ticket type
 * @returns Formatted display string
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

/**
 * Check if a driver has pending tickets that should be deducted
 * @param tickets - Array of ticket/toll records
 * @param driverId - Driver ID
 * @param periodStart - Pay period start date
 * @param periodEnd - Pay period end date
 * @returns Boolean indicating if there are pending deductions
 */
export function hasPendingDeductions(
  tickets: TicketToll[],
  driverId: number,
  periodStart: Date,
  periodEnd: Date
): boolean {
  return tickets.some(ticket => {
    if (ticket.driverId !== driverId) return false;
    if (ticket.status !== "pending") return false;
    
    const issueDate = new Date(ticket.issueDate);
    return issueDate >= periodStart && issueDate <= periodEnd;
  });
}

/**
 * Group tickets by type for summary display
 * @param tickets - Array of ticket/toll records
 * @returns Object with counts and totals by type
 */
export function groupTicketsByType(
  tickets: TicketToll[]
): Record<string, { count: number; total: number }> {
  return tickets.reduce((acc, ticket) => {
    const type = ticket.ticketType;
    if (!acc[type]) {
      acc[type] = { count: 0, total: 0 };
    }
    acc[type].count++;
    acc[type].total += ticket.amount;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);
}
