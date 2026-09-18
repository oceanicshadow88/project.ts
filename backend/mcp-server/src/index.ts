import 'dotenv/config';
import { createMcpExpressApp } from '@modelcontextprotocol/express';
import { NodeStreamableHTTPServerTransport } from '@modelcontextprotocol/node';
import { McpServer } from '@modelcontextprotocol/server';
import { createTicketTool } from './createTicketTool.js';

const app = createMcpExpressApp();
const server = new McpServer({
  name: 'techscrum-mcp-server',
  version: '1.0.0',
});
createTicketTool(server);

app.post('/mcp', async (req, res) => {
  const transport = new NodeStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

const port = Number(process.env.MCP_SERVER_PORT || 3001);

app.listen(port, '127.0.0.1', () => {
  console.log(
    `MCP Server running at http://127.0.0.1:${port}/mcp`,
  );
});