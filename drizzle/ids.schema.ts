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
// Actual Trips Table - Stores imported completed trips from MediRoute
// PHI-stripped: no patient names, phones, DOB, or full addresses
// ============================================================================

export const idsActualTrips = mysqlTable("ids_actual_trips", {
    id: int("id").autoincrement().primaryKey(),

    // Import reference
    importId: int("importId").references(() => idsImportAudit.id).notNull(),

    // Trip identification (from Trip Id column)
    tripId: varchar("tripId", { length: 100 }).notNull(),
    serviceDate: date("serviceDate").notNull(),

    // Assignment (no PHI)
    driverName: varchar("driverName", { length: 200 }).notNull(),
    vehicleUnit: varchar("vehicleUnit", { length: 50 }),

    // Trip type
    mobilityType: varchar("mobilityType", { length: 20 }).notNull(), // AMB, WC, STR
    tripType: varchar("tripType", { length: 20 }), // A (appointment), W (will-call)

    // Scheduled times
    schedPickupTime: time("schedPickupTime"),
    appointmentTime: time("appointmentTime"),

    // Actual times
    actualPickupArrive: time("actualPickupArrive"),
    actualPickupPerform: time("actualPickupPerform"),
    actualDropoffArrive: time("actualDropoffArrive"),
    actualDropoffPerform: time("actualDropoffPerform"),

    // Miles (SSOT: Routed Distance preferred, else Distance)
    milesActual: decimal("milesActual", { precision: 8, scale: 2 }),

    // GPS coordinates (for template mining, no address text)
    pickupLat: decimal("pickupLat", { precision: 10, scale: 7 }),
    pickupLon: decimal("pickupLon", { precision: 10, scale: 7 }),
    dropoffLat: decimal("dropoffLat", { precision: 10, scale: 7 }),
    dropoffLon: decimal("dropoffLon", { precision: 10, scale: 7 }),

    // Status flags
    status: varchar("status", { length: 20 }).notNull().default("completed"), // completed, cancelled, no_show
    isCancelled: boolean("isCancelled").default(false),
    isNoShow: boolean("isNoShow").default(false),
    isStanding: boolean("isStanding").default(false),
    isWillCall: boolean("isWillCall").default(false),

    // Computed on-time flag
    wasOnTime: boolean("wasOnTime"),

    // Audit
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ============================================================================
// Import Audit Table - Tracks CSV imports with file hash for idempotency
// ============================================================================

export const idsImportAudit = mysqlTable("ids_import_audit", {
    id: int("id").autoincrement().primaryKey(),

    // File identification
    fileHash: varchar("fileHash", { length: 64 }).notNull().unique(), // SHA-256
    fileName: varchar("fileName", { length: 255 }),
    fileSize: int("fileSize"),

    // Import stats
    totalRows: int("totalRows").notNull(),
    importedRows: int("importedRows").notNull(),
    skippedRows: int("skippedRows").notNull().default(0),
    errorRows: int("errorRows").notNull().default(0),

    // Date range covered
    serviceDateFrom: date("serviceDateFrom"),
    serviceDateTo: date("serviceDateTo"),

    // "Nothing dropped" proof
    accountedRows: int("accountedRows").notNull(), // imported + skipped + error = total
    isComplete: boolean("isComplete").notNull().default(false),

    // Audit
    importedBy: int("importedBy").references(() => users.id),
    importedAt: timestamp("importedAt").defaultNow().notNull(),
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

export type IDSActualTrip = typeof idsActualTrips.$inferSelect;
export type InsertIDSActualTrip = typeof idsActualTrips.$inferInsert;

export type IDSImportAudit = typeof idsImportAudit.$inferSelect;
export type InsertIDSImportAudit = typeof idsImportAudit.$inferInsert;
