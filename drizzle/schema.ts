import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  date,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

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

  // Expiration dates
  registrationExp: date("registrationExp"),
  stateInspectionExp: date("stateInspectionExp"),
  cityInspectionDate: date("cityInspectionDate"),

  // Insurance
  insurance: varchar("insurance", { length: 100 }), // SAHRAWI, Matrix-Transportation

  // Status
  isActive: mysqlEnum("isActive", ["active", "inactive"])
    .default("active")
    .notNull(),

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
  "other",
]);

/**
 * Vehicle documents table - stores uploaded documents for each vehicle
 */
export const vehicleDocuments = mysqlTable("vehicle_documents", {
  id: int("id").autoincrement().primaryKey(),

  // Reference to vehicle
  vehicleId: int("vehicleId")
    .notNull()
    .references(() => vehicles.id, { onDelete: "cascade" }),

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
  "other",
]);

/**
 * Maintenance records table - tracks maintenance history for each vehicle
 */
export const maintenanceRecords = mysqlTable("maintenance_records", {
  id: int("id").autoincrement().primaryKey(),

  // Reference to vehicle
  vehicleId: int("vehicleId")
    .notNull()
    .references(() => vehicles.id, { onDelete: "cascade" }),

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
  "terminated",
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

  // License info
  licenseNumber: varchar("licenseNumber", { length: 50 }),
  licenseExpiration: date("licenseExpiration"),
  licenseState: varchar("licenseState", { length: 10 }),

  // Assignment
  assignedVehicleId: int("assignedVehicleId").references(() => vehicles.id, {
    onDelete: "set null",
  }),
  city: varchar("city", { length: 10 }), // IW, NN, HPT, VB

  // Status
  status: driverStatusEnum.default("active").notNull(),
  hireDate: date("hireDate"),

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

  driverId: int("driverId")
    .notNull()
    .references(() => drivers.id, { onDelete: "cascade" }),
  vehicleId: int("vehicleId")
    .notNull()
    .references(() => vehicles.id, { onDelete: "cascade" }),

  assignedDate: date("assignedDate").notNull(),
  unassignedDate: date("unassignedDate"),

  notes: text("notes"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DriverVehicleHistory = typeof driverVehicleHistory.$inferSelect;
export type InsertDriverVehicleHistory =
  typeof driverVehicleHistory.$inferInsert;
