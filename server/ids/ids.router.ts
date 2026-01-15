/**
 * IDS (Integral Dispatch System) tRPC Router
 * API endpoints for trip optimization
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getIDSService } from "./ids.service";
import {
    solveRequestSchema,
    solveResponseSchema,
    tripSchema,
    driverScoreSchema,
} from "./ids.types";

// ============================================================================
// IDS Router
// ============================================================================

export const idsRouter = router({
    /**
         * POST /api/ids/solve
     * Main optimization endpoint - accepts trips, drivers, vehicles and returns optimized assignments
     */
                                  solve: protectedProcedure
      .input(solveRequestSchema)
      .output(solveResponseSchema)
      .mutation(async ({ input, ctx }) => {
              const ids = getIDSService();

                      // Log the solve request
                      console.log(`[IDS] Solve request from user ${ctx.user?.id}:`, {
                                trips: input.trips.length,
                                drivers: input.availableDriverIds.length,
                                vehicles: input.availableVehicleIds.length,
                                lockedTrips: input.lockedTripIds?.length || 0,
                                date: input.solveDate,
                                shadowMode: input.options?.shadowMode ?? true,
                      });

                      const result = await ids.solve(input);

                      console.log(`[IDS] Solve completed:`, {
                                success: result.success,
                                solveTimeMs: result.solveTimeMs,
                                assigned: result.summary.assignedTrips,
                                unassigned: result.summary.unassignedTrips,
                                gapFills: result.summary.gapFillWins,
                                earnings: result.summary.totalPredictedEarnings,
                      });

                      return result;
      }),

    /**
         * GET /api/ids/shadowRuns
     * Retrieve shadow run history for analysis
     */
    getShadowRuns: protectedProcedure
      .input(z.object({
              startDate: z.string(),
              endDate: z.string(),
      }))
      .query(async ({ input }) => {
              const ids = getIDSService();
              return ids.getShadowRunHistory(input.startDate, input.endDate);
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

    /**
         * GET /api/ids/config
     * Get current IDS configuration
     */
    getConfig: protectedProcedure
      .query(async () => {
              // Return safe-to-expose configuration
                   return {
                             shadowModeEnabled: true,
                             maxSolveTimeSeconds: 30,
                             maxRideTimeMinutes: 90,
                             version: "0.1.0",
                   };
      }),
});

export type IDSRouter = typeof idsRouter;
