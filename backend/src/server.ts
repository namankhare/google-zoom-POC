import Fastify from 'fastify';
import { config } from './config/index';
import webhookRoutes from './routes/webhook';
import meetingRoutes from './routes/meetings';

const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
    },
  },
});

// Register routes
fastify.register(webhookRoutes);
fastify.register(meetingRoutes);


const start = async () => {
  try {
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    fastify.log.info(`Server listening on http://localhost:${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
