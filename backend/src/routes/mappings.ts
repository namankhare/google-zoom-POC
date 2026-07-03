import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../services/prisma.service.js';

export default async function mappingRoutes(fastify: FastifyInstance) {
  /**
   * Endpoint for Google Apps Script Add-on to send meeting mappings.
   * Expected Body:
   * {
   *   "calendarEventId": "...",
   *   "zoomMeetingId": "...",
   *   "crmLeadId": "...",
   *   "customerId": "...",
   *   "googleDriveFolderId": "...",
   *   "topic": "...",
   *   "hostId": "...",
   *   "startTime": "2026-07-03T12:00:00.000Z"
   * }
   */
  fastify.post('/mappings', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;

    if (!body.zoomMeetingId) {
      return reply.code(400).send({ error: 'zoomMeetingId is required' });
    }

    const zoomMeetingId = body.zoomMeetingId.toString();
    const startTime = body.startTime ? new Date(body.startTime) : undefined;

    try {
      const mapping = await prisma.meetingMapping.upsert({
        where: { zoomMeetingId },
        update: {
          calendarEventId: body.calendarEventId,
          crmLeadId: body.crmLeadId,
          customerId: body.customerId,
          googleDriveFolderId: body.googleDriveFolderId,
        },
        create: {
          zoomMeetingId,
          calendarEventId: body.calendarEventId,
          crmLeadId: body.crmLeadId,
          customerId: body.customerId,
          googleDriveFolderId: body.googleDriveFolderId,
        },
      });

      // Also keep the Meeting record's basic details (topic/host/start time)
      // up to date so the dashboard has something to show before Zoom sends
      // the transcript/summary webhook for this meeting.
      if (body.topic || body.hostId || startTime) {
        await prisma.meeting.upsert({
          where: { meetingId: zoomMeetingId },
          update: {
            ...(body.topic ? { topic: body.topic } : {}),
            ...(body.hostId ? { hostId: body.hostId } : {}),
            ...(startTime ? { startTime } : {}),
          },
          create: {
            meetingId: zoomMeetingId,
            topic: body.topic || null,
            hostId: body.hostId || null,
            startTime: startTime || null,
          },
        });
      }

      fastify.log.info(`Stored mapping for Zoom Meeting: ${body.zoomMeetingId}`);
      return reply.code(201).send(mapping);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to store mapping' });
    }
  });

}
