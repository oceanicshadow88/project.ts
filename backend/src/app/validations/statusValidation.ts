import { param, body } from 'express-validator';
import mongoose from 'mongoose';

export const index = [];

export const update = [
  param('id')
    .notEmpty()
    .withMessage('ID is required')
    .bail()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('ID must be a valid ObjectId'),

  body('name')
    .optional()
    .isString()
    .withMessage('Name must be a string')
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty'),

  body('slug')
    .optional()
    .isString()
    .withMessage('Slug must be a string')
    .trim()
    .notEmpty()
    .withMessage('Slug cannot be empty'),

  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean'),

  body('color')
    .optional()
    .isString()
    .withMessage('Color must be a string')
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color code (e.g., #6a2add)'),
];
