import * as Sprint from '../../../src/app/model/sprint';
import db from '../../setup/db';
import BaseBuilder from './baseBuilder';
import ProjectBuilder from './projectBuilder';

export default class SprintBuilder extends BaseBuilder {
  constructor(defaultValues = true) {
    super(defaultValues);
  }

  withName(name) {
    this.properties.name = name;
    return this;
  }

  withProject(project) {
    this.properties.project = project._id;
    return this;
  }

  withTenant(tenant) {
    this.properties.tenant = tenant;
    return this;
  }

  withStartDate(startDate) {
    this.properties.startDate = startDate;
    return this;
  }

  withEndDate(endDate) {
    this.properties.endDate = endDate;
    return this;
  }

  withGoal(goal) {
    this.properties.goal = goal;
    return this;
  }

  withStatus(status) {
    this.properties.status = status;
    return this;
  }

  withBoard(board) {
    this.properties.board = board._id || board;
    return this;
  }

  withDescription(description) {
    this.properties.description = description;
    return this;
  }

  async buildDefault() {
    const project = await new ProjectBuilder().save();
    // Create a simple board ID for testing (board is required)
    const boardId = new (await import('mongoose')).default.Types.ObjectId();
    return {
      name: 'Sprint Title',
      project: project._id,
      board: boardId,
      tenant: db.defaultTenant._id,
      status: 'planning',
    };
  }

  build() {
    return {
      name: this.properties.name,
      project: this.properties.project,
      board: this.properties.board,
      tenant: this.properties.tenant,
      startDate: this.properties.startDate,
      endDate: this.properties.endDate,
      goal: this.properties.goal,
      status: this.properties.status ?? 'planning',
      description: this.properties.description,
    };
  }

  async save() {
    return super.save(Sprint.getModel(db.dbConnection));
  }
}
