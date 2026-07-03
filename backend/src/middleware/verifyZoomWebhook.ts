import type { FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { config } from '../config/index.js';
import { prisma } from '../services/prisma.service.js';

export const verifyZoomWebhook = async (request: FastifyRequest, reply: FastifyReply) => {
  const { headers, body } = request;

  const isValidationEvent = (body as any)?.event === 'endpoint.url_validation';

  let verified = isValidationEvent;
  let rejectReason: string | null = null;

  if (!isValidationEvent) {
    const signature = headers['x-zm-signature'] as string;
    const timestamp = headers['x-zm-request-timestamp'] as string;

    if (!signature || !timestamp) {
      rejectReason = 'Missing Zoom signature or timestamp';
    } else {
      // Check if timestamp is too old (e.g., > 5 minutes)
      const now = Math.floor(Date.now() / 1000);
      if (Math.abs(now - parseInt(timestamp, 10)) > 300) {
        rejectReason = 'Request timestamp expired';
      } else {
        const message = `v0:${timestamp}:${JSON.stringify(body)}`;
        const hash = crypto
          .createHmac('sha256', config.zoom.webhookSecret)
          .update(message)
          .digest('hex');

        const expectedSignature = `v0=${hash}`;

        if (signature !== expectedSignature) {
          rejectReason = 'Invalid Zoom signature';
        } else {
          verified = true;
        }
      }
    }
  }

  // Raw, unconditional audit log of every hit to this endpoint, regardless
  // of event type or verification outcome. Never let logging failures block
  // the actual webhook response.
  prisma.webhookRawLog
    .create({
      data: {
        event: (body as any)?.event ?? null,
        method: request.method,
        path: request.url,
        verified,
        headers: JSON.stringify(headers),
        body: JSON.stringify(body ?? {}),
      },
    })
    .catch((err: unknown) => {
      request.log.error(err, 'Failed to write raw webhook log');
    });

  if (!verified) {
    request.log.warn({ headers, rejectReason }, 'Zoom webhook rejected');
    return reply.status(401).send({ message: rejectReason });
  }

  request.log.info('Zoom webhook signature verified');
};

