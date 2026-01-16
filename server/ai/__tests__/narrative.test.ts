// Narrative Service Unit Tests
// Tests for token validation and PHI blocking

import { describe, it, expect } from "vitest";
import {
  extractMetrics,
  getTokenAllowlist,
  validateNarrativeOutput,
  checkForPHI,
  replacePlaceholders,
  renderToMarkdown,
  generateTemplateNarrative,
  type ReportSnapshot,
  type NarrativeOutput,
} from "../narrative.service";

// ============================================
// TEST DATA
// ============================================

const sampleSnapshot: ReportSnapshot = {
  templateName: "Weekly Ops (Internal)",
  dateRange: { start: "2026-01-09", end: "2026-01-16" },
  opcoId: "SAHRAWI",
  brokerAccountId: "MODIVCARE_SAHRAWI",
  kpis: {
    payroll: {
      totalDriverPay: 5250.0,
      totalTrips: 368,
      totalMiles: 4200,
      avgPayPerTrip: 14.27,
      avgPayPerMile: 1.25,
      driverCount: 5,
      drivers: [
        { name: "John Smith", trips: 80, miles: 920, pay: 1150 },
        { name: "Maria Garcia", trips: 75, miles: 850, pay: 1062.5 },
        { name: "James Wilson", trips: 72, miles: 820, pay: 1025 },
        { name: "Sarah Johnson", trips: 70, miles: 800, pay: 1000 },
        { name: "Michael Brown", trips: 71, miles: 810, pay: 1012.5 },
      ],
    },
    trips: {
      totalTrips: 368,
      completedTrips: 332,
      canceledTrips: 20,
      noShowTrips: 16,
      onTimeRate: 91.5,
      byMobilityType: { STD: 300, WCH: 68 },
      byBroker: { MODIVCARE: 368 },
    },
    fuelTolls: {
      totalFuelCost: 1250.0,
      totalTollCost: 147.32,
      fuelGallons: 400,
      avgFuelPricePerGallon: 3.125,
      tollTransactionCount: 45,
      vehicles: [
        { unit: "V001", fuelCost: 450, tollCost: 52 },
        { unit: "V002", fuelCost: 400, tollCost: 48 },
      ],
    },
    ids: {
      shadowRunCount: 5,
      predictedOnTimeRate: 95.0,
      predictedDeadheadMiles: 280,
      predictedTotalPay: 5025.0,
      actualOnTimeRate: 91.5,
      actualDeadheadMiles: 350,
      actualTotalPay: 5250.0,
    },
    summary: {
      totalRevenue: 8300.0,
      totalExpenses: 7147.32,
      netMargin: 1152.68,
      marginPercent: 13.89,
      expenseBreakdown: {
        driverPay: 5250.0,
        fuel: 1250.0,
        tolls: 147.32,
        other: 500.0,
      },
    },
  },
  audit: {
    rowCounts: { trips: 368, drivers: 5, vehicles: 8 },
    dataSources: ["payroll", "ids", "fuel_tolls"],
    calculationNotes: ["Using mock data for demo"],
    generatedAt: "2026-01-16T10:00:00Z",
  },
};

// ============================================
// TESTS: TOKEN EXTRACTION
// ============================================

describe("extractMetrics", () => {
  it("should extract all expected metrics from snapshot", () => {
    const metrics = extractMetrics(sampleSnapshot);

    expect(metrics.DATE_RANGE).toBe("2026-01-09 to 2026-01-16");
    expect(metrics.OPCO).toBe("SAHRAWI");
    expect(metrics.BROKER_ACCOUNT).toBe("MODIVCARE_SAHRAWI");
    expect(metrics.KPI_TOTAL_DRIVER_PAY).toBe("$5,250.00");
    expect(metrics.KPI_TOTAL_TRIPS).toBe("368");
    expect(metrics.KPI_ONTIME_PCT).toBe("91.5%");
  });

  it("should calculate deltas correctly", () => {
    const metrics = extractMetrics(sampleSnapshot);

    // On-time delta: 95.0 - 91.5 = 3.5
    expect(metrics.KPI_ONTIME_DELTA).toBe("+3.5%");
    // Deadhead delta: 350 - 280 = 70
    expect(metrics.KPI_DEADHEAD_DELTA).toBe("+70 mi");
    // Pay delta: 5250 - 5025 = 225
    expect(metrics.KPI_PAY_DELTA).toBe("+$225.00");
  });

  it("should identify top and bottom drivers", () => {
    const metrics = extractMetrics(sampleSnapshot);

    expect(metrics.TOP_DRIVER).toBe("John Smith");
    expect(metrics.TOP_DRIVER_PAY).toBe("$1,150.00");
    expect(metrics.BOTTOM_DRIVER).toBe("Sarah Johnson");
    expect(metrics.BOTTOM_DRIVER_PAY).toBe("$1,000.00");
  });
});

