import { body, param, query } from 'express-validator';

const show = [param('id').notEmpty()];

const validateTitle = [param('id').isMongoId().withMessage('A valid ticket id is required')];

const validateProposedTitle = [
  body('title').isString().bail().trim().notEmpty().withMessage('A ticket title is required'),
];

const validateSummary = [
  param('projectId').notEmpty().withMessage('projectId is required').isString(),
  query('summaryBy')
    .notEmpty()
    .withMessage('summaryBy is required')
    .isIn(['type', 'status'])
    .withMessage('summaryBy must be either "type" or "status"'),
];

const validateEpicSummary = [
  param('projectId').notEmpty().withMessage('projectId is required').isString(),
];

const store = [body(['title', 'type']).notEmpty()];

const migrateRanks = [body(['projectId']).notEmpty()];

const update = [
  param('id').notEmpty().isString(),
  body('title').if(body('title').exists()).isString().isLength({ min: 1 }),
  body('priority').if(body('priority').exists()).isString(),
];

const remove = [param('id').notEmpty().isString()];

export { show, store, update, remove, validateSummary, validateEpicSummary, migrateRanks, validateTitle, validateProposedTitle };
