import { describe, it, expect } from 'vitest';
import {
  calculateNetPay,
  formatCurrency,
  parseCurrency,
  generatePayrollCsv,
  calculatePayrollSummary,
  getDriverExceptionFlags,
} from '../client/src/lib/payrollCalculations';

/**
 * OC-PAY-2 Test Suite: Seed Import & Payroll Calculations
 * 
 * STANDARDIZED FORMULA (Spreadsheet Parity):
 * net = (miles * rate) + total_dollars + credits - gas - deductions
 */

describe('Payroll Calculations - Seed Import', () => {
  describe('calculateNetPay - STANDARDIZED FORMULA', () => {
    it('should calculate net pay with the correct formula: net = (miles * rate) + totalDollars + credits - gas - deductions', () => {
      // Test case: 100 miles at $1.50/mile + $50 total dollars + $25 credits - $30 gas - $20 deductions
      const result = calculateNetPay({
        miles: 100,
        ratePerMile: 1.50,
        totalDollars: 50,
        credits: 25,
        gas: 30,
        deductions: 20,
      });
      
      // Expected: (100 * 1.50) + 50 + 25 - 30 - 20 = 150 + 50 + 25 - 30 - 20 = 175
      expect(result.gross).toBe(150); // miles * rate
      expect(result.net).toBe(175);   // gross + totalDollars + credits - gas - deductions
    });

    it('should handle zero values correctly', () => {
      const result = calculateNetPay({
        miles: 0,
        ratePerMile: 1.50,
        totalDollars: 0,
        credits: 0,
        gas: 0,
        deductions: 0,
      });
      
      expect(result.gross).toBe(0);
      expect(result.net).toBe(0);
    });

    it('should handle typical driver scenario (no MAT/bonus)', () => {
      // Typical week: 720 miles at $1.50/mile, $50 gas, no credits/deductions
      const result = calculateNetPay({
        miles: 720,
        ratePerMile: 1.50,
        totalDollars: 0,
        credits: 0,
        gas: 50,
        deductions: 0,
      });
      
      // Expected: (720 * 1.50) + 0 + 0 - 50 - 0 = 1080 - 50 = 1030
      expect(result.gross).toBe(1080);
      expect(result.net).toBe(1030);
    });

    it('should handle wheelchair rate correctly', () => {
      const result = calculateNetPay({
        miles: 500,
        ratePerMile: 1.75, // wheelchair rate
        totalDollars: 0,
        credits: 0,
        gas: 40,
        deductions: 75,
      });
      
      // Expected: (500 * 1.75) + 0 + 0 - 40 - 75 = 875 - 115 = 760
      expect(result.gross).toBe(875);
      expect(result.net).toBe(760);
    });

    it('should include totalDollars (MAT/bonus) in calculation', () => {
      const result = calculateNetPay({
        miles: 600,
        ratePerMile: 1.50,
        totalDollars: 100, // MAT or bonus bucket
        credits: 50,
        gas: 25,
        deductions: 0,
      });
      
      // Expected: (600 * 1.50) + 100 + 50 - 25 - 0 = 900 + 100 + 50 - 25 = 1025
      expect(result.gross).toBe(900);
      expect(result.net).toBe(1025);
    });

    it('should handle negative net pay scenario', () => {
      const result = calculateNetPay({
        miles: 100,
        ratePerMile: 1.50,
        totalDollars: 0,
        credits: 0,
        gas: 100,
        deductions: 100,
      });
      
      // Expected: (100 * 1.50) + 0 + 0 - 100 - 100 = 150 - 200 = -50
      expect(result.gross).toBe(150);
      expect(result.net).toBe(-50);
    });

    it('should use default values when optional params are omitted', () => {
      const result = calculateNetPay({
        miles: 500,
        ratePerMile: 1.50,
      });
      
      // Expected: (500 * 1.50) + 0 + 0 - 0 - 0 = 750
      expect(result.gross).toBe(750);
      expect(result.net).toBe(750);
    });
  });

  describe('formatCurrency', () => {
    it('should format positive numbers correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('should format zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should format negative numbers correctly', () => {
      expect(formatCurrency(-50)).toBe('-$50.00');
    });

    it('should format large numbers with commas', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    });
  });

  describe('parseCurrency', () => {
    it('should parse currency strings correctly', () => {
      expect(parseCurrency('$1,234.56')).toBe(1234.56);
    });

    it('should parse plain numbers', () => {
      expect(parseCurrency('100')).toBe(100);
    });

    it('should handle empty strings', () => {
      expect(parseCurrency('')).toBe(0);
    });

    it('should handle whitespace', () => {
      expect(parseCurrency('  ')).toBe(0);
    });

    it('should handle invalid input', () => {
      expect(parseCurrency('abc')).toBe(0);
    });
  });

  describe('generatePayrollCsv', () => {
    it('should generate CSV with all required columns including Total$/MAT', () => {
      const drivers = [
        {
          id: 1,
          name: 'John Smith',
          driverId: 'DRV-001',
          trips: 48,
          miles: 720,
          rate: 1.50,
          totalDollars: 0,
          gas: 50,
          credits: 0,
          deductions: 0,
        },
      ];
      
      const csv = generatePayrollCsv(drivers, '2026-01-12');
      
      // Check header row includes all required columns
      expect(csv).toContain('Driver Name');
      expect(csv).toContain('Driver ID');
      expect(csv).toContain('Trips');
      expect(csv).toContain('Miles');
      expect(csv).toContain('Rate/Mile');
      expect(csv).toContain('Gross');
      expect(csv).toContain('Total$/MAT'); // Important: spreadsheet parity
      expect(csv).toContain('Gas');
      expect(csv).toContain('Credits');
      expect(csv).toContain('Deductions');
      expect(csv).toContain('Net');
      
      // Check formula comment
      expect(csv).toContain('Formula: Net = (Miles × Rate) + Total$/MAT + Credits − Gas − Deductions');
      
      // Check data row
      expect(csv).toContain('John Smith');
      expect(csv).toContain('DRV-001');
      expect(csv).toContain('48');
      expect(csv).toContain('720.00');
    });

    it('should handle driver names with commas', () => {
      const drivers = [
        {
          id: 1,
          name: 'Smith, John Jr.',
          driverId: 'DRV-001',
          trips: 10,
          miles: 100,
          rate: 1.50,
          totalDollars: 0,
          gas: 0,
          credits: 0,
          deductions: 0,
        },
      ];
      
      const csv = generatePayrollCsv(drivers, '2026-01-12');
      
      // Name should be quoted
      expect(csv).toContain('"Smith, John Jr."');
    });

    it('should calculate correct net in CSV export', () => {
      const drivers = [
        {
          id: 1,
          name: 'Test Driver',
          driverId: 'DRV-001',
          trips: 10,
          miles: 100,
          rate: 1.50,
          totalDollars: 50,
          gas: 20,
          credits: 10,
          deductions: 15,
        },
      ];
      
      const csv = generatePayrollCsv(drivers, '2026-01-12');
      
      // Net = (100 * 1.50) + 50 + 10 - 20 - 15 = 150 + 50 + 10 - 20 - 15 = 175
      expect(csv).toContain('175.00');
    });
  });

  describe('calculatePayrollSummary', () => {
    it('should calculate summary statistics correctly', () => {
      const drivers = [
        { net: 1000, status: 'pending', hasException: false },
        { net: 800, status: 'pending', hasException: true },
        { net: 1200, status: 'approved', hasException: false },
      ];
      
      const summary = calculatePayrollSummary(drivers);
      
      expect(summary.totalDrivers).toBe(3);
      expect(summary.totalPayout).toBe(3000);
      expect(summary.pendingCount).toBe(2);
      expect(summary.exceptionsCount).toBe(1);
    });

    it('should handle empty array', () => {
      const summary = calculatePayrollSummary([]);
      
      expect(summary.totalDrivers).toBe(0);
      expect(summary.totalPayout).toBe(0);
      expect(summary.pendingCount).toBe(0);
      expect(summary.exceptionsCount).toBe(0);
    });
  });

  describe('getDriverExceptionFlags', () => {
    it('should flag missing contract', () => {
      const flags = getDriverExceptionFlags({
        hasContract: false,
        miles: 100,
        hasSuggestedDeductions: false,
        hasImportErrors: false,
        deductions: 0,
        gross: 150,
        net: 150,
      });
      
      expect(flags.some(f => f.type === 'missing_contract')).toBe(true);
    });

    it('should flag zero miles', () => {
      const flags = getDriverExceptionFlags({
        hasContract: true,
        miles: 0,
        hasSuggestedDeductions: false,
        hasImportErrors: false,
        deductions: 0,
        gross: 0,
        net: 0,
      });
      
      expect(flags.some(f => f.type === 'zero_miles')).toBe(true);
    });

    it('should flag unconfirmed deductions', () => {
      const flags = getDriverExceptionFlags({
        hasContract: true,
        miles: 100,
        hasSuggestedDeductions: true,
        hasImportErrors: false,
        deductions: 0,
        gross: 150,
        net: 150,
      });
      
      expect(flags.some(f => f.type === 'unconfirmed_deduction')).toBe(true);
    });

    it('should flag import errors', () => {
      const flags = getDriverExceptionFlags({
        hasContract: true,
        miles: 100,
        hasSuggestedDeductions: false,
        hasImportErrors: true,
        deductions: 0,
        gross: 150,
        net: 150,
      });
      
      expect(flags.some(f => f.type === 'import_error')).toBe(true);
    });

    it('should flag negative pay', () => {
      const flags = getDriverExceptionFlags({
        hasContract: true,
        miles: 100,
        hasSuggestedDeductions: false,
        hasImportErrors: false,
        deductions: 200,
        gross: 150,
        net: -50,
      });
      
      expect(flags.some(f => f.type === 'negative_pay')).toBe(true);
    });

    it('should return no flags for clean driver', () => {
      const flags = getDriverExceptionFlags({
        hasContract: true,
        miles: 100,
        hasSuggestedDeductions: false,
        hasImportErrors: false,
        deductions: 10,
        gross: 150,
        net: 140,
      });
      
      expect(flags.length).toBe(0);
    });
  });
});

