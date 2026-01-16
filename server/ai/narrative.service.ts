// Narrative Service - "No Hallucination" AI Report Generation
// Uses placeholder validation to ensure all data comes from the report snapshot

import { z } from "zod";
import { localLLM, checkLLMStatus, LLM_CONFIG } from "./local_llm";

// ============================================
// TYPES
// ============================================

export type NarrativeStyle = "INTERNAL" | "CLIENT";

export interface ReportSnapshot {
  templateName: string;
  dateRange: { start: string; end: string };
  opcoId?: string;
  brokerAccountId?: string;
  kpis: {
    payroll?: {
      totalDriverPay: number;
      totalTrips: number;
      totalMiles: number;
      avgPayPerTrip: number;
      avgPayPerMile: number;
      driverCount: number;
      drivers?: Array<{
        name: string;
        trips: number;
        miles: number;
        pay: number;
      }>;
    };
    ids?: {
      shadowRunCount: number;
      predictedOnTimeRate: number;
      predictedDeadheadMiles: number;
      predictedTotalPay: number;
      actualOnTimeRate?: number;
      actualDeadheadMiles?: number;
      actualTotalPay?: number;
    };
    fuelTolls?: {
      totalFuelCost: number;
      totalTollCost: number;
      fuelGallons: number;
      avgFuelPricePerGallon: number;
      tollTransactionCount: number;
      vehicles?: Array<{
        unit: string;
        fuelCost: number;
        tollCost: number;
      }>;
    };
    trips?: {
      totalTrips: number;
      completedTrips: number;
      canceledTrips: number;
      noShowTrips: number;
      onTimeRate: number;
    };
    summary?: {
      totalRevenue: number;
      totalExpenses: number;
      netMargin: number;
      marginPercent: number;
    };
  };
  audit?: {
    rowCounts: Record<string, number>;
    dataSources: string[];
    calculationNotes: string[];
    generatedAt: string;
  };
}

export interface NarrativeOutput {
  title?: string;
  executive_summary?: string[];
  findings?: Array<{ severity: string; text: string }>;
  actions?: Array<{ owner_role: string; deadline: string; text: string }>;
  client_bullets?: string[];
}

export interface ExtractedMetrics {
  // Date/context
  DATE_RANGE: string;
  OPCO: string;
  BROKER_ACCOUNT: string;
  
  // Payroll KPIs
  KPI_TOTAL_DRIVER_PAY: string;
  KPI_TOTAL_TRIPS: string;
  KPI_TOTAL_MILES: string;
  KPI_AVG_PAY_PER_TRIP: string;
  KPI_AVG_PAY_PER_MILE: string;
  KPI_DRIVER_COUNT: string;
  
  // Trip KPIs
  KPI_TRIPS_TOTAL: string;
  KPI_TRIPS_COMPLETED: string;
  KPI_TRIPS_CANCELED: string;
  KPI_TRIPS_NOSHOW: string;
  KPI_ONTIME_PCT: string;
  
  // Fuel/Tolls KPIs
  KPI_FUEL_COST: string;
  KPI_TOLL_COST: string;
  KPI_FUEL_GALLONS: string;
  KPI_FUEL_PRICE_PER_GAL: string;
  
  // IDS KPIs
  KPI_SHADOW_RUNS: string;
  KPI_PRED_ONTIME: string;
  KPI_PRED_DEADHEAD: string;
  KPI_PRED_PAY: string;
  KPI_ACTUAL_ONTIME: string;
  KPI_ACTUAL_DEADHEAD: string;
  KPI_ACTUAL_PAY: string;
  KPI_ONTIME_DELTA: string;
  KPI_DEADHEAD_DELTA: string;
  KPI_PAY_DELTA: string;
  
  // Summary KPIs
  KPI_REVENUE: string;
  KPI_EXPENSES: string;
  KPI_NET_MARGIN: string;
  KPI_MARGIN_PCT: string;
  
  // Computed insights
  TOP_DRIVER: string;
  TOP_DRIVER_PAY: string;
  BOTTOM_DRIVER: string;
  BOTTOM_DRIVER_PAY: string;
  TOP_VEHICLE_FUEL: string;
  TOP_VEHICLE_FUEL_COST: string;
  
  // Anomalies
  ANOMALY_HIGH_DEADHEAD: string;
  ANOMALY_LOW_ONTIME: string;
  ANOMALY_HIGH_CANCELS: string;
  
