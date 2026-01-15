/**
 * IDS (Integral Dispatch System) Types
 * Core data models for NEMT trip optimization
 */

import { z } from "zod";

// ============================================================================
// Enums
// ============================================================================

export const tripStatusEnum = z.enum([
    "pending",      // Trip created, not yet assigned
    "assigned",     // Trip assigned to driver
    "en_route",     // Driver en route to pickup
    "picked_up",    // Patient picked up
    "completed",    // Trip completed successfully
    "cancelled",    // Trip cancelled
    "no_show"       // Patient no-show
  ]);

export const mobilityTypeEnum = z.enum([
    "ambulatory",   // AMB - can walk
    "wheelchair",   // WC - wheelchair
    "stretcher"     // STR - stretcher
  ]);

export const templateLockTypeEnum = z.enum([
    "hard",         // Cannot be moved by optimizer
    "soft"          // Can be moved with penalty
  ]);

// ============================================================================
// Zod Schemas
// ============================================================================

/**
 * Location schema with geocoding support
 */
export const locationSchema = z.object({
    address: z.string(),
    city: z.string(),
    state: z.string().length(2),
    zip: z.string(),
    lat: z.number().optional(),
    lng: z.number().optional(),
});

/**
 * Time window schema for pickup/dropoff constraints
 */
export const timeWindowSchema = z.object({
    earliest: z.string(), // ISO datetime
    latest: z.string(),   // ISO datetime
    appointmentTime: z.string().optional(), // Actual appointment time
});

/**
 * Trip schema - represents a single NEMT trip request
 */
export const tripSchema = z.object({
    id: z.number(),
    externalId: z.string().optional(), // Broker/external system ID

    // Patient info
    patientName: z.string(),
    patientPhone: z.string().optional(),
    mobilityType: mobilityTypeEnum,

    // Locations
    pickup: locationSchema,
    dropoff: locationSchema,

    // Time constraints
    pickupWindow: timeWindowSchema,
    dropoffWindow: timeWindowSchema.optional(),

    // Service times (minutes)
    pickupServiceTime: z.number().default(5),  // Time to load patient
    dropoffServiceTime: z.number().default(5), // Time to unload patient
    maxRideTime: z.number().optional(),        // Max minutes in vehicle

    // Status
    status: tripStatusEnum.default("pending"),

    // Assignment
    assignedDriverId: z.number().optional(),
    assignedVehicleId: z.number().optional(),

    // Template lock
    isTemplateLocked: z.boolean().default(false),
    templateLockType: templateLockTypeEnum.optional(),

    // Metadata
    notes: z.string().optional(),
    brokerName: z.string().optional(),
    tripDate: z.string(), // YYYY-MM-DD
});

/**
 * Driver score schema - reliability/performance metrics
 */
export const driverScoreSchema = z.object({
    driverId: z.number(),

    // Reliability scores (0-100)
    onTimeScore: z.number().min(0).max(100).default(80),
    earlyBirdScore: z.number().min(0).max(100).default(50), // Prefers early shifts
    latenessRisk: z.number().min(0).max(100).default(20),
    cancellationRisk: z.number().min(0).max(100).default(10),

    // Training status
    isTrainee: z.boolean().default(false),
    traineeLevel: z.number().min(1).max(5).optional(),

    // Preferences
    preferredZones: z.array(z.string()).optional(), // City codes
    maxTripsPerDay: z.number().optional(),

    // Updated timestamp
    updatedAt: z.string(),
});

/**
 * Pay rule schema - for earnings prediction
 */
export const payRuleSchema = z.object({
    id: z.number(),
    name: z.string(),

    // Base rates
    baseRatePerTrip: z.number().optional(),      // Per-trip flat rate
    baseRatePerMile: z.number().optional(),      // Per-mile rate
    baseRatePerHour: z.number().optional(),      // Per-hour rate

    // Modifiers
    wheelchairBonus: z.number().default(0),
    stretcherBonus: z.number().default(0),
    lateNightBonus: z.number().default(0),       // After 8pm
    weekendBonus: z.number().default(0),

    // Deductions
    fuelDeductionPerMile: z.number().default(0),
    tollPassthrough: z.boolean().default(true),

    // Effective dates
    effectiveFrom: z.string(),
    effectiveTo: z.string().optional(),
});

