"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookService = void 0;
const client_1 = require("@prisma/client");
const zoom_service_1 = require("./zoom.service");
const prisma = new client_1.PrismaClient();
class WebhookService {
    static async processMeetingSummary(meetingUuid, meetingId) {
        console.log(`Processing summary for meeting ${meetingId} (UUID: ${meetingUuid})`);
        try {
            // 1. Ensure Meeting exists in DB
            let meeting = await prisma.meeting.findUnique({
                where: { meetingId: meetingId.toString() },
            });
            if (!meeting) {
                meeting = await prisma.meeting.create({
                    data: {
                        meetingId: meetingId.toString(),
                        meetingUuid: meetingUuid,
                    },
                });
            }
            await prisma.processingLog.create({
                data: {
                    meetingId: meeting.meetingId,
                    step: 'SUMMARY_RETRIEVAL',
                    status: 'IN_PROGRESS',
                },
            });
            // 2. Resolve Meeting Mapping if we have one (from Calendar sync)
            const mapping = await prisma.meetingMapping.findUnique({
                where: { zoomMeetingId: meetingId.toString() },
            });
            // 3. Retrieve Summary from Zoom
            const summaryData = await zoom_service_1.ZoomService.getMeetingSummary(meetingUuid);
            // 4. Store Summary
            await prisma.meetingSummary.create({
                data: {
                    meetingId: meeting.meetingId,
                    summary: summaryData.summary_details ? JSON.stringify(summaryData.summary_details) : 'No summary content',
                    rawJson: JSON.stringify(summaryData),
                },
            });
            // 5. Update Meeting status
            await prisma.meeting.update({
                where: { meetingId: meeting.meetingId },
                data: {
                    summaryRetrieved: true,
                    topic: summaryData.topic || meeting.topic,
                    startTime: summaryData.start_time ? new Date(summaryData.start_time) : meeting.startTime,
                },
            });
            await prisma.processingLog.create({
                data: {
                    meetingId: meeting.meetingId,
                    step: 'SUMMARY_RETRIEVAL',
                    status: 'SUCCESS',
                },
            });
            console.log(`Successfully processed summary for meeting ${meetingId}`);
        }
        catch (error) {
            console.error(`Error processing meeting summary:`, error);
            await prisma.processingLog.create({
                data: {
                    meetingId: meetingId.toString(),
                    step: 'SUMMARY_RETRIEVAL',
                    status: 'FAILURE',
                    error: error.message,
                },
            });
        }
    }
}
exports.WebhookService = WebhookService;
//# sourceMappingURL=webhook.service.js.map