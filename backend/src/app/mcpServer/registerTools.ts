import { McpServer } from '@modelcontextprotocol/server';
import { callRestApi } from './apiHelper';
import { validateTicketTitleSchemas } from './schemas';

export const registerTools = (server: McpServer): void => {
  server.registerTool(
    'validate_ticket_title',
    {
      description:
        'Validate a ticket title before creating a ticket.',
      ...validateTicketTitleSchemas,
    },
    ({ title }, context) => callRestApi({
      method: 'POST',
      path: '/v2/tickets/validate-title',
      body: { title },
    }, context),
  );
  // add new tools
};