// ============================================================================
// API Request/Response Schemas
// ============================================================================

/**
 * Solve request - input to the IDS optimizer
 */
export const solveRequestSchema = z.object({
    trips: z.array(tripSchema),
    availableDriverIds: z.array(z.number()),
    availableVehicleIds: z.array(z.number()),

    // Template locks
    lockedTripIds: z.array(z.number()).optional(),

    // Optimization date
    solveDate: z.string(), // YYYY-MM-DD

    // Options
    options: z.object({
          maxSolveTimeSeconds: z.number().default(30),
          prioritizeOnTime: z.boolean().default(true),
          prioritizeEarnings: z.boolean().default(false),
          allowOverbooking: z.boolean().default(false),
          shadowMode: z.boolean().default(true), // Don't dispatch, just compute
    }).optional(),
});

/**
 * Trip assignment result from optimizer
 */
export const tripAssignmentSchema = z.object({
    tripId: z.number(),
    driverId: z.number(),
    vehicleId: z.number(),

    // Route position
    routeOrder: z.number(),          // Position in driver's route

    // Predicted times
    predictedPickupTime: z.string(), // ISO datetime
    predictedDropoffTime: z.string(),
    predictedArrivalMinutes: z.number(), // Minutes before/after window

    // Is this a "gap fill" (added to template route)
    isGapFill: z.boolean().default(false),
});

/**
 * Driver route result
 */
export const driverRouteSchema = z.object({
    driverId: z.number(),
    vehicleId: z.number(),

    // Route summary
    assignments: z.array(tripAssignmentSchema),
    totalTrips: z.number(),
    totalMiles: z.number(),
    totalHours: z.number(),

    // Performance metrics
    onTimePercentage: z.number(),
    templateTrips: z.number(),
    gapFillTrips: z.number(),

    // Earnings prediction
    predictedEarnings: z.number(),
    earningsBreakdown: z.object({
          baseEarnings: z.number(),
          bonuses: z.number(),
          deductions: z.number(),
    }).optional(),
});

/**
 * Solve response - output from IDS optimizer
 */
export const solveResponseSchema = z.object({
    success: z.boolean(),
    solveTimeMs: z.number(),

    // Routes by driver
    routes: z.array(driverRouteSchema),

    // Unassigned trips (couldn't fit)
    unassignedTripIds: z.array(z.number()),

    // Summary metrics
    summary: z.object({
          totalTrips: z.number(),
          assignedTrips: z.number(),
          unassignedTrips: z.number(),
          totalVehiclesUsed: z.number(),
          averageOnTimePercentage: z.number(),
          totalPredictedEarnings: z.number(),
          gapFillWins: z.number(), // Empty seats captured
    }),

    // Warnings/notes
    warnings: z.array(z.string()).optional(),
});

/**
 * Shadow mode result storage
 */
export const shadowRunSchema = z.object({
    id: z.number(),
    runDate: z.string(),     // YYYY-MM-DD
    runTimestamp: z.string(), // ISO datetime

    // Input snapshot
    inputTripsCount: z.number(),
    inputDriversCount: z.number(),
    lockedTripsCount: z.number(),

    // Results
    result: solveResponseSchema,

    // Comparison with actual (if available)
    actualAssignments: z.record(z.string(), z.number()).optional(), // tripId -> driverId
});

// ============================================================================
// Type Exports
// ============================================================================

export type TripStatus = z.infer<typeof tripStatusEnum>;
export type MobilityType = z.infer<typeof mobilityTypeEnum>;
export type TemplateLockType = z.infer<typeof templateLockTypeEnum>;

export type Location = z.infer<typeof locationSchema>;
export type TimeWindow = z.infer<typeof timeWindowSchema>;
export type Trip = z.infer<typeof tripSchema>;
export type DriverScore = z.infer<typeof driverScoreSchema>;
export type PayRule = z.infer<typeof payRuleSchema>;

export type SolveRequest = z.infer<typeof solveRequestSchema>;
export type TripAssignment = z.infer<typeof tripAssignmentSchema>;
export type DriverRoute = z.infer<typeof driverRouteSchema>;
export type SolveResponse = z.infer<typeof solveResponseSchema>;
export type ShadowRun = z.infer<typeof shadowRunSchema>;
