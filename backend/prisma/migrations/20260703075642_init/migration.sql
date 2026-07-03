-- CreateTable
CREATE TABLE `Meeting` (
    `id` VARCHAR(191) NOT NULL,
    `meetingId` VARCHAR(191) NOT NULL,
    `meetingUuid` VARCHAR(191) NULL,
    `topic` VARCHAR(191) NULL,
    `hostId` VARCHAR(191) NULL,
    `startTime` DATETIME(3) NULL,
    `summaryRetrieved` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Meeting_meetingId_key`(`meetingId`),
    UNIQUE INDEX `Meeting_meetingUuid_key`(`meetingUuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MeetingSummary` (
    `id` VARCHAR(191) NOT NULL,
    `meetingId` VARCHAR(191) NOT NULL,
    `summary` VARCHAR(191) NOT NULL,
    `rawJson` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MeetingMapping` (
    `id` VARCHAR(191) NOT NULL,
    `calendarEventId` VARCHAR(191) NULL,
    `zoomMeetingId` VARCHAR(191) NULL,
    `crmLeadId` VARCHAR(191) NULL,
    `customerId` VARCHAR(191) NULL,
    `googleDriveFolderId` VARCHAR(191) NULL,

    UNIQUE INDEX `MeetingMapping_calendarEventId_key`(`calendarEventId`),
    UNIQUE INDEX `MeetingMapping_zoomMeetingId_key`(`zoomMeetingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WebhookEvent` (
    `id` VARCHAR(191) NOT NULL,
    `event` VARCHAR(191) NOT NULL,
    `payload` VARCHAR(191) NOT NULL,
    `headers` VARCHAR(191) NOT NULL,
    `processed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProcessingLog` (
    `id` VARCHAR(191) NOT NULL,
    `meetingId` VARCHAR(191) NULL,
    `step` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `error` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MeetingSummary` ADD CONSTRAINT `MeetingSummary_meetingId_fkey` FOREIGN KEY (`meetingId`) REFERENCES `Meeting`(`meetingId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProcessingLog` ADD CONSTRAINT `ProcessingLog_meetingId_fkey` FOREIGN KEY (`meetingId`) REFERENCES `Meeting`(`meetingId`) ON DELETE SET NULL ON UPDATE CASCADE;
