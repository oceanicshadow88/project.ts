import { body, param } from 'express-validator';

const MAX_MESSAGE_LENGTH = 1000;

const chat = [
  param('id').isMongoId().withMessage('A valid project id is required'),
  body('message')
    .isString()
    .bail()
    .trim()
    .isLength({ min: 1, max: MAX_MESSAGE_LENGTH })
    .withMessage(`A message of 1 to ${MAX_MESSAGE_LENGTH} characters is required`),
];

export { chat };
