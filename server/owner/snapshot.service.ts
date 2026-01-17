/**
 * OC-OWNER-SNAPSHOT Generator Service
 * Aggregates data from all sources to create the Owner Snapshot
 */

import { createHash } from 'crypto';
import type {
  OwnerSnapshot,
  SnapshotMeta,
  SnapshotScope,
  SnapshotPeriod,
  SnapshotKPIs,
  Alert,
  SnapshotTimeline,
  SnapshotSections,
  DataSource,
  AlertSeverity,
  AlertType,
  LateCause,
  LeakType,
} from './snapshot.types';

// ============================================================================
// Snapshot Generator
// ============================================================================

interface GenerateSnapshotOptions {
  opcoId: string;
  brokerAccountId: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  timezone?: string;
}

/**
 * Generates an Owner Snapshot by aggregating data from all sources.
 * This is the single source of truth for the Owner Cockpit and Pack Narratives.
 */
export async function generateOwnerSnapshot(
  options: GenerateSnapshotOptions
): Promise<OwnerSnapshot> {
  const { opcoId, brokerAccountId, startDate, endDate, timezone = 'America/New_York' } = options;

  // Calculate compare period (previous week)
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const compareStart = new Date(start);
  compareStart.setDate(compareStart.getDate() - daysDiff);
  const compareEnd = new Date(start);
  compareEnd.setDate(compareEnd.getDate() - 1);

  // Aggregate data from all sources
  const [
    payrollData,
    idsData,
    fuelTollData,
    fleetData,
    tripData,
  ] = await Promise.all([
    aggregatePayrollData(opcoId, brokerAccountId, startDate, endDate),
    aggregateIDSData(opcoId, brokerAccountId, startDate, endDate),
    aggregateFuelTollData(opcoId, startDate, endDate),
    aggregateFleetData(opcoId),
    aggregateTripData(opcoId, brokerAccountId, startDate, endDate),
  ]);

  // Build data freshness
  const dataFreshness = buildDataFreshness(payrollData, idsData, fuelTollData, fleetData, tripData);

  // Build KPIs
  const kpis = buildKPIs(payrollData, idsData, fuelTollData, tripData);

  // Build alerts
  const alerts = buildAlerts(kpis, idsData, fleetData, tripData);

  // Build timeline
  const timeline = buildTimeline(tripData);

  // Build sections
  const sections = buildSections(payrollData, idsData, fuelTollData, fleetData, tripData);

  // Build scope
  const scope: SnapshotScope = {
    opco_id: opcoId,
    broker_account_id: brokerAccountId,
    opco_name: getOpcoName(opcoId),
    broker_account_name: getBrokerAccountName(brokerAccountId),
  };

  // Build period
  const period: SnapshotPeriod = {
    start_date: startDate,
    end_date: endDate,
    timezone,
    compare_to: {
      start_date: compareStart.toISOString().split('T')[0],
      end_date: compareEnd.toISOString().split('T')[0],
    },
  };

  // Build meta
  const snapshotData = { scope, period, kpis, alerts, timeline, sections };
  const checksum = createHash('sha256')
    .update(JSON.stringify(snapshotData))
    .digest('hex')
    .substring(0, 10);

  const meta: SnapshotMeta = {
    schema_version: '1.0',
    generated_at: new Date().toISOString(),
    snapshot_checksum: checksum,
    data_freshness: dataFreshness,
  };

  return {
    meta,
    scope,
    period,
    kpis,
    alerts,
    timeline,
    sections,
  };
}

// ============================================================================
// Data Aggregation Functions
// ============================================================================

interface PayrollData {
  available: boolean;
  totalPay: number;
  totalTrips: number;
  totalMiles: number;
  byDriver: Array<{ driverId: string; pay: number; trips: number; miles: number }>;
  lastSync?: Date;
}

