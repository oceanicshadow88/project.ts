import { McpServer } from '@modelcontextprotocol/server';
import { ValidateTicketTitleTool } from './validateTicketTitleTool';

export const createMcpServer = (): McpServer => {
  const server = new McpServer({
    name: 'techscrum-mcp-server',
    version: '1.0.0',
  });

  ValidateTicketTitleTool(server);
  return server;
};