// ============================================
// TESTS: TOKEN VALIDATION
// ============================================

describe("validateNarrativeOutput", () => {
  it("should pass validation for valid tokens", () => {
    const metrics = extractMetrics(sampleSnapshot);
    const allowlist = getTokenAllowlist(metrics);

    const output: NarrativeOutput = {
      title: "Weekly Ops — {DATE_RANGE} — {OPCO}",
      executive_summary: [
        "Trips: {KPI_TRIPS_TOTAL} completed.",
        "On-time rate: {KPI_ONTIME_PCT}.",
      ],
      findings: [{ severity: "high", text: "Deadhead is {KPI_ACTUAL_DEADHEAD}." }],
      actions: [
        {
          owner_role: "DISPATCH",
          deadline: "{NEXT_WEEKDAY}",
          text: "Review routes.",
        },
      ],
    };

    const result = validateNarrativeOutput(output, allowlist);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.invalidTokens).toHaveLength(0);
  });

  it("should fail validation for invented tokens", () => {
    const metrics = extractMetrics(sampleSnapshot);
    const allowlist = getTokenAllowlist(metrics);

    const output: NarrativeOutput = {
      title: "Weekly Ops — {DATE_RANGE}",
      executive_summary: [
        "Patient count: {PATIENT_COUNT}.", // Invalid - invented token
        "Secret data: {INTERNAL_SECRET}.", // Invalid - invented token
      ],
    };

    const result = validateNarrativeOutput(output, allowlist);
    expect(result.valid).toBe(false);
    expect(result.invalidTokens).toContain("PATIENT_COUNT");
    expect(result.invalidTokens).toContain("INTERNAL_SECRET");
  });

  it("should catch invalid tokens in all sections", () => {
    const metrics = extractMetrics(sampleSnapshot);
    const allowlist = getTokenAllowlist(metrics);

    const output: NarrativeOutput = {
      title: "{FAKE_TITLE}",
      executive_summary: ["{FAKE_SUMMARY}"],
      findings: [{ severity: "high", text: "{FAKE_FINDING}" }],
      actions: [
        {
          owner_role: "OPS",
          deadline: "{FAKE_DATE}",
          text: "{FAKE_ACTION}",
        },
      ],
      client_bullets: ["{FAKE_BULLET}"],
    };

    const result = validateNarrativeOutput(output, allowlist);
    expect(result.valid).toBe(false);
    expect(result.invalidTokens.length).toBeGreaterThan(0);
  });
});

// ============================================
// TESTS: PHI DETECTION
// ============================================

describe("checkForPHI", () => {
  it("should detect SSN patterns", () => {
    const result = checkForPHI("Patient SSN: 123-45-6789");
    expect(result.hasPHI).toBe(true);
    expect(result.matches).toContain("123-45-6789");
  });

  it("should detect phone number patterns", () => {
    const result = checkForPHI("Call us at 555-123-4567");
    expect(result.hasPHI).toBe(true);
    expect(result.matches.length).toBeGreaterThan(0);
  });

  it("should detect email patterns", () => {
    const result = checkForPHI("Contact: patient@example.com");
    expect(result.hasPHI).toBe(true);
    expect(result.matches).toContain("patient@example.com");
  });

  it("should detect address patterns", () => {
    const result = checkForPHI("Pickup at 123 Main Street");
    expect(result.hasPHI).toBe(true);
  });

  it("should not flag aggregate data", () => {
    const result = checkForPHI(
      "Total trips: 368. On-time rate: 91.5%. Revenue: $8,300.00"
    );
    expect(result.hasPHI).toBe(false);
    expect(result.matches).toHaveLength(0);
  });

  it("should not flag formatted currency or percentages", () => {
    const result = checkForPHI(
      "Driver pay: $5,250.00. Margin: 13.9%. Deadhead: 350 miles."
    );
    expect(result.hasPHI).toBe(false);
  });
});

// ============================================
// TESTS: PLACEHOLDER REPLACEMENT
// ============================================

describe("replacePlaceholders", () => {
  it("should replace all placeholders with values", () => {
    const metrics = extractMetrics(sampleSnapshot);

    const output: NarrativeOutput = {
      title: "Weekly Ops — {DATE_RANGE} — {OPCO}",
      executive_summary: ["Trips: {KPI_TRIPS_TOTAL}."],
    };

    const result = replacePlaceholders(output, metrics);
    expect(result.title).toBe("Weekly Ops — 2026-01-09 to 2026-01-16 — SAHRAWI");
    expect(result.executive_summary?.[0]).toBe("Trips: 368.");
  });

  it("should handle missing placeholders gracefully", () => {
    const metrics = extractMetrics(sampleSnapshot);

    const output: NarrativeOutput = {
      title: "Report with {UNKNOWN_TOKEN}",
    };

    const result = replacePlaceholders(output, metrics);
    // Unknown tokens should remain as-is
    expect(result.title).toBe("Report with {UNKNOWN_TOKEN}");
  });
});

