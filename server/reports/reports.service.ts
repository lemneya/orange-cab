// Reports Service - OC-REPORT-0
// KPI aggregator and report generation engine

import crypto from "crypto";

// ============================================
// TYPES
// ============================================

export interface ReportFilters {
  dateRange: { start: string; end: string };
  opcoId?: string;
  brokerAccountId?: string;
  driverIds?: string[];
  vehicleIds?: string[];
}

export interface PayrollKPIs {
  totalDriverPay: number;
  totalTrips: number;
  totalMiles: number;
  avgPayPerTrip: number;
  avgPayPerMile: number;
  driverCount: number;
  byDriver: Array<{
    driverId: string;
    driverName: string;
    trips: number;
    miles: number;
    pay: number;
  }>;
}

export interface IDSKPIs {
  shadowRunCount: number;
  predictedOnTimeRate: number;
  predictedDeadheadMiles: number;
  predictedTotalPay: number;
  actualOnTimeRate?: number;
  actualDeadheadMiles?: number;
  actualTotalPay?: number;
  comparison?: {
    onTimeDelta: number;
    deadheadDelta: number;
    payDelta: number;
  };
}

export interface FuelTollsKPIs {
  totalFuelCost: number;
  totalTollCost: number;
  fuelGallons: number;
  avgFuelPricePerGallon: number;
  tollTransactionCount: number;
  byVehicle: Array<{
    vehicleId: string;
    vehicleUnit: string;
    fuelCost: number;
    tollCost: number;
  }>;
}

export interface TripsKPIs {
  totalTrips: number;
  completedTrips: number;
  canceledTrips: number;
  noShowTrips: number;
  onTimeRate: number;
  byMobilityType: Record<string, number>;
  byBroker: Record<string, number>;
}

export interface SummaryKPIs {
  totalRevenue: number;
  totalExpenses: number;
  netMargin: number;
  marginPercent: number;
  expenseBreakdown: {
    driverPay: number;
    fuel: number;
    tolls: number;
    other: number;
  };
}

export interface ReportKPIs {
  payroll?: PayrollKPIs;
  ids?: IDSKPIs;
  fuelTolls?: FuelTollsKPIs;
  trips?: TripsKPIs;
  summary?: SummaryKPIs;
}

export interface ReportAudit {
  rowCounts: Record<string, number>;
  dataSources: string[];
  calculationNotes: string[];
  generatedAt: string;
}

