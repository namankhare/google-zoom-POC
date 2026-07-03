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
    const calendarEventId = body.calendarEventId || undefined;

    try {
      // calendarEventId and zoomMeetingId are both unique columns, but they
      // can independently identify the "same" mapping — e.g. a mapping saved
      // before a meetingId-detection fix may have stored a stale/incorrect
      // zoomMeetingId for a calendarEventId that's now resolving correctly.
      // A plain upsert keyed on zoomMeetingId alone would try to `create` a
      // new row and collide with the old row's calendarEventId. So look up
      // by either unique key and update that row in place if found.
      const existing = await prisma.meetingMapping.findFirst({
        where: {
          OR: [
            { zoomMeetingId },
            ...(calendarEventId ? [{ calendarEventId }] : []),
          ],
        },
      });

      const data = {
        zoomMeetingId,
        calendarEventId: body.calendarEventId,
        crmLeadId: body.crmLeadId,
        customerId: body.customerId,
        googleDriveFolderId: body.googleDriveFolderId,
      };

      const mapping = existing
        ? await prisma.meetingMapping.update({ where: { id: existing.id }, data })
        : await prisma.meetingMapping.create({ data });

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

  /**
   * Wipes ALL data — mappings, meetings, summaries, processing logs, and
   * webhook event/raw logs — so the state can be rebuilt from scratch by
   * re-mapping events in the Calendar add-on.
   * Deletion order respects foreign keys: MeetingSummary/ProcessingLog
   * reference Meeting, so they must go first.
   */
  fastify.delete('/mappings', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const [summaries, logs, meetings, mappings, webhookEvents, webhookRawLogs] = await prisma.$transaction([
        prisma.meetingSummary.deleteMany({}),
        prisma.processingLog.deleteMany({}),
        prisma.meeting.deleteMany({}),
        prisma.meetingMapping.deleteMany({}),
        prisma.webhookEvent.deleteMany({}),
        prisma.webhookRawLog.deleteMany({}),
      ]);

      fastify.log.info(
        `Reset data: ${mappings.count} mappings, ${meetings.count} meetings, ${summaries.count} summaries, ${logs.count} logs, ${webhookEvents.count} webhook events, ${webhookRawLogs.count} webhook raw logs deleted`
      );

      return reply.code(200).send({
        deleted: {
          mappings: mappings.count,
          meetings: meetings.count,
          summaries: summaries.count,
          logs: logs.count,
          webhookEvents: webhookEvents.count,
          webhookRawLogs: webhookRawLogs.count,
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to reset mappings' });
    }
  });
}
