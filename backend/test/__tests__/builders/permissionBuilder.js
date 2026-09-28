import * as Permission from '../../../src/app/model/permission';
import db from '../../setup/db';
import BaseBuilder from './baseBuilder';

export default class PermissionBuilder extends BaseBuilder {
  constructor(defaultValues = true) {
    super(defaultValues);
  }

  withSlug(slug) {
    this.properties.slug = slug;
    return this;
  }

  withDescription(description) {
    this.properties.description = description;
    return this;
  }

  async buildDefault() {
    return {
      slug: 'view:projects',
      description: 'View Projects',
    };
  }

  build() {
    return {
      slug: this.properties.slug,
      description: this.properties.description,
    };
  }

  async save() {
    return super.save(Permission.getModel(db.dbConnection));
  }
}
