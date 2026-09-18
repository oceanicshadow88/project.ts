export interface ITicketTitleValidationResult {
  classification: 'clear' | 'unclear' | 'ambiguous';
  reason?: string;
}