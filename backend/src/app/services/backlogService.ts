import escapeStringRegexp from 'escape-string-regexp';
import { Request } from 'express';
import { Mongoose } from 'mongoose';
import type { TicketPriority } from '../types/aiChat';
import { findTickets } from './ticketService';

class BacklogFilterBuilder {
  private readonly filters: Record<string, any>;

  constructor(projectId: string) {
    this.filters = {};
    this.filters.project = projectId;
  }

  withTitle(title: any) {
    if (!title) return this;
    const escapeRegex: string = escapeStringRegexp(title);
    const regex: RegExp = new RegExp(escapeRegex, 'i');
    this.filters.title = regex;
    return this;
  }

  withType(ticketTypes: any) {
    if (!ticketTypes) return this;
    const ticketTypeIds = ticketTypes.split(',');
    this.filters.type = { $in: ticketTypeIds };
    return this;
  }

  withEpic(ticketEpics: any) {
    if (!ticketEpics) return this;
    const ticketEpicIds = ticketEpics.split(',');
    this.filters.epic = { $in: ticketEpicIds };
    return this;
  }

  withUsers(users: any) {
    if (!users) return this;
    const userIds = users.split(',');
    this.filters.$or = [
      { assign: { $in: userIds.filter((id: string) => id !== 'unassigned') } },
      ...(userIds.includes('unassigned') ? [{ assign: null }] : []),
    ];
    return this;
  }

  withLabels(labels: any) {
    if (!labels) return this;
    const labelIds = labels.split(',');
    this.filters.labels = { $all: labelIds };

    return this;
  }

  withSprint(sprintId: any) {
    if (!sprintId) return this;
    this.filters.sprint = sprintId;
    return this;
  }

  withPriority(priority?: TicketPriority) {
    if (!priority) return this;
    this.filters.priority = priority;
    return this;
  }

  build() {
    return {
      ...this.filters,
    };
  } 
}

// Ids are comma separated, the same format as the Backlog page's query string
export type BacklogSearchFilters = {
  title?: string;
  ticketTypes?: string;
  ticketEpics?: string;
  users?: string;
  labels?: string;
  sprintId?: string;
  priority?: TicketPriority;
};

// A query value can also be an array or an object; only a single string is a filter
const toQueryText = (value: unknown) => (typeof value === 'string' ? value : undefined);

export const findBacklogTickets = async (
  dbConnection: Mongoose,
  tenantsConnection: Mongoose,
  projectId: string,
  { title, ticketTypes, ticketEpics, users, labels, sprintId, priority }: BacklogSearchFilters,
) => {
  const filters = new BacklogFilterBuilder(projectId)
    .withTitle(title)
    .withType(ticketTypes)
    .withEpic(ticketEpics)
    .withUsers(users)
    .withLabels(labels)
    .withSprint(sprintId)
    .withPriority(priority)
    .build();

  const allTickets = await findTickets(
    dbConnection,
    tenantsConnection,
    filters,
  );
  return allTickets;
};

export const fetchBacklogTickets = async (req: Request) => {
  const { projectId } = req.params;
  const { title, ticketTypes, ticketEpics, users, labels } = req.query;

  return findBacklogTickets(req.dbConnection, req.tenantsConnection, projectId, {
    title: toQueryText(title),
    ticketTypes: toQueryText(ticketTypes),
    ticketEpics: toQueryText(ticketEpics),
    users: toQueryText(users),
    labels: toQueryText(labels),
  });
};