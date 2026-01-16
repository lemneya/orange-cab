/**
 * Owner Router - tRPC endpoints for Owner Cockpit and Weekly Packs
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { generateOwnerSnapshot, validateSnapshot, storeSnapshot, getSnapshot, listSnapshots } from "./snapshot.service";
import { generateOwnerNarrative } from "../ai/narrative.service";

export const ownerRouter = router({
  // Generate a new snapshot
  generateSnapshot: publicProcedure
    .input(z.object({
      opcoId: z.string(),
      brokerAccountId: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      timezone: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const snapshot = await generateOwnerSnapshot(input);
      validateSnapshot(snapshot);
      const checksum = storeSnapshot(snapshot);
      return { snapshot, checksum };
    }),

  // Get a snapshot by checksum
  getSnapshot: publicProcedure
    .input(z.object({ checksum: z.string() }))
    .query(({ input }) => {
      const snapshot = getSnapshot(input.checksum);
      if (!snapshot) {
        throw new Error(`Snapshot not found: ${input.checksum}`);
      }
      return snapshot;
    }),

  // List all snapshots
  listSnapshots: publicProcedure
    .query(() => {
      return listSnapshots().map(s => ({
        checksum: s.meta.snapshot_checksum,
        generatedAt: s.meta.generated_at,
        opcoId: s.scope.opco_id,
        brokerAccountId: s.scope.broker_account_id,
        dateRange: `${s.period.start_date} to ${s.period.end_date}`,
      }));
    }),

  // Generate narrative from snapshot
  generateNarrative: publicProcedure
    .input(z.object({
      checksum: z.string(),
      style: z.enum(["INTERNAL", "CLIENT"]),
    }))
    .mutation(async ({ input }) => {
      const snapshot = getSnapshot(input.checksum);
      if (!snapshot) {
        throw new Error(`Snapshot not found: ${input.checksum}`);
      }
      return generateOwnerNarrative(snapshot, input.style);
    }),

  // Get cockpit data (combines snapshot generation + formatting for UI)
  getCockpitData: publicProcedure
    .input(z.object({
      opcoId: z.string(),
      brokerAccountId: z.string(),
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ input }) => {
      const snapshot = await generateOwnerSnapshot(input);
      
      // Format for UI consumption
      return {
        checksum: snapshot.meta.snapshot_checksum,
        generatedAt: snapshot.meta.generated_at,
        dataFreshness: snapshot.meta.data_freshness,
        scope: snapshot.scope,
        period: snapshot.period,
        kpis: {
          netMargin: {
            value: snapshot.kpis.revenue.value - snapshot.kpis.cash_out.value,
            delta: snapshot.kpis.revenue.delta?.value,
            direction: snapshot.kpis.revenue.delta?.direction,
          },
          onTimeRate: {
            value: snapshot.kpis.on_time.value,
            delta: snapshot.kpis.on_time.delta?.value,
            direction: snapshot.kpis.on_time.delta?.direction,
          },
          tripsCompleted: {
            value: snapshot.kpis.demand_loss.breakdown.completed,
            scheduled: snapshot.kpis.demand_loss.breakdown.scheduled,
          },
          deadheadMiles: {
            value: snapshot.kpis.deadhead.value,
            delta: snapshot.kpis.deadhead.delta?.value,
            direction: snapshot.kpis.deadhead.delta?.direction,
          },
        },
        alerts: snapshot.alerts,
        timeline: snapshot.timeline,
        sections: snapshot.sections,
      };
    }),

  // Weekly Pack endpoints
  packs: router({
    list: publicProcedure.query(() => {
      // In production, this would query the database
      return [
        {
          id: "WP-001",
          weekStart: "2026-01-06",
          weekEnd: "2026-01-12",
          scope: "SAHRAWI / MODIVCARE_SAHRAWI",
          status: "READY",
          createdAt: "2026-01-13T08:00:00Z",
          snapshotChecksum: "abc123def4",
        },
      ];
    }),

    get: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(({ input }) => {
        // In production, this would query the database
        return {
          id: input.id,
          weekStart: "2026-01-06",
          weekEnd: "2026-01-12",
          scope: "SAHRAWI / MODIVCARE_SAHRAWI",
          status: "READY",
          createdAt: "2026-01-13T08:00:00Z",
          snapshotChecksum: "abc123def4",
          narrative: {
            style: "INTERNAL",
            markdown: "# Weekly Ops Report\n\nGenerated content here...",
            generatedAt: "2026-01-13T08:05:00Z",
          },
        };
      }),

    generate: publicProcedure
      .input(z.object({
        opcoId: z.string(),
        brokerAccountId: z.string(),
        weekStart: z.string(),
        weekEnd: z.string(),
        style: z.enum(["INTERNAL", "CLIENT"]),
      }))
      .mutation(async ({ input }) => {
        // Generate snapshot
        const snapshot = await generateOwnerSnapshot({
          opcoId: input.opcoId,
          brokerAccountId: input.brokerAccountId,
          startDate: input.weekStart,
          endDate: input.weekEnd,
        });
        
        const checksum = storeSnapshot(snapshot);
        
        // Generate narrative
        const narrative = await generateOwnerNarrative(snapshot, input.style);
        
        // In production, save to database
        const packId = `WP-${Date.now()}`;
        
        return {
          id: packId,
          snapshotChecksum: checksum,
          narrative,
          status: narrative.success ? "READY" : "FAILED",
        };
      }),
  }),
});
