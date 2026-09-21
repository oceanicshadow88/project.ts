import * as ReviewReport from '../../../src/app/model/reviewReport';
import db from '../../setup/db';
import BaseBuilder from './baseBuilder';
import TicketBuilder from './ticketBuilder';

export default class ReviewReportBuilder extends BaseBuilder {
  constructor(defaultValues = true) {
    super(defaultValues);
  }

  withTicket(ticket) {
    this.properties.ticket = ticket._id || ticket;
    return this;
  }

  withAssignee(assignee) {
    this.properties.assignee = assignee._id || assignee;
    return this;
  }

  withProject(project) {
    this.properties.project = project._id || project;
    return this;
  }

  withDueDate(dueDate) {
    this.properties.dueDate = dueDate;
    return this;
  }

  withStatus(status) {
    this.properties.status = status;
    return this;
  }

  withReportContent(reportContent) {
    this.properties.reportContent = reportContent;
    return this;
  }

  withSubmittedAt(submittedAt) {
    this.properties.submittedAt = submittedAt;
    return this;
  }

  withSubmittedBy(submittedBy) {
    this.properties.submittedBy = submittedBy._id || submittedBy;
    return this;
  }

  async buildDefault() {
    const ticket = await new TicketBuilder().save();
    return {
      ticket: ticket._id,
      assignee: db.defaultUser._id,
      project: ticket.project,
      dueDate: new Date(),
      status: 'pending',
    };
  }

  build() {
    return {
      ...this.properties,
    };
  }

  async save() {
    return super.save(ReviewReport.getModel(db.dbConnection));
  }
}
