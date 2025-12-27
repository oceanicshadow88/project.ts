import { body, param, query } from 'express-validator';

export const createPromptValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters')
    .trim(),
  
  body('prompt')
    .notEmpty()
    .withMessage('Prompt content is required')
    .isLength({ min: 1, max: 10000 })
    .withMessage('Prompt must be between 1 and 10000 characters')
    .trim(),
];

export const updatePromptValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid prompt ID format'),
    
  body('title')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters')
    .trim(),
  
  body('prompt')
    .optional()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Prompt must be between 1 and 10000 characters')
    .trim(),
];

export const getPromptValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid prompt ID format'),
];

export const listPromptsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  query('search')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Search query too long'),
    
  query('sort_by')
    .optional()
    .isIn(['title', 'created_at', 'updated_at'])
    .withMessage('Invalid sort field'),
    
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),
];

export const deletePromptValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid prompt ID format'),
];
