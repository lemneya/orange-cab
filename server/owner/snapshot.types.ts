/**
 * OC-OWNER-SNAPSHOT v1.0 TypeScript Types
 * SSOT for Owner Cockpit + Pack Narratives
 * 
 * Rules:
 * - Aggregate-only (no trip-level rows, no names, no addresses, no phone, no DOB)
 * - Every numeric KPI has: value, unit, optional delta, optional threshold
 * - Every alert must include: severity, type, message, deep_link
 */

// ============================================================================
// Data Source Types
// ============================================================================

export type DataSourceName = 
  | 'MEDIROUTE' 
  | 'SHELL_FLEET' 
  | 'TOLLS' 
  | 'IDS' 
  | 'MAINTENANCE' 
  | 'PAYROLL' 
  | 'ADMIN';

export type DataSourceStatus = 'OK' | 'STALE' | 'MISSING';

export interface DataSource {
  name: DataSourceName;
  status: DataSourceStatus;
  note?: string;
}

export interface DataFreshness {
  last_sync_at: string; // ISO date-time
  sources: DataSource[];
}

// ============================================================================
// Meta Types
// ============================================================================

export interface SnapshotMeta {
  schema_version: '1.0';
  generated_at: string; // ISO date-time
  snapshot_checksum: string; // min 8 chars
  data_freshness: DataFreshness;
}

// ============================================================================
// Scope Types
// ============================================================================

export interface SnapshotScope {
  opco_id: string;
  broker_account_id: string;
  opco_name?: string;
  broker_account_name?: string;
}

// ============================================================================
// Period Types
// ============================================================================

export interface ComparePeriod {
  start_date: string; // ISO date
  end_date: string; // ISO date
}

export interface SnapshotPeriod {
  start_date: string; // ISO date
  end_date: string; // ISO date
  timezone: string;
  compare_to: ComparePeriod;
}

// ============================================================================
// KPI Types
// ============================================================================

export type DeltaDirection = 'UP' | 'DOWN' | 'FLAT';

export interface KPIDelta {
  value: number;
  unit: string;
  direction?: DeltaDirection;
}

export interface KPIThreshold {
  warn?: number;
  danger?: number;
}

export interface KPIBase {
  value: number;
  unit: string;
  delta?: KPIDelta;
  threshold?: KPIThreshold;
  note?: string;
}

export interface KPIMoney extends KPIBase {
  unit: 'USD';
}

export interface KPIPercent extends KPIBase {
  unit: 'PCT';
}

export interface KPIDistance extends KPIBase {
  unit: 'MI';
}

export interface DemandLossBreakdown {
  scheduled: number;
  completed: number;
  canceled: number;
  no_show: number;
  no_cover: number;
  estimated_lost_revenue_usd: number;
  data_available?: boolean;
  data_note?: string;
}

export interface KPIDemandLoss {
  value: number;
  unit: 'PCT';
  delta?: KPIDelta;
  breakdown: DemandLossBreakdown;
}

export interface CashOutComponents {
  payroll_usd: number;
  fuel_usd: number;
  tolls_usd: number;
}

export interface KPICashOut {
  value: number;
  unit: 'USD';
  delta?: KPIDelta;
  components: CashOutComponents;
}

export interface SnapshotKPIs {
  revenue: KPIMoney;
  on_time: KPIPercent;
  demand_loss: KPIDemandLoss;
  deadhead: KPIDistance;
  cash_out: KPICashOut;
}

// ============================================================================
// Alert Types
// ============================================================================

export type AlertSeverity = 'HIGH' | 'MED' | 'LOW';

export type AlertType = 
  | 'BROKER_PENALTY_RISK'
  | 'WCH_PRESSURE'
  | 'UNASSIGNED_TRIPS'
  | 'LOCK_VIOLATIONS'
  | 'VEHICLE_DOWNTIME_SPIKE'
  | 'FUEL_TOLL_ANOMALY'
  | 'DRIVER_SHORTAGE'
  | 'IMPORT_FAILURE';

export interface Alert {
  severity: AlertSeverity;
  type: AlertType;
  message: string;
  deep_link: string;
  evidence_keys?: string[];
}

// ============================================================================
// Timeline Types
// ============================================================================

export type TimelineLegend = 'WILL_CALL' | 'WCH' | 'TIGHT_WINDOWS' | 'NO_COVER_RISK';

export interface TimelinePoint {
  hour: number; // 0-23
  value: number; // >= 0
}

