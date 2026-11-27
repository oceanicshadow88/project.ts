const { param, body } = require('express-validator');

const store = [
  param('boardId').isMongoId(),
  param('projectId').isMongoId(),
  body('name').isString().trim().notEmpty().isLength({ max: 30 }),
];

const update = [
  param('boardId').isMongoId(),
  param('projectId').isMongoId(),
  body('statusIds').isArray({ min: 1 }),
  body('statusIds.*').isMongoId(),
];

export { store, update };