describe('MediRoute Import Simulation', () => {
  it('should process imported trip data and calculate payroll', () => {
    // Simulate MediRoute import data
    const importedTrips = [
      { driverId: 'DRV-001', miles: 15.5, tripType: 'standard' },
      { driverId: 'DRV-001', miles: 22.3, tripType: 'standard' },
      { driverId: 'DRV-001', miles: 18.7, tripType: 'wheelchair' },
      { driverId: 'DRV-002', miles: 30.0, tripType: 'standard' },
    ];
    
    // Aggregate by driver
    const driverTotals = importedTrips.reduce((acc, trip) => {
      if (!acc[trip.driverId]) {
        acc[trip.driverId] = { miles: 0, trips: 0 };
      }
      acc[trip.driverId].miles += trip.miles;
      acc[trip.driverId].trips += 1;
      return acc;
    }, {} as Record<string, { miles: number; trips: number }>);
    
    expect(driverTotals['DRV-001'].trips).toBe(3);
    expect(driverTotals['DRV-001'].miles).toBeCloseTo(56.5, 1);
    expect(driverTotals['DRV-002'].trips).toBe(1);
    expect(driverTotals['DRV-002'].miles).toBe(30.0);
  });

  it('should identify import errors', () => {
    const importedRows = [
      { row: 1, driverId: 'DRV-001', miles: 15.5, status: 'completed' },
      { row: 2, driverId: null, miles: 22.3, status: 'completed' }, // Error: no driver
      { row: 3, driverId: 'DRV-001', miles: null, status: 'completed' }, // Error: no miles
      { row: 4, driverId: 'DRV-001', miles: 18.7, status: 'cancelled' }, // Error: cancelled
    ];
    
    const errors = importedRows
      .filter(row => !row.driverId || !row.miles || row.status === 'cancelled')
      .map(row => ({
        rowNumber: row.row,
        reason: !row.driverId ? 'No Driver' : !row.miles ? 'Missing Data' : 'Invalid Status',
      }));
    
    expect(errors.length).toBe(3);
    expect(errors[0].reason).toBe('No Driver');
    expect(errors[1].reason).toBe('Missing Data');
    expect(errors[2].reason).toBe('Invalid Status');
  });

  it('should calculate payroll from imported data using standardized formula', () => {
    // Simulate aggregated import data
    const driverData = {
      driverId: 'DRV-001',
      miles: 720,
      trips: 48,
      rate: 1.50,
      totalDollars: 0, // No MAT/bonus
      gas: 50,
      credits: 0,
      deductions: 75, // Toll violation
    };
    
    const result = calculateNetPay({
      miles: driverData.miles,
      ratePerMile: driverData.rate,
      totalDollars: driverData.totalDollars,
      credits: driverData.credits,
      gas: driverData.gas,
      deductions: driverData.deductions,
    });
    
    // Expected: (720 * 1.50) + 0 + 0 - 50 - 75 = 1080 - 125 = 955
    expect(result.gross).toBe(1080);
    expect(result.net).toBe(955);
  });
});
