// Reports Schema - OC-REPORT-0
// Report templates, runs, and artifacts for the reporting engine

import { pgTable, serial, text, timestamp, integer, jsonb, varchar, boolean } from "drizzle-orm/pg-core";

// ============================================
// REPORT TEMPLATES
// ============================================

export const reportTemplates = pgTable("report_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(), // OPERATIONS, PAYROLL, BILLING, IDS, COMPLIANCE
  
  // Default filters for this template
  defaultFiltersJson: jsonb("default_filters_json").$type<{
    dateRange?: { start: string; end: string };
    opcoId?: string;
    brokerAccountId?: string;
    driverIds?: string[];
    vehicleIds?: string[];
  }>(),
  
  // Sections configuration
  sectionsJson: jsonb("sections_json").$type<{
    sections: Array<{
      id: string;
      title: string;
      type: "kpi_cards" | "table" | "chart" | "summary";
      dataSource: string; // payroll, ids_shadow, fuel_tolls, trips, etc.
      config?: Record<string, any>;
    }>;
  }>(),
  
  // Template metadata
  isActive: boolean("is_active").default(true),
  isBuiltIn: boolean("is_built_in").default(false), // System templates vs user-created
  createdBy: varchar("created_by", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// REPORT RUNS
// ============================================

export const reportRuns = pgTable("report_runs", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull(),
  
  // Run-specific filters (override template defaults)
  filtersJson: jsonb("filters_json").$type<{
    dateRange: { start: string; end: string };
    opcoId?: string;
    brokerAccountId?: string;
    driverIds?: string[];
    vehicleIds?: string[];
  }>().notNull(),
  
  // Status tracking
  status: varchar("status", { length: 50 }).notNull(), // PENDING, RUNNING, COMPLETED, FAILED
  errorMessage: text("error_message"),
  
  // Computed KPIs snapshot (stored for evidence)
  kpisJson: jsonb("kpis_json").$type<{
    payroll?: {
      totalDriverPay: number;
      totalTrips: number;
      totalMiles: number;
      avgPayPerTrip: number;
      avgPayPerMile: number;
      driverCount: number;
    };
    ids?: {
      shadowRunCount: number;
      predictedOnTimeRate: number;
      predictedDeadheadMiles: number;
      predictedTotalPay: number;
      actualOnTimeRate?: number;
      actualDeadheadMiles?: number;
      actualTotalPay?: number;
    };
    fuelTolls?: {
      totalFuelCost: number;
      totalTollCost: number;
      fuelGallons: number;
      avgFuelPricePerGallon: number;
      tollTransactionCount: number;
    };
    trips?: {
      totalTrips: number;
      completedTrips: number;
      canceledTrips: number;
      noShowTrips: number;
      onTimeRate: number;
    };
    summary?: {
      totalRevenue: number;
      totalExpenses: number;
      netMargin: number;
      marginPercent: number;
    };
  }>(),
  
  // Audit trail for calculations
  auditJson: jsonb("audit_json").$type<{
    rowCounts: Record<string, number>;
    dataSources: string[];
    calculationNotes: string[];
    generatedAt: string;
  }>(),
  
  // Metadata
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// ============================================
// REPORT ARTIFACTS
// ============================================

export const reportArtifacts = pgTable("report_artifacts", {
  id: serial("id").primaryKey(),
  runId: integer("run_id").notNull(),
  
  // Artifact type and location
  artifactType: varchar("artifact_type", { length: 50 }).notNull(), // PDF, JSON, CSV
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: text("file_path"), // Local path or S3 URL
  fileSize: integer("file_size"), // bytes
  checksum: varchar("checksum", { length: 64 }), // SHA-256
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type ReportTemplate = typeof reportTemplates.$inferSelect;
export type NewReportTemplate = typeof reportTemplates.$inferInsert;
export type ReportRun = typeof reportRuns.$inferSelect;
export type NewReportRun = typeof reportRuns.$inferInsert;
export type ReportArtifact = typeof reportArtifacts.$inferSelect;
export type NewReportArtifact = typeof reportArtifacts.$inferInsert;
