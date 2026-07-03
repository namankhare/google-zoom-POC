"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const index_1 = require("./config/index");
const webhook_1 = __importDefault(require("./routes/webhook"));
const meetings_1 = __importDefault(require("./routes/meetings"));
const fastify = (0, fastify_1.default)({
    logger: {
        transport: {
            target: 'pino-pretty',
        },
    },
});
// Register routes
fastify.register(webhook_1.default);
fastify.register(meetings_1.default);
const start = async () => {
    try {
        await fastify.listen({ port: index_1.config.port, host: '0.0.0.0' });
        fastify.log.info(`Server listening on http://localhost:${index_1.config.port}`);
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=server.js.map