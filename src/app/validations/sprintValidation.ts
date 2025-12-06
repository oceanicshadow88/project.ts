import { body } from 'express-validator';

export const store = [
  body(['name', 'projectId', 'board']).exists().notEmpty().isString(),
  body('status')
    .if(body('status').exists())
    .isIn(['active', 'planning', 'completed'])
    .withMessage('Status must be one of: active, planning, completed'),
  body('description').if(body('description').exists()).isString(),
];
