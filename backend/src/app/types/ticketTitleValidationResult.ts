export type TicketTitleValidationResult = {
  recommendedTitle: string;
  reason: string;
  classification: 'clear' | 'unclear' | 'ambiguous';
};
