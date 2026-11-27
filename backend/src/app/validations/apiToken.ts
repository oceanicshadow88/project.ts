import { param } from 'express-validator';

export const store = [
  param('id')
    .notEmpty()
    .withMessage('Project ID is required')
    .bail()
    .isMongoId()
    .withMessage('Project ID must be a valid ObjectId'),
];
