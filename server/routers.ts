import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

// Helper function to safely parse date strings into Date objects
function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  
  // Try parsing as ISO date first (YYYY-MM-DD)
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date;
  }
  
  // Try parsing JavaScript Date string format (e.g., "Thu Apr 29 2027 20:00:00 GMT-0400")
  const jsDate = new Date(dateStr);
  if (!isNaN(jsDate.getTime())) {
    return jsDate;
  }
  
  // Try MM/DD/YYYY format
  const usMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (usMatch) {
    const [, month, day, year] = usMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) return date;
  }
  
  return null;
}
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
  getMaintenanceRecords,
  getMaintenanceRecordById,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
  getDrivers,
  getDriverById,
  getDriverByVehicleId,
  createDriver,
  updateDriver,
  deleteDriver,
  assignVehicleToDriver,
  getDriverVehicleHistory,
  bulkCreateDrivers,
  getDriverStats,
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

const maintenanceTypeSchema = z.enum([
  "oil_change",
  "tire_rotation",
  "tire_replacement",
  "brake_service",
  "transmission",
  "engine_repair",
  "battery",
  "inspection",
  "registration_renewal",
  "insurance_renewal",
  "body_work",
  "electrical",
  "ac_heating",
  "general_service",
  "other",
]);

const maintenanceInputSchema = z.object({
  vehicleId: z.number(),
  maintenanceType: maintenanceTypeSchema,
  description: z.string().optional().nullable(),
  serviceDate: z.string(),
  mileage: z.number().optional().nullable(),
  cost: z.number().optional().nullable(), // in cents
  serviceProvider: z.string().optional().nullable(),
  invoiceNumber: z.string().optional().nullable(),
  nextServiceDate: z.string().optional().nullable(),
  nextServiceMileage: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Driver schemas
const driverStatusSchema = z.enum(["active", "inactive", "on_leave", "terminated"]);

const driverFiltersSchema = z.object({
  search: z.string().optional(),
  city: z.string().optional(),
  status: driverStatusSchema.optional(),
  hasVehicle: z.boolean().optional(),
});

const driverInputSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  licenseNumber: z.string().optional().nullable(),
  licenseExpiration: z.string().optional().nullable(),
  licenseState: z.string().optional().nullable(),
  assignedVehicleId: z.number().optional().nullable(),
  city: z.string().optional().nullable(),
  status: driverStatusSchema.optional(),
  hireDate: z.string().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const bulkDriverSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  licenseNumber: z.string().optional().nullable(),
  licenseExpiration: z.string().optional().nullable(),
  licenseState: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  hireDate: z.string().optional().nullable(),
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
          registrationExp: parseDate(v.registrationExp),
          stateInspectionExp: parseDate(v.stateInspectionExp),
          cityInspectionDate: parseDate(v.cityInspectionDate),
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

  drivers: router({
    // List drivers with optional filters
    list: protectedProcedure
      .input(driverFiltersSchema.optional())
      .query(async ({ input }) => {
        return getDrivers(input || {});
      }),

    // Get single driver by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getDriverById(input.id);
      }),

    // Get driver by vehicle ID
    getByVehicleId: protectedProcedure
      .input(z.object({ vehicleId: z.number() }))
      .query(async ({ input }) => {
        return getDriverByVehicleId(input.vehicleId);
      }),

    // Create new driver
    create: protectedProcedure
      .input(driverInputSchema)
      .mutation(async ({ input, ctx }) => {
        const data = {
          ...input,
          licenseExpiration: parseDate(input.licenseExpiration),
          hireDate: parseDate(input.hireDate),
          createdBy: ctx.user.id,
        };
        return createDriver(data);
      }),

    // Update driver
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: driverInputSchema.partial(),
      }))
      .mutation(async ({ input }) => {
        const updateData: Record<string, unknown> = { ...input.data };
        
        if (input.data.licenseExpiration !== undefined) {
          updateData.licenseExpiration = parseDate(input.data.licenseExpiration);
        }
        if (input.data.hireDate !== undefined) {
          updateData.hireDate = parseDate(input.data.hireDate);
        }
        
        return updateDriver(input.id, updateData);
      }),

    // Delete driver
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteDriver(input.id);
      }),

    // Assign vehicle to driver
    assignVehicle: protectedProcedure
      .input(z.object({
        driverId: z.number(),
        vehicleId: z.number().nullable(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return assignVehicleToDriver(input.driverId, input.vehicleId, input.notes);
      }),

    // Get driver's vehicle history
    vehicleHistory: protectedProcedure
      .input(z.object({ driverId: z.number() }))
      .query(async ({ input }) => {
        return getDriverVehicleHistory(input.driverId);
      }),

    // Bulk import drivers
    bulkImport: protectedProcedure
      .input(z.object({ drivers: z.array(bulkDriverSchema) }))
      .mutation(async ({ input, ctx }) => {
        const driverData = input.drivers.map(d => ({
          ...d,
          licenseExpiration: parseDate(d.licenseExpiration),
          hireDate: parseDate(d.hireDate),
          createdBy: ctx.user.id,
        }));
        return bulkCreateDrivers(driverData);
      }),

    // Get driver stats
    stats: protectedProcedure.query(async () => {
      return getDriverStats();
    }),
  }),

  maintenance: router({
    // List maintenance records for a vehicle
    listByVehicle: protectedProcedure
      .input(z.object({ vehicleId: z.number() }))
      .query(async ({ input }) => {
        return getMaintenanceRecords(input.vehicleId);
      }),

    // Get single maintenance record by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getMaintenanceRecordById(input.id);
      }),

    // Create new maintenance record
    create: protectedProcedure
      .input(maintenanceInputSchema)
      .mutation(async ({ input, ctx }) => {
        const data = {
          ...input,
          serviceDate: parseDate(input.serviceDate)!,
          nextServiceDate: parseDate(input.nextServiceDate),
          createdBy: ctx.user.id,
        };
        return createMaintenanceRecord(data);
      }),

    // Update maintenance record
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: maintenanceInputSchema.partial().omit({ vehicleId: true }),
      }))
      .mutation(async ({ input }) => {
        const updateData: Record<string, unknown> = { ...input.data };
        
        if (input.data.serviceDate !== undefined) {
          updateData.serviceDate = parseDate(input.data.serviceDate);
        }
        if (input.data.nextServiceDate !== undefined) {
          updateData.nextServiceDate = parseDate(input.data.nextServiceDate);
        }
        
        return updateMaintenanceRecord(input.id, updateData);
      }),

    // Delete maintenance record
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteMaintenanceRecord(input.id);
      }),
  }),

  // OC-PAY-2: Payroll router
  payroll: router({
    // ============ PAYROLL PERIODS ============
    
    // List payroll periods
    periods: router({
      list: protectedProcedure
        .input(z.object({ status: z.enum(["open", "processing", "completed"]).optional() }).optional())
        .query(async ({ input }) => {
          return getPayrollPeriods(input?.status);
        }),

      getById: protectedProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
          return getPayrollPeriodById(input.id);
        }),

      create: protectedProcedure
        .input(z.object({
          periodStart: z.string(),
          periodEnd: z.string(),
          payDate: z.string(),
          notes: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          return createPayrollPeriod({
            periodStart: new Date(input.periodStart),
            periodEnd: new Date(input.periodEnd),
            payDate: new Date(input.payDate),
            notes: input.notes,
            processedBy: ctx.user.id,
          });
        }),

      update: protectedProcedure
        .input(z.object({
          id: z.number(),
          data: z.object({
            status: z.enum(["open", "processing", "completed"]).optional(),
            totalDriverPay: z.number().optional(),
            totalEmployeePay: z.number().optional(),
            notes: z.string().optional(),
          }),
        }))
        .mutation(async ({ input }) => {
          return updatePayrollPeriod(input.id, input.data);
        }),
    }),

    // ============ DRIVER PAYMENTS ============
    
    payments: router({
      listByPeriod: protectedProcedure
        .input(z.object({ payrollPeriodId: z.number() }))
        .query(async ({ input }) => {
          return getDriverPaymentsByPeriod(input.payrollPeriodId);
        }),

      getById: protectedProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
          return getDriverPaymentById(input.id);
        }),

      // Update payment with inline editing (Gas/Credits/Deductions)
      update: protectedProcedure
        .input(z.object({
          id: z.number(),
          data: z.object({
            tripCount: z.number().optional(),
            totalMiles: z.string().optional(),
            grossPay: z.number().optional(),
            deductions: z.number().optional(),
            netPay: z.number().optional(),
            status: z.enum(["pending", "approved", "paid"]).optional(),
            notes: z.string().optional(),
          }),
        }))
        .mutation(async ({ input }) => {
          return updateDriverPayment(input.id, input.data);
        }),

      // Upsert payment (create or update)
      upsert: protectedProcedure
        .input(z.object({
          driverId: z.number(),
          payrollPeriodId: z.number(),
          tripCount: z.number(),
          totalMiles: z.string(),
          grossPay: z.number(),
          deductions: z.number().default(0),
          netPay: z.number(),
          status: z.enum(["pending", "approved", "paid"]).default("pending"),
          notes: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          return upsertDriverPayment(input);
        }),

      // Recalculate net pay for a driver payment
      recalculate: protectedProcedure
        .input(z.object({
          driverId: z.number(),
          payrollPeriodId: z.number(),
          miles: z.number(),
          ratePerMile: z.number(),
          totalDollars: z.number().default(0),
        }))
        .mutation(async ({ input }) => {
          return calculateDriverNetPay(
            input.driverId,
            input.payrollPeriodId,
            input.miles,
            input.ratePerMile,
            input.totalDollars
          );
        }),
    }),

    // ============ DRIVER CONTRACTS ============
    
    contracts: router({
      getActive: protectedProcedure
        .input(z.object({ driverId: z.number() }))
        .query(async ({ input }) => {
          return getActiveContractForDriver(input.driverId);
        }),

      listByDriver: protectedProcedure
        .input(z.object({ driverId: z.number() }))
        .query(async ({ input }) => {
          return getDriverContracts(input.driverId);
        }),

      create: protectedProcedure
        .input(z.object({
          driverId: z.number(),
          contractType: z.enum(["standard", "wheelchair", "long_distance", "premium"]).default("standard"),
          payScheme: z.enum(["per_trip", "per_mile", "hybrid"]).default("per_mile"),
          ratePerMile: z.number().optional(),
          ratePerTrip: z.number().optional(),
          baseRate: z.number().optional(),
          effectiveDate: z.string(),
          endDate: z.string().optional(),
          contractDocumentUrl: z.string().optional(),
          notes: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          return createDriverPayContract({
            driverId: input.driverId,
            contractType: input.contractType,
            payScheme: input.payScheme,
            ratePerMile: input.ratePerMile,
            ratePerTrip: input.ratePerTrip,
            baseRate: input.baseRate,
            effectiveDate: input.effectiveDate, // Drizzle date type accepts string in YYYY-MM-DD format
            endDate: input.endDate, // Drizzle date type accepts string in YYYY-MM-DD format
            contractDocumentUrl: input.contractDocumentUrl,
            notes: input.notes,
            createdBy: ctx.user.id,
          } as any);
        }),

      update: protectedProcedure
        .input(z.object({
          id: z.number(),
          data: z.object({
            contractType: z.enum(["standard", "wheelchair", "long_distance", "premium"]).optional(),
            payScheme: z.enum(["per_trip", "per_mile", "hybrid"]).optional(),
            ratePerMile: z.number().optional(),
            ratePerTrip: z.number().optional(),
            baseRate: z.number().optional(),
            endDate: z.string().optional(),
            isActive: z.boolean().optional(),
            notes: z.string().optional(),
          }),
        }))
        .mutation(async ({ input }) => {
          const data: Record<string, unknown> = { ...input.data };
          if (input.data.endDate) {
            data.endDate = new Date(input.data.endDate);
          }
          return updateDriverContract(input.id, data);
        }),
    }),

    // ============ PAYROLL ADJUSTMENTS ============
    
    adjustments: router({
      listByPayment: protectedProcedure
        .input(z.object({ driverPaymentId: z.number() }))
        .query(async ({ input }) => {
          return getAdjustmentsForPayment(input.driverPaymentId);
        }),

      listByDriverPeriod: protectedProcedure
        .input(z.object({ driverId: z.number(), payrollPeriodId: z.number() }))
        .query(async ({ input }) => {
          return getAdjustmentsForDriverPeriod(input.driverId, input.payrollPeriodId);
        }),

      create: protectedProcedure
        .input(z.object({
          driverPaymentId: z.number().optional(),
          driverId: z.number(),
          payrollPeriodId: z.number(),
          adjustmentType: z.enum(["gas", "credit", "advance", "deduction"]),
          amount: z.number(),
          memo: z.string().optional(),
          sourceRef: z.string().optional(),
          sourceType: z.string().optional(),
          sourceId: z.number().optional(),
          isAutoSuggested: z.boolean().default(false),
          isApproved: z.boolean().default(true),
        }))
        .mutation(async ({ input, ctx }) => {
          return createPayrollAdjustment({
            ...input,
            createdBy: ctx.user.id,
          });
        }),

      update: protectedProcedure
        .input(z.object({
          id: z.number(),
          data: z.object({
            amount: z.number().optional(),
            memo: z.string().optional(),
            isApproved: z.boolean().optional(),
          }),
        }))
        .mutation(async ({ input }) => {
          return updatePayrollAdjustment(input.id, input.data);
        }),

      delete: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          return deletePayrollAdjustment(input.id);
        }),

      // Get suggested deductions from tickets/tolls
      getSuggested: protectedProcedure
        .input(z.object({ driverId: z.number(), payrollPeriodId: z.number() }))
        .query(async ({ input }) => {
          return getSuggestedDeductions(input.driverId, input.payrollPeriodId);
        }),
    }),

    // ============ IMPORT MANAGEMENT ============
    
    import: router({
      // Get import errors
      errors: protectedProcedure
        .input(z.object({
          batchId: z.string().optional(),
          includeResolved: z.boolean().default(false),
        }).optional())
        .query(async ({ input }) => {
          return getImportErrors(input?.batchId, input?.includeResolved);
        }),

      // Resolve an import error
      resolveError: protectedProcedure
        .input(z.object({
          id: z.number(),
          notes: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          return resolveImportError(input.id, ctx.user.id, input.notes);
        }),

      // Get import batches
      batches: protectedProcedure
        .input(z.object({ payrollPeriodId: z.number().optional() }).optional())
        .query(async ({ input }) => {
          return getImportBatches(input?.payrollPeriodId);
        }),

      // Import trips from MediRoute for payroll
      importTrips: protectedProcedure
        .input(z.object({
          payrollPeriodId: z.number(),
          periodStart: z.string(),
          periodEnd: z.string(),
        }))
        .mutation(async ({ input, ctx }) => {
          const batchId = `IMPORT-${Date.now()}`;
          
          // Create import batch record
          await createImportBatch({
            batchId,
            payrollPeriodId: input.payrollPeriodId,
            sourceType: "mediroute_api",
            importedBy: ctx.user.id,
          });

          // Get completed trips for the period
          const tripsData = await getCompletedTripsForPayroll(
            new Date(input.periodStart),
            new Date(input.periodEnd)
          );

          // Group trips by driver
          const driverTrips = new Map<number, { trips: typeof tripsData, totalMiles: number, tripCount: number }>();
          
          let successCount = 0;
          let errorCount = 0;

          for (const { trip, driver } of tripsData) {
            if (!driver?.id) {
              // Log error for unassigned trip
              await createImportError({
                importBatchId: batchId,
                rowNumber: successCount + errorCount + 1,
                reason: "Trip has no assigned driver",
                rawPayload: JSON.stringify(trip),
              });
              errorCount++;
              continue;
            }

            const existing = driverTrips.get(driver.id) || { trips: [], totalMiles: 0, tripCount: 0 };
            existing.trips.push({ trip, driver });
            existing.totalMiles += parseFloat(trip.actualMiles?.toString() || "0");
            existing.tripCount++;
            driverTrips.set(driver.id, existing);
            successCount++;
          }

          // Create/update driver payments
          for (const [driverId, data] of Array.from(driverTrips.entries())) {
            // Get driver's contract rate
            const contract = await getActiveContractForDriver(driverId);
            // Handle both driverPayContracts (ratePerMile) and driverContracts (payRate)
            let ratePerMile = 150; // Default $1.50/mile in cents
            if (contract && 'ratePerMile' in contract && contract.ratePerMile) {
              ratePerMile = contract.ratePerMile;
            } else if (contract && 'payRate' in contract && contract.payRate) {
              ratePerMile = Math.round(parseFloat(contract.payRate) * 100);
            }

            // Calculate pay
            const grossPay = Math.round(data.totalMiles * ratePerMile);
            
            await upsertDriverPayment({
              driverId,
              payrollPeriodId: input.payrollPeriodId,
              tripCount: data.tripCount,
              totalMiles: data.totalMiles.toFixed(2),
              grossPay,
              deductions: 0,
              netPay: grossPay,
              status: "pending",
            });
          }

          // Update batch status
          await updateImportBatch(1, {
            totalRows: successCount + errorCount,
            successfulRows: successCount,
            failedRows: errorCount,
            status: "completed",
            completedAt: new Date(),
          });

          return {
            batchId,
            totalRows: successCount + errorCount,
            successfulRows: successCount,
            failedRows: errorCount,
            driversProcessed: driverTrips.size,
          };
        }),
    }),

    // ============ EXCEPTIONS & REPORTS ============
    
    exceptions: protectedProcedure
      .input(z.object({ payrollPeriodId: z.number() }))
      .query(async ({ input }) => {
        return getPayrollExceptions(input.payrollPeriodId);
      }),

    // Export payroll data as CSV
    exportCsv: protectedProcedure
      .input(z.object({ payrollPeriodId: z.number() }))
      .query(async ({ input }) => {
        const payments = await getDriverPaymentsByPeriod(input.payrollPeriodId);
        const period = await getPayrollPeriodById(input.payrollPeriodId);

        // Build CSV data
        const headers = ["Driver", "Driver ID", "Trips", "Miles", "Gross Pay", "Deductions", "Net Pay", "Status"];
        const rows = payments.map(({ payment, driver }) => [
          driver ? `${driver.firstName} ${driver.lastName}` : "Unknown",
          payment.driverId.toString(),
          payment.tripCount?.toString() || "0",
          payment.totalMiles?.toString() || "0",
          (payment.grossPay / 100).toFixed(2),
          ((payment.deductions || 0) / 100).toFixed(2),
          (payment.netPay / 100).toFixed(2),
          payment.status,
        ]);

        const csvContent = [
          headers.join(","),
          ...rows.map(row => row.join(",")),
        ].join("\n");

        return {
          filename: `payroll_${period?.periodStart}_${period?.periodEnd}.csv`,
          content: csvContent,
          period,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;

// OC-PAY-2: Payroll router imports
import {
  getPayrollPeriods,
  getPayrollPeriodById,
  createPayrollPeriod,
  updatePayrollPeriod,
  getDriverPaymentsByPeriod,
  getDriverPaymentById,
  createDriverPayment,
  updateDriverPayment,
  upsertDriverPayment,
  getActiveContractForDriver,
  getDriverContracts,
  getDriverPayContracts,
  createDriverContract,
  createDriverPayContract,
  updateDriverContract,
  getAdjustmentsForPayment,
  getAdjustmentsForDriverPeriod,
  createPayrollAdjustment,
  updatePayrollAdjustment,
  deletePayrollAdjustment,
  getSuggestedDeductions,
  getImportErrors,
  createImportError,
  resolveImportError,
  getImportBatches,
  createImportBatch,
  updateImportBatch,
  getCompletedTripsForPayroll,
  getDriverTripsForPeriod,
  calculateDriverNetPay,
  getPayrollExceptions,
} from "./db";
