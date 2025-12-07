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
    .custom((value) => {
      if (!value) return true;
      if (value === 'automatic') return true;
      return mongoose.Types.ObjectId.isValid(value);
    })
    .withMessage('Assignee must be "automatic" or a valid ObjectId'),
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
    .custom((value) => {
      if (!value) return true;
      if (value === 'automatic') return true;
      return mongoose.Types.ObjectId.isValid(value);
    })
    .withMessage('Assignee must be "automatic" or a valid ObjectId'),

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

export const sendToPO = [
  param('id')
    .notEmpty()
    .withMessage('ID is required')
    .bail()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('ID must be a valid ObjectId'),

  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .bail()
    .isEmail()
    .withMessage('Email must be a valid email address'),
];

export const sendAllToPO = [
  param('projectId')
    .notEmpty()
    .withMessage('Project ID is required')
    .bail()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Project ID must be a valid ObjectId'),

  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .bail()
    .isEmail()
    .withMessage('Email must be a valid email address'),

  body('questionIds')
    .notEmpty()
    .withMessage('Question IDs are required')
    .bail()
    .isArray()
    .withMessage('Question IDs must be an array')
    .bail()
    .custom((value) => value.every((id: string) => mongoose.Types.ObjectId.isValid(id)))
    .withMessage('All question IDs must be valid ObjectIds'),
];