async function aggregatePayrollData(
  opcoId: string,
  brokerAccountId: string,
  startDate: string,
  endDate: string
): Promise<PayrollData> {
  // In production, this would query the payroll tables
  // For now, return mock data that matches the expected structure
  return {
    available: true,
    totalPay: 6120.10,
    totalTrips: 332,
    totalMiles: 2840,
    byDriver: [
      { driverId: 'D001', pay: 1224.02, trips: 66, miles: 568 },
      { driverId: 'D002', pay: 1102.82, trips: 60, miles: 512 },
      { driverId: 'D003', pay: 1040.54, trips: 56, miles: 480 },
      { driverId: 'D004', pay: 918.01, trips: 50, miles: 428 },
      { driverId: 'D005', pay: 834.71, trips: 45, miles: 392 },
      { driverId: 'D006', pay: 1000.00, trips: 55, miles: 460 },
    ],
    lastSync: new Date(),
  };
}

interface IDSData {
  available: boolean;
  shadowRuns: Array<{
    id: string;
    date: string;
    predOnTime: number;
    actualOnTime: number;
    predDeadhead: number;
    actualDeadhead: number;
    predPay: number;
    actualPay: number;
  }>;
  summary: {
    onTimeUplift: number;
    deadheadSaved: number;
    paySaved: number;
  };
  lastSync?: Date;
}

async function aggregateIDSData(
  opcoId: string,
  brokerAccountId: string,
  startDate: string,
  endDate: string
): Promise<IDSData> {
  return {
    available: true,
    shadowRuns: [
      {
        id: 'SR-0012',
        date: '2026-01-12',
        predOnTime: 92.6,
        actualOnTime: 89.4,
        predDeadhead: 340,
        actualDeadhead: 410,
        predPay: 5895.10,
        actualPay: 6120.10,
      },
    ],
    summary: {
      onTimeUplift: 3.5,
      deadheadSaved: 70,
      paySaved: 1225,
    },
    lastSync: new Date(),
  };
}

interface FuelTollData {
  available: boolean;
  fuelTotal: number;
  tollsTotal: number;
  byVehicle: Array<{ vehicleId: string; fuel: number; tolls: number }>;
  lastSync?: Date;
}

async function aggregateFuelTollData(
  opcoId: string,
  startDate: string,
  endDate: string
): Promise<FuelTollData> {
  return {
    available: true,
    fuelTotal: 720.22,
    tollsTotal: 307.00,
    byVehicle: [
      { vehicleId: 'V001', fuel: 144.04, tolls: 61.40 },
      { vehicleId: 'V002', fuel: 129.64, tolls: 55.26 },
      { vehicleId: 'V003', fuel: 122.24, tolls: 52.19 },
      { vehicleId: 'V004', fuel: 108.03, tolls: 46.05 },
      { vehicleId: 'V005', fuel: 100.83, tolls: 43.00 },
      { vehicleId: 'V006', fuel: 115.44, tolls: 49.10 },
    ],
    lastSync: new Date(),
  };
}

interface FleetData {
  available: boolean;
  vehiclesTotal: number;
  vehiclesActive: number;
  inShop: number;
  wchReady: number;
  inspectionsDue: number;
  vehicles: Array<{
    unit: string;
    status: 'ACTIVE' | 'IN_SHOP' | 'LOT' | 'RETIRING' | 'RETIRED';
    daysDown: number;
    nextDue: string;
  }>;
  lastSync?: Date;
}

async function aggregateFleetData(opcoId: string): Promise<FleetData> {
  return {
    available: true,
    vehiclesTotal: 60,
    vehiclesActive: 40,
    inShop: 3,
    wchReady: 10,
    inspectionsDue: 2,
    vehicles: [
      { unit: 'V012', status: 'IN_SHOP', daysDown: 4, nextDue: 'Brakes' },
      { unit: 'V018', status: 'IN_SHOP', daysDown: 2, nextDue: 'Transmission' },
      { unit: 'V025', status: 'IN_SHOP', daysDown: 1, nextDue: 'AC Repair' },
    ],
    lastSync: new Date(),
  };
}

interface TripData {
  available: boolean;
  scheduled: number;
  completed: number;
  canceled: number;
  noShow: number;
  noCover: number;
  onTimeRate: number;
  deadheadMiles: number;
  estimatedRevenue: number;
  estimatedLostRevenue: number;
  hourlyDemand: Array<{ hour: number; count: number }>;
  hourlyRisk: Array<{ hour: number; risk: number }>;
  lateCauses: Array<{ cause: LateCause; count: number }>;
  lastSync?: Date;
  dataNote?: string;
}

