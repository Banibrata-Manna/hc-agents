import { Mastra } from '@mastra/core/mastra';
import { Observability, DefaultExporter, CloudExporter, SensitiveDataFilter } from '@mastra/observability';

import { orderRoutingAgent } from './agents/orderRoutingAgent';
import { networkingAgent } from './agents/networkingAgent';
import { routingRagAgent } from './agents/routingRagAgent'; 
import { PostgresStore } from '@mastra/pg';
import { PinoLogger } from '@mastra/loggers';
import { PostgresJwtAuth } from './auth/postgres-jwt-auth';

import { updateOrderRoutingGroupWorkflow } from './workflows/orderRoutingWorkflows';

const storage = new PostgresStore({
  id: 'hc-agent-store',
  connectionString: process.env.DATABASE_URL || '',
  schemaName: process.env.DATABASE_SCHEMA || ''
});

const config = {
  agents: {
    orderRoutingAgent,
    networkingAgent,
    routingRagAgent
  },
  workflows: {
    updateOrderRoutingGroupWorkflow
  },
  logger: new PinoLogger({ name: 'HC-Agents', level: 'debug' }),
  storage,
  bundler: {
    sourcemap: true,
  },
  server: {
    port: parseInt(process.env.MASTRA_PORT || '4111'),
    host: process.env.MASTRA_HOST || 'localhost',
    build: {
      swaggerUI: true,
      openAPIDocs: true
    },
    auth: new PostgresJwtAuth({
      connectionString: process.env.DATABASE_URL || '',
      jwtSecret: process.env.JWT_SECRET || '',
      store: storage,
      public: [
        '/api/studio/*',
        '/_next/*',
        '/assets/*',
        '/settings',
        '/refresh-events',
        '/mastra.svg',
        '/swagger-ui',
        '/api/openapi.json'
      ]
    }),
    apiRoutes: [
      {
        path: '/',
        method: 'GET' as const,
        handler: (c: any) => c.redirect('/settings'),
        requiresAuth: false
      }
    ]
  },
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [
          new DefaultExporter(), // Persists traces to storage for Mastra Studio
          new CloudExporter(), // Sends traces to Mastra Cloud (if MASTRA_CLOUD_ACCESS_TOKEN is set)
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(), // Redacts sensitive data like passwords, tokens, keys
        ],
      },
    },
  }),
};

export const mastra = new Mastra({
  ...config,
});
