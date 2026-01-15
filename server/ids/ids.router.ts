/**
 * IDS (Integral Dispatch System) tRPC Router
 * API endpoints for trip optimization
 * 
 * Safety: All endpoints check IDS_ENABLED before executing
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getIDSService } from "./ids.service";
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
import { getActualImportService } from "./ids.actual-import.service";

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
   * GET /api/ids/shadowRun/:id/compare
   * Compare shadow run results with actual dispatches
   */
  compareShadowRun: protectedProcedure
    .input(z.object({
      runId: z.number(),
    }))
    .query(async ({ input }) => {
      requireIDS();
      const ids = getIDSService();
      return ids.compareShadowWithActual(input.runId);
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

  // ============================================================================
  // Actual Import Endpoints
  // ============================================================================

  previewActualCSV: protectedProcedure
    .input(z.object({ csvContent: z.string() }))
    .mutation(async ({ input }) => {
      requireIDS();
      const importService = getActualImportService();
      return importService.previewCSV(input.csvContent);
    }),

  importActualCSV: protectedProcedure
    .input(z.object({
      csvContent: z.string(),
      fileName: z.string().optional(),
      // Partition fields (required)
      opcoId: z.enum(["SAHRAWI", "METRIX"]),
      brokerId: z.enum(["MODIVCARE", "MTM", "ACCESS2CARE"]),
      brokerAccountId: z.enum(["MODIVCARE_SAHRAWI", "MODIVCARE_METRIX", "MTM_MAIN", "A2C_MAIN"]),
    }))
    .mutation(async ({ input }) => {
      requireIDS();
      const importService = getActualImportService();
      return importService.importCSV(input.csvContent, input.fileName, {
        opcoId: input.opcoId,
        brokerId: input.brokerId,
        brokerAccountId: input.brokerAccountId,
      });
    }),

  getActualImports: protectedProcedure
    .input(z.object({
      opcoId: z.enum(["SAHRAWI", "METRIX"]).optional(),
      brokerAccountId: z.enum(["MODIVCARE_SAHRAWI", "MODIVCARE_METRIX", "MTM_MAIN", "A2C_MAIN"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      requireIDS();
      const importService = getActualImportService();
      return importService.getImports(input);
    }),

  getActualImport: protectedProcedure
    .input(z.object({ importId: z.number() }))
    .query(async ({ input }) => {
      requireIDS();
      const importService = getActualImportService();
      return importService.getImportById(input.importId);
    }),

  getActualTrips: protectedProcedure
    .input(z.object({
      serviceDate: z.string(),
      opcoId: z.enum(["SAHRAWI", "METRIX"]).optional(),
      brokerAccountId: z.enum(["MODIVCARE_SAHRAWI", "MODIVCARE_METRIX", "MTM_MAIN", "A2C_MAIN"]).optional(),
    }))
    .query(async ({ input }) => {
      requireIDS();
      const importService = getActualImportService();
      return importService.getActualTripsByDate(input.serviceDate, {
        opcoId: input.opcoId,
        brokerAccountId: input.brokerAccountId,
      });
    }),

  getActualDriverSummary: protectedProcedure
    .input(z.object({
      serviceDate: z.string(),
      opcoId: z.enum(["SAHRAWI", "METRIX"]).optional(),
      brokerAccountId: z.enum(["MODIVCARE_SAHRAWI", "MODIVCARE_METRIX", "MTM_MAIN", "A2C_MAIN"]).optional(),
    }))
    .query(async ({ input }) => {
      requireIDS();
      const importService = getActualImportService();
      return importService.getDriverSummaryByDate(input.serviceDate, {
        opcoId: input.opcoId,
        brokerAccountId: input.brokerAccountId,
      });
    }),

  compareWithActual: protectedProcedure
    .input(z.object({ shadowRunId: z.number() }))
    .query(async ({ input }) => {
      requireIDS();
      const ids = getIDSService();
      const importService = getActualImportService();
      
      const shadowRun = await ids.getShadowRunById(input.shadowRunId);
      if (!shadowRun) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Shadow run not found' });
      }
      
      // Use partition fields from shadow run to filter actual data
      // This ensures apples-to-apples comparison (Sahrawi vs Sahrawi, not Sahrawi vs Metrix)
      const partitionFilter = {
        opcoId: shadowRun.opcoId,
        brokerAccountId: shadowRun.brokerAccountId,
      };
      
      const actualSummary = await importService.getDriverSummaryByDate(shadowRun.runDate, partitionFilter);
      
      if (actualSummary.length === 0) {
        return {
          hasActualData: false,
          shadowRunId: input.shadowRunId,
          serviceDate: shadowRun.runDate,
          comparison: null,
        };
      }
      
      const shadowRoutes = shadowRun.result.routes;
      const comparison = {
        predicted: {
          onTimePercent: shadowRun.result.summary.averageOnTimePercentage,
          totalTrips: shadowRun.result.summary.assignedTrips,
          totalMiles: shadowRoutes.reduce((sum: number, r: any) => sum + r.totalMiles, 0),
          totalPay: shadowRun.result.summary.totalPredictedEarnings,
        },
        actual: {
          onTimePercent: actualSummary.reduce((sum, d) => sum + d.onTimePercent, 0) / actualSummary.length,
          totalTrips: actualSummary.reduce((sum, d) => sum + d.completedTrips, 0),
          totalMiles: actualSummary.reduce((sum, d) => sum + d.totalMiles, 0),
          totalPay: null as number | null,
        },
        delta: {
          onTimePercent: 0,
          totalTrips: 0,
          totalMiles: 0,
          totalPay: null as number | null,
        },
        driverDeltas: [] as any[],
        topCauses: [] as { cause: string; count: number; impact: string }[],
      };
      
      comparison.delta.onTimePercent = comparison.predicted.onTimePercent - comparison.actual.onTimePercent;
      comparison.delta.totalTrips = comparison.predicted.totalTrips - comparison.actual.totalTrips;
      comparison.delta.totalMiles = comparison.predicted.totalMiles - comparison.actual.totalMiles;
      
      const driverMap = new Map<string, any>();
      
      for (const route of shadowRoutes) {
        const driverName = `Driver ${route.driverId}`;
        driverMap.set(driverName, {
          driverName,
          predTrips: route.totalTrips,
          actualTrips: 0,
          predMiles: route.totalMiles,
          actualMiles: 0,
          predOnTime: route.onTimePercentage,
          actualOnTime: 0,
          predPay: route.predictedEarnings,
          actualPay: null,
          delta: null,
          flags: [],
        });
      }
      
      for (const actual of actualSummary) {
        let data = driverMap.get(actual.driverName);
        if (!data) {
          data = {
            driverName: actual.driverName,
            predTrips: 0, actualTrips: 0,
            predMiles: 0, actualMiles: 0,
            predOnTime: 0, actualOnTime: 0,
            predPay: 0, actualPay: null,
            delta: null, flags: [],
          };
          driverMap.set(actual.driverName, data);
        }
        data.actualTrips = actual.completedTrips;
        data.actualMiles = actual.totalMiles;
        data.actualOnTime = actual.onTimePercent;
        
        if (data.actualTrips < data.predTrips) data.flags.push('FEWER_TRIPS');
        else if (data.actualTrips > data.predTrips) data.flags.push('MORE_TRIPS');
        if (data.actualMiles > data.predMiles * 1.1) data.flags.push('MORE_MILES');
        else if (data.actualMiles < data.predMiles * 0.9) data.flags.push('FEWER_MILES');
        if (data.actualOnTime < data.predOnTime - 5) data.flags.push('LATE_PICKUPS');
      }
      
      comparison.driverDeltas = Array.from(driverMap.values());
      
      const causes = new Map<string, number>();
      for (const driver of comparison.driverDeltas) {
        for (const flag of driver.flags) {
          causes.set(flag, (causes.get(flag) || 0) + 1);
        }
      }
      
      comparison.topCauses = Array.from(causes.entries())
        .map(([cause, count]) => ({
          cause,
          count,
          impact: cause === 'MORE_MILES' ? `+${Math.round(comparison.delta.totalMiles)} mi` :
                  cause === 'LATE_PICKUPS' ? `${Math.round(comparison.delta.onTimePercent)}% on-time` :
                  `${count} drivers affected`,
        }))
        .sort((a, b) => b.count - a.count);
      
      return {
        hasActualData: true,
        shadowRunId: input.shadowRunId,
        serviceDate: shadowRun.runDate,
        comparison,
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
