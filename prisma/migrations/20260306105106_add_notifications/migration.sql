-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `role` ENUM('ADMIN', 'OPERATOR', 'CONSUMER') NOT NULL DEFAULT 'CONSUMER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_phoneNumber_key`(`phoneNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consumers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `meterNumber` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `connectionType` ENUM('RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL') NOT NULL DEFAULT 'RESIDENTIAL',
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `lastReading` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `consumers_userId_key`(`userId`),
    UNIQUE INDEX `consumers_meterNumber_key`(`meterNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `operators` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `operators_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bills` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `billNumber` VARCHAR(191) NOT NULL,
    `consumerId` INTEGER NOT NULL,
    `operatorId` INTEGER NULL,
    `prevReading` DOUBLE NOT NULL,
    `currReading` DOUBLE NOT NULL,
    `units` DOUBLE NOT NULL,
    `ratePerUnit` DOUBLE NOT NULL DEFAULT 6,
    `baseAmount` DOUBLE NOT NULL,
    `taxPercent` DOUBLE NOT NULL DEFAULT 5,
    `taxAmount` DOUBLE NOT NULL,
    `totalAmount` DOUBLE NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `billMonth` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `bills_billNumber_key`(`billNumber`),
    INDEX `bills_consumerId_idx`(`consumerId`),
    INDEX `bills_status_idx`(`status`),
    INDEX `bills_operatorId_fkey`(`operatorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transactionId` VARCHAR(191) NOT NULL,
    `billId` INTEGER NOT NULL,
    `consumerId` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,
    `mode` ENUM('CASH', 'UPI', 'CREDIT_CARD', 'BANK_TRANSFER', 'ONLINE') NOT NULL DEFAULT 'ONLINE',
    `status` ENUM('SUCCESS', 'FAILED', 'PENDING') NOT NULL DEFAULT 'SUCCESS',
    `paidAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `payments_transactionId_key`(`transactionId`),
    INDEX `payments_billId_idx`(`billId`),
    INDEX `payments_consumerId_idx`(`consumerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `complaints` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `complaintNumber` VARCHAR(191) NOT NULL,
    `consumerId` INTEGER NOT NULL,
    `type` ENUM('BILLING_ISSUE', 'POWER_FAILURE', 'VOLTAGE_FLUCTUATION', 'METER_ISSUE', 'SPARKING_ISSUE', 'BILL_DELIVERY', 'OTHER') NOT NULL,
    `description` TEXT NOT NULL,
    `status` ENUM('PENDING', 'IN_PROGRESS', 'RESOLVED') NOT NULL DEFAULT 'PENDING',
    `assignedTo` VARCHAR(191) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `complaints_complaintNumber_key`(`complaintNumber`),
    INDEX `complaints_consumerId_idx`(`consumerId`),
    INDEX `complaints_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_settings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `maintenanceMode` BOOLEAN NOT NULL DEFAULT false,
    `residentialRate` DOUBLE NOT NULL DEFAULT 6,
    `commercialRate` DOUBLE NOT NULL DEFAULT 8,
    `industrialRate` DOUBLE NOT NULL DEFAULT 12,
    `taxPercent` DOUBLE NOT NULL DEFAULT 5,
    `gatewayIp` VARCHAR(191) NOT NULL DEFAULT '192.168.1.100',
    `gatewayPort` INTEGER NOT NULL DEFAULT 502,
    `baudRate` INTEGER NOT NULL DEFAULT 9600,
    `pollingInterval` INTEGER NOT NULL DEFAULT 15,
    `kwhRegister` INTEGER NOT NULL DEFAULT 40001,
    `voltageRegister` INTEGER NOT NULL DEFAULT 40010,
    `currentRegister` INTEGER NOT NULL DEFAULT 40020,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consumers` ADD CONSTRAINT `consumers_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `operators` ADD CONSTRAINT `operators_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bills` ADD CONSTRAINT `bills_consumerId_fkey` FOREIGN KEY (`consumerId`) REFERENCES `consumers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bills` ADD CONSTRAINT `bills_operatorId_fkey` FOREIGN KEY (`operatorId`) REFERENCES `operators`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_billId_fkey` FOREIGN KEY (`billId`) REFERENCES `bills`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_consumerId_fkey` FOREIGN KEY (`consumerId`) REFERENCES `consumers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaints` ADD CONSTRAINT `complaints_consumerId_fkey` FOREIGN KEY (`consumerId`) REFERENCES `consumers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
