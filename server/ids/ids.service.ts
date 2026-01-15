/**
 * IDS (Integral Dispatch System) Service
 * Main orchestration layer for trip optimization
 */

import type {
    Trip,
    SolveRequest,
    SolveResponse,
    DriverRoute,
    TripAssignment,
    DriverScore,
    PayRule,
    ShadowRun,
} from "./ids.types";

import {
    solveRequestSchema,
    solveResponseSchema,
} from "./ids.types";

// ============================================================================
// Configuration
// ============================================================================

interface IDSConfig {
    shadowMode: boolean;           // If true, don't dispatch results
  maxSolveTimeSeconds: number;   // Solver time limit
  defaultServiceTimeMinutes: number;
    maxRideTimeMinutes: number;
    enableEarningsPrediction: boolean;
}

const DEFAULT_CONFIG: IDSConfig = {
    shadowMode: true,
    maxSolveTimeSeconds: 30,
    defaultServiceTimeMinutes: 5,
    maxRideTimeMinutes: 90,
    enableEarningsPrediction: true,
};

// ============================================================================
// IDS Service Class
// ============================================================================

export class IDSService {
    private config: IDSConfig;

  constructor(config: Partial<IDSConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
     * Main solve endpoint - optimizes trip assignments
     */
  async solve(request: SolveRequest): Promise<SolveResponse> {
        const startTime = Date.now();

      // Validate request
      const validatedRequest = solveRequestSchema.parse(request);

      // Extract locked template trips
      const lockedTripIds = new Set(validatedRequest.lockedTripIds || []);
        const lockedTrips = validatedRequest.trips.filter(t => lockedTripIds.has(t.id));
        const unlockedTrips = validatedRequest.trips.filter(t => !lockedTripIds.has(t.id));

      // TODO: Phase 2 - Call OR-Tools VRPPD+TW solver
      // For now, use greedy assignment as baseline
      const result = await this.greedyAssignment(
              validatedRequest.trips,
              validatedRequest.availableDriverIds,
              validatedRequest.availableVehicleIds,
              lockedTripIds
            );

      const solveTimeMs = Date.now() - startTime;

      const response: SolveResponse = {
              success: true,
              solveTimeMs,
              routes: result.routes,
              unassignedTripIds: result.unassignedTripIds,
              summary: {
                        totalTrips: validatedRequest.trips.length,
                        assignedTrips: validatedRequest.trips.length - result.unassignedTripIds.length,
                        unassignedTrips: result.unassignedTripIds.length,
                        totalVehiclesUsed: result.routes.length,
                        averageOnTimePercentage: this.calculateAverageOnTime(result.routes),
                        totalPredictedEarnings: this.calculateTotalEarnings(result.routes),
                        gapFillWins: result.routes.reduce((sum, r) => sum + r.gapFillTrips, 0),
              },
              warnings: result.warnings,
      };

      // Store shadow run result if in shadow mode
      if (this.config.shadowMode) {
              await this.storeShadowRun(validatedRequest, response);
      }

      return solveResponseSchema.parse(response);
  }

  /**
     * Greedy assignment algorithm (baseline before OR-Tools integration)
     * Respects template locks, fills gaps in veteran routes
     */
  private async greedyAssignment(
        trips: Trip[],
        driverIds: number[],
        vehicleIds: number[],
        lockedTripIds: Set<number>
      ): Promise<{
        routes: DriverRoute[];
        unassignedTripIds: number[];
        warnings: string[];
  }> {
        const routes: Map<number, DriverRoute> = new Map();
        const unassignedTripIds: number[] = [];
        const warnings: string[] = [];

      // Initialize routes for each driver-vehicle pair
      const driverVehiclePairs = driverIds.slice(0, vehicleIds.length).map((driverId, i) => ({
              driverId,
              vehicleId: vehicleIds[i],
      }));

      for (const { driverId, vehicleId } of driverVehiclePairs) {
              routes.set(driverId, {
                        driverId,
                        vehicleId,
                        assignments: [],
                        totalTrips: 0,
                        totalMiles: 0,
                        totalHours: 0,
                        onTimePercentage: 100,
                        templateTrips: 0,
                        gapFillTrips: 0,
                        predictedEarnings: 0,
              });
      }

      // Sort trips: locked first, then by pickup time
      const sortedTrips = [...trips].sort((a, b) => {
              const aLocked = lockedTripIds.has(a.id) ? 0 : 1;
              const bLocked = lockedTripIds.has(b.id) ? 0 : 1;
              if (aLocked !== bLocked) return aLocked - bLocked;
              return a.pickupWindow.earliest.localeCompare(b.pickupWindow.earliest);
      });

      // Assign trips
      let routeOrderCounter: Map<number, number> = new Map();
        for (const { driverId } of driverVehiclePairs) {
                routeOrderCounter.set(driverId, 0);
        }

      for (const trip of sortedTrips) {
              const isLocked = lockedTripIds.has(trip.id);

          // Find best driver for this trip
          let bestDriverId: number | null = null;
              let bestScore = -Infinity;

          for (const { driverId, vehicleId } of driverVehiclePairs) {
                    const route = routes.get(driverId)!;

                // If trip is locked, it must go to its assigned driver
                if (isLocked && trip.assignedDriverId) {
                            if (driverId === trip.assignedDriverId) {
                                          bestDriverId = driverId;
                                          break;
                            }
                            continue;
                }

                // Score this assignment (simple heuristic for now)
                const tripCount = route.assignments.length;
                    const score = 100 - tripCount * 10; // Prefer less busy drivers

                if (score > bestScore) {
                            bestScore = score;
                            bestDriverId = driverId;
                }
          }

          if (bestDriverId !== null) {
                    const route = routes.get(bestDriverId)!;
                    const order = routeOrderCounter.get(bestDriverId)! + 1;
                    routeOrderCounter.set(bestDriverId, order);

                const assignment: TripAssignment = {
                            tripId: trip.id,
                            driverId: bestDriverId,
                            vehicleId: route.vehicleId,
                            routeOrder: order,
                            predictedPickupTime: trip.pickupWindow.earliest,
                            predictedDropoffTime: trip.dropoffWindow?.earliest || trip.pickupWindow.latest,
                            predictedArrivalMinutes: 0, // On time
                            isGapFill: !isLocked,
                };

                route.assignments.push(assignment);
                    route.totalTrips++;
                    route.totalMiles += 10; // Placeholder - would need actual distance calc
                route.totalHours += 0.5; // Placeholder

                if (isLocked) {
                            route.templateTrips++;
                } else {
                            route.gapFillTrips++;
                }
          } else {
                    unassignedTripIds.push(trip.id);
                    warnings.push(`Trip ${trip.id} could not be assigned`);
          }
      }

      // Calculate earnings for each route
      if (this.config.enableEarningsPrediction) {
              for (const route of routes.values()) {
                        route.predictedEarnings = this.estimateRouteEarnings(route);
              }
      }

      return {
              routes: Array.from(routes.values()).filter(r => r.totalTrips > 0),
              unassignedTripIds,
              warnings,
      };
  }

  /**
     * Estimate earnings for a route based on pay rules
     */
  private estimateRouteEarnings(route: DriverRoute): number {
        // Simplified earnings calculation
      // TODO: Load actual pay rules from DB
      const BASE_PER_TRIP = 15;
        const PER_MILE = 0.50;

      return (route.totalTrips * BASE_PER_TRIP) + (route.totalMiles * PER_MILE);
  }

  /**
     * Calculate average on-time percentage across routes
     */
  private calculateAverageOnTime(routes: DriverRoute[]): number {
        if (routes.length === 0) return 100;
        return routes.reduce((sum, r) => sum + r.onTimePercentage, 0) / routes.length;
  }

  /**
     * Calculate total predicted earnings
     */
  private calculateTotalEarnings(routes: DriverRoute[]): number {
        return routes.reduce((sum, r) => sum + r.predictedEarnings, 0);
  }

  /**
     * Store shadow run result for later analysis
     */
  private async storeShadowRun(request: SolveRequest, response: SolveResponse): Promise<void> {
        // TODO: Implement DB storage
      console.log("[IDS Shadow Mode] Run completed:", {
              date: request.solveDate,
              trips: request.trips.length,
              assigned: response.summary.assignedTrips,
              gapFills: response.summary.gapFillWins,
              earnings: response.summary.totalPredictedEarnings,
      });
  }

  /**
     * Get shadow run history for analysis
     */
  async getShadowRunHistory(startDate: string, endDate: string): Promise<ShadowRun[]> {
        // TODO: Implement DB query
      return [];
  }

  /**
     * Compare shadow run results with actual dispatches
     */
  async compareShadowWithActual(runId: number): Promise<{
        tripsMatched: number;
        tripsDifferent: number;
        earningsImprovement: number;
  }> {
        // TODO: Implement comparison logic
      return {
              tripsMatched: 0,
              tripsDifferent: 0,
              earningsImprovement: 0,
      };
  }
}

// ============================================================================
// Singleton instance for API routes
// ============================================================================

let idsServiceInstance: IDSService | null = null;

export function getIDSService(config?: Partial<IDSConfig>): IDSService {
    if (!idsServiceInstance) {
          idsServiceInstance = new IDSService(config);
    }
    return idsServiceInstance;
}

export function resetIDSService(): void {
    idsServiceInstance = null;
}