  // Actions
  NEXT_WEEKDAY: string;
  ZONE_A: string;
  
  // Estimates
  KPI_LEAKAGE_ESTIMATE: string;
  KPI_PREVENTABLE_LATES: string;
}

// ============================================
// STEP A: DETERMINISTIC EXTRACTOR
// ============================================

export function extractMetrics(snapshot: ReportSnapshot): ExtractedMetrics {
  const { kpis, dateRange, opcoId, brokerAccountId } = snapshot;
  
  // Format helpers
  const fmt = (n: number | undefined, decimals = 2) => 
    n !== undefined ? n.toFixed(decimals) : "N/A";
  const fmtCurrency = (n: number | undefined) => 
    n !== undefined ? `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "N/A";
  const fmtPct = (n: number | undefined) => 
    n !== undefined ? `${n.toFixed(1)}%` : "N/A";
  const fmtInt = (n: number | undefined) => 
    n !== undefined ? n.toLocaleString("en-US") : "N/A";
  
  // Calculate deltas
  const onTimeDelta = kpis.ids?.predictedOnTimeRate && kpis.ids?.actualOnTimeRate
    ? kpis.ids.predictedOnTimeRate - kpis.ids.actualOnTimeRate
    : undefined;
  const deadheadDelta = kpis.ids?.predictedDeadheadMiles && kpis.ids?.actualDeadheadMiles
    ? kpis.ids.actualDeadheadMiles - kpis.ids.predictedDeadheadMiles
    : undefined;
  const payDelta = kpis.ids?.predictedTotalPay && kpis.ids?.actualTotalPay
    ? kpis.ids.actualTotalPay - kpis.ids.predictedTotalPay
    : undefined;
  
  // Find top/bottom drivers
  const drivers = kpis.payroll?.drivers || [];
  const sortedByPay = [...drivers].sort((a, b) => b.pay - a.pay);
  const topDriver = sortedByPay[0];
  const bottomDriver = sortedByPay[sortedByPay.length - 1];
  
  // Find top fuel vehicle
  const vehicles = kpis.fuelTolls?.vehicles || [];
  const sortedByFuel = [...vehicles].sort((a, b) => b.fuelCost - a.fuelCost);
  const topFuelVehicle = sortedByFuel[0];
  
  // Anomaly detection
  const highDeadhead = kpis.ids?.actualDeadheadMiles && kpis.ids.actualDeadheadMiles > 500;
  const lowOnTime = kpis.trips?.onTimeRate && kpis.trips.onTimeRate < 90;
  const highCancels = kpis.trips?.canceledTrips && kpis.trips.totalTrips
    ? (kpis.trips.canceledTrips / kpis.trips.totalTrips) > 0.1
    : false;
  
  // Calculate estimates
  const leakageEstimate = payDelta && payDelta > 0 ? payDelta * 4 : 0; // Monthly estimate
  const preventableLates = kpis.trips?.totalTrips && kpis.trips?.onTimeRate
    ? Math.round(kpis.trips.totalTrips * (1 - kpis.trips.onTimeRate / 100) * 0.3) // 30% preventable
    : 0;
  
  // Next weekday
  const today = new Date();
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
  
  return {
    // Date/context
    DATE_RANGE: `${dateRange.start} to ${dateRange.end}`,
    OPCO: opcoId || "All Companies",
    BROKER_ACCOUNT: brokerAccountId || "All Accounts",
    
    // Payroll KPIs
    KPI_TOTAL_DRIVER_PAY: fmtCurrency(kpis.payroll?.totalDriverPay),
    KPI_TOTAL_TRIPS: fmtInt(kpis.payroll?.totalTrips),
    KPI_TOTAL_MILES: fmtInt(kpis.payroll?.totalMiles),
    KPI_AVG_PAY_PER_TRIP: fmtCurrency(kpis.payroll?.avgPayPerTrip),
    KPI_AVG_PAY_PER_MILE: fmtCurrency(kpis.payroll?.avgPayPerMile),
    KPI_DRIVER_COUNT: fmtInt(kpis.payroll?.driverCount),
    
    // Trip KPIs
    KPI_TRIPS_TOTAL: fmtInt(kpis.trips?.totalTrips),
    KPI_TRIPS_COMPLETED: fmtInt(kpis.trips?.completedTrips),
    KPI_TRIPS_CANCELED: fmtInt(kpis.trips?.canceledTrips),
    KPI_TRIPS_NOSHOW: fmtInt(kpis.trips?.noShowTrips),
    KPI_ONTIME_PCT: fmtPct(kpis.trips?.onTimeRate),
    
    // Fuel/Tolls KPIs
    KPI_FUEL_COST: fmtCurrency(kpis.fuelTolls?.totalFuelCost),
    KPI_TOLL_COST: fmtCurrency(kpis.fuelTolls?.totalTollCost),
    KPI_FUEL_GALLONS: fmtInt(kpis.fuelTolls?.fuelGallons),
    KPI_FUEL_PRICE_PER_GAL: fmtCurrency(kpis.fuelTolls?.avgFuelPricePerGallon),
    
    // IDS KPIs
    KPI_SHADOW_RUNS: fmtInt(kpis.ids?.shadowRunCount),
    KPI_PRED_ONTIME: fmtPct(kpis.ids?.predictedOnTimeRate),
    KPI_PRED_DEADHEAD: `${fmtInt(kpis.ids?.predictedDeadheadMiles)} mi`,
    KPI_PRED_PAY: fmtCurrency(kpis.ids?.predictedTotalPay),
    KPI_ACTUAL_ONTIME: fmtPct(kpis.ids?.actualOnTimeRate),
    KPI_ACTUAL_DEADHEAD: `${fmtInt(kpis.ids?.actualDeadheadMiles)} mi`,
    KPI_ACTUAL_PAY: fmtCurrency(kpis.ids?.actualTotalPay),
    KPI_ONTIME_DELTA: onTimeDelta !== undefined ? `${onTimeDelta > 0 ? "+" : ""}${fmtPct(onTimeDelta)}` : "N/A",
    KPI_DEADHEAD_DELTA: deadheadDelta !== undefined ? `${deadheadDelta > 0 ? "+" : ""}${fmtInt(deadheadDelta)} mi` : "N/A",
    KPI_PAY_DELTA: payDelta !== undefined ? `${payDelta > 0 ? "+" : ""}${fmtCurrency(payDelta)}` : "N/A",
    
    // Summary KPIs
    KPI_REVENUE: fmtCurrency(kpis.summary?.totalRevenue),
    KPI_EXPENSES: fmtCurrency(kpis.summary?.totalExpenses),
    KPI_NET_MARGIN: fmtCurrency(kpis.summary?.netMargin),
    KPI_MARGIN_PCT: fmtPct(kpis.summary?.marginPercent),
    
    // Computed insights
    TOP_DRIVER: topDriver?.name || "N/A",
    TOP_DRIVER_PAY: fmtCurrency(topDriver?.pay),
    BOTTOM_DRIVER: bottomDriver?.name || "N/A",
    BOTTOM_DRIVER_PAY: fmtCurrency(bottomDriver?.pay),
    TOP_VEHICLE_FUEL: topFuelVehicle?.unit || "N/A",
    TOP_VEHICLE_FUEL_COST: fmtCurrency(topFuelVehicle?.fuelCost),
    
    // Anomalies
    ANOMALY_HIGH_DEADHEAD: highDeadhead ? "YES" : "NO",
    ANOMALY_LOW_ONTIME: lowOnTime ? "YES" : "NO",
    ANOMALY_HIGH_CANCELS: highCancels ? "YES" : "NO",
    
    // Actions
    NEXT_WEEKDAY: nextMonday.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
    ZONE_A: "North Metro",
    
    // Estimates
    KPI_LEAKAGE_ESTIMATE: fmtCurrency(leakageEstimate),
    KPI_PREVENTABLE_LATES: fmtInt(preventableLates),
  };
}

// ============================================
// TOKEN ALLOWLIST
// ============================================

export function getTokenAllowlist(metrics: ExtractedMetrics): Set<string> {
  return new Set(Object.keys(metrics));
}

// ============================================
// STEP B: LLM PROMPT GENERATION
// ============================================

const NARRATIVE_SCHEMA = z.object({
  title: z.string().optional(),
  executive_summary: z.array(z.string()).optional(),
  findings: z.array(z.object({
    severity: z.enum(["high", "medium", "low"]),
    text: z.string(),
  })).optional(),
  actions: z.array(z.object({
    owner_role: z.string(),
    deadline: z.string(),
    text: z.string(),
  })).optional(),
  client_bullets: z.array(z.string()).optional(),
});

function buildSystemPrompt(style: NarrativeStyle, allowlist: string[]): string {
  const tokenList = allowlist.map(t => `{${t}}`).join(", ");
  
  const basePrompt = `You are a report narrative generator for a NEMT (Non-Emergency Medical Transportation) fleet operations company.

Your task is to generate a structured JSON narrative using ONLY the provided placeholder tokens.

CRITICAL RULES:
1. You MUST use ONLY these placeholder tokens: ${tokenList}
2. Do NOT invent any new tokens or use any values not in the allowlist
3. Do NOT include any patient names, addresses, phone numbers, or other PHI
4. Output MUST be valid JSON matching the schema

OUTPUT SCHEMA:
{
  "title": "string with {PLACEHOLDERS}",
  "executive_summary": ["array of strings with {PLACEHOLDERS}"],
  "findings": [{"severity": "high|medium|low", "text": "string with {PLACEHOLDERS}"}],
  "actions": [{"owner_role": "DISPATCH|PAYROLL|OPS", "deadline": "{NEXT_WEEKDAY}", "text": "action with {PLACEHOLDERS}"}],
  "client_bullets": ["array of strings with {PLACEHOLDERS}"]
}`;

  if (style === "INTERNAL") {
    return `${basePrompt}

STYLE: INTERNAL OPERATIONS REPORT
- Include detailed findings and action items
- Use operational language
- Focus on efficiency improvements and cost savings
- Include all severity levels of findings`;
  } else {
    return `${basePrompt}

STYLE: CLIENT-FACING REPORT
- Professional, concise language
- Focus on value delivered and improvements
- No internal operational details
- Only include high-level metrics and outcomes
- Use client_bullets for key takeaways`;
  }
}

function buildUserPrompt(metrics: ExtractedMetrics, templateName: string): string {
  return `Generate a narrative for the "${templateName}" report.

AVAILABLE DATA (use these placeholders in your output):
${Object.entries(metrics).map(([key, value]) => `- {${key}}: ${value}`).join("\n")}

Generate the JSON narrative now. Remember: ONLY use the placeholders listed above.`;
}

// ============================================
// STEP C: PLACEHOLDER VALIDATOR
// ============================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  invalidTokens: string[];
}

export function validateNarrativeOutput(
  output: NarrativeOutput,
  allowlist: Set<string>
): ValidationResult {
  const errors: string[] = [];
  const invalidTokens: string[] = [];
  
  // Extract all tokens from the output
  const tokenRegex = /\{([A-Z_0-9]+)\}/g;
  
  function checkString(str: string, context: string) {
    let match;
    while ((match = tokenRegex.exec(str)) !== null) {
      const token = match[1];
      if (!allowlist.has(token)) {
        invalidTokens.push(token);
        errors.push(`Invalid token {${token}} in ${context}`);
      }
    }
  }
  
  // Check title
  if (output.title) {
    checkString(output.title, "title");
  }
  
  // Check executive_summary
  if (output.executive_summary) {
    output.executive_summary.forEach((item, i) => {
      checkString(item, `executive_summary[${i}]`);
    });
  }
  
  // Check findings
  if (output.findings) {
    output.findings.forEach((finding, i) => {
      checkString(finding.text, `findings[${i}].text`);
    });
  }
  
  // Check actions
  if (output.actions) {
    output.actions.forEach((action, i) => {
      checkString(action.text, `actions[${i}].text`);
      checkString(action.deadline, `actions[${i}].deadline`);
    });
  }
  
  // Check client_bullets
  if (output.client_bullets) {
    output.client_bullets.forEach((bullet, i) => {
      checkString(bullet, `client_bullets[${i}]`);
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
    invalidTokens: [...new Set(invalidTokens)],
  };
}

// ============================================
// PHI PATTERN CHECK
// ============================================

const PHI_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, // Phone
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
  /\b\d{1,5}\s+\w+\s+(street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|court|ct|boulevard|blvd)\b/i, // Address
  /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b/i, // Full date (potential DOB)
  /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/, // Date format MM/DD/YYYY
];

export function checkForPHI(text: string): { hasPHI: boolean; matches: string[] } {
  const matches: string[] = [];
  
  for (const pattern of PHI_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      matches.push(match[0]);
    }
  }
  
  return {
    hasPHI: matches.length > 0,
    matches,
  };
}

// ============================================
// PLACEHOLDER REPLACEMENT
// ============================================

export function replacePlaceholders(
  output: NarrativeOutput,
  metrics: ExtractedMetrics
): NarrativeOutput {
  function replaceInString(str: string): string {
    return str.replace(/\{([A-Z_0-9]+)\}/g, (match, token) => {
      return (metrics as any)[token] ?? match;
    });
  }
  
  return {
    title: output.title ? replaceInString(output.title) : undefined,
    executive_summary: output.executive_summary?.map(replaceInString),
    findings: output.findings?.map(f => ({
      ...f,
      text: replaceInString(f.text),
    })),
    actions: output.actions?.map(a => ({
      ...a,
      text: replaceInString(a.text),
      deadline: replaceInString(a.deadline),
    })),
    client_bullets: output.client_bullets?.map(replaceInString),
  };
}

// ============================================
// MARKDOWN RENDERER
// ============================================

export function renderToMarkdown(output: NarrativeOutput, style: NarrativeStyle): string {
  const lines: string[] = [];
  
  if (output.title) {
    lines.push(`# ${output.title}`);
    lines.push("");
  }
  
  if (output.executive_summary && output.executive_summary.length > 0) {
    lines.push("## Executive Summary");
    lines.push("");
    output.executive_summary.forEach(item => {
      lines.push(`- ${item}`);
    });
    lines.push("");
  }
  
  if (style === "INTERNAL" && output.findings && output.findings.length > 0) {
    lines.push("## Key Findings");
    lines.push("");
    
    const severityOrder = { high: 0, medium: 1, low: 2 };
    const sorted = [...output.findings].sort((a, b) => 
      severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder]
    );
    
    sorted.forEach(finding => {
      const icon = finding.severity === "high" ? "🔴" : finding.severity === "medium" ? "🟡" : "🟢";
      lines.push(`${icon} **${finding.severity.toUpperCase()}**: ${finding.text}`);
    });
    lines.push("");
  }
  
  if (style === "INTERNAL" && output.actions && output.actions.length > 0) {
    lines.push("## Recommended Actions");
    lines.push("");
    output.actions.forEach((action, i) => {
      lines.push(`${i + 1}. **${action.owner_role}** (by ${action.deadline}): ${action.text}`);
    });
    lines.push("");
  }
  
  if (style === "CLIENT" && output.client_bullets && output.client_bullets.length > 0) {
    lines.push("## Key Takeaways");
    lines.push("");
    output.client_bullets.forEach(bullet => {
      lines.push(`✓ ${bullet}`);
    });
    lines.push("");
  }
  
  return lines.join("\n");
}

