"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = meetingRoutes;
const fastify_1 = require("fastify");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function meetingRoutes(fastify) {
    fastify.get('/meetings', async (request, reply) => {
        const meetings = await prisma.meeting.findMany({
            include: {
                summaries: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return meetings;
    });
    fastify.get('/meetings/:meetingId', async (request, reply) => {
        const { meetingId } = request.params;
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
    fastify.get('/webhooks', async (request, reply) => {
        const webhooks = await prisma.webhookEvent.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        return webhooks;
    });
    fastify.get('/mappings', async (request, reply) => {
        const mappings = await prisma.meetingMapping.findMany();
        return mappings;
    });
}
//# sourceMappingURL=meetings.js.map