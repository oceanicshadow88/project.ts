import { body } from 'express-validator';
import type { TicketTitleValidationResult } from '../types/ticketTitleValidationResult';

const validations = [
  body().isObject(),
  body('classification')
    .isString()
    .bail()
    .isIn(['clear', 'unclear', 'ambiguous']),
  body('reason')
    .if(body('classification').isIn(['unclear', 'ambiguous']))
    .isString()
    .bail()
    .notEmpty(),
];

export const validateTicketTitleResult = async (
  value: unknown,
): Promise<TicketTitleValidationResult> => {
  const request = { body: value };
  for (const validation of validations) {
    const result = await validation.run(request);

    if (!result.isEmpty()) {
      throw new Error('Invalid ticket title validation result');
    }
  }
  const result = value as TicketTitleValidationResult;
  if (result.classification === 'clear') {
    return { classification: result.classification };
  }

  return { classification: result.classification, reason: result.reason };
};
