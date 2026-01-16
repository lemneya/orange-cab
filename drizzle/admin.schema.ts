/**
 * OC-ADMIN-0: Admin Hub Database Schema
 * 
 * Core org tables, billing rate cards, driver pay contracts, audit logs, and RBAC
 * This is the "truth source" for IDS partitioning, imports, payroll, billing.
 */

import {
  pgTable,
  serial,
  text,
  varchar,
  boolean,
  timestamp,
  integer,
  decimal,
  date,
  json,
  pgEnum,
  unique,
  index,
} from "drizzle-orm/pg-core";

// ============================================================================
// ENUMS
// ============================================================================

// User roles for RBAC
export const userRoleEnum = pgEnum("user_role", [
  "ADMIN",
  "PAYROLL",
  "DISPATCH",
  "BILLING",
  "RECEPTION",
  "MECHANIC",
  "OPS_DIRECTOR",
]);

// Billing rate rule types
export const rateRuleTypeEnum = pgEnum("rate_rule_type", [
  "PER_MILE",
  "PER_TRIP",
  "BASE_PLUS_MILE",
  "ZONE",
  "TIME_BAND",
  "MOBILITY_DIFF",
]);

// Mobility types
export const mobilityTypeEnum = pgEnum("mobility_type", [
  "STD",      // Standard / Ambulatory
  "WCH",      // Wheelchair
  "STRETCHER", // Stretcher
]);

// Pay scheme types
export const paySchemeEnum = pgEnum("pay_scheme", [
  "HOURLY",
  "PER_TRIP",
  "PER_MILE",
  "DAILY_RATE",
  "COMMISSION",
  "HYBRID",
]);

// Contract types
export const contractTypeEnum = pgEnum("contract_type", [
  "W2",
  "1099",
  "OWNER_OPERATOR",
]);

// Audit action types
export const auditActionEnum = pgEnum("audit_action", [
  "CREATE",
  "UPDATE",
  "DELETE",
  "ARCHIVE",
  "RESTORE",
]);

// ============================================================================
// CORE ORG TABLES
// ============================================================================

/**
 * Operating Companies (OpCos)
 * e.g., Sahrawi, Metrix
 */
export const opcos = pgTable("opcos", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  timezone: varchar("timezone", { length: 50 }).default("America/New_York"),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 100 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Brokers (funding sources)
 * e.g., Modivcare, MTM, Access2Care
 */
export const brokers = pgTable("brokers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  contactName: varchar("contact_name", { length: 100 }),
  contactEmail: varchar("contact_email", { length: 100 }),
  contactPhone: varchar("contact_phone", { length: 20 }),
  website: varchar("website", { length: 200 }),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Broker Accounts (OpCo-specific broker relationships)
 * e.g., MODIVCARE_SAHRAWI, MODIVCARE_METRIX, MTM_MAIN
 */
export const brokerAccounts = pgTable("broker_accounts", {
  id: serial("id").primaryKey(),
  brokerId: integer("broker_id").notNull().references(() => brokers.id),
  opcoId: integer("opco_id").references(() => opcos.id), // nullable for "global" accounts
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  accountNumber: varchar("account_number", { length: 50 }),
  contractStartDate: date("contract_start_date"),
  contractEndDate: date("contract_end_date"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  brokerOpcoIdx: index("broker_accounts_broker_opco_idx").on(table.brokerId, table.opcoId),
}));

// ============================================================================
// BILLING RATE CARDS
// ============================================================================

/**
 * Billing Rate Cards (what your company earns)
 * One card per (OpCo + Broker Account) with effective date
 */
export const billingRateCards = pgTable("billing_rate_cards", {
  id: serial("id").primaryKey(),
  opcoId: integer("opco_id").notNull().references(() => opcos.id),
  brokerAccountId: integer("broker_account_id").notNull().references(() => brokerAccounts.id),
  name: varchar("name", { length: 100 }).notNull(),
  effectiveDate: date("effective_date").notNull(),
  expirationDate: date("expiration_date"),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  opcoAccountEffectiveIdx: index("billing_rate_cards_opco_account_effective_idx")
    .on(table.opcoId, table.brokerAccountId, table.effectiveDate),
}));

/**
 * Billing Rate Rules (versioned rules inside a rate card)
 */
export const billingRateRules = pgTable("billing_rate_rules", {
  id: serial("id").primaryKey(),
  rateCardId: integer("rate_card_id").notNull().references(() => billingRateCards.id),
  ruleType: rateRuleTypeEnum("rule_type").notNull(),
  mobilityType: mobilityTypeEnum("mobility_type").default("STD"),
  
  // Rate values (used based on rule_type)
  baseAmount: decimal("base_amount", { precision: 10, scale: 2 }),
  ratePerMile: decimal("rate_per_mile", { precision: 10, scale: 4 }),
  ratePerTrip: decimal("rate_per_trip", { precision: 10, scale: 2 }),
  minCharge: decimal("min_charge", { precision: 10, scale: 2 }),
  maxCharge: decimal("max_charge", { precision: 10, scale: 2 }),
  
  // Zone-based pricing
  zoneId: varchar("zone_id", { length: 50 }),
  
  // Time-band pricing
  timeBandStart: varchar("time_band_start", { length: 5 }), // HH:MM
  timeBandEnd: varchar("time_band_end", { length: 5 }),     // HH:MM
  
  // Priority for rule matching (lower = higher priority)
  priority: integer("priority").default(100).notNull(),
  
  // Flexible conditions for future expansion
  conditionsJson: json("conditions_json"),
  
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  rateCardMobilityIdx: index("billing_rate_rules_card_mobility_idx")
    .on(table.rateCardId, table.mobilityType),
}));

