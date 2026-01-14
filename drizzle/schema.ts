import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, date, boolean, decimal, time } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "director", "dispatcher", "receptionist", "payroll", "billing", "mechanic"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Vehicle status enum - extended for NEMT operations
 */
export const vehicleStatusEnum = mysqlEnum("vehicleStatus", [
  "active",      // On the road
  "lot",         // In lot, not in use
  "repair",      // Being repaired
  "retiring",    // Being phased out
  "retired"      // No longer in service
]);

/**
 * Vehicle type enum
 */
export const vehicleTypeEnum = mysqlEnum("vehicleType", [
  "sedan",
  "minivan",
  "wheelchair",
  "stretcher"
]);

/**
 * Vehicles table - stores all vehicle information
 */
export const vehicles = mysqlTable("vehicles", {
  id: int("id").autoincrement().primaryKey(),
  
  // Basic identification
  vehicleNumber: varchar("vehicleNumber", { length: 20 }).notNull(), // e.g., 1001, A412
  tagNumber: varchar("tagNumber", { length: 20 }).notNull(), // License plate / TAG #
  vin: varchar("vin", { length: 20 }), // Vehicle Identification Number
  
  // Location
  city: varchar("city", { length: 10 }), // IW, NN, HPT, VB
  
  // Vehicle details
  make: varchar("make", { length: 50 }), // Honda, Toyota, Dodge, Nissan
  model: varchar("model", { length: 50 }), // Odyssey, Sienna, Caravan, Quest
  year: int("year"),
  tireSize: varchar("tireSize", { length: 20 }),
  color: varchar("color", { length: 30 }),
  mileage: int("mileage"),
  
  // Vehicle type and status
  vehicleType: vehicleTypeEnum.default("minivan"),
  status: vehicleStatusEnum.default("active").notNull(),
  isWheelchairAccessible: boolean("isWheelchairAccessible").default(false),
  
  // Expiration dates
  registrationExp: date("registrationExp"),
  stateInspectionExp: date("stateInspectionExp"),
  cityInspectionDate: date("cityInspectionDate"),
  
  // Insurance
  insurance: varchar("insurance", { length: 100 }), // SAHRAWI, Matrix-Transportation
  insuranceExpDate: date("insuranceExpDate"),
  insurancePolicyNumber: varchar("insurancePolicyNumber", { length: 50 }),
  
  // For legacy compatibility
  isActive: mysqlEnum("isActive", ["active", "inactive"]).default("active").notNull(),
  
  // Metadata
  notes: text("notes"),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = typeof vehicles.$inferInsert;

/**
 * Document categories for vehicle documents
 */
export const documentCategoryEnum = mysqlEnum("documentCategory", [
  "title",
  "purchase_bill",
  "state_inspection",
  "registration",
  "insurance",
  "city_inspection",
  "other"
]);

/**
 * Vehicle documents table - stores uploaded documents for each vehicle
 */
export const vehicleDocuments = mysqlTable("vehicle_documents", {
  id: int("id").autoincrement().primaryKey(),
  
  // Reference to vehicle
  vehicleId: int("vehicleId").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
  
  // Document info
  category: documentCategoryEnum.notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(), // S3 key
  fileUrl: varchar("fileUrl", { length: 1000 }).notNull(), // S3 URL
  mimeType: varchar("mimeType", { length: 100 }),
  fileSize: int("fileSize"), // in bytes
  
  // Optional metadata
  expirationDate: date("expirationDate"),
  notes: text("notes"),
  
  // Audit
  uploadedBy: int("uploadedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VehicleDocument = typeof vehicleDocuments.$inferSelect;
export type InsertVehicleDocument = typeof vehicleDocuments.$inferInsert;


/**
 * Maintenance type categories
 */
export const maintenanceTypeEnum = mysqlEnum("maintenanceType", [
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
  "other"
]);

/**
 * Maintenance records table - tracks maintenance history for each vehicle
 */
export const maintenanceRecords = mysqlTable("maintenance_records", {
  id: int("id").autoincrement().primaryKey(),
  
  // Reference to vehicle
  vehicleId: int("vehicleId").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
  
  // Maintenance details
  maintenanceType: maintenanceTypeEnum.notNull(),
  description: text("description"),
  
  // Service info
  serviceDate: date("serviceDate").notNull(),
  mileage: int("mileage"),
  cost: int("cost"), // in cents to avoid floating point issues
  
  // Service provider
  serviceProvider: varchar("serviceProvider", { length: 200 }),
  invoiceNumber: varchar("invoiceNumber", { length: 100 }),
  
  // Next service
  nextServiceDate: date("nextServiceDate"),
  nextServiceMileage: int("nextServiceMileage"),
  
  // Notes
  notes: text("notes"),
  
  // Audit
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect;
export type InsertMaintenanceRecord = typeof maintenanceRecords.$inferInsert;


/**
 * Driver status enum
 */
export const driverStatusEnum = mysqlEnum("driverStatus", [
  "active",
  "inactive",
  "on_leave",
  "terminated"
]);

/**
 * Driver employment type
 */
export const employmentTypeEnum = mysqlEnum("employmentType", [
  "1099",  // Independent contractor
  "W2"     // Full-time employee
]);

/**
 * Application status enum
 */
export const applicationStatusEnum = mysqlEnum("applicationStatus", [
  "pending",
  "interview_scheduled",
  "training_scheduled",
  "certification_pending",
  "approved",
  "rejected",
  "withdrawn"
]);

/**
 * Drivers table - stores driver information
 */
export const drivers = mysqlTable("drivers", {
  id: int("id").autoincrement().primaryKey(),
  
  // Basic info
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  
  // Contact info
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  
  // License info
  licenseNumber: varchar("licenseNumber", { length: 50 }),
  licenseExpiration: date("licenseExpiration"),
  licenseState: varchar("licenseState", { length: 10 }),
  
  // Employment info
  employmentType: employmentTypeEnum.default("1099"),
  payRate: decimal("payRate", { precision: 10, scale: 2 }), // Per trip or hourly rate
  
  // Assignment
  assignedVehicleId: int("assignedVehicleId").references(() => vehicles.id, { onDelete: "set null" }),
  city: varchar("city", { length: 10 }), // IW, NN, HPT, VB
  
  // Shift info (for 1099 contractors)
  shiftStart: time("shiftStart"), // e.g., 04:00:00
  shiftEnd: time("shiftEnd"),     // e.g., 16:00:00
  
  // Status
  status: driverStatusEnum.default("active").notNull(),
  hireDate: date("hireDate"),
  
  // Certifications
  medicalCertExpiration: date("medicalCertExpiration"),
  backgroundCheckDate: date("backgroundCheckDate"),
  drugTestDate: date("drugTestDate"),
  
  // Emergency contact
  emergencyContactName: varchar("emergencyContactName", { length: 200 }),
  emergencyContactPhone: varchar("emergencyContactPhone", { length: 20 }),
  
  // Notes
  notes: text("notes"),
  
  // Audit
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Driver = typeof drivers.$inferSelect;
export type InsertDriver = typeof drivers.$inferInsert;

/**
 * Driver vehicle assignment history - tracks which drivers were assigned to which vehicles
 */
export const driverVehicleHistory = mysqlTable("driver_vehicle_history", {
  id: int("id").autoincrement().primaryKey(),
  
  driverId: int("driverId").notNull().references(() => drivers.id, { onDelete: "cascade" }),
  vehicleId: int("vehicleId").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
  
  assignedDate: date("assignedDate").notNull(),
  unassignedDate: date("unassignedDate"),
  
  notes: text("notes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DriverVehicleHistory = typeof driverVehicleHistory.$inferSelect;
export type InsertDriverVehicleHistory = typeof driverVehicleHistory.$inferInsert;

// =====================================================
// GARAGE / REPAIR SERVICES MODULE
// =====================================================

/**
 * Garage bays table - 3 bays for in-house repairs
 */
export const garageBays = mysqlTable("garage_bays", {
  id: int("id").autoincrement().primaryKey(),
  bayNumber: int("bayNumber").notNull().unique(),
  name: varchar("name", { length: 50 }).notNull(),
  status: mysqlEnum("status", ["available", "occupied", "maintenance"]).default("available").notNull(),
  currentVehicleId: int("currentVehicleId").references(() => vehicles.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GarageBay = typeof garageBays.$inferSelect;
export type InsertGarageBay = typeof garageBays.$inferInsert;

/**
 * Mechanics table - 2 full-time mechanics
 */
export const mechanics = mysqlTable("mechanics", {
  id: int("id").autoincrement().primaryKey(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  specialization: varchar("specialization", { length: 200 }),
  certifications: text("certifications"),
  hireDate: date("hireDate"),
  hourlyRate: decimal("hourlyRate", { precision: 10, scale: 2 }),
  status: mysqlEnum("status", ["active", "inactive", "on_leave"]).default("active").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Mechanic = typeof mechanics.$inferSelect;
export type InsertMechanic = typeof mechanics.$inferInsert;

/**
 * Repair orders table - tracks repair work
 */
export const repairOrders = mysqlTable("repair_orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 20 }).notNull().unique(),
  vehicleId: int("vehicleId").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
  bayId: int("bayId").references(() => garageBays.id, { onDelete: "set null" }),
  mechanicId: int("mechanicId").references(() => mechanics.id, { onDelete: "set null" }),
  
  // Order details
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "waiting_parts", "completed", "cancelled"]).default("pending").notNull(),
  
  // Problem and solution
  problemDescription: text("problemDescription").notNull(),
  diagnosis: text("diagnosis"),
  workPerformed: text("workPerformed"),
  
  // Parts and costs
  partsUsed: text("partsUsed"), // JSON string of parts
  partsCost: int("partsCost"), // in cents
  laborHours: decimal("laborHours", { precision: 5, scale: 2 }),
  laborCost: int("laborCost"), // in cents
  totalCost: int("totalCost"), // in cents
  
  // Dates
  dateReported: timestamp("dateReported").defaultNow().notNull(),
  dateStarted: timestamp("dateStarted"),
  dateCompleted: timestamp("dateCompleted"),
  estimatedCompletion: date("estimatedCompletion"),
  
  // Mileage
  mileageIn: int("mileageIn"),
  mileageOut: int("mileageOut"),
  
  notes: text("notes"),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RepairOrder = typeof repairOrders.$inferSelect;
export type InsertRepairOrder = typeof repairOrders.$inferInsert;

// =====================================================
// HR / DRIVER MANAGEMENT MODULE
// =====================================================

/**
 * Driver applications table
 */
export const driverApplications = mysqlTable("driver_applications", {
  id: int("id").autoincrement().primaryKey(),
  
  // Applicant info
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  
  // License info
  licenseNumber: varchar("licenseNumber", { length: 50 }),
  licenseState: varchar("licenseState", { length: 10 }),
  licenseExpiration: date("licenseExpiration"),
  
  // Application details
  applicationDate: timestamp("applicationDate").defaultNow().notNull(),
  status: applicationStatusEnum.default("pending").notNull(),
  preferredCity: varchar("preferredCity", { length: 10 }),
  
  // Scheduling
  interviewDate: timestamp("interviewDate"),
  interviewNotes: text("interviewNotes"),
  trainingStartDate: date("trainingStartDate"),
  trainingEndDate: date("trainingEndDate"),
  certificationDate: date("certificationDate"),
  contractSignedDate: date("contractSignedDate"),
  
  // Documents
  resumeUrl: varchar("resumeUrl", { length: 1000 }),
  licenseUrl: varchar("licenseUrl", { length: 1000 }),
  
  notes: text("notes"),
  processedBy: int("processedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DriverApplication = typeof driverApplications.$inferSelect;
export type InsertDriverApplication = typeof driverApplications.$inferInsert;

/**
 * Driver contracts table
 */
export const driverContracts = mysqlTable("driver_contracts", {
  id: int("id").autoincrement().primaryKey(),
  driverId: int("driverId").notNull().references(() => drivers.id, { onDelete: "cascade" }),
  
  contractNumber: varchar("contractNumber", { length: 50 }).notNull(),
  contractType: employmentTypeEnum.notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate"),
  
  // Pay terms
  payRate: decimal("payRate", { precision: 10, scale: 2 }),
  payFrequency: mysqlEnum("payFrequency", ["weekly", "bi_weekly", "monthly"]).default("weekly"),
  
  // Contract document
  contractUrl: varchar("contractUrl", { length: 1000 }),
  signedDate: date("signedDate"),
  
  status: mysqlEnum("status", ["active", "expired", "terminated"]).default("active").notNull(),
  notes: text("notes"),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DriverContract = typeof driverContracts.$inferSelect;
export type InsertDriverContract = typeof driverContracts.$inferInsert;

/**
 * Driver time off / scheduling
 */
export const driverSchedule = mysqlTable("driver_schedule", {
  id: int("id").autoincrement().primaryKey(),
  driverId: int("driverId").notNull().references(() => drivers.id, { onDelete: "cascade" }),
  
  scheduleDate: date("scheduleDate").notNull(),
  scheduleType: mysqlEnum("scheduleType", ["work", "day_off", "vacation", "sick", "training"]).notNull(),
  shiftStart: time("shiftStart"),
  shiftEnd: time("shiftEnd"),
  
  notes: text("notes"),
  approvedBy: int("approvedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DriverSchedule = typeof driverSchedule.$inferSelect;
export type InsertDriverSchedule = typeof driverSchedule.$inferInsert;

// =====================================================
// RECEPTIONIST / OFFICE MODULE
// =====================================================

/**
 * Call logs table
 */
export const callLogs = mysqlTable("call_logs", {
  id: int("id").autoincrement().primaryKey(),
  
  // Caller info
  callerName: varchar("callerName", { length: 200 }),
  callerPhone: varchar("callerPhone", { length: 20 }),
  callerType: mysqlEnum("callerType", ["customer", "driver", "vendor", "other"]).default("customer"),
  
  // Call details
  callTime: timestamp("callTime").defaultNow().notNull(),
  callDuration: int("callDuration"), // in seconds
  callType: mysqlEnum("callType", ["incoming", "outgoing"]).default("incoming"),
  
  // Content
  subject: varchar("subject", { length: 200 }),
  notes: text("notes"),
  
  // Follow-up
  requiresFollowUp: boolean("requiresFollowUp").default(false),
  followUpDate: date("followUpDate"),
  followUpCompleted: boolean("followUpCompleted").default(false),
  
  // Dispatch pass-through
  passedToDispatch: boolean("passedToDispatch").default(false),
  dispatchMessage: text("dispatchMessage"),
  
  receivedBy: int("receivedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CallLog = typeof callLogs.$inferSelect;
export type InsertCallLog = typeof callLogs.$inferInsert;

/**
 * Mail / correspondence tracking
 */
export const mailRecords = mysqlTable("mail_records", {
  id: int("id").autoincrement().primaryKey(),
  
  mailType: mysqlEnum("mailType", ["incoming", "outgoing"]).default("incoming"),
  mailCategory: mysqlEnum("mailCategory", ["invoice", "ticket", "toll", "registration", "insurance", "legal", "other"]).default("other"),
  
  sender: varchar("sender", { length: 200 }),
  recipient: varchar("recipient", { length: 200 }),
  subject: varchar("subject", { length: 300 }),
  
  receivedDate: date("receivedDate"),
  processedDate: date("processedDate"),
  
  // Scanned document
  documentUrl: varchar("documentUrl", { length: 1000 }),
  
  // Related records
  relatedVehicleId: int("relatedVehicleId").references(() => vehicles.id, { onDelete: "set null" }),
  relatedDriverId: int("relatedDriverId").references(() => drivers.id, { onDelete: "set null" }),
  
  status: mysqlEnum("status", ["pending", "processed", "filed", "action_required"]).default("pending"),
  notes: text("notes"),
  processedBy: int("processedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MailRecord = typeof mailRecords.$inferSelect;
export type InsertMailRecord = typeof mailRecords.$inferInsert;

/**
 * Tickets and tolls tracking
 */
export const ticketsAndTolls = mysqlTable("tickets_and_tolls", {
  id: int("id").autoincrement().primaryKey(),
  
  ticketType: mysqlEnum("ticketType", ["parking", "speeding", "toll", "red_light", "other"]).notNull(),
  ticketNumber: varchar("ticketNumber", { length: 50 }),
  
  vehicleId: int("vehicleId").references(() => vehicles.id, { onDelete: "set null" }),
  driverId: int("driverId").references(() => drivers.id, { onDelete: "set null" }),
  
  issueDate: date("issueDate").notNull(),
  dueDate: date("dueDate"),
  
  amount: int("amount").notNull(), // in cents
  paidAmount: int("paidAmount").default(0),
  
  status: mysqlEnum("status", ["pending", "paid", "disputed", "overdue"]).default("pending"),
  
  // Document
  documentUrl: varchar("documentUrl", { length: 1000 }),
  
  notes: text("notes"),
  processedBy: int("processedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TicketAndToll = typeof ticketsAndTolls.$inferSelect;
export type InsertTicketAndToll = typeof ticketsAndTolls.$inferInsert;

// =====================================================
// DISPATCH MODULE (MediRoute Integration)
// =====================================================

/**
 * Trips table - represents work orders from MediRoute/ModivCare
 */
export const trips = mysqlTable("trips", {
  id: int("id").autoincrement().primaryKey(),
  
  // External IDs
  medirouteId: varchar("medirouteId", { length: 50 }).unique(),
  modivcareTripId: varchar("modivcareTripId", { length: 50 }),
  
  // Trip details
  tripDate: date("tripDate").notNull(),
  scheduledPickupTime: time("scheduledPickupTime"),
  scheduledDropoffTime: time("scheduledDropoffTime"),
  
  // Actual times
  actualPickupTime: timestamp("actualPickupTime"),
  actualDropoffTime: timestamp("actualDropoffTime"),
  
  // Locations
  pickupAddress: text("pickupAddress"),
  pickupCity: varchar("pickupCity", { length: 100 }),
  pickupZip: varchar("pickupZip", { length: 10 }),
  pickupLat: decimal("pickupLat", { precision: 10, scale: 7 }),
  pickupLng: decimal("pickupLng", { precision: 10, scale: 7 }),
  
  dropoffAddress: text("dropoffAddress"),
  dropoffCity: varchar("dropoffCity", { length: 100 }),
  dropoffZip: varchar("dropoffZip", { length: 10 }),
  dropoffLat: decimal("dropoffLat", { precision: 10, scale: 7 }),
  dropoffLng: decimal("dropoffLng", { precision: 10, scale: 7 }),
  
  // Patient info
  patientName: varchar("patientName", { length: 200 }),
  patientPhone: varchar("patientPhone", { length: 20 }),
  memberNumber: varchar("memberNumber", { length: 50 }),
  
  // Trip type
  tripType: mysqlEnum("tripType", ["ambulatory", "wheelchair", "stretcher"]).default("ambulatory"),
  isRoundTrip: boolean("isRoundTrip").default(false),
  legNumber: int("legNumber").default(1), // 1 for outbound, 2 for return
  
  // Assignment
  assignedDriverId: int("assignedDriverId").references(() => drivers.id, { onDelete: "set null" }),
  assignedVehicleId: int("assignedVehicleId").references(() => vehicles.id, { onDelete: "set null" }),
  
  // Status
  status: mysqlEnum("status", [
    "scheduled",
    "assigned",
    "en_route_pickup",
    "at_pickup",
    "in_transit",
    "at_dropoff",
    "completed",
    "no_show",
    "cancelled"
  ]).default("scheduled").notNull(),
  
  // Mileage and billing
  estimatedMiles: decimal("estimatedMiles", { precision: 6, scale: 2 }),
  actualMiles: decimal("actualMiles", { precision: 6, scale: 2 }),
  baseRate: int("baseRate"), // in cents
  mileageRate: int("mileageRate"), // in cents
  totalAmount: int("totalAmount"), // in cents
  
  // Billing status
  billingStatus: mysqlEnum("billingStatus", ["pending", "submitted", "approved", "rejected", "paid"]).default("pending"),
  billingSubmittedDate: date("billingSubmittedDate"),
  
  notes: text("notes"),
  dispatchNotes: text("dispatchNotes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Trip = typeof trips.$inferSelect;
export type InsertTrip = typeof trips.$inferInsert;

// =====================================================
// BILLING MODULE
// =====================================================

/**
 * Billing batches - groups of trips submitted for payment
 */
export const billingBatches = mysqlTable("billing_batches", {
  id: int("id").autoincrement().primaryKey(),
  
  batchNumber: varchar("batchNumber", { length: 50 }).notNull().unique(),
  batchDate: date("batchDate").notNull(),
  
  // Period
  periodStart: date("periodStart").notNull(),
  periodEnd: date("periodEnd").notNull(),
  
  // Totals
  tripCount: int("tripCount").default(0),
  totalAmount: int("totalAmount").default(0), // in cents
  adjustedAmount: int("adjustedAmount"), // in cents after adjustments
  
  status: mysqlEnum("status", ["draft", "submitted", "processing", "approved", "paid", "rejected"]).default("draft"),
  
  submittedDate: timestamp("submittedDate"),
  approvedDate: timestamp("approvedDate"),
  paidDate: timestamp("paidDate"),
  
  notes: text("notes"),
  submittedBy: int("submittedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BillingBatch = typeof billingBatches.$inferSelect;
export type InsertBillingBatch = typeof billingBatches.$inferInsert;

/**
 * Time adjustments for billing
 */
export const timeAdjustments = mysqlTable("time_adjustments", {
  id: int("id").autoincrement().primaryKey(),
  
  tripId: int("tripId").notNull().references(() => trips.id, { onDelete: "cascade" }),
  
  originalPickupTime: timestamp("originalPickupTime"),
  adjustedPickupTime: timestamp("adjustedPickupTime"),
  originalDropoffTime: timestamp("originalDropoffTime"),
  adjustedDropoffTime: timestamp("adjustedDropoffTime"),
  
  reason: text("reason"),
  
  adjustedBy: int("adjustedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TimeAdjustment = typeof timeAdjustments.$inferSelect;
export type InsertTimeAdjustment = typeof timeAdjustments.$inferInsert;

// =====================================================
// PAYROLL MODULE
// =====================================================

/**
 * Payroll periods
 */
export const payrollPeriods = mysqlTable("payroll_periods", {
  id: int("id").autoincrement().primaryKey(),
  
  periodStart: date("periodStart").notNull(),
  periodEnd: date("periodEnd").notNull(),
  payDate: date("payDate").notNull(),
  
  status: mysqlEnum("status", ["open", "processing", "completed"]).default("open"),
  
  totalDriverPay: int("totalDriverPay").default(0), // in cents
  totalEmployeePay: int("totalEmployeePay").default(0), // in cents
  
  processedBy: int("processedBy").references(() => users.id),
  processedDate: timestamp("processedDate"),
  
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PayrollPeriod = typeof payrollPeriods.$inferSelect;
export type InsertPayrollPeriod = typeof payrollPeriods.$inferInsert;

/**
 * Driver payments (1099)
 */
export const driverPayments = mysqlTable("driver_payments", {
  id: int("id").autoincrement().primaryKey(),
  
  payrollPeriodId: int("payrollPeriodId").notNull().references(() => payrollPeriods.id, { onDelete: "cascade" }),
  driverId: int("driverId").notNull().references(() => drivers.id, { onDelete: "cascade" }),
  
  tripCount: int("tripCount").default(0),
  totalMiles: decimal("totalMiles", { precision: 8, scale: 2 }),
  
  grossPay: int("grossPay").notNull(), // in cents
  deductions: int("deductions").default(0), // in cents
  netPay: int("netPay").notNull(), // in cents
  
  status: mysqlEnum("status", ["pending", "approved", "paid"]).default("pending"),
  paidDate: date("paidDate"),
  paymentMethod: mysqlEnum("paymentMethod", ["check", "direct_deposit", "cash"]),
  checkNumber: varchar("checkNumber", { length: 50 }),
  
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DriverPayment = typeof driverPayments.$inferSelect;
export type InsertDriverPayment = typeof driverPayments.$inferInsert;

/**
 * W2 Employee payroll
 */
export const employeePayroll = mysqlTable("employee_payroll", {
  id: int("id").autoincrement().primaryKey(),
  
  payrollPeriodId: int("payrollPeriodId").notNull().references(() => payrollPeriods.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  hoursWorked: decimal("hoursWorked", { precision: 5, scale: 2 }),
  hourlyRate: decimal("hourlyRate", { precision: 10, scale: 2 }),
  
  grossPay: int("grossPay").notNull(), // in cents
  federalTax: int("federalTax").default(0),
  stateTax: int("stateTax").default(0),
  socialSecurity: int("socialSecurity").default(0),
  medicare: int("medicare").default(0),
  otherDeductions: int("otherDeductions").default(0),
  netPay: int("netPay").notNull(), // in cents
  
  status: mysqlEnum("status", ["pending", "approved", "paid"]).default("pending"),
  paidDate: date("paidDate"),
  
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmployeePayroll = typeof employeePayroll.$inferSelect;
export type InsertEmployeePayroll = typeof employeePayroll.$inferInsert;

/**
 * Company bills / expenses
 */
export const companyBills = mysqlTable("company_bills", {
  id: int("id").autoincrement().primaryKey(),
  
  billCategory: mysqlEnum("billCategory", [
    "rent",
    "utilities",
    "insurance",
    "fuel",
    "parts",
    "supplies",
    "professional_services",
    "software",
    "other"
  ]).notNull(),
  
  vendorName: varchar("vendorName", { length: 200 }),
  invoiceNumber: varchar("invoiceNumber", { length: 100 }),
  
  billDate: date("billDate").notNull(),
  dueDate: date("dueDate"),
  
  amount: int("amount").notNull(), // in cents
  paidAmount: int("paidAmount").default(0),
  
  status: mysqlEnum("status", ["pending", "partial", "paid", "overdue"]).default("pending"),
  paidDate: date("paidDate"),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  
  // Document
  documentUrl: varchar("documentUrl", { length: 1000 }),
  
  notes: text("notes"),
  processedBy: int("processedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CompanyBill = typeof companyBills.$inferSelect;
export type InsertCompanyBill = typeof companyBills.$inferInsert;

// =====================================================
// FILE MANAGEMENT / DOCUMENT HUB
// =====================================================

/**
 * General file storage for company documents
 */
export const companyFiles = mysqlTable("company_files", {
  id: int("id").autoincrement().primaryKey(),
  
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 1000 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  fileSize: int("fileSize"),
  
  category: mysqlEnum("category", [
    "contracts",
    "insurance",
    "licenses",
    "reports",
    "correspondence",
    "training",
    "policies",
    "other"
  ]).default("other"),
  
  folder: varchar("folder", { length: 500 }), // Virtual folder path
  
  // Access control
  isPublic: boolean("isPublic").default(false),
  
  uploadedBy: int("uploadedBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CompanyFile = typeof companyFiles.$inferSelect;
export type InsertCompanyFile = typeof companyFiles.$inferInsert;

// =====================================================
// ACTIVITY LOG / AUDIT TRAIL
// =====================================================

/**
 * Activity log for monitoring and audit
 */
export const activityLog = mysqlTable("activity_log", {
  id: int("id").autoincrement().primaryKey(),
  
  userId: int("userId").references(() => users.id, { onDelete: "set null" }),
  
  action: varchar("action", { length: 100 }).notNull(),
  module: varchar("module", { length: 50 }).notNull(), // fleet, garage, hr, dispatch, billing, payroll, etc.
  
  entityType: varchar("entityType", { length: 50 }), // vehicle, driver, trip, etc.
  entityId: int("entityId"),
  
  description: text("description"),
  metadata: text("metadata"), // JSON string for additional data
  
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = typeof activityLog.$inferInsert;
