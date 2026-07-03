import { FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { config } from '../config/index';

export const verifyZoomWebhook = async (request: FastifyRequest, reply: FastifyReply) => {
  const { headers, body } = request;
  
  // Skip verification for endpoint validation
  if ((body as any)?.event === 'endpoint.url_validation') {
    return;
  }

  const signature = headers['x-zm-signature'] as string;

  const timestamp = headers['x-zm-request-timestamp'] as string;

  if (!signature || !timestamp) {
    return reply.status(401).send({ message: 'Missing Zoom signature or timestamp' });
  }

  // Check if timestamp is too old (e.g., > 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) {
    return reply.status(401).send({ message: 'Request timestamp expired' });
  }

  const message = `v0:${timestamp}:${JSON.stringify(body)}`;
  const hash = crypto
    .createHmac('sha256', config.zoom.webhookSecret)
    .update(message)
    .digest('hex');

  const expectedSignature = `v0=${hash}`;

  if (signature !== expectedSignature) {
    return reply.status(401).send({ message: 'Invalid Zoom signature' });
  }
};
