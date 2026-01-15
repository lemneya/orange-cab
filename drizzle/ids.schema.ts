/**
 * IDS (Integral Dispatch System) Database Schema
 * Drizzle ORM tables for trip optimization
 */

import {
    int,
    mysqlEnum,
    mysqlTable,
    text,
    timestamp,
    varchar,
    boolean,
    decimal,
    json,
    date,
    time,
} from "drizzle-orm/mysql-core";
import { drivers, vehicles, users } from "./schema";

// ============================================================================
// Enums
// ============================================================================

export const tripStatusEnum = mysqlEnum("tripStatus", [
    "pending",
    "assigned",
    "en_route",
    "picked_up",
    "completed",
    "cancelled",
    "no_show",
  ]);

export const mobilityTypeEnum = mysqlEnum("mobilityType", [
    "ambulatory",
    "wheelchair",
    "stretcher",
  ]);

export const templateLockTypeEnum = mysqlEnum("templateLockType", [
    "hard",
    "soft",
  ]);

// ============================================================================
// IDS Trips Table
// ============================================================================

export const idsTrips = mysqlTable("ids_trips", {
    id: int("id").autoincrement().primaryKey(),

    // External reference
    externalId: varchar("externalId", { length: 100 }),

    // Patient info
    patientName: varchar("patientName", { length: 200 }).notNull(),
    patientPhone: varchar("patientPhone", { length: 20 }),
    mobilityType: mobilityTypeEnum.notNull().default("ambulatory"),

    // Pickup location
    pickupAddress: varchar("pickupAddress", { length: 500 }).notNull(),
    pickupCity: varchar("pickupCity", { length: 100 }).notNull(),
    pickupState: varchar("pickupState", { length: 2 }).notNull(),
    pickupZip: varchar("pickupZip", { length: 10 }).notNull(),
    pickupLat: decimal("pickupLat", { precision: 10, scale: 7 }),
    pickupLng: decimal("pickupLng", { precision: 10, scale: 7 }),

    // Dropoff location
    dropoffAddress: varchar("dropoffAddress", { length: 500 }).notNull(),
    dropoffCity: varchar("dropoffCity", { length: 100 }).notNull(),
    dropoffState: varchar("dropoffState", { length: 2 }).notNull(),
    dropoffZip: varchar("dropoffZip", { length: 10 }).notNull(),
    dropoffLat: decimal("dropoffLat", { precision: 10, scale: 7 }),
    dropoffLng: decimal("dropoffLng", { precision: 10, scale: 7 }),

    // Time windows
    tripDate: date("tripDate").notNull(),
    pickupEarliest: time("pickupEarliest").notNull(),
    pickupLatest: time("pickupLatest").notNull(),
    appointmentTime: time("appointmentTime"),
    dropoffEarliest: time("dropoffEarliest"),
    dropoffLatest: time("dropoffLatest"),

    // Service times (minutes)
    pickupServiceTime: int("pickupServiceTime").default(5),
    dropoffServiceTime: int("dropoffServiceTime").default(5),
    maxRideTime: int("maxRideTime"), // Max minutes in vehicle

    // Status and assignment
    status: tripStatusEnum.notNull().default("pending"),
    assignedDriverId: int("assignedDriverId").references(() => drivers.id),
    assignedVehicleId: int("assignedVehicleId").references(() => vehicles.id),

    // Template lock
    isTemplateLocked: boolean("isTemplateLocked").default(false),
    templateLockType: templateLockTypeEnum,

    // Metadata
    notes: text("notes"),
    brokerName: varchar("brokerName", { length: 100 }),

    // Audit
    createdBy: int("createdBy").references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// Driver Scores Table
// ============================================================================

export const idsDriverScores = mysqlTable("ids_driver_scores", {
    id: int("id").autoincrement().primaryKey(),
    driverId: int("driverId").references(() => drivers.id).notNull(),

    // Reliability scores (0-100)
    onTimeScore: int("onTimeScore").default(80),
    earlyBirdScore: int("earlyBirdScore").default(50),
    latenessRisk: int("latenessRisk").default(20),
    cancellationRisk: int("cancellationRisk").default(10),

    // Training status
    isTrainee: boolean("isTrainee").default(false),
    traineeLevel: int("traineeLevel"), // 1-5

    // Preferences (JSON array of city codes)
    preferredZones: json("preferredZones"),
    maxTripsPerDay: int("maxTripsPerDay"),

    // Audit
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// Template Locks Table
// ============================================================================

export const idsTemplateLocks = mysqlTable("ids_template_locks", {
    id: int("id").autoincrement().primaryKey(),

    // Lock applies to specific trip on specific date
    tripId: int("tripId").references(() => idsTrips.id).notNull(),
    driverId: int("driverId").references(() => drivers.id).notNull(),

    // Lock type
    lockType: templateLockTypeEnum.notNull().default("hard"),

    // Effective dates (null = forever)
    effectiveFrom: date("effectiveFrom").notNull(),
    effectiveTo: date("effectiveTo"),

    // Reason for lock
    reason: text("reason"),

    // Audit
    createdBy: int("createdBy").references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================================================
// Pay Rules Table
// ============================================================================

export const idsPayRules = mysqlTable("ids_pay_rules", {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),

    // Base rates (in cents to avoid floating point)
    baseRatePerTripCents: int("baseRatePerTripCents"),
    baseRatePerMileCents: int("baseRatePerMileCents"),
    baseRatePerHourCents: int("baseRatePerHourCents"),

    // Bonuses (in cents)
    wheelchairBonusCents: int("wheelchairBonusCents").default(0),
    stretcherBonusCents: int("stretcherBonusCents").default(0),
    lateNightBonusCents: int("lateNightBonusCents").default(0),
    weekendBonusCents: int("weekendBonusCents").default(0),

    // Deductions (in cents)
    fuelDeductionPerMileCents: int("fuelDeductionPerMileCents").default(0),
    tollPassthrough: boolean("tollPassthrough").default(true),

    // Effective dates
    effectiveFrom: date("effectiveFrom").notNull(),
    effectiveTo: date("effectiveTo"),

    // Audit
    createdBy: int("createdBy").references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ============================================================================
// Shadow Runs Table - Stores IDS optimization results for analysis
// ============================================================================

export const idsShadowRuns = mysqlTable("ids_shadow_runs", {
    id: int("id").autoincrement().primaryKey(),

    // Run metadata
    runDate: date("runDate").notNull(),
    runTimestamp: timestamp("runTimestamp").defaultNow().notNull(),

    // Input snapshot
    inputTripsCount: int("inputTripsCount").notNull(),
    inputDriversCount: int("inputDriversCount").notNull(),
    lockedTripsCount: int("lockedTripsCount").notNull(),

    // Results (JSON blob of full SolveResponse)
    resultJson: json("resultJson").notNull(),

    // Summary metrics for quick queries
    solveTimeMs: int("solveTimeMs").notNull(),
    assignedTrips: int("assignedTrips").notNull(),
    unassignedTrips: int("unassignedTrips").notNull(),
    vehiclesUsed: int("vehiclesUsed").notNull(),
    avgOnTimePercent: int("avgOnTimePercent").notNull(),
    totalPredictedEarningsCents: int("totalPredictedEarningsCents").notNull(),
    gapFillWins: int("gapFillWins").notNull(),

    // Comparison with actual (populated later)
    actualAssignmentsJson: json("actualAssignmentsJson"),
    tripsMatched: int("tripsMatched"),
    tripsDifferent: int("tripsDifferent"),
    earningsImprovementCents: int("earningsImprovementCents"),

    // Audit
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type IDSTrip = typeof idsTrips.$inferSelect;
export type InsertIDSTrip = typeof idsTrips.$inferInsert;

export type IDSDriverScore = typeof idsDriverScores.$inferSelect;
export type InsertIDSDriverScore = typeof idsDriverScores.$inferInsert;

export type IDSTemplateLock = typeof idsTemplateLocks.$inferSelect;
export type InsertIDSTemplateLock = typeof idsTemplateLocks.$inferInsert;

export type IDSPayRule = typeof idsPayRules.$inferSelect;
export type InsertIDSPayRule = typeof idsPayRules.$inferInsert;

export type IDSShadowRun = typeof idsShadowRuns.$inferSelect;
export type InsertIDSShadowRun = typeof idsShadowRuns.$inferInsert;


// ============================================================================
// Actual Runs Table - Stores actual dispatch data for comparison with shadow
// ============================================================================

export const idsActualRuns = mysqlTable("ids_actual_runs", {
    id: int("id").autoincrement().primaryKey(),

    // Run metadata
    serviceDate: date("serviceDate").notNull(),
    importTimestamp: timestamp("importTimestamp").defaultNow().notNull(),
    
    // Source info
    sourceFileName: varchar("sourceFileName", { length: 255 }),
    sourceFileHash: varchar("sourceFileHash", { length: 64 }), // SHA-256
    
    // Input counts
    totalTrips: int("totalTrips").notNull(),
    totalDrivers: int("totalDrivers").notNull(),
    
    // Summary metrics
    completedTrips: int("completedTrips").notNull(),
    cancelledTrips: int("cancelledTrips").notNull(),
    noShowTrips: int("noShowTrips").notNull(),
    onTimeTrips: int("onTimeTrips").notNull(),
    lateTrips: int("lateTrips").notNull(),
    avgOnTimePercent: int("avgOnTimePercent").notNull(),
    
    // Pay summary
    totalActualPayCents: int("totalActualPayCents").notNull(),
    totalMiles: int("totalMiles").notNull(),
    totalDeadheadMiles: int("totalDeadheadMiles").notNull(),
    
    // Raw data (no PHI - IDs only)
    rawDataJson: json("rawDataJson").notNull(),
    
    // Import audit
    importBatchId: varchar("importBatchId", { length: 36 }),
    rowsImported: int("rowsImported").notNull(),
    rowsSkipped: int("rowsSkipped").default(0),
    rowsErrored: int("rowsErrored").default(0),
    
    // Audit
    createdBy: int("createdBy").references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================================================
// Actual Driver Summary Table - Per-driver actual performance for comparison
// ============================================================================

export const idsActualDriverSummary = mysqlTable("ids_actual_driver_summary", {
    id: int("id").autoincrement().primaryKey(),
    
    // Foreign keys
    actualRunId: int("actualRunId").references(() => idsActualRuns.id).notNull(),
    driverId: int("driverId").references(() => drivers.id),
    
    // Driver identification (for matching when driverId not in system)
    externalDriverId: varchar("externalDriverId", { length: 100 }),
    driverName: varchar("driverName", { length: 200 }),
    
    // Trip counts
    totalTrips: int("totalTrips").notNull(),
    completedTrips: int("completedTrips").notNull(),
    cancelledTrips: int("cancelledTrips").default(0),
    noShowTrips: int("noShowTrips").default(0),
    
    // Time performance
    onTimeTrips: int("onTimeTrips").notNull(),
    lateTrips: int("lateTrips").default(0),
    onTimePercent: int("onTimePercent").notNull(),
    
    // Distance
    totalMiles: int("totalMiles").notNull(),
    deadheadMiles: int("deadheadMiles").default(0),
    
    // Pay
    actualPayCents: int("actualPayCents").notNull(),
    
    // Shift info
    shiftStart: time("shiftStart"),
    shiftEnd: time("shiftEnd"),
    
    // Vehicle
    vehicleId: int("vehicleId").references(() => vehicles.id),
    externalVehicleId: varchar("externalVehicleId", { length: 100 }),
    
    // Raw trip IDs (JSON array, no PHI)
    tripIds: json("tripIds"),
    
    // Audit
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================================================
// Comparison Results Table - Stores delta analysis between shadow and actual
// ============================================================================

export const idsComparisonResults = mysqlTable("ids_comparison_results", {
    id: int("id").autoincrement().primaryKey(),
    
    // Foreign keys
    shadowRunId: int("shadowRunId").references(() => idsShadowRuns.id).notNull(),
    actualRunId: int("actualRunId").references(() => idsActualRuns.id).notNull(),
    
    // Service date (denormalized for quick queries)
    serviceDate: date("serviceDate").notNull(),
    
    // Comparison timestamp
    comparedAt: timestamp("comparedAt").defaultNow().notNull(),
    
    // KPI Deltas
    onTimePercentDelta: int("onTimePercentDelta").notNull(), // predicted - actual
    deadheadMilesDelta: int("deadheadMilesDelta").notNull(),
    totalPayDeltaCents: int("totalPayDeltaCents").notNull(),
    
    // Assignment comparison
    tripsMatched: int("tripsMatched").notNull(), // Same driver assigned
    tripsDifferent: int("tripsDifferent").notNull(), // Different driver
    tripsOnlyInShadow: int("tripsOnlyInShadow").notNull(),
    tripsOnlyInActual: int("tripsOnlyInActual").notNull(),
    
    // Per-driver deltas (JSON array)
    driverDeltasJson: json("driverDeltasJson").notNull(),
    
    // Top causes for differences (JSON array)
    topCausesJson: json("topCausesJson").notNull(),
    
    // Audit
    createdBy: int("createdBy").references(() => users.id),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================================================
// Type Exports for new tables
// ============================================================================

export type IDSActualRun = typeof idsActualRuns.$inferSelect;
export type InsertIDSActualRun = typeof idsActualRuns.$inferInsert;

export type IDSActualDriverSummary = typeof idsActualDriverSummary.$inferSelect;
export type InsertIDSActualDriverSummary = typeof idsActualDriverSummary.$inferInsert;

export type IDSComparisonResult = typeof idsComparisonResults.$inferSelect;
export type InsertIDSComparisonResult = typeof idsComparisonResults.$inferInsert;
