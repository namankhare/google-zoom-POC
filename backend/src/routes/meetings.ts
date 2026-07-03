import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../services/prisma.service.js';

export default async function meetingRoutes(fastify: FastifyInstance) {
  fastify.get('/meetings', async (request: FastifyRequest, reply: FastifyReply) => {
    const meetings = await prisma.meeting.findMany({
      include: {
        summaries: true,
        logs: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mappings = await prisma.meetingMapping.findMany();
    const mappingByMeetingId = new Map(mappings.map((m) => [m.zoomMeetingId, m]));

    const meetingRows = meetings.map((meeting) => ({
      ...meeting,
      mapping: mappingByMeetingId.get(meeting.meetingId) || null,
    }));

    // Include mappings that don't have a corresponding Meeting record yet
    // (e.g. calendar event was mapped to a CRM record, but Zoom hasn't sent
    // the transcript/summary webhook for that meeting yet).
    const meetingIds = new Set(meetings.map((m) => m.meetingId));
    const unmatchedMappingRows = mappings
      .filter((m) => m.zoomMeetingId && !meetingIds.has(m.zoomMeetingId))
      .map((mapping) => ({
        id: `mapping-${mapping.id}`,
        meetingId: mapping.zoomMeetingId || '',
        meetingUuid: null,
        topic: null,
        hostId: null,
        startTime: null,
        summaryRetrieved: false,
        createdAt: new Date(0),
        summaries: [],
        logs: [],
        mapping,
      }));

    return [...meetingRows, ...unmatchedMappingRows];
  });

  fastify.get('/meetings/:meetingId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { meetingId } = request.params as { meetingId: string };
    const meeting = await prisma.meeting.findUnique({
      where: { meetingId },
      include: {
        summaries: true,
        logs: true,
      },
    });

    if (!meeting) {
      return reply.code(404).send({ error: 'Meeting not found' });
    }

    const mapping = await prisma.meetingMapping.findUnique({
      where: { zoomMeetingId: meetingId },
    });

    return { meeting, mapping };
  });

  fastify.get('/webhooks', async (request: FastifyRequest, reply: FastifyReply) => {
    const webhooks = await prisma.webhookEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return webhooks;
  });

  fastify.get('/mappings', async (request: FastifyRequest, reply: FastifyReply) => {
    const mappings = await prisma.meetingMapping.findMany();
    return mappings;
  });
}
