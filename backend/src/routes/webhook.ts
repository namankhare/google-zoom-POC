import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { config } from '../config/index.js';
import { prisma } from '../services/prisma.service.js';
import { verifyZoomWebhook } from '../middleware/verifyZoomWebhook.js';
import { WebhookService } from '../services/webhook.service.js';

export default async function webhookRoutes(fastify: FastifyInstance) {
  fastify.post('/webhooks/zoom', {
    preHandler: [verifyZoomWebhook]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;

    fastify.log.info({ event: body?.event, headers: request.headers }, 'Incoming Zoom webhook request');

    // Handle Zoom Webhook URL Validation
    if (body.event === 'endpoint.url_validation') {
      const plainToken = body.payload.plainToken;
      const hash = crypto
        .createHmac('sha256', config.zoom.webhookSecret)
        .update(plainToken)
        .digest('hex');

      fastify.log.info({ plainToken }, 'Responding to Zoom URL validation challenge');

      return reply.send({
        plainToken,
        encryptedToken: hash,
      });
    }

    // Store Webhook Event
    try {
      await prisma.webhookEvent.create({
        data: {
          event: body.event,
          payload: JSON.stringify(body.payload),
          headers: JSON.stringify(request.headers),
        },
      });
      
      fastify.log.info(`Received webbook event: ${body.event}`);

      // Handle specific event: meeting.aic_transcript_completed
      if (body.event === 'meeting.aic_transcript_completed') {
        const { meeting_id, meeting_uuid } = body.payload.object;
        // Process asynchronously
        WebhookService.processMeetingSummary(meeting_uuid, meeting_id);
      }

      return reply.code(200).send();
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  });
}

