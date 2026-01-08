import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleFilterOptions,
  bulkCreateVehicles,
  getVehicleDocuments,
  createVehicleDocument,
  deleteVehicleDocument,
  getDocumentById,
  getVehicleStats,
} from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

// Zod schemas for validation
const vehicleFiltersSchema = z.object({
  search: z.string().optional(),
  city: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().optional(),
  isActive: z.enum(["active", "inactive"]).optional(),
});

const vehicleInputSchema = z.object({
  vehicleNumber: z.string().min(1, "Vehicle number is required"),
  tagNumber: z.string().min(1, "Tag number is required"),
  vin: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  make: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  year: z.number().optional().nullable(),
  tireSize: z.string().optional().nullable(),
  registrationExp: z.string().optional().nullable(),
  stateInspectionExp: z.string().optional().nullable(),
  cityInspectionDate: z.string().optional().nullable(),
  insurance: z.string().optional().nullable(),
  isActive: z.enum(["active", "inactive"]).optional(),
  notes: z.string().optional().nullable(),
});

const documentCategorySchema = z.enum([
  "title",
  "purchase_bill",
  "state_inspection",
  "registration",
  "insurance",
  "city_inspection",
  "other",
]);

const documentInputSchema = z.object({
  vehicleId: z.number(),
  category: documentCategorySchema,
  fileName: z.string(),
  fileData: z.string(), // Base64 encoded file data
  mimeType: z.string(),
  fileSize: z.number(),
  expirationDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const bulkVehicleSchema = z.object({
  vehicleNumber: z.string(),
  tagNumber: z.string(),
  vin: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  make: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  year: z.number().optional().nullable(),
  tireSize: z.string().optional().nullable(),
  registrationExp: z.string().optional().nullable(),
  stateInspectionExp: z.string().optional().nullable(),
  cityInspectionDate: z.string().optional().nullable(),
  insurance: z.string().optional().nullable(),
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  vehicles: router({
    // List vehicles with optional filters
    list: protectedProcedure
      .input(vehicleFiltersSchema.optional())
      .query(async ({ input }) => {
        return getVehicles(input || {});
      }),

    // Get single vehicle by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getVehicleById(input.id);
      }),

    // Create new vehicle
    create: protectedProcedure
      .input(vehicleInputSchema)
      .mutation(async ({ input, ctx }) => {
        const data = {
          ...input,
          registrationExp: input.registrationExp ? new Date(input.registrationExp) : null,
          stateInspectionExp: input.stateInspectionExp ? new Date(input.stateInspectionExp) : null,
          cityInspectionDate: input.cityInspectionDate ? new Date(input.cityInspectionDate) : null,
          createdBy: ctx.user.id,
        };
        return createVehicle(data);
      }),

    // Update vehicle
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: vehicleInputSchema.partial(),
      }))
      .mutation(async ({ input }) => {
        const updateData: Record<string, unknown> = { ...input.data };
        
        if (input.data.registrationExp !== undefined) {
          updateData.registrationExp = input.data.registrationExp ? new Date(input.data.registrationExp) : null;
        }
        if (input.data.stateInspectionExp !== undefined) {
          updateData.stateInspectionExp = input.data.stateInspectionExp ? new Date(input.data.stateInspectionExp) : null;
        }
        if (input.data.cityInspectionDate !== undefined) {
          updateData.cityInspectionDate = input.data.cityInspectionDate ? new Date(input.data.cityInspectionDate) : null;
        }
        
        return updateVehicle(input.id, updateData);
      }),

    // Delete vehicle
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteVehicle(input.id);
      }),

    // Get filter options (cities, makes, models, years)
    filterOptions: protectedProcedure.query(async () => {
      return getVehicleFilterOptions();
    }),

    // Bulk import vehicles
    bulkImport: protectedProcedure
      .input(z.object({ vehicles: z.array(bulkVehicleSchema) }))
      .mutation(async ({ input, ctx }) => {
        const vehicleData = input.vehicles.map(v => ({
          ...v,
          registrationExp: v.registrationExp ? new Date(v.registrationExp) : null,
          stateInspectionExp: v.stateInspectionExp ? new Date(v.stateInspectionExp) : null,
          cityInspectionDate: v.cityInspectionDate ? new Date(v.cityInspectionDate) : null,
          createdBy: ctx.user.id,
        }));
        return bulkCreateVehicles(vehicleData);
      }),

    // Get dashboard stats
    stats: protectedProcedure.query(async () => {
      return getVehicleStats();
    }),
  }),

  documents: router({
    // List documents for a vehicle
    listByVehicle: protectedProcedure
      .input(z.object({ vehicleId: z.number() }))
      .query(async ({ input }) => {
        return getVehicleDocuments(input.vehicleId);
      }),

    // Upload document
    upload: protectedProcedure
      .input(documentInputSchema)
      .mutation(async ({ input, ctx }) => {
        // Decode base64 file data
        const fileBuffer = Buffer.from(input.fileData, "base64");
        
        // Generate unique file key
        const fileExt = input.fileName.split(".").pop() || "bin";
        const fileKey = `vehicles/${input.vehicleId}/documents/${input.category}/${nanoid()}.${fileExt}`;
        
        // Upload to S3
        const { url } = await storagePut(fileKey, fileBuffer, input.mimeType);
        
        // Save document record
        const docData = {
          vehicleId: input.vehicleId,
          category: input.category,
          fileName: input.fileName,
          fileKey,
          fileUrl: url,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          expirationDate: input.expirationDate ? new Date(input.expirationDate) : null,
          notes: input.notes,
          uploadedBy: ctx.user.id,
        };
        
        return createVehicleDocument(docData);
      }),

    // Delete document
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteVehicleDocument(input.id);
      }),

    // Get document by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getDocumentById(input.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
