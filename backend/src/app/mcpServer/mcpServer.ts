import { McpServer } from '@modelcontextprotocol/server';

export type RegisterMcpTool = (server: McpServer) => void;

export const createMcpServer = (registerTool: RegisterMcpTool): McpServer => {
  const server = new McpServer({
    name: 'techscrum-mcp-server',
    version: '1.0.0',
  });

  try {
    registerTool(server);
    return server;
  } catch (error) {
    void Promise.allSettled([
      Promise.resolve().then(() => server.close()),
    ]);
    throw error;
  }
};
