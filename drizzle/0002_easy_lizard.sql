CREATE TABLE `maintenance_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vehicleId` int NOT NULL,
	`maintenanceType` enum('oil_change','tire_rotation','tire_replacement','brake_service','transmission','engine_repair','battery','inspection','registration_renewal','insurance_renewal','body_work','electrical','ac_heating','general_service','other') NOT NULL,
	`description` text,
	`serviceDate` date NOT NULL,
	`mileage` int,
	`cost` int,
	`serviceProvider` varchar(200),
	`invoiceNumber` varchar(100),
	`nextServiceDate` date,
	`nextServiceMileage` int,
	`notes` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `maintenance_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `maintenance_records` ADD CONSTRAINT `maintenance_records_vehicleId_vehicles_id_fk` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `maintenance_records` ADD CONSTRAINT `maintenance_records_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;