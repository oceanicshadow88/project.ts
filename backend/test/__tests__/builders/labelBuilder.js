import * as Label from '../../../src/app/model/label';
import db from '../../setup/db';
import BaseBuilder from './baseBuilder';

export default class LabelBuilder extends BaseBuilder {
  constructor(defaultValues = true) {
    super(defaultValues);
  }

  withName(name) {
    this.properties.name = name;
    return this;
  }

  withSlug(slug) {
    this.properties.slug = slug;
    return this;
  }

  withTenant(tenant) {
    this.properties.tenant = tenant;
    return this;
  }

  withProjectId(projectId) {
    this.properties.projectId = projectId;
    return this;
  }

  withColor(color) {
    this.properties.color = color;
    return this;
  }

  async buildDefault() {
    return {
      name: 'Default Label',
      slug: 'default-label',
      tenant: db.defaultTenant._id,
    };
  }

  build() {
    return {
      name: this.properties.name,
      slug: this.properties.slug,
      color: this.properties.color,
      projectId: this.properties.projectId,
      tenant: this.properties.tenant,
    };
  }

  async save() {
    return super.save(Label.getModel(db.dbConnection));
  }
}
