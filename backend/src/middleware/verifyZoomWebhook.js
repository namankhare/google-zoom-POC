"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyZoomWebhook = void 0;
const fastify_1 = require("fastify");
const crypto_1 = __importDefault(require("crypto"));
const index_1 = require("../config/index");
const verifyZoomWebhook = async (request, reply) => {
    const { headers, body } = request;
    // Skip verification for endpoint validation
    if (body?.event === 'endpoint.url_validation') {
        return;
    }
    const signature = headers['x-zm-signature'];
    const timestamp = headers['x-zm-request-timestamp'];
    if (!signature || !timestamp) {
        return reply.status(401).send({ message: 'Missing Zoom signature or timestamp' });
    }
    // Check if timestamp is too old (e.g., > 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp, 10)) > 300) {
        return reply.status(401).send({ message: 'Request timestamp expired' });
    }
    const message = `v0:${timestamp}:${JSON.stringify(body)}`;
    const hash = crypto_1.default
        .createHmac('sha256', index_1.config.zoom.webhookSecret)
        .update(message)
        .digest('hex');
    const expectedSignature = `v0=${hash}`;
    if (signature !== expectedSignature) {
        return reply.status(401).send({ message: 'Invalid Zoom signature' });
    }
};
exports.verifyZoomWebhook = verifyZoomWebhook;
//# sourceMappingURL=verifyZoomWebhook.js.map