const { param, body } = require('express-validator');

const LABEL_NAME_MAX_LENGTH = 30;
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const store = [body('name').notEmpty().isString(), body('slug').notEmpty().isString()];

const storeProjectLabel = [
  param('projectId').isMongoId().withMessage('Invalid project id'),
  body('name')
    .isString()
    .withMessage('Label name is required')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Label name is required')
    .bail()
    .isLength({ max: LABEL_NAME_MAX_LENGTH })
    .withMessage(`Label name must be ${LABEL_NAME_MAX_LENGTH} characters or fewer`),
  body('color')
    .optional()
    .matches(HEX_COLOR)
    .withMessage('Color must be a hex code like #6a2add'),
];

const update = [param('id').notEmpty().isString()];

const remove = [param('id').notEmpty().isString()];

const eliminate = [param('ticketId').notEmpty().isString(), param('labelId').notEmpty().isString()];

export { store, storeProjectLabel, update, remove, eliminate };
