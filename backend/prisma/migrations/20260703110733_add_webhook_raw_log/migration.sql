-- CreateTable
CREATE TABLE `WebhookRawLog` (
    `id` VARCHAR(191) NOT NULL,
    `event` VARCHAR(191) NULL,
    `method` VARCHAR(191) NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `headers` TEXT NOT NULL,
    `body` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
