import { param, body } from 'express-validator';
import mongoose from 'mongoose';

export const index = [
  param('questionId')
    .notEmpty()
    .withMessage('Question ID is required')
    .bail()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Question ID must be a valid ObjectId'),
];

export const store = [
  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .bail()
    .isString()
    .withMessage('Content must be a string')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Content must be between 1 and 5000 characters'),

  body('question')
    .notEmpty()
    .withMessage('Question ID is required')
    .bail()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Question ID must be a valid ObjectId'),
];

export const update = [
  param('id')
    .notEmpty()
    .withMessage('ID is required')
    .bail()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('ID must be a valid ObjectId'),

  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .bail()
    .isString()
    .withMessage('Content must be a string')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Content must be between 1 and 5000 characters'),
];

export const destroy = [
  param('id')
    .notEmpty()
    .withMessage('ID is required')
    .bail()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('ID must be a valid ObjectId'),
];