// ============================================
// TESTS: MARKDOWN RENDERING
// ============================================

describe("renderToMarkdown", () => {
  it("should render internal narrative with findings and actions", () => {
    const output: NarrativeOutput = {
      title: "Weekly Ops Report",
      executive_summary: ["Trips completed: 368.", "On-time: 91.5%."],
      findings: [
        { severity: "high", text: "Deadhead too high." },
        { severity: "low", text: "Good driver performance." },
      ],
      actions: [
        {
          owner_role: "DISPATCH",
          deadline: "Monday, Jan 20",
          text: "Review routes.",
        },
      ],
    };

    const markdown = renderToMarkdown(output, "INTERNAL");

    expect(markdown).toContain("# Weekly Ops Report");
    expect(markdown).toContain("## Executive Summary");
    expect(markdown).toContain("## Key Findings");
    expect(markdown).toContain("## Recommended Actions");
    expect(markdown).toContain("🔴 **HIGH**");
    expect(markdown).toContain("🟢 **LOW**");
  });

  it("should render client narrative with client bullets", () => {
    const output: NarrativeOutput = {
      title: "Operations Summary",
      executive_summary: ["Completed 332 trips."],
      client_bullets: ["On-time improvement: +3.5%.", "Cost savings: $225."],
    };

    const markdown = renderToMarkdown(output, "CLIENT");

    expect(markdown).toContain("# Operations Summary");
    expect(markdown).toContain("## Key Takeaways");
    expect(markdown).toContain("✓ On-time improvement");
    // Client narrative should not include internal findings
    expect(markdown).not.toContain("## Key Findings");
    expect(markdown).not.toContain("## Recommended Actions");
  });
});

// ============================================
// TESTS: TEMPLATE NARRATIVE GENERATION
// ============================================

describe("generateTemplateNarrative", () => {
  it("should generate internal narrative successfully", () => {
    const result = generateTemplateNarrative(sampleSnapshot, "INTERNAL");

    expect(result.success).toBe(true);
    expect(result.markdown).toBeDefined();
    expect(result.outputJson).toBeDefined();
    expect(result.promptVersion).toBe("template-v1.0.0");
    expect(result.modelId).toBe("template-engine");
  });

  it("should generate client narrative successfully", () => {
    const result = generateTemplateNarrative(sampleSnapshot, "CLIENT");

    expect(result.success).toBe(true);
    expect(result.markdown).toBeDefined();
    expect(result.outputJson?.client_bullets).toBeDefined();
  });

  it("should not contain PHI in generated narrative", () => {
    const result = generateTemplateNarrative(sampleSnapshot, "INTERNAL");

    expect(result.success).toBe(true);
    if (result.markdown) {
      const phiCheck = checkForPHI(result.markdown);
      expect(phiCheck.hasPHI).toBe(false);
    }
  });

  it("should include actual KPI values in output", () => {
    const result = generateTemplateNarrative(sampleSnapshot, "INTERNAL");

    expect(result.markdown).toContain("368"); // Total trips
    expect(result.markdown).toContain("91.5%"); // On-time rate
    expect(result.markdown).toContain("$5,250.00"); // Driver pay
  });
});

// ============================================
// TESTS: EDGE CASES
// ============================================

describe("Edge cases", () => {
  it("should handle empty snapshot gracefully", () => {
    const emptySnapshot: ReportSnapshot = {
      templateName: "Empty Report",
      dateRange: { start: "2026-01-01", end: "2026-01-07" },
      kpis: {},
    };

    const metrics = extractMetrics(emptySnapshot);
    expect(metrics.KPI_TOTAL_DRIVER_PAY).toBe("N/A");
    expect(metrics.KPI_TRIPS_TOTAL).toBe("N/A");
  });

  it("should handle snapshot with missing nested data", () => {
    const partialSnapshot: ReportSnapshot = {
      templateName: "Partial Report",
      dateRange: { start: "2026-01-01", end: "2026-01-07" },
      kpis: {
        payroll: {
          totalDriverPay: 1000,
          totalTrips: 50,
          totalMiles: 500,
          avgPayPerTrip: 20,
          avgPayPerMile: 2,
          driverCount: 2,
          // No drivers array
        },
      },
    };

    const metrics = extractMetrics(partialSnapshot);
    expect(metrics.TOP_DRIVER).toBe("N/A");
    expect(metrics.BOTTOM_DRIVER).toBe("N/A");
  });
});
