/**
 * IDS (Integral Dispatch System) Module
 * 
 * Orange Cab's optimization brain for NEMT trip dispatch.
 * 
 * Key Features:
 * - Template Lock + Gap-Fill: Keep veteran routes intact, harvest empty seats
 * - Earnings Prediction: Predict driver pay before committing schedules  
 * - Shadow Mode: Run optimizations nightly without dispatching
 * - Driver Scoring: Track reliability for smarter dispatch decisions
 * 
 * Architecture:
 * - ids.types.ts: Zod schemas and TypeScript types
 * - ids.service.ts: Main optimization orchestration
 * - ids.router.ts: tRPC API endpoints
 * 
 * Database (Drizzle):
 * - drizzle/ids.schema.ts: Tables for trips, scores, locks, pay rules
 * 
 * Future (Phase 2):
 * - OR-Tools VRPPD+TW integration for true pickup/delivery optimization
 * - Redis queue for heavy solves
 * - Real-time incremental re-optimization
 */

// Types
export * from "./ids.types";

// Config
export * from "./ids.config";

// Service
export { IDSService, getIDSService, resetIDSService } from "./ids.service";

// Router
export { idsRouter, type IDSRouter } from "./ids.router";
