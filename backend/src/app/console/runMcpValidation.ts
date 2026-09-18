/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */

import { callCreateTicketTool } from '../services/mcpService';

const titles = [
  '(SPIKE) Look at controllers and identify any logic that should not be in a controller',
  '(SPIKE) AI MCP',
];

const run = async (): Promise<void> => {
  for (const title of titles) {
    try {
      const result = await callCreateTicketTool(title);

      console.log(`\nTicket title: ${title}`);
      console.log(
        'Validation result:',
        JSON.stringify(result, null, 2),
      );
    } catch (error: unknown) {
      console.error(
        `MCP validation failed for "${title}":`,
        error,
      );

      process.exitCode = 1;
    }
  }
};

run().catch((error: unknown) => {
  console.error('MCP test script failed:', error);
  process.exitCode = 1;
});