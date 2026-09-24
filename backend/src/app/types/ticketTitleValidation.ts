import { z } from 'zod';

export const ticketTitleValidationSchema = z.discriminatedUnion(
  'classification',
  [
    z.object({
      classification: z.literal('clear'),
    }),
    z.object({
      classification: z.enum([
        'unclear',
        'ambiguous',
      ]),
      reason: z.string().min(1),
    }),
  ],
);

export type TicketTitleValidationResult = z.infer<
  typeof ticketTitleValidationSchema
>;