export interface SnapshotTimeline {
  start_hour: number; // 0-23
  end_hour: number; // 0-23
  demand_pressure: TimelinePoint[];
  risk_pressure: TimelinePoint[];
  legend?: TimelineLegend[];
}

// ============================================================================
// Section Types
// ============================================================================

// Loss Workbench
export interface LossWorkbenchRow {
  broker_account_id: string;
  scheduled: number;
  completed: number;
  canceled: number;
  no_show: number;
  no_cover: number;
  est_lost_usd: number;
  top_cause: string;
  deep_link: string;
}

export interface SectionLossWorkbench {
  rows: LossWorkbenchRow[];
}

// Late Causes
export type LateCause = 
  | 'LATE_WINDOWS' 
  | 'LOCK_CONSTRAINTS' 
  | 'WCH_MISMATCH' 
  | 'DEADHEAD' 
  | 'WILL_CALL_VOLATILITY' 
  | 'DATA_MISSING';

export interface LateCauseRow {
  cause: LateCause;
  count: number;
  severity: AlertSeverity;
  suggested_fix: string;
  deep_link: string;
}

export interface SectionLateCauses {
  rows: LateCauseRow[];
}

// Cost Leaks
export type LeakType = 
  | 'DEADHEAD' 
  | 'FUEL' 
  | 'TOLLS' 
  | 'LOW_UTILIZATION' 
  | 'OVERTIME' 
  | 'REWORK';

export interface CostLeakRow {
  leak_type: LeakType;
  amount_usd: number;
  delta_usd: number;
  top_entity: string;
  suggested_fix: string;
  deep_link: string;
}

export interface SectionCostLeaks {
  rows: CostLeakRow[];
}

// Fleet Readiness
export type VehicleStatus = 'ACTIVE' | 'IN_SHOP' | 'LOT' | 'RETIRING' | 'RETIRED';

export interface FleetSummary {
  vehicles_total: number;
  vehicles_active: number;
  in_shop: number;
  wch_ready: number;
  inspections_due: number;
}

export interface FleetReadinessRow {
  vehicle_unit: string;
  status: VehicleStatus;
  days_down: number;
  next_due: string;
  deep_link: string;
}

export interface SectionFleetReadiness {
  summary: FleetSummary;
  rows: FleetReadinessRow[];
}

// IDS Impact
export interface IDSImpactSummary {
  on_time_uplift_pct: number;
  deadhead_saved_mi: number;
  pay_saved_usd: number;
}

export interface IDSImpactRow {
  date: string; // ISO date
  shadow_run_id: string;
  on_time_delta_pct: number;
  deadhead_delta_mi: number;
  pay_delta_usd: number;
  deep_link: string;
}

export interface SectionIDSImpact {
  summary: IDSImpactSummary;
  rows: IDSImpactRow[];
}

// All Sections
export interface SnapshotSections {
  loss_workbench: SectionLossWorkbench;
  late_causes: SectionLateCauses;
  cost_leaks: SectionCostLeaks;
  fleet_readiness: SectionFleetReadiness;
  ids_impact: SectionIDSImpact;
}

// ============================================================================
// Main Snapshot Type
// ============================================================================

export interface OwnerSnapshot {
  meta: SnapshotMeta;
  scope: SnapshotScope;
  period: SnapshotPeriod;
  kpis: SnapshotKPIs;
  alerts: Alert[];
  timeline: SnapshotTimeline;
  sections: SnapshotSections;
}

// ============================================================================
// Token Allowlist (for narrative generation)
// ============================================================================

/**
 * Derives the token allowlist from a snapshot.
 * Only these tokens can be used in narrative generation.
 */