// ============================================
// MAIN PIPELINE
// ============================================

export interface NarrativeResult {
  success: boolean;
  markdown?: string;
  outputJson?: NarrativeOutput;
  error?: string;
  promptVersion: string;
  modelId: string;
}

export async function generateNarrative(
  snapshot: ReportSnapshot,
  style: NarrativeStyle
): Promise<NarrativeResult> {
  const promptVersion = "v1.0.0";
  const modelId = LLM_CONFIG.model;
  
  // Step A: Extract metrics
  const metrics = extractMetrics(snapshot);
  const allowlist = getTokenAllowlist(metrics);
  
  // Check LLM availability
  const llmStatus = await checkLLMStatus();
  if (!llmStatus.available) {
    return {
      success: false,
      error: llmStatus.error || "Local LLM unavailable",
      promptVersion,
      modelId,
    };
  }
  
  // Step B: Generate with LLM
  const systemPrompt = buildSystemPrompt(style, Array.from(allowlist));
  const userPrompt = buildUserPrompt(metrics, snapshot.templateName);
  
  const llmResult = await localLLM.completeJson(
    systemPrompt,
    userPrompt,
    NARRATIVE_SCHEMA,
    { temperature: 0.3, maxTokens: 2048 }
  );
  
  if (!llmResult.success) {
    return {
      success: false,
      error: `LLM error: ${llmResult.error.message}`,
      promptVersion,
      modelId,
    };
  }
  
  // Step C: Validate placeholders
  const validation = validateNarrativeOutput(llmResult.data, allowlist);
  if (!validation.valid) {
    return {
      success: false,
      error: `Invalid tokens: ${validation.invalidTokens.join(", ")}`,
      promptVersion,
      modelId,
    };
  }
  
  // Replace placeholders with actual values
  const resolvedOutput = replacePlaceholders(llmResult.data, metrics);
  
  // Check for PHI in final output
  const markdown = renderToMarkdown(resolvedOutput, style);
  const phiCheck = checkForPHI(markdown);
  if (phiCheck.hasPHI) {
    return {
      success: false,
      error: `PHI detected in output: ${phiCheck.matches.join(", ")}`,
      promptVersion,
      modelId,
    };
  }
  
  return {
    success: true,
    markdown,
    outputJson: resolvedOutput,
    promptVersion,
    modelId,
  };
}

