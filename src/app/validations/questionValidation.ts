import { param, body } from 'express-validator';
import mongoose from 'mongoose';

export const index = [
  param('ticketId')
    .notEmpty()
    .withMessage('Ticket ID is required')
    .bail()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Ticket ID must be a valid ObjectId'),
];

export const show = [
  param('id')
    .notEmpty()
    .withMessage('ID is required')
    .bail()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('ID must be a valid ObjectId'),
];

export const store = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .bail()
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Title must be between 1 and 500 characters'),

  body('ticket')
    .notEmpty()
    .withMessage('Ticket ID is required')
    .bail()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Ticket ID must be a valid ObjectId'),

  body('priority')
    .optional()
    .isIn(['Highest', 'High', 'Medium', 'Low', 'Lowest'])
    .withMessage('Priority must be one of: Highest, High, Medium, Low, Lowest'),

  body('assignee')
    .optional()
    .custom((value) => !value || mongoose.Types.ObjectId.isValid(value))
    .withMessage('Assignee must be a valid ObjectId'),
];

export const update = [
  param('id')
    .notEmpty()
    .withMessage('ID is required')
    .bail()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('ID must be a valid ObjectId'),

  body('title')
    .optional()
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Title must be between 1 and 500 characters'),

  body('priority')
    .optional()
    .isIn(['Highest', 'High', 'Medium', 'Low', 'Lowest'])
    .withMessage('Priority must be one of: Highest, High, Medium, Low, Lowest'),

  body('assignee')
    .optional()
    .custom((value) => !value || mongoose.Types.ObjectId.isValid(value))
    .withMessage('Assignee must be a valid ObjectId'),

  body('isResolved')
    .optional()
    .isBoolean()
    .withMessage('isResolved must be a boolean'),
];

export const destroy = [
  param('id')
    .notEmpty()
    .withMessage('ID is required')
    .bail()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('ID must be a valid ObjectId'),
];

