export interface ITicketTitleValidationResult {
  title: string;
  recommendedTitle: string;
  classification: 'clear' | 'unclear' | 'ambiguous';
  reason: string;
}
