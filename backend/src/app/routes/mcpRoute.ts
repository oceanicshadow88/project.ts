import { NextFunction, Request, Response, Router } from 'express';
import { NodeStreamableHTTPServerTransport } from '@modelcontextprotocol/node';
import { createMcpServer } from '../mcpServer/mcpServer';

const router = Router();

router.post(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    const server = createMcpServer();
    const transport = new NodeStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on('close', () => {
      transport.close();
      server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