async function aggregateTripData(
  opcoId: string,
  brokerAccountId: string,
  startDate: string,
  endDate: string
): Promise<TripData> {
  return {
    available: false, // Demand snapshot pending
    scheduled: 0,
    completed: 332,
    canceled: 0,
    noShow: 0,
    noCover: 0,
    onTimeRate: 89.4,
    deadheadMiles: 410,
    estimatedRevenue: 8300,
    estimatedLostRevenue: 0,
    hourlyDemand: [
      { hour: 4, count: 8 },
      { hour: 5, count: 15 },
      { hour: 6, count: 28 },
      { hour: 7, count: 42 },
      { hour: 8, count: 55 },
      { hour: 9, count: 48 },
      { hour: 10, count: 35 },
      { hour: 11, count: 25 },
      { hour: 12, count: 20 },
      { hour: 13, count: 22 },
      { hour: 14, count: 28 },
      { hour: 15, count: 18 },
      { hour: 16, count: 10 },
    ],
    hourlyRisk: [
      { hour: 7, risk: 0.8 },
      { hour: 8, risk: 0.9 },
      { hour: 9, risk: 0.7 },
      { hour: 10, risk: 0.6 },
      { hour: 14, risk: 0.5 },
    ],
    lateCauses: [
      { cause: 'LATE_WINDOWS', count: 18 },
      { cause: 'DEADHEAD', count: 12 },
      { cause: 'WCH_MISMATCH', count: 5 },
    ],
    lastSync: new Date(),
    dataNote: 'Demand snapshot pending',
  };
}

// ============================================================================
// Builder Functions
// ============================================================================

function buildDataFreshness(
  payroll: PayrollData,
  ids: IDSData,
  fuelToll: FuelTollData,
  fleet: FleetData,
  trip: TripData
): { last_sync_at: string; sources: DataSource[] } {
  const sources: DataSource[] = [
    {
      name: 'PAYROLL',
      status: payroll.available ? 'OK' : 'MISSING',
    },
    {
      name: 'IDS',
      status: ids.available ? 'OK' : 'MISSING',
    },
    {
      name: 'SHELL_FLEET',
      status: fuelToll.available ? 'OK' : 'MISSING',
    },
    {
      name: 'TOLLS',
      status: fuelToll.available ? 'OK' : 'MISSING',
    },
    {
      name: 'MAINTENANCE',
      status: fleet.available ? 'OK' : 'MISSING',
    },
    {
      name: 'MEDIROUTE',
      status: trip.available ? 'OK' : 'STALE',
      note: trip.dataNote,
    },
  ];

  return {
    last_sync_at: new Date().toISOString(),
    sources,
  };
}

function buildKPIs(
  payroll: PayrollData,
  ids: IDSData,
  fuelToll: FuelTollData,
  trip: TripData
): SnapshotKPIs {
  return {
    revenue: {
      value: trip.estimatedRevenue,
      unit: 'USD',
      delta: { value: 2.1, unit: 'PCT', direction: 'UP' },
    },
    on_time: {
      value: trip.onTimeRate,
      unit: 'PCT',
      delta: { value: 1.2, unit: 'PCT', direction: 'UP' },
    },
    demand_loss: {
      value: trip.available ? 
        ((trip.canceled + trip.noShow + trip.noCover) / trip.scheduled * 100) : 0,
      unit: 'PCT',
      breakdown: {
        scheduled: trip.scheduled,
        completed: trip.completed,
        canceled: trip.canceled,
        no_show: trip.noShow,
        no_cover: trip.noCover,
        estimated_lost_revenue_usd: trip.estimatedLostRevenue,
        data_available: trip.available,
        data_note: trip.dataNote,
      },
    },
    deadhead: {
      value: trip.deadheadMiles,
      unit: 'MI',
      delta: { value: -70, unit: 'MI', direction: 'DOWN' },
    },
    cash_out: {
      value: payroll.totalPay + fuelToll.fuelTotal + fuelToll.tollsTotal,
      unit: 'USD',
      components: {
        payroll_usd: payroll.totalPay,
        fuel_usd: fuelToll.fuelTotal,
        tolls_usd: fuelToll.tollsTotal,
      },
    },
  };
}

