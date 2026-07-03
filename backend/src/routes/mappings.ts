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
   *   "googleDriveFolderId": "..."
   * }
   */
  fastify.post('/mappings', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;

    if (!body.zoomMeetingId) {
      return reply.code(400).send({ error: 'zoomMeetingId is required' });
    }

    try {
      const mapping = await prisma.meetingMapping.upsert({
        where: { zoomMeetingId: body.zoomMeetingId.toString() },
        update: {
          calendarEventId: body.calendarEventId,
          crmLeadId: body.crmLeadId,
          customerId: body.customerId,
          googleDriveFolderId: body.googleDriveFolderId,
        },
        create: {
          zoomMeetingId: body.zoomMeetingId.toString(),
          calendarEventId: body.calendarEventId,
          crmLeadId: body.crmLeadId,
          customerId: body.customerId,
          googleDriveFolderId: body.googleDriveFolderId,
        },
      });

      fastify.log.info(`Stored mapping for Zoom Meeting: ${body.zoomMeetingId}`);
      return reply.code(201).send(mapping);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to store mapping' });
    }
  });
}
