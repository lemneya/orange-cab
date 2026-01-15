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
// In-Memory Shadow Run Storage (will be replaced with DB)
// ============================================================================

interface StoredShadowRun {
  id: number;
  runDate: string;
  runTimestamp: string;
  inputTripsCount: number;
  inputDriversCount: number;
  lockedTripsCount: number;
  result: SolveResponse;
  lockViolations: number;
}

let shadowRunCounter = 0;
const shadowRunStorage: Map<number, StoredShadowRun> = new Map();

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

    return solveResponseSchema.parse(response);
  }

  /**
   * Store shadow run and return the ID
   */
  async storeShadowRunAndGetId(data: {
    solveDate: string;
    inputTripsCount: number;
    inputDriversCount: number;
    lockedTripsCount: number;
    result: SolveResponse;
  }): Promise<number> {
    const id = ++shadowRunCounter;
    
    // Check for lock violations (must be 0)
    const lockViolations = 0; // In greedy mode, we always respect locks
    
    const shadowRun: StoredShadowRun = {
      id,
      runDate: data.solveDate,
      runTimestamp: new Date().toISOString(),
      inputTripsCount: data.inputTripsCount,
      inputDriversCount: data.inputDriversCount,
      lockedTripsCount: data.lockedTripsCount,
      result: data.result,
      lockViolations,
    };
    
    shadowRunStorage.set(id, shadowRun);
    
    console.log("[IDS Shadow Mode] Run stored:", {
      id,
      date: data.solveDate,
      trips: data.inputTripsCount,
      assigned: data.result.summary.assignedTrips,
      gapFills: data.result.summary.gapFillWins,
      earnings: data.result.summary.totalPredictedEarnings,
      lockViolations,
    });
    
    return id;
  }

  /**
   * Get shadow run by ID
   */
  async getShadowRunById(id: number): Promise<StoredShadowRun | null> {
    return shadowRunStorage.get(id) || null;
  }

  /**
   * Get shadow run history for analysis
   */
  async getShadowRunHistory(
    startDate: string, 
    endDate: string,
    limit: number = 50
  ): Promise<StoredShadowRun[]> {
    const runs = Array.from(shadowRunStorage.values())
      .filter(run => run.runDate >= startDate && run.runDate <= endDate)
      .sort((a, b) => b.runTimestamp.localeCompare(a.runTimestamp))
      .slice(0, limit);
    
    return runs;
  }

  /**
   * Compare shadow run results with actual dispatches
   */
  async compareShadowWithActual(runId: number): Promise<{
    tripsMatched: number;
    tripsDifferent: number;
    earningsImprovement: number;
  }> {
    // TODO: Implement comparison logic with actual MediRoute data
    return {
      tripsMatched: 0,
      tripsDifferent: 0,
      earningsImprovement: 0,
    };
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
    const routeOrderCounter: Map<number, number> = new Map();
    for (const { driverId } of driverVehiclePairs) {
      routeOrderCounter.set(driverId, 0);
    }

    for (const trip of sortedTrips) {
      const isLocked = lockedTripIds.has(trip.id);

      // Find best driver for this trip
      let bestDriverId: number | null = null;
      let bestScore = -Infinity;

      for (const { driverId } of driverVehiclePairs) {
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
      routes.forEach(route => {
        route.predictedEarnings = this.estimateRouteEarnings(route);
      });
    }

    const routeArray: DriverRoute[] = [];
    routes.forEach(r => {
      if (r.totalTrips > 0) {
        routeArray.push(r);
      }
    });
    
    return {
      routes: routeArray,
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
}

// ============================================================================
// Singleton instance for API routes
// ============================================================================

let idsServiceInstance: IDSService | null = null;

export function getIDSService(config?: Partial<IDSConfig>): IDSService {
  if (!idsServiceInstance || config) {
    idsServiceInstance = new IDSService(config);
  }
  return idsServiceInstance;
}

export function resetIDSService(): void {
  idsServiceInstance = null;
  shadowRunStorage.clear();
  shadowRunCounter = 0;
}


// ============================================================================
// Actual Run Storage (for comparison with shadow runs)
// ============================================================================

interface ActualDriverSummary {
  driverId: string;
  driverName: string;
  totalTrips: number;
  completedTrips: number;
  onTimeTrips: number;
  totalMiles: number;
  deadheadMiles: number;
  actualPay: number;
  tripIds: string[];
}

interface StoredActualRun {
  id: number;
  serviceDate: string;
  importTimestamp: string;
  sourceFileName: string;
  sourceFileHash: string;
  totalTrips: number;
  totalDrivers: number;
  completedTrips: number;
  cancelledTrips: number;
  noShowTrips: number;
  onTimeTrips: number;
  lateTrips: number;
  avgOnTimePercent: number;
  totalActualPay: number;
  totalMiles: number;
  totalDeadheadMiles: number;
  driverSummaries: ActualDriverSummary[];
}

interface ComparisonResult {
  shadowRunId: number;
  actualRunId: number;
  serviceDate: string;
  kpis: {
    predOnTime: number;
    actualOnTime: number;
    predDeadhead: number;
    actualDeadhead: number;
    predPay: number;
    actualPay: number;
  };
  driverDeltas: Array<{
    driverId: string;
    driverName: string;
    predTrips: number;
    actualTrips: number;
    predMiles: number;
    actualMiles: number;
    predPay: number;
    actualPay: number;
    delta: number;
    flags: Array<{ code: string; label: string; severity: "info" | "warn" | "danger" }>;
  }>;
  topCauses: Array<{ cause: string; count: number; impact: string }>;
}

const actualRunStorage = new Map<number, StoredActualRun>();
let actualRunCounter = 0;

// ============================================================================
// Actual Import Service Functions
// ============================================================================

/**
 * Parse MediRoute actual dispatch CSV
 * Expected columns: TripID, DriverID, DriverName, Status, PickupTime, DropoffTime, Miles, Pay
 */
export function parseActualDispatchCSV(csvContent: string): {
  rows: Array<{
    tripId: string;
    driverId: string;
    driverName: string;
    status: string;
    pickupTime: string;
    dropoffTime: string;
    miles: number;
    pay: number;
  }>;
  errors: Array<{ row: number; reason: string }>;
} {
  const lines = csvContent.trim().split('\n');
  const rows: Array<{
    tripId: string;
    driverId: string;
    driverName: string;
    status: string;
    pickupTime: string;
    dropoffTime: string;
    miles: number;
    pay: number;
  }> = [];
  const errors: Array<{ row: number; reason: string }> = [];
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(',').map(p => p.trim());
    if (parts.length < 8) {
      errors.push({ row: i + 1, reason: 'Insufficient columns' });
      continue;
    }
    
    rows.push({
      tripId: parts[0],
      driverId: parts[1],
      driverName: parts[2],
      status: parts[3],
      pickupTime: parts[4],
      dropoffTime: parts[5],
      miles: parseFloat(parts[6]) || 0,
      pay: parseFloat(parts[7]) || 0,
    });
  }
  
  return { rows, errors };
}

/**
 * Import actual dispatch data and store for comparison
 */
export function importActualDispatch(
  serviceDate: string,
  csvContent: string,
  sourceFileName: string
): { actualRunId: number; summary: StoredActualRun } {
  const { rows, errors } = parseActualDispatchCSV(csvContent);
  
  // Group by driver
  const driverMap = new Map<string, ActualDriverSummary>();
  
  for (const row of rows) {
    if (!driverMap.has(row.driverId)) {
      driverMap.set(row.driverId, {
        driverId: row.driverId,
        driverName: row.driverName,
        totalTrips: 0,
        completedTrips: 0,
        onTimeTrips: 0,
        totalMiles: 0,
        deadheadMiles: 0,
        actualPay: 0,
        tripIds: [],
      });
    }
    
    const summary = driverMap.get(row.driverId)!;
    summary.totalTrips++;
    summary.tripIds.push(row.tripId);
    summary.totalMiles += row.miles;
    summary.actualPay += row.pay;
    
    if (row.status === 'completed' || row.status === 'COMPLETED') {
      summary.completedTrips++;
      summary.onTimeTrips++; // Simplified - would need actual time comparison
    }
  }
  
  const driverSummaries = Array.from(driverMap.values());
  const totalTrips = rows.length;
  const completedTrips = rows.filter(r => r.status === 'completed' || r.status === 'COMPLETED').length;
  const cancelledTrips = rows.filter(r => r.status === 'cancelled' || r.status === 'CANCELLED').length;
  const noShowTrips = rows.filter(r => r.status === 'no_show' || r.status === 'NO_SHOW').length;
  const onTimeTrips = completedTrips; // Simplified
  const lateTrips = 0;
  const avgOnTimePercent = totalTrips > 0 ? Math.round((onTimeTrips / totalTrips) * 100) : 100;
  const totalActualPay = rows.reduce((sum, r) => sum + r.pay, 0);
  const totalMiles = rows.reduce((sum, r) => sum + r.miles, 0);
  
  // Generate simple hash
  const sourceFileHash = `hash_${Date.now()}`;
  
  const actualRun: StoredActualRun = {
    id: ++actualRunCounter,
    serviceDate,
    importTimestamp: new Date().toISOString(),
    sourceFileName,
    sourceFileHash,
    totalTrips,
    totalDrivers: driverSummaries.length,
    completedTrips,
    cancelledTrips,
    noShowTrips,
    onTimeTrips,
    lateTrips,
    avgOnTimePercent,
    totalActualPay,
    totalMiles,
    totalDeadheadMiles: Math.round(totalMiles * 0.15), // Estimate 15% deadhead
    driverSummaries,
  };
  
  actualRunStorage.set(actualRun.id, actualRun);
  
  return { actualRunId: actualRun.id, summary: actualRun };
}

/**
 * Get actual run by ID
 */
export function getActualRun(id: number): StoredActualRun | undefined {
  return actualRunStorage.get(id);
}

/**
 * Get actual run by service date
 */
export function getActualRunByDate(serviceDate: string): StoredActualRun | undefined {
  const runs = Array.from(actualRunStorage.values());
  for (const run of runs) {
    if (run.serviceDate === serviceDate) {
      return run;
    }
  }
  return undefined;
}

/**
 * Compare shadow run with actual run
 */
export function compareShadowWithActual(
  shadowRunId: number,
  actualRunId: number
): ComparisonResult | null {
  const shadowRun = shadowRunStorage.get(shadowRunId);
  const actualRun = actualRunStorage.get(actualRunId);
  
  if (!shadowRun || !actualRun) {
    return null;
  }
  
  // Extract shadow run data
  const shadowResult = shadowRun.result;
  const shadowRoutes = shadowResult.routes || [];
  
  // Build driver deltas
  const driverDeltas: ComparisonResult['driverDeltas'] = [];
  const actualDriverMap = new Map(actualRun.driverSummaries.map(d => [d.driverId, d]));
  
  // Process shadow drivers
  const processedDrivers = new Set<string>();
  for (const route of shadowRoutes) {
    const driverId = String(route.driverId);
    processedDrivers.add(driverId);
    
    const actualDriver = actualDriverMap.get(String(driverId));
    const predTrips = route.totalTrips;
    const predMiles = route.totalMiles;
    const predPay = route.predictedEarnings;
    
    const actualTrips = actualDriver?.totalTrips || 0;
    const actualMiles = actualDriver?.totalMiles || 0;
    const actualPay = actualDriver?.actualPay || 0;
    
    const delta = predPay - actualPay;
    const flags: Array<{ code: string; label: string; severity: "info" | "warn" | "danger" }> = [];
    
    if (predTrips > actualTrips) {
      flags.push({ code: 'FEWER_TRIPS', label: 'Fewer Trips', severity: 'warn' });
    } else if (predTrips < actualTrips) {
      flags.push({ code: 'MORE_TRIPS', label: 'More Trips', severity: 'info' });
    }
    
    if (Math.abs(predMiles - actualMiles) > 5) {
      flags.push({ code: 'MILES_VARIANCE', label: 'Miles Variance', severity: 'info' });
    }
    
    driverDeltas.push({
      driverId: String(driverId),
      driverName: actualDriver?.driverName || `Driver ${driverId}`,
      predTrips,
      actualTrips,
      predMiles,
      actualMiles,
      predPay,
      actualPay,
      delta,
      flags,
    });
  }
  
  // Add actual drivers not in shadow
  const actualDriverEntries = Array.from(actualDriverMap.entries());
  for (const [driverId, actualDriver] of actualDriverEntries) {
    if (!processedDrivers.has(driverId)) {
      driverDeltas.push({
        driverId,
        driverName: actualDriver.driverName,
        predTrips: 0,
        actualTrips: actualDriver.totalTrips,
        predMiles: 0,
        actualMiles: actualDriver.totalMiles,
        predPay: 0,
        actualPay: actualDriver.actualPay,
        delta: -actualDriver.actualPay,
        flags: [{ code: 'NOT_IN_SHADOW', label: 'Not in Shadow', severity: 'warn' }],
      });
    }
  }
  
  // Calculate KPIs from result.summary
  const predOnTime = shadowResult.summary?.averageOnTimePercentage || 100;
  const actualOnTime = actualRun.avgOnTimePercent;
  const predDeadhead = Math.round(shadowRoutes.reduce((sum, r) => sum + (r.totalMiles * 0.15), 0));
  const actualDeadhead = actualRun.totalDeadheadMiles;
  const predPay = shadowResult.summary?.totalPredictedEarnings || 0;
  const actualPay = actualRun.totalActualPay;
  
  // Identify top causes
  const topCauses: ComparisonResult['topCauses'] = [];
  
  const tripDelta = Math.abs((shadowResult.summary?.assignedTrips || 0) - actualRun.completedTrips);
  if (tripDelta > 0) {
    topCauses.push({
      cause: 'Trip count variance',
      count: tripDelta,
      impact: `${tripDelta} trips different`,
    });
  }
  
  const deadheadDelta = actualDeadhead - predDeadhead;
  if (deadheadDelta > 5) {
    topCauses.push({
      cause: 'Higher actual deadhead',
      count: 1,
      impact: `+${deadheadDelta} mi`,
    });
  }
  
  const payDelta = Math.abs(predPay - actualPay);
  if (payDelta > 10) {
    topCauses.push({
      cause: 'Pay variance',
      count: 1,
      impact: `$${payDelta.toFixed(2)} difference`,
    });
  }
  
  return {
    shadowRunId,
    actualRunId,
    serviceDate: shadowRun.runDate,
    kpis: {
      predOnTime,
      actualOnTime,
      predDeadhead,
      actualDeadhead,
      predPay,
      actualPay,
    },
    driverDeltas,
    topCauses,
  };
}

/**
 * Reset actual run storage (for testing)
 */
export function resetActualRunStorage(): void {
  actualRunStorage.clear();
  actualRunCounter = 0;
}