export function deriveTokenAllowlist(snapshot: OwnerSnapshot): Set<string> {
  const tokens = new Set<string>();

  // Meta/scope/period tokens
  tokens.add('OPCO_ID');
  tokens.add('OPCO_NAME');
  tokens.add('BROKER_ACCOUNT_ID');
  tokens.add('BROKER_ACCOUNT_NAME');
  tokens.add('DATE_RANGE');
  tokens.add('COMPARE_RANGE');
  tokens.add('SNAPSHOT_CHECKSUM');
  tokens.add('GENERATED_AT');

  // KPI tokens
  tokens.add('KPI_REVENUE_USD');
  tokens.add('KPI_REVENUE_DELTA_PCT');
  tokens.add('KPI_REVENUE_DELTA_DIR');
  tokens.add('KPI_ONTIME_PCT');
  tokens.add('KPI_ONTIME_DELTA_PCT');
  tokens.add('KPI_ONTIME_DELTA_DIR');
  tokens.add('KPI_DEMAND_LOSS_PCT');
  tokens.add('KPI_SCHEDULED_COUNT');
  tokens.add('KPI_COMPLETED_COUNT');
  tokens.add('KPI_CANCELED_COUNT');
  tokens.add('KPI_NOSHOW_COUNT');
  tokens.add('KPI_NOCOVER_COUNT');
  tokens.add('KPI_LOST_REV_USD');
  tokens.add('KPI_DEADHEAD_MI');
  tokens.add('KPI_DEADHEAD_DELTA_MI');
  tokens.add('KPI_DEADHEAD_DELTA_DIR');
  tokens.add('KPI_CASHOUT_USD');
  tokens.add('KPI_PAYROLL_USD');
  tokens.add('KPI_FUEL_USD');
  tokens.add('KPI_TOLLS_USD');

  // Alert tokens (top 8)
  for (let i = 1; i <= Math.min(8, snapshot.alerts.length); i++) {
    tokens.add(`ALERT_${i}_SEVERITY`);
    tokens.add(`ALERT_${i}_TYPE`);
    tokens.add(`ALERT_${i}_MESSAGE`);
    tokens.add(`ALERT_${i}_DEEP_LINK`);
  }

  // Section tokens (top 10 rows each)
  // Loss workbench
  for (let i = 1; i <= Math.min(10, snapshot.sections.loss_workbench.rows.length); i++) {
    tokens.add(`LOSS_ROW_${i}_BROKER`);
    tokens.add(`LOSS_ROW_${i}_SCHEDULED`);
    tokens.add(`LOSS_ROW_${i}_COMPLETED`);
    tokens.add(`LOSS_ROW_${i}_LOST_USD`);
    tokens.add(`LOSS_ROW_${i}_TOP_CAUSE`);
  }

  // Late causes
  for (let i = 1; i <= Math.min(10, snapshot.sections.late_causes.rows.length); i++) {
    tokens.add(`LATE_ROW_${i}_CAUSE`);
    tokens.add(`LATE_ROW_${i}_COUNT`);
    tokens.add(`LATE_ROW_${i}_SEVERITY`);
    tokens.add(`LATE_ROW_${i}_FIX`);
  }

  // Cost leaks
  for (let i = 1; i <= Math.min(10, snapshot.sections.cost_leaks.rows.length); i++) {
    tokens.add(`LEAK_ROW_${i}_TYPE`);
    tokens.add(`LEAK_ROW_${i}_AMOUNT_USD`);
    tokens.add(`LEAK_ROW_${i}_DELTA_USD`);
    tokens.add(`LEAK_ROW_${i}_ENTITY`);
    tokens.add(`LEAK_ROW_${i}_FIX`);
  }

  // Fleet readiness
  tokens.add('FLEET_TOTAL');
  tokens.add('FLEET_ACTIVE');
  tokens.add('FLEET_IN_SHOP');
  tokens.add('FLEET_WCH_READY');
  tokens.add('FLEET_INSPECTIONS_DUE');

  // IDS impact
  tokens.add('IDS_ONTIME_UPLIFT_PCT');
  tokens.add('IDS_DEADHEAD_SAVED_MI');
  tokens.add('IDS_PAY_SAVED_USD');

  // Timeline tokens
  tokens.add('TIMELINE_START_HOUR');
  tokens.add('TIMELINE_END_HOUR');
  tokens.add('TIMELINE_PEAK_DEMAND_HOUR');
  tokens.add('TIMELINE_PEAK_RISK_HOUR');

  // Computed tokens
  tokens.add('NEXT_WEEKDAY');
  tokens.add('CURRENT_DATE');

  return tokens;
}

/**
 * Resolves a token to its value from the snapshot.
 */
