import type { RequestHandler } from 'express';
import { NodeStreamableHTTPServerTransport } from '@modelcontextprotocol/node';
import { createMcpServer, RegisterMcpTool } from './mcpServer';

export const mcpEndpoint = (registerTool: RegisterMcpTool): RequestHandler =>
  async (req, res, next) => {
    let server: ReturnType<typeof createMcpServer> | undefined;
    let transport: NodeStreamableHTTPServerTransport | undefined;
    let closePromise: Promise<void> | undefined;

    const closeResources = (): Promise<void> => {
      if (!closePromise) {
        closePromise = Promise.allSettled([
          Promise.resolve().then(() => transport?.close()),
          Promise.resolve().then(() => server?.close()),
        ]).then(() => undefined);
      }
      return closePromise;
    };

    try {
      server = createMcpServer(registerTool);
      transport = new NodeStreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

      res.once('close', () => {
        void closeResources();
      });

      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      await closeResources();
      next(error);
    }
  };
