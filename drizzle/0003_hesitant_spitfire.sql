CREATE TABLE `driver_vehicle_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`driverId` int NOT NULL,
	`vehicleId` int NOT NULL,
	`assignedDate` date NOT NULL,
	`unassignedDate` date,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `driver_vehicle_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drivers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`phone` varchar(20),
	`email` varchar(320),
	`licenseNumber` varchar(50),
	`licenseExpiration` date,
	`licenseState` varchar(10),
	`assignedVehicleId` int,
	`city` varchar(10),
	`driverStatus` enum('active','inactive','on_leave','terminated') NOT NULL DEFAULT 'active',
	`hireDate` date,
	`emergencyContactName` varchar(200),
	`emergencyContactPhone` varchar(20),
	`notes` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drivers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `driver_vehicle_history` ADD CONSTRAINT `driver_vehicle_history_driverId_drivers_id_fk` FOREIGN KEY (`driverId`) REFERENCES `drivers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `driver_vehicle_history` ADD CONSTRAINT `driver_vehicle_history_vehicleId_vehicles_id_fk` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `drivers` ADD CONSTRAINT `drivers_assignedVehicleId_vehicles_id_fk` FOREIGN KEY (`assignedVehicleId`) REFERENCES `vehicles`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `drivers` ADD CONSTRAINT `drivers_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;