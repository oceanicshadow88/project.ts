import { body, param } from 'express-validator';

const validateProjectId = [
  param('id')
    .notEmpty()
    .withMessage('Project ID is required')
    .bail()
    .isMongoId()
    .withMessage('Project ID must be a valid ObjectId'),

];

export const store = [
  ...validateProjectId,
  body('name').isString().bail().trim().notEmpty().isLength({ max: 30 }),
];

export const index = validateProjectId;

export const revoke = [
  ...validateProjectId,
  param('tokenId').isMongoId().withMessage('Token ID must be a valid ObjectId'),
];
