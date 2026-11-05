import { z } from 'zod';

export const validateTicketTitleSchemas = {
  inputSchema: z.object({
    title: z.string().trim().min(1),
  }),
};
