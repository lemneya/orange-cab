import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, date } from "drizzle-orm/mysql-core";

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