function buildAlerts(
  kpis: SnapshotKPIs,
  ids: IDSData,
  fleet: FleetData,
  trip: TripData
): Alert[] {
  const alerts: Alert[] = [];

  // Check for data availability issues
  if (!trip.available) {
    alerts.push({
      severity: 'MED',
      type: 'IMPORT_FAILURE',
      message: 'Demand snapshot not available for cancellations/no-shows.',
      deep_link: '/ids/manifest-import',
    });
  }

  // Check for vehicle downtime
  if (fleet.inShop >= 3) {
    alerts.push({
      severity: 'MED',
      type: 'VEHICLE_DOWNTIME_SPIKE',
      message: `${fleet.inShop} vehicles in shop. May impact capacity.`,
      deep_link: '/maintenance/vehicles',
      evidence_keys: ['FLEET_IN_SHOP'],
    });
  }

  // Check for WCH pressure
  if (fleet.wchReady < 8) {
    alerts.push({
      severity: 'HIGH',
      type: 'WCH_PRESSURE',
      message: `Only ${fleet.wchReady} WCH vehicles ready. Risk of no-cover.`,
      deep_link: '/maintenance/vehicles?filter=wch',
      evidence_keys: ['FLEET_WCH_READY'],
    });
  }

  // Check for on-time issues
  if (kpis.on_time.value < 90) {
    alerts.push({
      severity: 'MED',
      type: 'BROKER_PENALTY_RISK',
      message: `On-time rate ${kpis.on_time.value}% is below 90% threshold.`,
      deep_link: '/ids/shadow-runs',
      evidence_keys: ['KPI_ONTIME_PCT'],
    });
  }

  return alerts.slice(0, 12); // Max 12 alerts
}

function buildTimeline(trip: TripData): SnapshotTimeline {
  const maxDemand = Math.max(...trip.hourlyDemand.map(h => h.count));
  
  return {
    start_hour: 4,
    end_hour: 16,
    demand_pressure: trip.hourlyDemand.map(h => ({
      hour: h.hour,
      value: maxDemand > 0 ? h.count / maxDemand : 0,
    })),
    risk_pressure: trip.hourlyRisk.map(h => ({
      hour: h.hour,
      value: h.risk,
    })),
    legend: ['WCH', 'TIGHT_WINDOWS'],
  };
}

function buildSections(
  payroll: PayrollData,
  ids: IDSData,
  fuelToll: FuelTollData,
  fleet: FleetData,
  trip: TripData
): SnapshotSections {
  return {
    loss_workbench: {
      rows: [], // Empty until demand data is available
    },
    late_causes: {
      rows: trip.lateCauses.map(lc => ({
        cause: lc.cause,
        count: lc.count,
        severity: lc.count > 15 ? 'HIGH' : lc.count > 8 ? 'MED' : 'LOW' as AlertSeverity,
        suggested_fix: getSuggestedFix(lc.cause),
        deep_link: '/ids/shadow-runs',
      })),
    },
    cost_leaks: {
      rows: [
        {
          leak_type: 'DEADHEAD' as LeakType,
          amount_usd: 310,
          delta_usd: -55,
          top_entity: 'Zone Peninsula',
          suggested_fix: 'Cluster morning pickups by geohash; lock standing routes.',
          deep_link: '/ids/shadow-runs/1/map',
        },
        {
          leak_type: 'FUEL' as LeakType,
          amount_usd: fuelToll.fuelTotal,
          delta_usd: 12.50,
          top_entity: fuelToll.byVehicle[0]?.vehicleId || 'V001',
          suggested_fix: 'Review high-fuel vehicles for maintenance issues.',
          deep_link: '/payroll/fuel',
        },
      ],
    },
    fleet_readiness: {
      summary: {
        vehicles_total: fleet.vehiclesTotal,
        vehicles_active: fleet.vehiclesActive,
        in_shop: fleet.inShop,
        wch_ready: fleet.wchReady,
        inspections_due: fleet.inspectionsDue,
      },
      rows: fleet.vehicles.map(v => ({
        vehicle_unit: v.unit,
        status: v.status,
        days_down: v.daysDown,
        next_due: v.nextDue,
        deep_link: `/maintenance/vehicles/${v.unit}`,
      })),
    },
    ids_impact: {
      summary: {
        on_time_uplift_pct: ids.summary.onTimeUplift,
        deadhead_saved_mi: ids.summary.deadheadSaved,
        pay_saved_usd: ids.summary.paySaved,
      },
      rows: ids.shadowRuns.map(sr => ({
        date: sr.date,
        shadow_run_id: sr.id,
        on_time_delta_pct: sr.predOnTime - sr.actualOnTime,
        deadhead_delta_mi: sr.actualDeadhead - sr.predDeadhead,
        pay_delta_usd: sr.actualPay - sr.predPay,
        deep_link: `/ids/shadow-runs/${sr.id.replace('SR-', '')}/compare`,
      })),
    },
  };
}

