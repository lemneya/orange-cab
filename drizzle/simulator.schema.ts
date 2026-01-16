/**
 * OC-SIM-0: Simulator Database Schema
 * Tables for simulation runs and proof packs
 */

import { pgTable, serial, text, timestamp, jsonb, boolean, integer, real, pgEnum } from "drizzle-orm/pg-core";

// ============================================
// ENUMS
// ============================================

export const simRunStatusEnum = pgEnum("sim_run_status", [
  "NOT_STARTED",
  "DEMAND_IMPORTED",
  "SHADOW_COMPLETE",
  "ACTUAL_IMPORTED",
  "COMPARE_COMPLETE",
  "PACK_GENERATED",
  "FAILED"
]);

export const stepStatusEnum = pgEnum("step_status", [
  "NOT_STARTED",
  "READY",
  "IN_PROGRESS",
  "COMPLETED",
  "FAILED"
]);

export const packStatusEnum = pgEnum("pack_status", [
  "GENERATING",
  "READY",
  "FAILED"
]);

// ============================================
// SIMULATION RUNS
// ============================================

export const simRuns = pgTable("sim_runs", {
  id: serial("id").primaryKey(),
  
  // Scope
  opcoId: text("opco_id").notNull(),
  opcoName: text("opco_name"),
  brokerAccountId: text("broker_account_id").notNull(),
  brokerAccountName: text("broker_account_name"),
  serviceDate: text("service_date").notNull(),
  
  // Status tracking
  status: simRunStatusEnum("status").default("NOT_STARTED"),
  
  // Step statuses
  demandStep: stepStatusEnum("demand_step").default("NOT_STARTED"),
  shadowStep: stepStatusEnum("shadow_step").default("NOT_STARTED"),
  actualStep: stepStatusEnum("actual_step").default("NOT_STARTED"),
  proofStep: stepStatusEnum("proof_step").default("NOT_STARTED"),
  
  // References
  manifestImportId: text("manifest_import_id"),
  shadowRunId: text("shadow_run_id"),
  actualImportId: text("actual_import_id"),
  proofPackId: text("proof_pack_id"),
  
  // Snapshot data
  snapshotChecksum: text("snapshot_checksum"),
  snapshotJson: jsonb("snapshot_json"),
  
  // Metadata
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================
// PROOF PACKS (Shareable)
// ============================================

export const proofPacks = pgTable("proof_packs", {
  id: serial("id").primaryKey(),
  packId: text("pack_id").notNull().unique(), // e.g., "PP-20260116-001"
  
  // Scope
  opcoId: text("opco_id").notNull(),
  opcoName: text("opco_name"),
  brokerAccountId: text("broker_account_id").notNull(),
  brokerAccountName: text("broker_account_name"),
  serviceDate: text("service_date").notNull(),
  
  // Status
  status: packStatusEnum("status").default("GENERATING"),
  
  // References
  simRunId: integer("sim_run_id"),
  shadowRunId: text("shadow_run_id"),
  
  // Content
  title: text("title"),
  narrativeMarkdown: text("narrative_markdown"),
  narrativeStyle: text("narrative_style"), // INTERNAL | CLIENT
  
  // KPIs (aggregate only, no PHI)
  kpisJson: jsonb("kpis_json"),
  
  // Evidence
  snapshotChecksum: text("snapshot_checksum"),
  importAuditIds: jsonb("import_audit_ids"), // array of batch IDs
  evidenceJson: jsonb("evidence_json"), // checksums, proofs, etc.
  
  // Flags
  hasManifest: boolean("has_manifest").default(false),
  hasActual: boolean("has_actual").default(false),
  hasShadowRun: boolean("has_shadow_run").default(false),
  phiStripped: boolean("phi_stripped").default(true),
  
  // Warnings
  warningsJson: jsonb("warnings_json"), // array of warning messages
  
  // Metadata
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // optional expiry for shared links
});

// ============================================
// COMPARE RESULTS (cached)
// ============================================

export const simCompareResults = pgTable("sim_compare_results", {
  id: serial("id").primaryKey(),
  simRunId: integer("sim_run_id").notNull(),
  
  // KPI Deltas
  predOnTimePct: real("pred_on_time_pct"),
  actualOnTimePct: real("actual_on_time_pct"),
  onTimeDelta: real("on_time_delta"),
  
  predDeadheadMiles: real("pred_deadhead_miles"),
  actualDeadheadMiles: real("actual_deadhead_miles"),
  deadheadDelta: real("deadhead_delta"),
  
  predDriverPay: real("pred_driver_pay"),
  actualDriverPay: real("actual_driver_pay"),
  driverPayDelta: real("driver_pay_delta"),
  
  predUnassigned: integer("pred_unassigned"),
  actualNoCover: integer("actual_no_cover"),
  
  // Demand loss (if manifest present)
  scheduledTrips: integer("scheduled_trips"),
  completedTrips: integer("completed_trips"),
  canceledTrips: integer("canceled_trips"),
  noShowTrips: integer("no_show_trips"),
  demandLossPct: real("demand_loss_pct"),
  
  // Estimated savings
  estimatedSavingsUsd: real("estimated_savings_usd"),
  savingsBreakdownJson: jsonb("savings_breakdown_json"),
  
  // Top causes
  topCausesJson: jsonb("top_causes_json"),
  
  // Per-driver deltas
  driverDeltasJson: jsonb("driver_deltas_json"),
  
  // Metadata
  computedAt: timestamp("computed_at").defaultNow(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type SimRun = typeof simRuns.$inferSelect;
export type NewSimRun = typeof simRuns.$inferInsert;

export type ProofPack = typeof proofPacks.$inferSelect;
export type NewProofPack = typeof proofPacks.$inferInsert;

export type SimCompareResult = typeof simCompareResults.$inferSelect;
export type NewSimCompareResult = typeof simCompareResults.$inferInsert;
