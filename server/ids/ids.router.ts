/**
 * IDS (Integral Dispatch System) tRPC Router
 * API endpoints for trip optimization
 * 
 * Safety: All endpoints check IDS_ENABLED before executing
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { 
  getIDSService,
  importActualDispatch,
  getActualRun,
  getActualRunByDate,
  compareShadowWithActual,
} from "./ids.service";
import { 
  isIDSEnabled, 
  isIDSShadowMode, 
  getIDSStatus,
  loadIDSConfig 
} from "./ids.config";
import {
  solveRequestSchema,
  solveResponseSchema,
  tripSchema,
} from "./ids.types";
import { TRPCError } from "@trpc/server";

// ============================================================================
// Guard Middleware
// ============================================================================

/**
 * Check if IDS is enabled before allowing any operation
 */
function requireIDS() {
  if (!isIDSEnabled()) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'IDS is disabled. Set IDS_ENABLED=true to enable.',
    });
  }
}

// ============================================================================
// IDS Router
// ============================================================================

export const idsRouter = router({
  /**
   * GET /api/ids/status
   * Get current IDS configuration status
   */
  getStatus: protectedProcedure
    .query(async () => {
      return getIDSStatus();
    }),

  /**
   * GET /api/ids/config
   * Get current IDS configuration
   */
  getConfig: protectedProcedure
    .query(async () => {
      const config = loadIDSConfig();
      return {
        enabled: config.enabled,
        shadowModeEnabled: config.shadowMode,
        maxSolveTimeSeconds: config.maxSolveTimeSeconds,
        enableEarningsPrediction: config.enableEarningsPrediction,
        version: "0.2.0",
      };
    }),

  /**
   * POST /api/ids/solve
   * Main optimization endpoint - accepts trips, drivers, vehicles and returns optimized assignments
   * In shadow mode: saves to ids_shadow_runs only
   */
  solve: protectedProcedure
    .input(solveRequestSchema)
    .output(solveResponseSchema)
    .mutation(async ({ input, ctx }) => {
      requireIDS();
      
      const shadowMode = isIDSShadowMode();
      const ids = getIDSService({ shadowMode });

      // Log the solve request
      console.log(`[IDS] Solve request from user ${ctx.user?.id}:`, {
        trips: input.trips.length,
        drivers: input.availableDriverIds.length,
        vehicles: input.availableVehicleIds.length,
        lockedTrips: input.lockedTripIds?.length || 0,
        date: input.solveDate,
        shadowMode,
      });

      const result = await ids.solve(input);

      console.log(`[IDS] Solve completed:`, {
        success: result.success,
        solveTimeMs: result.solveTimeMs,
        assigned: result.summary.assignedTrips,
        unassigned: result.summary.unassignedTrips,
        gapFills: result.summary.gapFillWins,
        earnings: result.summary.totalPredictedEarnings,
        shadowMode,
      });

      return result;
    }),

  /**
   * POST /api/ids/solveFromCSV
   * Parse MediRoute CSV and run shadow solve
   */
  solveFromCSV: protectedProcedure
    .input(z.object({
      csvContent: z.string(),
      solveDate: z.string(),
      availableDriverIds: z.array(z.number()),
      availableVehicleIds: z.array(z.number()),
    }))
    .mutation(async ({ input, ctx }) => {
      requireIDS();
      
      const shadowMode = isIDSShadowMode();
      if (!shadowMode) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'CSV solve is only available in shadow mode for safety.',
        });
      }

      // Parse CSV into trips
      const trips = parseCSVToTrips(input.csvContent, input.solveDate);
      
      const ids = getIDSService({ shadowMode: true });
      const result = await ids.solve({
        trips,
        availableDriverIds: input.availableDriverIds,
        availableVehicleIds: input.availableVehicleIds,
        solveDate: input.solveDate,
        options: {
          maxSolveTimeSeconds: 30,
          prioritizeOnTime: true,
          prioritizeEarnings: false,
          allowOverbooking: false,
          shadowMode: true,
        },
      });

      // Store shadow run and return with ID
      const shadowRunId = await ids.storeShadowRunAndGetId({
        solveDate: input.solveDate,
        inputTripsCount: trips.length,
        inputDriversCount: input.availableDriverIds.length,
        lockedTripsCount: 0,
        result,
      });

      return {
        shadowRunId,
        result,
      };
    }),

  /**
   * GET /api/ids/shadowRuns
   * Retrieve shadow run history for analysis
   */
  getShadowRuns: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      requireIDS();
      const ids = getIDSService();
      return ids.getShadowRunHistory(
        input.startDate || '2020-01-01',
        input.endDate || '2099-12-31',
        input.limit
      );
    }),

  /**
   * GET /api/ids/shadowRun/:id
   * Get a specific shadow run by ID
   */
  getShadowRun: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input }) => {
      requireIDS();
      const ids = getIDSService();
      return ids.getShadowRunById(input.id);
    }),

  /**
   * POST /api/ids/importActual
   * Import actual dispatch CSV for comparison
   */
  importActual: protectedProcedure
    .input(z.object({
      serviceDate: z.string(),
      csvContent: z.string(),
      sourceFileName: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      requireIDS();
      
      console.log(`[IDS] Importing actual dispatch from user ${ctx.user?.id}:`, {
        serviceDate: input.serviceDate,
        fileName: input.sourceFileName,
        contentLength: input.csvContent.length,
      });

      const result = importActualDispatch(
        input.serviceDate,
        input.csvContent,
        input.sourceFileName
      );

      console.log(`[IDS] Actual import completed:`, {
        actualRunId: result.actualRunId,
        totalTrips: result.summary.totalTrips,
        totalDrivers: result.summary.totalDrivers,
        completedTrips: result.summary.completedTrips,
      });

      return result;
    }),

  /**
   * GET /api/ids/actualRun/:id
   * Get a specific actual run by ID
   */
  getActualRun: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input }) => {
      requireIDS();
      return getActualRun(input.id);
    }),

  /**
   * GET /api/ids/actualRunByDate
   * Get actual run by service date
   */
  getActualRunByDate: protectedProcedure
    .input(z.object({
      serviceDate: z.string(),
    }))
    .query(async ({ input }) => {
      requireIDS();
      return getActualRunByDate(input.serviceDate);
    }),

  /**
   * GET /api/ids/shadowRun/:id/compare
   * Compare shadow run results with actual dispatches
   */
  compareShadowRun: protectedProcedure
    .input(z.object({
      shadowRunId: z.number(),
      actualRunId: z.number(),
    }))
    .query(async ({ input }) => {
      requireIDS();
      return compareShadowWithActual(input.shadowRunId, input.actualRunId);
    }),

  /**
   * POST /api/ids/validateTrips
   * Validate trip data before optimization
   */
  validateTrips: protectedProcedure
    .input(z.object({
      trips: z.array(tripSchema),
    }))
    .mutation(async ({ input }) => {
      requireIDS();
      
      const errors: { tripId: number; errors: string[] }[] = [];

      for (const trip of input.trips) {
        const tripErrors: string[] = [];

        // Validate time windows
        const pickupEarliest = new Date(trip.pickupWindow.earliest);
        const pickupLatest = new Date(trip.pickupWindow.latest);

        if (pickupLatest <= pickupEarliest) {
          tripErrors.push("Pickup window latest must be after earliest");
        }

        // Validate locations have coordinates (needed for distance calc)
        if (!trip.pickup.lat || !trip.pickup.lng) {
          tripErrors.push("Pickup location missing coordinates");
        }
        if (!trip.dropoff.lat || !trip.dropoff.lng) {
          tripErrors.push("Dropoff location missing coordinates");
        }

        if (tripErrors.length > 0) {
          errors.push({ tripId: trip.id, errors: tripErrors });
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        totalTrips: input.trips.length,
        invalidTrips: errors.length,
      };
    }),
});