export interface StoredReportTemplate {
  id: number;
  name: string;
  description: string | null;
  category: string;
  defaultFiltersJson: any;
  sectionsJson: any;
  isActive: boolean;
  isBuiltIn: boolean;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredReportRun {
  id: number;
  templateId: number;
  templateName?: string;
  filtersJson: ReportFilters;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  errorMessage: string | null;
  kpisJson: ReportKPIs | null;
  auditJson: ReportAudit | null;
  createdBy: string;
  createdAt: Date;
  completedAt: Date | null;
}

export interface StoredReportArtifact {
  id: number;
  runId: number;
  artifactType: "PDF" | "JSON" | "CSV";
  fileName: string;
  filePath: string | null;
  fileSize: number | null;
  checksum: string | null;
  createdAt: Date;
}

// ============================================
// IN-MEMORY STORAGE (for demo)
// ============================================

const templates: StoredReportTemplate[] = [];
const runs: StoredReportRun[] = [];
const artifacts: StoredReportArtifact[] = [];

let templateIdCounter = 1;
let runIdCounter = 1;
let artifactIdCounter = 1;

// ============================================
// SEED BUILT-IN TEMPLATES
// ============================================

export function seedReportTemplates(): void {
  if (templates.length > 0) return;

  // Weekly Operations Report (Internal)
  templates.push({
    id: templateIdCounter++,
    name: "Weekly Ops (Internal)",
    description: "Weekly operations summary for internal review. Includes payroll, trips, fuel/tolls, and IDS metrics.",
    category: "OPERATIONS",
    defaultFiltersJson: {
      dateRange: { start: "", end: "" }, // Will be set at runtime
    },
    sectionsJson: {
      sections: [
        { id: "summary", title: "Executive Summary", type: "kpi_cards", dataSource: "summary" },
        { id: "payroll", title: "Payroll Summary", type: "kpi_cards", dataSource: "payroll" },
        { id: "payroll_table", title: "Driver Pay Details", type: "table", dataSource: "payroll" },
        { id: "trips", title: "Trip Metrics", type: "kpi_cards", dataSource: "trips" },
        { id: "fuel_tolls", title: "Fuel & Tolls", type: "kpi_cards", dataSource: "fuelTolls" },
        { id: "ids", title: "IDS Shadow Run Analysis", type: "kpi_cards", dataSource: "ids" },
      ],
    },
    isActive: true,
    isBuiltIn: true,
    createdBy: "system",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Payroll Report
  templates.push({
    id: templateIdCounter++,
    name: "Payroll Summary",
    description: "Detailed payroll breakdown by driver with trip counts and mileage.",
    category: "PAYROLL",
    defaultFiltersJson: {
      dateRange: { start: "", end: "" },
    },
    sectionsJson: {
      sections: [
        { id: "payroll", title: "Payroll Overview", type: "kpi_cards", dataSource: "payroll" },
        { id: "payroll_table", title: "Driver Pay Details", type: "table", dataSource: "payroll" },
      ],
    },
    isActive: true,
    isBuiltIn: true,
    createdBy: "system",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // IDS Performance Report
  templates.push({
    id: templateIdCounter++,
    name: "IDS Performance",
    description: "Shadow run analysis comparing predicted vs actual dispatch outcomes.",
    category: "IDS",
    defaultFiltersJson: {
      dateRange: { start: "", end: "" },
    },
    sectionsJson: {
      sections: [
        { id: "ids", title: "IDS Metrics", type: "kpi_cards", dataSource: "ids" },
        { id: "comparison", title: "Predicted vs Actual", type: "table", dataSource: "ids" },
      ],
    },
    isActive: true,
    isBuiltIn: true,
    createdBy: "system",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Fuel & Tolls Report
  templates.push({
    id: templateIdCounter++,
    name: "Fuel & Tolls",
    description: "Fuel and toll expense tracking by vehicle.",
    category: "OPERATIONS",
    defaultFiltersJson: {
      dateRange: { start: "", end: "" },
    },
    sectionsJson: {
      sections: [
        { id: "fuel_tolls", title: "Expense Overview", type: "kpi_cards", dataSource: "fuelTolls" },
        { id: "fuel_tolls_table", title: "Vehicle Breakdown", type: "table", dataSource: "fuelTolls" },
      ],
    },
    isActive: true,
    isBuiltIn: true,
    createdBy: "system",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log("[Reports] Seeded", templates.length, "built-in report templates");
}

// ============================================
// TEMPLATE CRUD
// ============================================

export function getTemplates(category?: string): StoredReportTemplate[] {
  let result = templates.filter((t) => t.isActive);
  if (category) {
    result = result.filter((t) => t.category === category);
  }
  return result;
}

export function getTemplateById(id: number): StoredReportTemplate | undefined {
  return templates.find((t) => t.id === id);
}

export function createTemplate(data: {
  name: string;
  description?: string;
  category: string;
  defaultFiltersJson?: any;
  sectionsJson?: any;
  createdBy: string;
}): StoredReportTemplate {
  const template: StoredReportTemplate = {
    id: templateIdCounter++,
    name: data.name,
    description: data.description || null,
    category: data.category,
    defaultFiltersJson: data.defaultFiltersJson || {},
    sectionsJson: data.sectionsJson || { sections: [] },
    isActive: true,
    isBuiltIn: false,
    createdBy: data.createdBy,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  templates.push(template);
  return template;
}

// ============================================
// KPI AGGREGATORS
// ============================================

function aggregatePayrollKPIs(filters: ReportFilters): PayrollKPIs {
  // Generate realistic mock data based on date range
  const startDate = new Date(filters.dateRange.start);
  const endDate = new Date(filters.dateRange.end);
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const drivers = [
    { id: "D001", name: "John Smith" },
    { id: "D002", name: "Maria Garcia" },
    { id: "D003", name: "James Wilson" },
    { id: "D004", name: "Sarah Johnson" },
    { id: "D005", name: "Michael Brown" },
  ];

  const byDriver = drivers.map((d) => {
    const tripsPerDay = 8 + Math.floor(Math.random() * 4);
    const trips = tripsPerDay * days;
    const milesPerTrip = 12 + Math.random() * 8;
    const miles = Math.round(trips * milesPerTrip);
    const payPerTrip = 10 + Math.random() * 5;
    const pay = Math.round(trips * payPerTrip * 100) / 100;
    return { driverId: d.id, driverName: d.name, trips, miles, pay };
  });

  const totalTrips = byDriver.reduce((sum, d) => sum + d.trips, 0);
  const totalMiles = byDriver.reduce((sum, d) => sum + d.miles, 0);
  const totalDriverPay = byDriver.reduce((sum, d) => sum + d.pay, 0);

  return {
    totalDriverPay: Math.round(totalDriverPay * 100) / 100,
    totalTrips,
    totalMiles,
    avgPayPerTrip: Math.round((totalDriverPay / totalTrips) * 100) / 100,
    avgPayPerMile: Math.round((totalDriverPay / totalMiles) * 100) / 100,
    driverCount: drivers.length,
    byDriver,
  };
}

function aggregateIDSKPIs(filters: ReportFilters): IDSKPIs {
  const startDate = new Date(filters.dateRange.start);
  const endDate = new Date(filters.dateRange.end);
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const shadowRunCount = days; // One shadow run per day
  const predictedOnTimeRate = 92 + Math.random() * 5;
  const predictedDeadheadMiles = Math.round(days * 45 + Math.random() * 20);
  const predictedTotalPay = Math.round(days * 2500 + Math.random() * 500);

  // Actual data (slightly worse than predicted to show IDS value)
  const actualOnTimeRate = predictedOnTimeRate - 3 - Math.random() * 2;
  const actualDeadheadMiles = predictedDeadheadMiles + Math.round(days * 8 + Math.random() * 10);
  const actualTotalPay = predictedTotalPay + Math.round(days * 150 + Math.random() * 100);

  return {
    shadowRunCount,
    predictedOnTimeRate: Math.round(predictedOnTimeRate * 10) / 10,
    predictedDeadheadMiles,
    predictedTotalPay,
    actualOnTimeRate: Math.round(actualOnTimeRate * 10) / 10,
    actualDeadheadMiles,
    actualTotalPay,
    comparison: {
      onTimeDelta: Math.round((predictedOnTimeRate - actualOnTimeRate) * 10) / 10,
      deadheadDelta: actualDeadheadMiles - predictedDeadheadMiles,
      payDelta: actualTotalPay - predictedTotalPay,
    },
  };
}

function aggregateFuelTollsKPIs(filters: ReportFilters): FuelTollsKPIs {
  const startDate = new Date(filters.dateRange.start);
  const endDate = new Date(filters.dateRange.end);
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const vehicles = [
    { id: "V001", unit: "OC-101" },
    { id: "V002", unit: "OC-102" },
    { id: "V003", unit: "OC-103" },
    { id: "V004", unit: "OC-104" },
    { id: "V005", unit: "OC-105" },
  ];

  const byVehicle = vehicles.map((v) => {
    const fuelCost = Math.round((days * 35 + Math.random() * 15) * 100) / 100;
    const tollCost = Math.round((days * 8 + Math.random() * 5) * 100) / 100;
    return { vehicleId: v.id, vehicleUnit: v.unit, fuelCost, tollCost };
  });

  const totalFuelCost = byVehicle.reduce((sum, v) => sum + v.fuelCost, 0);
  const totalTollCost = byVehicle.reduce((sum, v) => sum + v.tollCost, 0);
  const fuelGallons = Math.round(totalFuelCost / 3.25); // ~$3.25/gallon
  const tollTransactionCount = Math.round(days * vehicles.length * 1.5);

  return {
    totalFuelCost: Math.round(totalFuelCost * 100) / 100,
    totalTollCost: Math.round(totalTollCost * 100) / 100,
    fuelGallons,
    avgFuelPricePerGallon: Math.round((totalFuelCost / fuelGallons) * 100) / 100,
    tollTransactionCount,
    byVehicle,
  };
}

function aggregateTripsKPIs(filters: ReportFilters): TripsKPIs {
  const startDate = new Date(filters.dateRange.start);
  const endDate = new Date(filters.dateRange.end);
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const totalTrips = days * 45 + Math.floor(Math.random() * 10);
  const canceledTrips = Math.floor(totalTrips * 0.05);
  const noShowTrips = Math.floor(totalTrips * 0.03);
  const completedTrips = totalTrips - canceledTrips - noShowTrips;
  const onTimeRate = 88 + Math.random() * 8;

  return {
    totalTrips,
    completedTrips,
    canceledTrips,
    noShowTrips,
    onTimeRate: Math.round(onTimeRate * 10) / 10,
    byMobilityType: {
      AMB: Math.floor(completedTrips * 0.65),
      WCH: Math.floor(completedTrips * 0.30),
      STR: Math.floor(completedTrips * 0.05),
    },
    byBroker: {
      MODIVCARE: Math.floor(completedTrips * 0.60),
      MTM: Math.floor(completedTrips * 0.25),
      ACCESS2CARE: Math.floor(completedTrips * 0.15),
    },
  };
}

function aggregateSummaryKPIs(
  payroll: PayrollKPIs,
  fuelTolls: FuelTollsKPIs,
  trips: TripsKPIs
): SummaryKPIs {
  // Revenue estimate: ~$25 per completed trip
  const totalRevenue = Math.round(trips.completedTrips * 25 * 100) / 100;

  const expenseBreakdown = {
    driverPay: payroll.totalDriverPay,
    fuel: fuelTolls.totalFuelCost,
    tolls: fuelTolls.totalTollCost,
    other: Math.round(trips.completedTrips * 2 * 100) / 100, // ~$2/trip for misc
  };

  const totalExpenses =
    expenseBreakdown.driverPay +
    expenseBreakdown.fuel +
    expenseBreakdown.tolls +
    expenseBreakdown.other;

  const netMargin = Math.round((totalRevenue - totalExpenses) * 100) / 100;
  const marginPercent = Math.round((netMargin / totalRevenue) * 1000) / 10;

  return {
    totalRevenue,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    netMargin,
    marginPercent,
    expenseBreakdown,
  };
}

// ============================================
// REPORT RUN BUILDER
// ============================================

export function buildReportRun(
  templateId: number,
  filters: ReportFilters,
  createdBy: string
): StoredReportRun {
  const template = getTemplateById(templateId);
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  // Start the run
  const run: StoredReportRun = {
    id: runIdCounter++,
    templateId,
    templateName: template.name,
    filtersJson: filters,
    status: "RUNNING",
    errorMessage: null,
    kpisJson: null,
    auditJson: null,
    createdBy,
    createdAt: new Date(),
    completedAt: null,
  };
  runs.push(run);

  try {
    // Aggregate KPIs based on template sections
    const sections = template.sectionsJson?.sections || [];
    const dataSources: Set<string> = new Set(sections.map((s: any) => s.dataSource as string));

    const kpis: ReportKPIs = {};
    const audit: ReportAudit = {
      rowCounts: {},
      dataSources: Array.from(dataSources),
      calculationNotes: [],
      generatedAt: new Date().toISOString(),
    };

    // Aggregate each data source
    if (dataSources.has("payroll") || dataSources.has("summary")) {
      kpis.payroll = aggregatePayrollKPIs(filters);
      audit.rowCounts["payroll_records"] = kpis.payroll.byDriver.length;
      audit.calculationNotes.push(`Payroll: ${kpis.payroll.driverCount} drivers, ${kpis.payroll.totalTrips} trips`);
    }

    if (dataSources.has("ids")) {
      kpis.ids = aggregateIDSKPIs(filters);
      audit.rowCounts["shadow_runs"] = kpis.ids.shadowRunCount;
      audit.calculationNotes.push(`IDS: ${kpis.ids.shadowRunCount} shadow runs analyzed`);
    }

    if (dataSources.has("fuelTolls") || dataSources.has("summary")) {
      kpis.fuelTolls = aggregateFuelTollsKPIs(filters);
      audit.rowCounts["fuel_transactions"] = kpis.fuelTolls.byVehicle.length;
      audit.rowCounts["toll_transactions"] = kpis.fuelTolls.tollTransactionCount;
      audit.calculationNotes.push(`Fuel/Tolls: ${kpis.fuelTolls.byVehicle.length} vehicles tracked`);
    }

    if (dataSources.has("trips") || dataSources.has("summary")) {
      kpis.trips = aggregateTripsKPIs(filters);
      audit.rowCounts["trips"] = kpis.trips.totalTrips;
      audit.calculationNotes.push(`Trips: ${kpis.trips.totalTrips} total, ${kpis.trips.completedTrips} completed`);
    }

    if (dataSources.has("summary")) {
      kpis.summary = aggregateSummaryKPIs(
        kpis.payroll || aggregatePayrollKPIs(filters),
        kpis.fuelTolls || aggregateFuelTollsKPIs(filters),
        kpis.trips || aggregateTripsKPIs(filters)
      );
      audit.calculationNotes.push(`Summary: ${kpis.summary.marginPercent}% margin`);
    }

    // Update run with results
    run.kpisJson = kpis;
    run.auditJson = audit;
    run.status = "COMPLETED";
    run.completedAt = new Date();

    return run;
  } catch (error: any) {
    run.status = "FAILED";
    run.errorMessage = error.message;
    run.completedAt = new Date();
    return run;
  }
}

// ============================================
// RUN QUERIES
// ============================================

export function getReportRuns(options?: {
  templateId?: number;
  status?: string;
  limit?: number;
}): StoredReportRun[] {
  let result = [...runs].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  if (options?.templateId) {
    result = result.filter((r) => r.templateId === options.templateId);
  }
  if (options?.status) {
    result = result.filter((r) => r.status === options.status);
  }
  if (options?.limit) {
    result = result.slice(0, options.limit);
  }

  return result;
}

export function getReportRunById(id: number): StoredReportRun | undefined {
  return runs.find((r) => r.id === id);
}

// ============================================
// ARTIFACT MANAGEMENT
// ============================================

export function createArtifact(data: {
  runId: number;
  artifactType: "PDF" | "JSON" | "CSV";
  fileName: string;
  content: string | Buffer;
}): StoredReportArtifact {
  const contentBuffer = typeof data.content === "string" ? Buffer.from(data.content) : data.content;
  const checksum = crypto.createHash("sha256").update(contentBuffer).digest("hex");

  const artifact: StoredReportArtifact = {
    id: artifactIdCounter++,
    runId: data.runId,
    artifactType: data.artifactType,
    fileName: data.fileName,
    filePath: `/reports/${data.runId}/${data.fileName}`,
    fileSize: contentBuffer.length,
    checksum,
    createdAt: new Date(),
  };
  artifacts.push(artifact);

  return artifact;
}

export function getArtifactsByRunId(runId: number): StoredReportArtifact[] {
  return artifacts.filter((a) => a.runId === runId);
}

// ============================================
// NARRATIVE MANAGEMENT
// ============================================

export interface StoredNarrative {
  id: number;
  reportRunId: number;
  style: "INTERNAL" | "CLIENT";
  status: "queued" | "running" | "success" | "failed";
  promptVersion?: string;
  modelId?: string;
  outputMarkdown?: string;
  outputJson?: {
    title?: string;
    executive_summary?: string[];
    findings?: Array<{ severity: string; text: string }>;
    actions?: Array<{ owner_role: string; deadline: string; text: string }>;
    client_bullets?: string[];
  };
  error?: string;
  createdBy?: string;
  createdAt: Date;
}

const narratives: StoredNarrative[] = [];
let narrativeIdCounter = 1;

export function createNarrative(data: {
  reportRunId: number;
  style: "INTERNAL" | "CLIENT";
  status: "queued" | "running" | "success" | "failed";
  promptVersion?: string;
  modelId?: string;
  outputMarkdown?: string;
  outputJson?: StoredNarrative["outputJson"];
  error?: string;
  createdBy?: string;
}): StoredNarrative {
  const narrative: StoredNarrative = {
    id: narrativeIdCounter++,
    ...data,
    createdAt: new Date(),
  };
  narratives.push(narrative);
  return narrative;
}

export function getNarrativesByRunId(runId: number): StoredNarrative[] {
  return narratives.filter((n) => n.reportRunId === runId);
}

export function getNarrativeById(id: number): StoredNarrative | undefined {
  return narratives.find((n) => n.id === id);
}

// ============================================
// INITIALIZE
// ============================================

seedReportTemplates();
