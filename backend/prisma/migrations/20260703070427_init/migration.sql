-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "meetingId" TEXT NOT NULL,
    "meetingUuid" TEXT,
    "topic" TEXT,
    "hostId" TEXT,
    "startTime" DATETIME,
    "summaryRetrieved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "MeetingSummary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "meetingId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "rawJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MeetingSummary_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting" ("meetingId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MeetingMapping" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "calendarEventId" TEXT,
    "zoomMeetingId" TEXT,
    "crmLeadId" TEXT,
    "customerId" TEXT,
    "googleDriveFolderId" TEXT
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "headers" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ProcessingLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "meetingId" TEXT,
    "step" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProcessingLog_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting" ("meetingId") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_meetingId_key" ON "Meeting"("meetingId");

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_meetingUuid_key" ON "Meeting"("meetingUuid");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingMapping_calendarEventId_key" ON "MeetingMapping"("calendarEventId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingMapping_zoomMeetingId_key" ON "MeetingMapping"("zoomMeetingId");