// ============================================================================
// CSV Parsing Helper
// ============================================================================

interface ParsedTrip {
  id: number;
  externalId?: string;
  patientName: string;
  patientPhone?: string;
  mobilityType: "ambulatory" | "wheelchair" | "stretcher";
  pickup: {
    address: string;
    city: string;
    state: string;
    zip: string;
    lat?: number;
    lng?: number;
  };
  dropoff: {
    address: string;
    city: string;
    state: string;
    zip: string;
    lat?: number;
    lng?: number;
  };
  pickupWindow: {
    earliest: string;
    latest: string;
    appointmentTime?: string;
  };
  dropoffWindow?: {
    earliest: string;
    latest: string;
  };
  pickupServiceTime: number;
  dropoffServiceTime: number;
  status: "pending";
  isTemplateLocked: boolean;
  tripDate: string;
  notes?: string;
  brokerName?: string;
}

/**
 * Parse MediRoute CSV format into IDS Trip objects
 * Expected columns: TripID, MemberName, MobilityType, PickupAddress, PickupCity, 
 *                   PickupState, PickupZip, DropoffAddress, DropoffCity, DropoffState,
 *                   DropoffZip, PickupTime, AppointmentTime, Notes
 */
function parseCSVToTrips(csvContent: string, solveDate: string): ParsedTrip[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'CSV must have header row and at least one data row',
    });
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
  const trips: ParsedTrip[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx]?.trim() || '';
    });

    // Map mobility type
    let mobilityType: "ambulatory" | "wheelchair" | "stretcher" = "ambulatory";
    const mobRaw = (row['mobilitytype'] || row['mobility'] || 'AMB').toUpperCase();
    if (mobRaw.includes('WC') || mobRaw.includes('WHEEL')) {
      mobilityType = 'wheelchair';
    } else if (mobRaw.includes('STR')) {
      mobilityType = 'stretcher';
    }

    // Parse times
    const pickupTime = row['pickuptime'] || row['pickup'] || '08:00';
    const appointmentTime = row['appointmenttime'] || row['appt'] || row['appointment'];
    
    // Create pickup window (30 min before/after pickup time)
    const pickupDate = new Date(`${solveDate}T${pickupTime}`);
    const pickupEarliest = new Date(pickupDate.getTime() - 15 * 60000);
    const pickupLatest = new Date(pickupDate.getTime() + 15 * 60000);

    const trip: ParsedTrip = {
      id: i,
      externalId: row['tripid'] || row['id'] || String(i),
      patientName: row['membername'] || row['patient'] || row['name'] || `Patient ${i}`,
      patientPhone: row['phone'] || row['memberphone'],
      mobilityType,
      pickup: {
        address: row['pickupaddress'] || row['pickup_address'] || '',
        city: row['pickupcity'] || row['pickup_city'] || '',
        state: row['pickupstate'] || row['pickup_state'] || 'VA',
        zip: row['pickupzip'] || row['pickup_zip'] || '',
      },
      dropoff: {
        address: row['dropoffaddress'] || row['dropoff_address'] || '',
        city: row['dropoffcity'] || row['dropoff_city'] || '',
        state: row['dropoffstate'] || row['dropoff_state'] || 'VA',
        zip: row['dropoffzip'] || row['dropoff_zip'] || '',
      },
      pickupWindow: {
        earliest: pickupEarliest.toISOString(),
        latest: pickupLatest.toISOString(),
        appointmentTime: appointmentTime ? `${solveDate}T${appointmentTime}` : undefined,
      },
      pickupServiceTime: 5,
      dropoffServiceTime: 5,
      status: "pending",
      isTemplateLocked: false,
      tripDate: solveDate,
      notes: row['notes'] || row['comment'],
      brokerName: row['broker'] || 'MediRoute',
    };

    trips.push(trip);
  }

  return trips;
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
}

export type IDSRouter = typeof idsRouter;
