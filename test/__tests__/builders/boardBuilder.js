import * as Board from '../../../src/app/model/board';
import db from '../../setup/db';
import BaseBuilder from './baseBuilder';
import StatusBuilder from './statusBuilder';

export default class BoardBuilder extends BaseBuilder {
  constructor(defaultValues = true) {
    super(defaultValues);
  }

  withTitle(title) {
    this.properties.title = title;
    return this;
  }

  withStatuses(statuses) {
    this.properties.statuses = statuses.map((s) => s._id || s);
    return this;
  }

  withIsPublic(isPublic) {
    this.properties.isPublic = isPublic;
    return this;
  }

  async buildDefault() {
    const statuses = await StatusBuilder.createDefaultStatuses();
    return {
      title: 'Default Board',
      tenant: db.defaultTenant._id,
      statuses: statuses.map((s) => s._id),
      isPublic: false,
    };
  }

  build() {
    return {
      title: this.properties.title,
      tenant: this.properties.tenant,
      statuses: this.properties.statuses,
      isPublic: this.properties.isPublic ?? false,
    };
  }

  async save() {
    return super.save(Board.getModel(db.dbConnection));
  }
}

