export type TicketTitleValidationResult =
  | { classification: 'clear' }
  | { classification: 'unclear' | 'ambiguous'; reason: string };
