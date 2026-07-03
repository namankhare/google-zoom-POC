-- AlterTable
ALTER TABLE `MeetingSummary` MODIFY `summary` TEXT NOT NULL,
    MODIFY `rawJson` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `ProcessingLog` MODIFY `error` TEXT NULL;

-- AlterTable
ALTER TABLE `WebhookEvent` MODIFY `payload` TEXT NOT NULL,
    MODIFY `headers` TEXT NOT NULL;
