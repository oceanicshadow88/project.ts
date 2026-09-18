import { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { validateTicketTitle } from './ticketTitleValidator.js';

export const createTicketTool = (
  server: McpServer,
): void => {
  server.registerTool(
    'create_ticket',
    {
      description:
        'Validate a ticket title before creating a ticket.',
      inputSchema: z.object({
        title: z.string().trim().min(1),
      }),
    },
    async ({ title }) => {
      const result = await validateTicketTitle(title);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );
};