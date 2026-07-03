import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../services/prisma.service.js';

export default async function meetingRoutes(fastify: FastifyInstance) {
  fastify.get('/meetings', async (request: FastifyRequest, reply: FastifyReply) => {
    const meetings = await prisma.meeting.findMany({
      include: {
        summaries: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return meetings;
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