function getSuggestedFix(cause: LateCause): string {
  const fixes: Record<LateCause, string> = {
    LATE_WINDOWS: 'Add lock templates for the top 10 repeats; reduce cross-zone deadhead.',
    LOCK_CONSTRAINTS: 'Review lock constraints for flexibility; consider driver reassignment.',
    WCH_MISMATCH: 'Ensure WCH vehicles are assigned to WCH trips; check vehicle availability.',
    DEADHEAD: 'Cluster pickups by geohash; optimize route sequencing.',
    WILL_CALL_VOLATILITY: 'Add buffer time for will-call trips; improve communication with members.',
    DATA_MISSING: 'Ensure all trip data is imported; check for missing fields.',
  };
  return fixes[cause];
}

function getOpcoName(opcoId: string): string {
  const names: Record<string, string> = {
    SAHRAWI: 'Sahrawi',
    METRIX: 'Metrix',
  };
  return names[opcoId] || opcoId;
}

function getBrokerAccountName(brokerAccountId: string): string {
  const names: Record<string, string> = {
    MODIVCARE_SAHRAWI: 'Modivcare - Sahrawi',
    MODIVCARE_METRIX: 'Modivcare - Metrix',
    MTM_MAIN: 'MTM',
    A2C_MAIN: 'Access2Care',
  };
  return names[brokerAccountId] || brokerAccountId;
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validates a snapshot against the schema.
 * Returns true if valid, throws error if invalid.
 */
export function validateSnapshot(snapshot: OwnerSnapshot): boolean {
  // Check required fields
  if (!snapshot.meta || !snapshot.scope || !snapshot.period || 
      !snapshot.kpis || !snapshot.alerts || !snapshot.timeline || !snapshot.sections) {
    throw new Error('Missing required top-level fields');
  }

  // Check schema version
  if (snapshot.meta.schema_version !== '1.0') {
    throw new Error(`Invalid schema version: ${snapshot.meta.schema_version}`);
  }

  // Check checksum
  if (!snapshot.meta.snapshot_checksum || snapshot.meta.snapshot_checksum.length < 8) {
    throw new Error('Invalid snapshot checksum');
  }

  // Check alerts limit
  if (snapshot.alerts.length > 12) {
    throw new Error('Too many alerts (max 12)');
  }

  return true;
}

// ============================================================================
// Storage
// ============================================================================

const snapshotStorage: Map<string, OwnerSnapshot> = new Map();

export function storeSnapshot(snapshot: OwnerSnapshot): string {
  const key = snapshot.meta.snapshot_checksum;
  snapshotStorage.set(key, snapshot);
  return key;
}

export function getSnapshot(checksum: string): OwnerSnapshot | null {
  return snapshotStorage.get(checksum) || null;
}

export function listSnapshots(): OwnerSnapshot[] {
  return Array.from(snapshotStorage.values());
}
