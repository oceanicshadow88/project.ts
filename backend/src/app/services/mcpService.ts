import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { config } from '../config/app';
import type { TicketTitleValidationResult } from '../types/ticketTitleValidationResult';
import { validateTicketTitleResult } from '../validations/ticketTitleResultValidation';

type McpToolResult = Awaited<ReturnType<Client['callTool']>>;

export const buildMcpEndpoint = (
  baseUrl: string,
  toolName: string,
): URL => {
  if (!baseUrl.trim()) {
    throw new Error('Missing MCP_BASE_URL');
  }
  if (!/^[A-Za-z0-9_-]+$/.test(toolName)) {
    throw new Error('Invalid MCP tool name');
  }

  const endpoint = new URL(baseUrl);
  if (endpoint.search || endpoint.hash) {
    throw new Error('MCP_BASE_URL must not contain query or fragment');
  }

  const basePath = endpoint.pathname.replace(/\/+$/, '');
  endpoint.pathname = `${basePath}/${toolName}`;
  return endpoint;
};

export const callMcpTool = async (
  toolName: string,
  args: Record<string, unknown>,
): Promise<McpToolResult> => {
  const endpoint = buildMcpEndpoint(config.mcp.serverUrl, toolName);
  const mcpClient = new Client({
    name: 'techscrum-mcp-client',
    version: '1.0.0',
  });

  const transport = new StreamableHTTPClientTransport(endpoint);

  try {
    await mcpClient.connect(transport);

    return await mcpClient.callTool({
      name: toolName,
      arguments: args,
    });
  } finally {
    await mcpClient.close();
  }
};

export const callValidateTicketTitleTool = async (
  title: string,
): Promise<TicketTitleValidationResult> => {
  const result = await callMcpTool('validate_ticket_title', { title });
  const textBlock = result.content.find(
    (block) => block.type === 'text',
  );

  if (result.isError) {
    throw new Error(
      textBlock?.type === 'text'
        ? textBlock.text
        : 'The MCP validate_ticket_title tool returned an error',
    );
  }

  if (textBlock?.type !== 'text') {
    throw new Error(
      'The MCP validate_ticket_title tool did not return a validation result',
    );
  }

  return validateTicketTitleResult(JSON.parse(textBlock.text));
};
