/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */

import { callValidateTicketTitleTool } from '../services/mcpService';

const titles = [
  '(SPIKE) Look at controllers and identify any logic that should not be in a controller',
  '(SPIKE) Understanding saasMiddlewareV2.ts and plan how to refactor the codebase to combine it into one database instead of two',
  '(SPIKE) AI MCP',
  '(SPIKE) Find UI alignment problem (eg: textbox...etc)',
  '(SPIKE) Look at all the docs and provide improvement feedback',
];

const run = async (): Promise<void> => {
  for (const title of titles) {
    try {
      const result = await callValidateTicketTitleTool(title);

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
