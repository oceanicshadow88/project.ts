const { param, body } = require('express-validator');

const show = [
  param('id').isString(),
];

const addStatus = [
  param('boardId').isMongoId(),
  param('projectId').isMongoId(),
  body('name').isString().trim().notEmpty().isLength({ max: 30 }),
];

const reorderStatus = [
  param('boardId').isMongoId(),
  param('projectId').isMongoId(),
  body('statusIds').isArray({ min: 1 }),
  body('statusIds.*').isMongoId(),
];

export { show, addStatus, reorderStatus };