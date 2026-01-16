// Reports Router - OC-REPORT-0
// tRPC endpoints for report management

import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import * as reportsService from "./reports.service";

export const reportsRouter = router({
  // ============================================
  // TEMPLATES
  // ============================================

  getTemplates: publicProcedure
    .input(z.object({ category: z.string().optional() }).optional())
    .query(({ input }) => {
      return reportsService.getTemplates(input?.category);
    }),

  getTemplateById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => {
      const template = reportsService.getTemplateById(input.id);
      if (!template) {
        throw new Error(`Template ${input.id} not found`);
      }
      return template;
    }),

  createTemplate: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.enum(["OPERATIONS", "PAYROLL", "BILLING", "IDS", "COMPLIANCE"]),
        defaultFiltersJson: z.any().optional(),
        sectionsJson: z.any().optional(),
      })
    )
    .mutation(({ input }) => {
      return reportsService.createTemplate({
        ...input,
        createdBy: "current_user", // TODO: Get from auth context
      });
    }),

  // ============================================
  // REPORT RUNS
  // ============================================

  generateReport: publicProcedure
    .input(
      z.object({
        templateId: z.number(),
        filters: z.object({
          dateRange: z.object({
            start: z.string(),
            end: z.string(),
          }),
          opcoId: z.string().optional(),
          brokerAccountId: z.string().optional(),
          driverIds: z.array(z.string()).optional(),
          vehicleIds: z.array(z.string()).optional(),
        }),
      })
    )
    .mutation(({ input }) => {
      const run = reportsService.buildReportRun(
        input.templateId,
        input.filters,
        "current_user" // TODO: Get from auth context
      );

      // Create JSON artifact with the KPIs snapshot
      if (run.status === "COMPLETED" && run.kpisJson) {
        reportsService.createArtifact({
          runId: run.id,
          artifactType: "JSON",
          fileName: `report_${run.id}_kpis.json`,
          content: JSON.stringify(run.kpisJson, null, 2),
        });
      }

      return run;
    }),

  getReportRuns: publicProcedure
    .input(
      z
        .object({
          templateId: z.number().optional(),
          status: z.string().optional(),
          limit: z.number().optional(),
        })
        .optional()
    )
    .query(({ input }) => {
      return reportsService.getReportRuns(input);
    }),

  getReportRunById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => {
      const run = reportsService.getReportRunById(input.id);
      if (!run) {
        throw new Error(`Report run ${input.id} not found`);
      }
      return run;
    }),

  // ============================================
  // ARTIFACTS
  // ============================================

  getArtifacts: publicProcedure
    .input(z.object({ runId: z.number() }))
    .query(({ input }) => {
      return reportsService.getArtifactsByRunId(input.runId);
    }),

  createPDFArtifact: publicProcedure
    .input(
      z.object({
        runId: z.number(),
        htmlContent: z.string(),
      })
    )
    .mutation(({ input }) => {
      // For now, store the HTML content as a placeholder
      // In production, this would render to PDF using puppeteer or similar
      const artifact = reportsService.createArtifact({
        runId: input.runId,
        artifactType: "PDF",
        fileName: `report_${input.runId}.pdf`,
        content: input.htmlContent,
      });
      return artifact;
    }),
});
