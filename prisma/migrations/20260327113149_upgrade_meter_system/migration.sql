-- CreateTable
CREATE TABLE `meters` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `consumerId` INTEGER NOT NULL,
    `meterId` VARCHAR(191) NOT NULL,
    `meterName` VARCHAR(191) NOT NULL DEFAULT 'Energy Meter',
    `connectionType` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `port` INTEGER NULL,
    `comPort` VARCHAR(191) NULL,
    `baudRate` INTEGER NULL,
    `dataBits` INTEGER NOT NULL DEFAULT 8,
    `parity` VARCHAR(191) NOT NULL DEFAULT 'none',
    `stopBits` INTEGER NOT NULL DEFAULT 1,
    `modbusAddress` INTEGER NOT NULL DEFAULT 1,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Disconnected',
    `lastUpdated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `meters_meterId_key`(`meterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `registers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `meterId` INTEGER NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `address` INTEGER NOT NULL,
    `functionCode` INTEGER NOT NULL DEFAULT 3,
    `dataType` VARCHAR(191) NOT NULL DEFAULT 'Float',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `meters` ADD CONSTRAINT `meters_consumerId_fkey` FOREIGN KEY (`consumerId`) REFERENCES `consumers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `registers` ADD CONSTRAINT `registers_meterId_fkey` FOREIGN KEY (`meterId`) REFERENCES `meters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
