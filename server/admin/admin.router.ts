/**
 * OC-ADMIN-0: Admin Router
 * 
 * tRPC endpoints for OpCos, Brokers, Broker Accounts, Rate Cards, Driver Pay
 */

import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { getAdminService } from "./admin.service";

const adminService = getAdminService();

// Seed default data on startup
adminService.seedDefaultData("system");

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const opcoSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  timezone: z.string().default("America/New_York"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().default(true),
});

const brokerSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  website: z.string().url().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

const brokerAccountSchema = z.object({
  brokerId: z.number(),
  opcoId: z.number().optional(),
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(50),
  accountNumber: z.string().optional(),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

const rateCardSchema = z.object({
  opcoId: z.number(),
  brokerAccountId: z.number(),
  name: z.string().min(1).max(100),
  effectiveDate: z.string(),
  expirationDate: z.string().optional(),
  currency: z.string().default("USD"),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

const rateRuleSchema = z.object({
  rateCardId: z.number(),
  ruleType: z.enum(["PER_MILE", "PER_TRIP", "BASE_PLUS_MILE", "ZONE", "TIME_BAND", "MOBILITY_DIFF"]),
  mobilityType: z.enum(["STD", "WCH", "STRETCHER"]).default("STD"),
  baseAmount: z.number().optional(),
  ratePerMile: z.number().optional(),
  ratePerTrip: z.number().optional(),
  minCharge: z.number().optional(),
  maxCharge: z.number().optional(),
  zoneId: z.string().optional(),
  timeBandStart: z.string().optional(),
  timeBandEnd: z.string().optional(),
  priority: z.number().default(100),
  conditionsJson: z.record(z.unknown()).optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

const payDefaultSchema = z.object({
  opcoId: z.number(),
  brokerAccountId: z.number().optional(),
  name: z.string().min(1).max(100),
  contractType: z.enum(["W2", "1099", "OWNER_OPERATOR"]),
  payScheme: z.enum(["HOURLY", "PER_TRIP", "PER_MILE", "DAILY_RATE", "COMMISSION", "HYBRID"]),
  hourlyRate: z.number().optional(),
  perTripRate: z.number().optional(),
  perMileRate: z.number().optional(),
  dailyRate: z.number().optional(),
  commissionPercent: z.number().optional(),
  minDailyGuarantee: z.number().optional(),
  maxDailyPay: z.number().optional(),
  effectiveDate: z.string(),
  expirationDate: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

const payContractSchema = z.object({
  driverId: z.number(),
  opcoId: z.number(),
  brokerAccountId: z.number().optional(),
  contractType: z.enum(["W2", "1099", "OWNER_OPERATOR"]),
  payScheme: z.enum(["HOURLY", "PER_TRIP", "PER_MILE", "DAILY_RATE", "COMMISSION", "HYBRID"]),
  hourlyRate: z.number().optional(),
  perTripRate: z.number().optional(),
  perMileRate: z.number().optional(),
  dailyRate: z.number().optional(),
  commissionPercent: z.number().optional(),
  minDailyGuarantee: z.number().optional(),
  maxDailyPay: z.number().optional(),
  effectiveDate: z.string(),
  expirationDate: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

// ============================================================================
// ROUTER
// ============================================================================

export const adminRouter = router({
  // ==========================================================================
  // OPCO ENDPOINTS
  // ==========================================================================

  getOpcos: publicProcedure
    .input(z.object({ includeInactive: z.boolean().optional() }).optional())
    .query(async ({ input }) => {
      return adminService.getOpcos(input?.includeInactive);
    }),

  getOpco: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return adminService.getOpco(input.id);
    }),

  getOpcoByCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      return adminService.getOpcoByCode(input.code);
    }),

  createOpco: publicProcedure
    .input(opcoSchema)
    .mutation(async ({ input }) => {
      return adminService.createOpco(input, "user");
    }),

  updateOpco: publicProcedure
    .input(z.object({ id: z.number(), data: opcoSchema.partial() }))
    .mutation(async ({ input }) => {
      return adminService.updateOpco(input.id, input.data, "user");
    }),

  deleteOpco: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return adminService.deleteOpco(input.id, "user");
    }),

  // ==========================================================================
  // BROKER ENDPOINTS
  // ==========================================================================

  getBrokers: publicProcedure
    .input(z.object({ includeInactive: z.boolean().optional() }).optional())
    .query(async ({ input }) => {
      return adminService.getBrokers(input?.includeInactive);
    }),

  getBroker: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return adminService.getBroker(input.id);
    }),

  getBrokerByCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      return adminService.getBrokerByCode(input.code);
    }),

  createBroker: publicProcedure
    .input(brokerSchema)
    .mutation(async ({ input }) => {
      return adminService.createBroker(input, "user");
    }),

  updateBroker: publicProcedure
    .input(z.object({ id: z.number(), data: brokerSchema.partial() }))
    .mutation(async ({ input }) => {
      return adminService.updateBroker(input.id, input.data, "user");
    }),

  deleteBroker: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return adminService.deleteBroker(input.id, "user");
    }),

  // ==========================================================================
  // BROKER ACCOUNT ENDPOINTS
  // ==========================================================================

  getBrokerAccounts: publicProcedure
    .input(z.object({
      brokerId: z.number().optional(),
      opcoId: z.number().optional(),
      includeInactive: z.boolean().optional(),
    }).optional())
    .query(async ({ input }) => {
      return adminService.getBrokerAccounts(input);
    }),

  getBrokerAccount: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return adminService.getBrokerAccount(input.id);
    }),

  getBrokerAccountByCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      return adminService.getBrokerAccountByCode(input.code);
    }),

  createBrokerAccount: publicProcedure
    .input(brokerAccountSchema)
    .mutation(async ({ input }) => {
      return adminService.createBrokerAccount(input, "user");
    }),

  updateBrokerAccount: publicProcedure
    .input(z.object({ id: z.number(), data: brokerAccountSchema.partial() }))
    .mutation(async ({ input }) => {
      return adminService.updateBrokerAccount(input.id, input.data, "user");
    }),

  deleteBrokerAccount: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return adminService.deleteBrokerAccount(input.id, "user");
    }),

  // ==========================================================================
  // RATE CARD ENDPOINTS
  // ==========================================================================

  getRateCards: publicProcedure
    .input(z.object({
      opcoId: z.number().optional(),
      brokerAccountId: z.number().optional(),
      effectiveDate: z.string().optional(),
      includeInactive: z.boolean().optional(),
    }).optional())
    .query(async ({ input }) => {
      return adminService.getRateCards(input);
    }),

  getRateCard: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return adminService.getRateCard(input.id);
    }),

  createRateCard: publicProcedure
    .input(rateCardSchema)
    .mutation(async ({ input }) => {
      return adminService.createRateCard(input, "user");
    }),

  updateRateCard: publicProcedure
    .input(z.object({ id: z.number(), data: rateCardSchema.partial() }))
    .mutation(async ({ input }) => {
      return adminService.updateRateCard(input.id, input.data, "user");
    }),

  deleteRateCard: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return adminService.deleteRateCard(input.id, "user");
    }),

  // ==========================================================================
  // RATE RULE ENDPOINTS
  // ==========================================================================

  getRateRulesByCard: publicProcedure
    .input(z.object({ rateCardId: z.number() }))
    .query(async ({ input }) => {
      return adminService.getRateRulesByCard(input.rateCardId);
    }),

  createRateRule: publicProcedure
    .input(rateRuleSchema)
    .mutation(async ({ input }) => {
      return adminService.createRateRule(input, "user");
    }),

  updateRateRule: publicProcedure
    .input(z.object({ id: z.number(), data: rateRuleSchema.partial() }))
    .mutation(async ({ input }) => {
      return adminService.updateRateRule(input.id, input.data, "user");
    }),

  deleteRateRule: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return adminService.deleteRateRule(input.id, "user");
    }),

  // ==========================================================================
  // PAY DEFAULT ENDPOINTS
  // ==========================================================================

  getPayDefaults: publicProcedure
    .input(z.object({
      opcoId: z.number().optional(),
      brokerAccountId: z.number().optional(),
      effectiveDate: z.string().optional(),
      includeInactive: z.boolean().optional(),
    }).optional())
    .query(async ({ input }) => {
      return adminService.getPayDefaults(input);
    }),

  getPayDefault: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return adminService.getPayDefault(input.id);
    }),

  createPayDefault: publicProcedure
    .input(payDefaultSchema)
    .mutation(async ({ input }) => {
      return adminService.createPayDefault(input, "user");
    }),

  updatePayDefault: publicProcedure
    .input(z.object({ id: z.number(), data: payDefaultSchema.partial() }))
    .mutation(async ({ input }) => {
      return adminService.updatePayDefault(input.id, input.data, "user");
    }),

  deletePayDefault: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return adminService.deletePayDefault(input.id, "user");
    }),

  // ==========================================================================
  // PAY CONTRACT ENDPOINTS
  // ==========================================================================

  getPayContracts: publicProcedure
    .input(z.object({
      driverId: z.number().optional(),
      opcoId: z.number().optional(),
      brokerAccountId: z.number().optional(),
      effectiveDate: z.string().optional(),
      includeInactive: z.boolean().optional(),
    }).optional())
    .query(async ({ input }) => {
      return adminService.getPayContracts(input);
    }),

  getPayContract: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return adminService.getPayContract(input.id);
    }),

  createPayContract: publicProcedure
    .input(payContractSchema)
    .mutation(async ({ input }) => {
      return adminService.createPayContract(input, "user");
    }),

  updatePayContract: publicProcedure
    .input(z.object({ id: z.number(), data: payContractSchema.partial() }))
    .mutation(async ({ input }) => {
      return adminService.updatePayContract(input.id, input.data, "user");
    }),

  deletePayContract: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return adminService.deletePayContract(input.id, "user");
    }),

  // ==========================================================================
  // EFFECTIVE PAY RATE
  // ==========================================================================

  getEffectivePayRate: publicProcedure
    .input(z.object({
      driverId: z.number(),
      opcoId: z.number(),
      brokerAccountId: z.number().nullable(),
      date: z.string(),
    }))
    .query(async ({ input }) => {
      return adminService.getEffectivePayRate(
        input.driverId,
        input.opcoId,
        input.brokerAccountId,
        input.date
      );
    }),

  // ==========================================================================
  // AUDIT LOG ENDPOINTS
  // ==========================================================================

  getAuditLog: publicProcedure
    .input(z.object({
      entity: z.string().optional(),
      entityId: z.number().optional(),
      actor: z.string().optional(),
      action: z.enum(["CREATE", "UPDATE", "DELETE", "ARCHIVE", "RESTORE"]).optional(),
      fromDate: z.string().optional(),
      toDate: z.string().optional(),
      limit: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      return adminService.getAuditLog(input);
    }),
});
