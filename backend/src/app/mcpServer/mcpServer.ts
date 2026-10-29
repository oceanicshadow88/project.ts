import { McpServer } from '@modelcontextprotocol/server';
import { registerTools } from './registerTools';

export const createMcpServer = (): McpServer => {
  const server = new McpServer({
    name: 'techscrum-mcp-server',
    version: '1.0.0',
  });

  registerTools(server);
  return server;
};