// ============================================================================
// DRIVER PAY CONTRACTS
// ============================================================================

/**
 * Driver Pay Defaults (default pay plans for new drivers)
 * Can be global (opco-wide) or specific to a broker account
 */
export const driverPayDefaults = pgTable("driver_pay_defaults", {
  id: serial("id").primaryKey(),
  opcoId: integer("opco_id").notNull().references(() => opcos.id),
  brokerAccountId: integer("broker_account_id").references(() => brokerAccounts.id), // nullable = applies to all
  name: varchar("name", { length: 100 }).notNull(),
  contractType: contractTypeEnum("contract_type").notNull(),
  payScheme: paySchemeEnum("pay_scheme").notNull(),
  
  // Rate values
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  perTripRate: decimal("per_trip_rate", { precision: 10, scale: 2 }),
  perMileRate: decimal("per_mile_rate", { precision: 10, scale: 4 }),
  dailyRate: decimal("daily_rate", { precision: 10, scale: 2 }),
  commissionPercent: decimal("commission_percent", { precision: 5, scale: 2 }),
  
  // Minimums and caps
  minDailyGuarantee: decimal("min_daily_guarantee", { precision: 10, scale: 2 }),
  maxDailyPay: decimal("max_daily_pay", { precision: 10, scale: 2 }),
  
  effectiveDate: date("effective_date").notNull(),
  expirationDate: date("expiration_date"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  opcoAccountEffectiveIdx: index("driver_pay_defaults_opco_account_effective_idx")
    .on(table.opcoId, table.brokerAccountId, table.effectiveDate),
}));

/**
 * Driver Pay Contracts (individual driver overrides)
 * Extends existing driver_pay_contracts with partitioning
 */
export const driverPayContracts = pgTable("driver_pay_contracts", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull(), // references drivers table
  opcoId: integer("opco_id").notNull().references(() => opcos.id),
  brokerAccountId: integer("broker_account_id").references(() => brokerAccounts.id), // nullable = applies to all
  
  contractType: contractTypeEnum("contract_type").notNull(),
  payScheme: paySchemeEnum("pay_scheme").notNull(),
  
  // Rate values (override defaults)
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  perTripRate: decimal("per_trip_rate", { precision: 10, scale: 2 }),
  perMileRate: decimal("per_mile_rate", { precision: 10, scale: 4 }),
  dailyRate: decimal("daily_rate", { precision: 10, scale: 2 }),
  commissionPercent: decimal("commission_percent", { precision: 5, scale: 2 }),
  
  // Minimums and caps
  minDailyGuarantee: decimal("min_daily_guarantee", { precision: 10, scale: 2 }),
  maxDailyPay: decimal("max_daily_pay", { precision: 10, scale: 2 }),
  
  effectiveDate: date("effective_date").notNull(),
  expirationDate: date("expiration_date"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  driverOpcoEffectiveIdx: index("driver_pay_contracts_driver_opco_effective_idx")
    .on(table.driverId, table.opcoId, table.effectiveDate),
  uniqueDriverOpcoAccountDate: unique("driver_pay_contracts_unique")
    .on(table.driverId, table.opcoId, table.brokerAccountId, table.effectiveDate),
}));

// ============================================================================
// AUDIT LOG
// ============================================================================

/**
 * Audit Log for tracking all changes
 */
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  actor: varchar("actor", { length: 100 }).notNull(), // user ID or system
  actorRole: userRoleEnum("actor_role"),
  action: auditActionEnum("action").notNull(),
  entity: varchar("entity", { length: 100 }).notNull(), // table name
  entityId: integer("entity_id"), // record ID
  beforeJson: json("before_json"),
  afterJson: json("after_json"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => ({
  entityIdx: index("audit_log_entity_idx").on(table.entity, table.entityId),
  actorIdx: index("audit_log_actor_idx").on(table.actor),
  timestampIdx: index("audit_log_timestamp_idx").on(table.timestamp),
}));

// ============================================================================
// USER ROLES (RBAC)
// ============================================================================

/**
 * User Roles assignment
 */
export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // references users table
  role: userRoleEnum("role").notNull(),
  opcoId: integer("opco_id").references(() => opcos.id), // nullable = all opcos
  grantedBy: varchar("granted_by", { length: 100 }),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true).notNull(),
}, (table) => ({
  userRoleIdx: index("user_roles_user_role_idx").on(table.userId, table.role),
  uniqueUserRoleOpco: unique("user_roles_unique").on(table.userId, table.role, table.opcoId),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Opco = typeof opcos.$inferSelect;
export type NewOpco = typeof opcos.$inferInsert;

export type Broker = typeof brokers.$inferSelect;
export type NewBroker = typeof brokers.$inferInsert;

export type BrokerAccount = typeof brokerAccounts.$inferSelect;
export type NewBrokerAccount = typeof brokerAccounts.$inferInsert;

export type BillingRateCard = typeof billingRateCards.$inferSelect;
export type NewBillingRateCard = typeof billingRateCards.$inferInsert;

export type BillingRateRule = typeof billingRateRules.$inferSelect;
export type NewBillingRateRule = typeof billingRateRules.$inferInsert;

export type DriverPayDefault = typeof driverPayDefaults.$inferSelect;
export type NewDriverPayDefault = typeof driverPayDefaults.$inferInsert;

export type DriverPayContract = typeof driverPayContracts.$inferSelect;
export type NewDriverPayContract = typeof driverPayContracts.$inferInsert;

export type AuditLogEntry = typeof auditLog.$inferSelect;
export type NewAuditLogEntry = typeof auditLog.$inferInsert;

export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
