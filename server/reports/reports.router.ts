// Reports Router - OC-REPORT-0
// tRPC endpoints for report management

import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import * as reportsService from "./reports.service";
import * as narrativeService from "../ai/narrative.service";
import { checkLLMStatus } from "../ai/local_llm";

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

  // ============================================
  // NARRATIVES (AI-generated)
  // ============================================

  checkLLMStatus: publicProcedure.query(async () => {
    return checkLLMStatus();
  }),

  generateNarrative: publicProcedure
    .input(
      z.object({
        runId: z.number(),
        style: z.enum(["INTERNAL", "CLIENT"]),
        useTemplate: z.boolean().optional(), // Fallback to template if LLM unavailable
      })
    )
    .mutation(async ({ input }) => {
      const run = reportsService.getReportRunById(input.runId);
      if (!run) {
        throw new Error(`Report run ${input.runId} not found`);
      }

      const template = reportsService.getTemplateById(run.templateId);
      if (!template) {
        throw new Error(`Template ${run.templateId} not found`);
      }

      // Build snapshot from run data
      const snapshot: narrativeService.ReportSnapshot = {
        templateName: template.name,
        dateRange: run.filtersJson.dateRange,
        opcoId: run.filtersJson.opcoId,
        brokerAccountId: run.filtersJson.brokerAccountId,
        kpis: run.kpisJson || {},
        audit: run.auditJson ?? undefined,
      };

      // Try LLM first, fallback to template if requested or unavailable
      let result: narrativeService.NarrativeResult;
      
      if (input.useTemplate) {
        result = narrativeService.generateTemplateNarrative(snapshot, input.style);
      } else {
        result = await narrativeService.generateNarrative(snapshot, input.style);
        
        // Fallback to template if LLM fails
        if (!result.success && result.error?.includes("unavailable")) {
          result = narrativeService.generateTemplateNarrative(snapshot, input.style);
        }
      }

      // Store the narrative
      const narrative = reportsService.createNarrative({
        reportRunId: input.runId,
        style: input.style,
        status: result.success ? "success" : "failed",
        promptVersion: result.promptVersion,
        modelId: result.modelId,
        outputMarkdown: result.markdown,
        outputJson: result.outputJson,
        error: result.error,
        createdBy: "current_user", // TODO: Get from auth context
      });

      return {
        narrative,
        result,
      };
    }),

  getNarratives: publicProcedure
    .input(z.object({ runId: z.number() }))
    .query(({ input }) => {
      return reportsService.getNarrativesByRunId(input.runId);
    }),

  getNarrativeById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => {
      const narrative = reportsService.getNarrativeById(input.id);
      if (!narrative) {
        throw new Error(`Narrative ${input.id} not found`);
      }
      return narrative;
    }),
});