export function resolveToken(token: string, snapshot: OwnerSnapshot): string | null {
  const { meta, scope, period, kpis, alerts, sections } = snapshot;

  // Meta/scope/period
  if (token === 'OPCO_ID') return scope.opco_id;
  if (token === 'OPCO_NAME') return scope.opco_name || scope.opco_id;
  if (token === 'BROKER_ACCOUNT_ID') return scope.broker_account_id;
  if (token === 'BROKER_ACCOUNT_NAME') return scope.broker_account_name || scope.broker_account_id;
  if (token === 'DATE_RANGE') return `${period.start_date} to ${period.end_date}`;
  if (token === 'COMPARE_RANGE') return `${period.compare_to.start_date} to ${period.compare_to.end_date}`;
  if (token === 'SNAPSHOT_CHECKSUM') return meta.snapshot_checksum;
  if (token === 'GENERATED_AT') return meta.generated_at;

  // KPI tokens
  if (token === 'KPI_REVENUE_USD') return `$${kpis.revenue.value.toLocaleString()}`;
  if (token === 'KPI_REVENUE_DELTA_PCT') return kpis.revenue.delta ? `${kpis.revenue.delta.value}%` : 'N/A';
  if (token === 'KPI_REVENUE_DELTA_DIR') return kpis.revenue.delta?.direction || 'FLAT';
  if (token === 'KPI_ONTIME_PCT') return `${kpis.on_time.value}%`;
  if (token === 'KPI_ONTIME_DELTA_PCT') return kpis.on_time.delta ? `${kpis.on_time.delta.value}%` : 'N/A';
  if (token === 'KPI_ONTIME_DELTA_DIR') return kpis.on_time.delta?.direction || 'FLAT';
  if (token === 'KPI_DEMAND_LOSS_PCT') return `${kpis.demand_loss.value}%`;
  if (token === 'KPI_SCHEDULED_COUNT') return kpis.demand_loss.breakdown.scheduled.toString();
  if (token === 'KPI_COMPLETED_COUNT') return kpis.demand_loss.breakdown.completed.toString();
  if (token === 'KPI_CANCELED_COUNT') return kpis.demand_loss.breakdown.canceled.toString();
  if (token === 'KPI_NOSHOW_COUNT') return kpis.demand_loss.breakdown.no_show.toString();
  if (token === 'KPI_NOCOVER_COUNT') return kpis.demand_loss.breakdown.no_cover.toString();
  if (token === 'KPI_LOST_REV_USD') return `$${kpis.demand_loss.breakdown.estimated_lost_revenue_usd.toLocaleString()}`;
  if (token === 'KPI_DEADHEAD_MI') return `${kpis.deadhead.value} mi`;
  if (token === 'KPI_DEADHEAD_DELTA_MI') return kpis.deadhead.delta ? `${kpis.deadhead.delta.value} mi` : 'N/A';
  if (token === 'KPI_DEADHEAD_DELTA_DIR') return kpis.deadhead.delta?.direction || 'FLAT';
  if (token === 'KPI_CASHOUT_USD') return `$${kpis.cash_out.value.toLocaleString()}`;
  if (token === 'KPI_PAYROLL_USD') return `$${kpis.cash_out.components.payroll_usd.toLocaleString()}`;
  if (token === 'KPI_FUEL_USD') return `$${kpis.cash_out.components.fuel_usd.toLocaleString()}`;
  if (token === 'KPI_TOLLS_USD') return `$${kpis.cash_out.components.tolls_usd.toLocaleString()}`;

  // Alert tokens
  const alertMatch = token.match(/^ALERT_(\d+)_(.+)$/);
  if (alertMatch) {
    const idx = parseInt(alertMatch[1]) - 1;
    const field = alertMatch[2];
    if (idx < alerts.length) {
      const alert = alerts[idx];
      if (field === 'SEVERITY') return alert.severity;
      if (field === 'TYPE') return alert.type;
      if (field === 'MESSAGE') return alert.message;
      if (field === 'DEEP_LINK') return alert.deep_link;
    }
    return 'N/A';
  }

  // Fleet readiness
  if (token === 'FLEET_TOTAL') return sections.fleet_readiness.summary.vehicles_total.toString();
  if (token === 'FLEET_ACTIVE') return sections.fleet_readiness.summary.vehicles_active.toString();
  if (token === 'FLEET_IN_SHOP') return sections.fleet_readiness.summary.in_shop.toString();
  if (token === 'FLEET_WCH_READY') return sections.fleet_readiness.summary.wch_ready.toString();
  if (token === 'FLEET_INSPECTIONS_DUE') return sections.fleet_readiness.summary.inspections_due.toString();

  // IDS impact
  if (token === 'IDS_ONTIME_UPLIFT_PCT') return `${sections.ids_impact.summary.on_time_uplift_pct}%`;
  if (token === 'IDS_DEADHEAD_SAVED_MI') return `${sections.ids_impact.summary.deadhead_saved_mi} mi`;
  if (token === 'IDS_PAY_SAVED_USD') return `$${sections.ids_impact.summary.pay_saved_usd.toLocaleString()}`;

  // Computed tokens
  if (token === 'NEXT_WEEKDAY') {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    return nextMonday.toISOString().split('T')[0];
  }
  if (token === 'CURRENT_DATE') return new Date().toISOString().split('T')[0];

  return null;
}
