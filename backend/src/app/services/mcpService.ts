import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { config } from '../config/app';
import { ticketTitleValidationSchema, type TicketTitleValidationResult } from '../types/ticketTitleValidation';

export const callValidateTicketTitleTool = async (
  title: string,
): Promise<TicketTitleValidationResult> => {
  if (!config.mcp.serverUrl) {
    throw new Error('Missing MCP_SERVER_URL');
  }

  const mcpClient = new Client({
    name: 'techscrum-mcp-client',
    version: '1.0.0',
  });

  const transport = new StreamableHTTPClientTransport(
    new URL(config.mcp.serverUrl),
  );

  try {
    await mcpClient.connect(transport);

    const result = await mcpClient.callTool({
      name: 'validate_ticket_title',
      arguments: { title },
    });

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

    return ticketTitleValidationSchema.parse(JSON.parse(textBlock.text));
  } finally {
    await mcpClient.close();
  }
};
