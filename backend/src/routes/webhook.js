"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = webhookRoutes;
const fastify_1 = require("fastify");
const crypto_1 = __importDefault(require("crypto"));
const index_1 = require("../config/index");
const client_1 = require("@prisma/client");
const verifyZoomWebhook_1 = require("../middleware/verifyZoomWebhook");
const webhook_service_1 = require("../services/webhook.service");
const prisma = new client_1.PrismaClient();
async function webhookRoutes(fastify) {
    fastify.post('/webhooks/zoom', {
        preHandler: [verifyZoomWebhook_1.verifyZoomWebhook]
    }, async (request, reply) => {
        const body = request.body;
        // Handle Zoom Webhook URL Validation
        if (body.event === 'endpoint.url_validation') {
            const plainToken = body.payload.plainToken;
            const hash = crypto_1.default
                .createHmac('sha256', index_1.config.zoom.webhookSecret)
                .update(plainToken)
                .digest('hex');
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
                webhook_service_1.WebhookService.processMeetingSummary(meeting_uuid, meeting_id);
            }
            return reply.code(200).send();
        }
        catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    });
}
//# sourceMappingURL=webhook.js.map