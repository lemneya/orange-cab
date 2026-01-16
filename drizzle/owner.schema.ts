// Owner Cockpit + Weekly Pack Schema
// Tables for weekly proof packs and owner snapshots

import { z } from "zod";

// ============================================
// ENUMS
// ============================================

export const PackStatus = {
  GENERATING: "GENERATING",
  READY: "READY",
  FAILED: "FAILED",
} as const;

export type PackStatus = (typeof PackStatus)[keyof typeof PackStatus];

export const PackStyle = {
  INTERNAL: "INTERNAL",
  CLIENT: "CLIENT",
} as const;

export type PackStyle = (typeof PackStyle)[keyof typeof PackStyle];

// ============================================
// WEEKLY PACKS TABLE
// ============================================

export interface WeeklyPack {
  id: string;
  name: string;
  opcoId: string;
  brokerAccountId: string | null;
  startDate: string; // ISO date
  endDate: string; // ISO date
  style: PackStyle;
  status: PackStatus;
  reportRunId: string | null;
  narrativeId: string | null;
  snapshotJson: string; // JSON string of OwnerSnapshot
  snapshotChecksum: string;
  artifactPdfUrl: string | null;
  createdBy: string;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
  error: string | null;
}

// ============================================
// OWNER SNAPSHOT (for narrative generation)
// ============================================

export interface OwnerSnapshot {
  // Context
  opcoId: string;
  opcoName: string;
  brokerAccountId: string | null;
  brokerAccountName: string | null;
  startDate: string;
  endDate: string;
  generatedAt: string;
  
  // Revenue & Expenses
  revenueEstimate: number;
  revenueDeltaPct: number;
  expenses: number;
  margin: number;
  marginPct: number;
  
  // Trips
  tripsTotal: number;
  tripsCompleted: number;
  tripsCanceled: number;
  tripsNoShow: number;
  tripsNoCover: number;
  demandDataAvailable: boolean;
  
  // On-Time
  onTimePct: number;
  lateCount: number;
  onTimeDeltaPct: number;
  
  // Deadhead
  deadheadMiles: number;
  deadheadDeltaMiles: number;
  
  // Cash Out
  payrollTotal: number;
  fuelTotal: number;
  tollTotal: number;
  cashOutTotal: number;
  
  // Fleet Readiness
  vehiclesActive: number;
  vehiclesTotal: number;
  vehiclesInShop: number;
  vehiclesDueInspection: number;
  wchReady: number;
  
  // IDS Impact (if available)
  idsAvailable: boolean;
  idsOnTimeImprovement: number;
  idsDeadheadSaved: number;
  idsPaySaved: number;
  idsLockCompliance: number;
  
  // Alerts
  alerts: OwnerAlert[];
  
  // Top drivers/vehicles
  topDrivers: Array<{ name: string; pay: number; trips: number }>;
  topCostDrivers: Array<{ name: string; type: string; amount: number }>;
  
  // Late causes
  lateCauses: Array<{ cause: string; count: number; severity: string }>;
  
  // Cost leaks
  costLeaks: Array<{ type: string; amount: number; delta: number }>;
}

export interface OwnerAlert {
  id: string;
  severity: "HIGH" | "MED";
  type: string;
  headline: string;
  deepLink: string;
  module: string;
}

// ============================================
// ZOD SCHEMAS
// ============================================

export const ownerSnapshotSchema = z.object({
  opcoId: z.string(),
  opcoName: z.string(),
  brokerAccountId: z.string().nullable(),
  brokerAccountName: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string(),
  generatedAt: z.string(),
  
  revenueEstimate: z.number(),
  revenueDeltaPct: z.number(),
  expenses: z.number(),
  margin: z.number(),
  marginPct: z.number(),
  
  tripsTotal: z.number(),
  tripsCompleted: z.number(),
  tripsCanceled: z.number(),
  tripsNoShow: z.number(),
  tripsNoCover: z.number(),
  demandDataAvailable: z.boolean(),
  
  onTimePct: z.number(),
  lateCount: z.number(),
  onTimeDeltaPct: z.number(),
  
  deadheadMiles: z.number(),
  deadheadDeltaMiles: z.number(),
  
  payrollTotal: z.number(),
  fuelTotal: z.number(),
  tollTotal: z.number(),
  cashOutTotal: z.number(),
  
  vehiclesActive: z.number(),
  vehiclesTotal: z.number(),
  vehiclesInShop: z.number(),
  vehiclesDueInspection: z.number(),
  wchReady: z.number(),
  
  idsAvailable: z.boolean(),
  idsOnTimeImprovement: z.number(),
  idsDeadheadSaved: z.number(),
  idsPaySaved: z.number(),
  idsLockCompliance: z.number(),
  
  alerts: z.array(z.object({
    id: z.string(),
    severity: z.enum(["HIGH", "MED"]),
    type: z.string(),
    headline: z.string(),
    deepLink: z.string(),
    module: z.string(),
  })),
  
  topDrivers: z.array(z.object({
    name: z.string(),
    pay: z.number(),
    trips: z.number(),
  })),
  
  topCostDrivers: z.array(z.object({
    name: z.string(),
    type: z.string(),
    amount: z.number(),
  })),
  
  lateCauses: z.array(z.object({
    cause: z.string(),
    count: z.number(),
    severity: z.string(),
  })),
  
  costLeaks: z.array(z.object({
    type: z.string(),
    amount: z.number(),
    delta: z.number(),
  })),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type InsertWeeklyPack = Omit<WeeklyPack, "id" | "createdAt" | "updatedAt">;
export type SelectWeeklyPack = WeeklyPack;
