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
  // OC-PAY-3: Fuel + Toll Import
  createImportBatch,
  updateImportBatch,
  getImportBatches,
  createFuelTransaction,
  getFuelTransactions,
  checkDuplicateFuelTransaction,
  createTollTransaction,
  getTollTransactions,
  checkDuplicateTollTransaction,
  createPayrollAllocation,
  getPayrollAllocations,
  getUnmatchedAllocations,
  updatePayrollAllocation,
  assignAllocationToDriver,
  getDriverAllocationTotals,
  autoMatchFuelTransaction,
  autoMatchTollTransaction,
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

  // OC-PAY-3: Fuel + Toll Import
  fuelImport: router({
    // Get import batches
    getBatches: protectedProcedure
      .input(z.object({ type: z.enum(["fuel", "toll"]).optional() }).optional())
      .query(async ({ input }) => {
        return getImportBatches(input?.type);
      }),

    // Get fuel transactions
    getFuelTransactions: protectedProcedure
      .input(z.object({
        batchId: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return getFuelTransactions({
          batchId: input?.batchId,
          startDate: input?.startDate ? new Date(input.startDate) : undefined,
          endDate: input?.endDate ? new Date(input.endDate) : undefined,
        });
      }),

    // Get toll transactions
    getTollTransactions: protectedProcedure
      .input(z.object({
        batchId: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return getTollTransactions({
          batchId: input?.batchId,
          startDate: input?.startDate ? new Date(input.startDate) : undefined,
          endDate: input?.endDate ? new Date(input.endDate) : undefined,
        });
      }),

    // Import fuel transactions from CSV
    importFuel: protectedProcedure
      .input(z.object({
        vendor: z.enum(["shell", "exxon", "bp", "chevron", "wawa", "sheetz", "other"]),
        payPeriodId: z.number().optional(),
        fileName: z.string(),
        transactions: z.array(z.object({
          vendorTxnId: z.string(),
          transactionDate: z.string(),
          amount: z.number(), // in cents
          gallons: z.number().optional(),
          pricePerGallon: z.number().optional(),
          cardId: z.string().optional(),
          cardLastFour: z.string().optional(),
          licensePlate: z.string().optional(),
          unitNumber: z.string().optional(),
          stationName: z.string().optional(),
          stationAddress: z.string().optional(),
          stationCity: z.string().optional(),
          stationState: z.string().optional(),
          productType: z.string().optional(),
          rawPayload: z.string().optional(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const batchId = `FUEL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Create import batch
        await createImportBatch({
          batchId,
          importType: "fuel",
          vendor: input.vendor,
          fileName: input.fileName,
          totalRows: input.transactions.length,
          status: "processing",
          payPeriodId: input.payPeriodId,
          importedBy: ctx.user.id,
        });

        let successfulRows = 0;
        let failedRows = 0;
        let duplicateRows = 0;
        let autoMatchedCount = 0;
        let unmatchedCount = 0;

        for (const txn of input.transactions) {
          try {
            // Check for duplicate
            const isDuplicate = await checkDuplicateFuelTransaction(input.vendor, txn.vendorTxnId);
            if (isDuplicate) {
              duplicateRows++;
              continue;
            }

            // Create fuel transaction
            const result = await createFuelTransaction({
              vendor: input.vendor,
              vendorTxnId: txn.vendorTxnId,
              transactionDate: new Date(txn.transactionDate),
              amount: txn.amount,
              gallons: txn.gallons?.toString(),
              pricePerGallon: txn.pricePerGallon,
              cardId: txn.cardId,
              cardLastFour: txn.cardLastFour,
              licensePlate: txn.licensePlate,
              unitNumber: txn.unitNumber,
              stationName: txn.stationName,
              stationAddress: txn.stationAddress,
              stationCity: txn.stationCity,
              stationState: txn.stationState,
              productType: txn.productType,
              importBatchId: batchId,
              rawPayload: txn.rawPayload,
            });

            // Auto-match to driver
            const fuelTxn = { ...txn, id: result.id, vendor: input.vendor } as any;
            const matchResult = await autoMatchFuelTransaction(fuelTxn, input.payPeriodId || 0);

            // Create allocation
            await createPayrollAllocation({
              sourceType: "fuel",
              sourceTxnId: result.id,
              payPeriodId: input.payPeriodId,
              driverId: matchResult.driverId,
              amount: txn.amount,
              confidence: matchResult.confidence as any || "vehicle_time",
              matchReason: matchResult.reason,
              status: matchResult.matched ? "matched" : "unmatched",
            });

            if (matchResult.matched) {
              autoMatchedCount++;
            } else {
              unmatchedCount++;
            }

            successfulRows++;
          } catch (error) {
            failedRows++;
          }
        }

        // Update batch stats
        await updateImportBatch(batchId, {
          successfulRows,
          failedRows,
          duplicateRows,
          autoMatchedCount,
          unmatchedCount,
          status: "completed",
        });

        return {
          batchId,
          totalRows: input.transactions.length,
          successfulRows,
          failedRows,
          duplicateRows,
          autoMatchedCount,
          unmatchedCount,
        };
      }),

    // Import toll transactions from CSV
    importToll: protectedProcedure
      .input(z.object({
        vendor: z.enum(["ezpass", "sunpass", "ipass", "fastrak", "txtag", "other"]),
        payPeriodId: z.number().optional(),
        fileName: z.string(),
        transactions: z.array(z.object({
          vendorTxnId: z.string(),
          transactionDate: z.string(),
          amount: z.number(), // in cents
          transponderNumber: z.string().optional(),
          licensePlate: z.string().optional(),
          unitNumber: z.string().optional(),
          tollPlaza: z.string().optional(),
          tollRoad: z.string().optional(),
          entryPlaza: z.string().optional(),
          exitPlaza: z.string().optional(),
          rawPayload: z.string().optional(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const batchId = `TOLL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Create import batch
        await createImportBatch({
          batchId,
          importType: "toll",
          vendor: input.vendor,
          fileName: input.fileName,
          totalRows: input.transactions.length,
          status: "processing",
          payPeriodId: input.payPeriodId,
          importedBy: ctx.user.id,
        });

        let successfulRows = 0;
        let failedRows = 0;
        let duplicateRows = 0;
        let autoMatchedCount = 0;
        let unmatchedCount = 0;

        for (const txn of input.transactions) {
          try {
            // Check for duplicate
            const isDuplicate = await checkDuplicateTollTransaction(input.vendor, txn.vendorTxnId);
            if (isDuplicate) {
              duplicateRows++;
              continue;
            }

            // Create toll transaction
            const result = await createTollTransaction({
              vendor: input.vendor,
              vendorTxnId: txn.vendorTxnId,
              transactionDate: new Date(txn.transactionDate),
              amount: txn.amount,
              transponderNumber: txn.transponderNumber,
              licensePlate: txn.licensePlate,
              unitNumber: txn.unitNumber,
              tollPlaza: txn.tollPlaza,
              tollRoad: txn.tollRoad,
              entryPlaza: txn.entryPlaza,
              exitPlaza: txn.exitPlaza,
              importBatchId: batchId,
              rawPayload: txn.rawPayload,
            });

            // Auto-match to driver
            const tollTxn = { ...txn, id: result.id, vendor: input.vendor } as any;
            const matchResult = await autoMatchTollTransaction(tollTxn, input.payPeriodId || 0);

            // Create allocation
            await createPayrollAllocation({
              sourceType: "toll",
              sourceTxnId: result.id,
              payPeriodId: input.payPeriodId,
              driverId: matchResult.driverId,
              vehicleId: matchResult.vehicleId,
              amount: txn.amount,
              confidence: matchResult.confidence as any || "vehicle_time",
              matchReason: matchResult.reason,
              status: matchResult.matched ? "matched" : "unmatched",
            });

            if (matchResult.matched) {
              autoMatchedCount++;
            } else {
              unmatchedCount++;
            }

            successfulRows++;
          } catch (error) {
            failedRows++;
          }
        }

        // Update batch stats
        await updateImportBatch(batchId, {
          successfulRows,
          failedRows,
          duplicateRows,
          autoMatchedCount,
          unmatchedCount,
          status: "completed",
        });

        return {
          batchId,
          totalRows: input.transactions.length,
          successfulRows,
          failedRows,
          duplicateRows,
          autoMatchedCount,
          unmatchedCount,
        };
      }),

    // Get unmatched allocations (reconciliation queue)
    getUnmatched: protectedProcedure
      .input(z.object({ payPeriodId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return getUnmatchedAllocations(input?.payPeriodId);
      }),

    // Get all allocations
    getAllocations: protectedProcedure
      .input(z.object({
        payPeriodId: z.number().optional(),
        driverId: z.number().optional(),
        sourceType: z.enum(["fuel", "toll"]).optional(),
        status: z.enum(["matched", "unmatched", "disputed", "excluded"]).optional(),
      }).optional())
      .query(async ({ input }) => {
        return getPayrollAllocations(input);
      }),

    // Manually assign allocation to driver
    assignToDriver: protectedProcedure
      .input(z.object({
        allocationId: z.number(),
        driverId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        await assignAllocationToDriver(input.allocationId, input.driverId, ctx.user.id, "manual");
        return { success: true };
      }),

    // Get driver allocation totals for a pay period
    getDriverTotals: protectedProcedure
      .input(z.object({
        driverId: z.number(),
        payPeriodId: z.number(),
      }))
      .query(async ({ input }) => {
        return getDriverAllocationTotals(input.driverId, input.payPeriodId);
      }),

    // Update allocation status
    updateAllocationStatus: protectedProcedure
      .input(z.object({
        allocationId: z.number(),
        status: z.enum(["matched", "unmatched", "disputed", "excluded"]),
        disputeReason: z.string().optional(),
        resolutionNotes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const updateData: any = { status: input.status };
        
        if (input.status === "disputed") {
          updateData.disputeReason = input.disputeReason;
          updateData.disputedAt = new Date();
        }
        
        if (input.resolutionNotes) {
          updateData.resolutionNotes = input.resolutionNotes;
          updateData.resolvedBy = ctx.user.id;
          updateData.resolvedAt = new Date();
        }
        
        await updatePayrollAllocation(input.allocationId, updateData);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
