import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import type { ITicketTitleValidationResult } from '../types/ticketTitleValidation';

export const callCreateTicketTool = async (
  title: string,
): Promise<ITicketTitleValidationResult> => {
  const mcpClient = new Client({
    name: 'techscrum-mcp-client',
    version: '1.0.0',
  });

  const transport = new StreamableHTTPClientTransport(
    new URL('http://127.0.0.1:3001/mcp'),
  );

  try {
    await mcpClient.connect(transport);

    const result = await mcpClient.callTool({
      name: 'create_ticket',
      arguments: { title },
    });

    const textBlock = result.content.find(
      (block) => block.type === 'text',
    );

    if (result.isError) {
      throw new Error(
        textBlock?.type === 'text'
          ? textBlock.text
          : 'The MCP create_ticket tool returned an error',
      );
    }

    if (!textBlock || textBlock.type !== 'text') {
      throw new Error(
        'The MCP create_ticket tool did not return a validation result',
      );
    }

    return JSON.parse(
      textBlock.text,
    ) as ITicketTitleValidationResult;
  } finally {
    await mcpClient.close();
  }
};