// ============================================
// FALLBACK: TEMPLATE-BASED NARRATIVE
// ============================================

export function generateTemplateNarrative(
  snapshot: ReportSnapshot,
  style: NarrativeStyle
): NarrativeResult {
  const promptVersion = "template-v1.0.0";
  const modelId = "template-engine";
  
  const metrics = extractMetrics(snapshot);
  
  // Pre-built template narrative
  const output: NarrativeOutput = style === "INTERNAL" ? {
    title: `Weekly Ops — ${metrics.DATE_RANGE} — ${metrics.OPCO}/${metrics.BROKER_ACCOUNT}`,
    executive_summary: [
      `Trips: ${metrics.KPI_TRIPS_TOTAL} total (${metrics.KPI_TRIPS_COMPLETED} completed).`,
      `On-time rate: ${metrics.KPI_ONTIME_PCT}. ${metrics.ANOMALY_LOW_ONTIME === "YES" ? "Below target - needs attention." : "Meeting target."}`,
      `Driver pay: ${metrics.KPI_TOTAL_DRIVER_PAY} across ${metrics.KPI_DRIVER_COUNT} drivers.`,
      `Net margin: ${metrics.KPI_NET_MARGIN} (${metrics.KPI_MARGIN_PCT}).`,
    ],
    findings: [
      ...(metrics.ANOMALY_HIGH_DEADHEAD === "YES" ? [{
        severity: "high" as const,
        text: `Deadhead miles (${metrics.KPI_ACTUAL_DEADHEAD}) exceed target. Focus on route optimization.`,
      }] : []),
      ...(metrics.ANOMALY_LOW_ONTIME === "YES" ? [{
        severity: "high" as const,
        text: `On-time rate (${metrics.KPI_ONTIME_PCT}) below 90% threshold.`,
      }] : []),
      ...(metrics.ANOMALY_HIGH_CANCELS === "YES" ? [{
        severity: "medium" as const,
        text: `Cancellation rate elevated. Review booking confirmation process.`,
      }] : []),
      {
        severity: "low" as const,
        text: `Top performer: ${metrics.TOP_DRIVER} (${metrics.TOP_DRIVER_PAY}).`,
      },
    ],
    actions: [
      {
        owner_role: "DISPATCH",
        deadline: metrics.NEXT_WEEKDAY,
        text: `Review top 12 standing templates in ${metrics.ZONE_A} for lock optimization.`,
      },
      {
        owner_role: "OPS",
        deadline: metrics.NEXT_WEEKDAY,
        text: `Analyze IDS shadow run deltas (${metrics.KPI_PAY_DELTA} variance).`,
      },
    ],
  } : {
    title: `Operations Summary — ${metrics.DATE_RANGE}`,
    executive_summary: [
      `Completed ${metrics.KPI_TRIPS_COMPLETED} trips with ${metrics.KPI_ONTIME_PCT} on-time performance.`,
    ],
    client_bullets: [
      `On-time improvement potential: ${metrics.KPI_ONTIME_DELTA} based on IDS analysis.`,
      `Estimated monthly savings opportunity: ${metrics.KPI_LEAKAGE_ESTIMATE}.`,
      `Preventable late pickups identified: ${metrics.KPI_PREVENTABLE_LATES}.`,
    ],
  };
  
  const markdown = renderToMarkdown(output, style);
  
  return {
    success: true,
    markdown,
    outputJson: output,
    promptVersion,
    modelId,
  };
}
