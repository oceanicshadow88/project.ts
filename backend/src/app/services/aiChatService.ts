import { Request } from 'express';
import httpStatus from 'http-status';
import type {
  AiChatFilter,
  AiChatReply,
  TicketDraft,
  TicketPriority,
  TicketSummary,
} from '../types/aiChat';
import type {
  ChatOptionNames,
  ChatSearchFields,
  ChatTicketFields,
} from '../types/chatIntentResult';
import { BacklogSearchFilters, findBacklogTickets } from './backlogService';
import { detectChatIntentByClaude } from './claudeService';
import { getProjectAccessStatus } from './projectAccessService';
import { projectDetails } from './projectService';

type AiChatResponse = {
  status: number;
  result?: AiChatReply;
};

type NamedItem = { id: string; name: string };

// What the chat reads from the documents projectDetails returns
type NamedDocument = { id?: string; name?: string };
type SprintDocument = NamedDocument & { status?: string };

// What the chat reads from a ticket that findTickets has populated
type PopulatedTicket = {
  id: string;
  title: string;
  ticketNumber?: number;
  priority: TicketPriority;
  status?: unknown;
  type?: { name?: string } | null;
  assign?: { name?: string } | null;
};

type ProjectOptions = {
  key: string;
  types: NamedItem[];
  members: NamedItem[];
  sprints: (NamedItem & { status: string })[];
  statuses: NamedItem[];
};

const MAX_SEARCH_ROWS = 10;
const PRIORITIES: TicketPriority[] = ['Highest', 'High', 'Medium', 'Low', 'Lowest'];
const OUT_OF_SCOPE_REPLY: AiChatReply = {
  kind: 'out_of_scope',
  text: "That's outside what I can do right now.",
};
// The draft card shows these as "Not in your message: … (optional)"
const OPTIONAL_DRAFT_FIELDS: [string, keyof TicketDraft][] = [
  ['Priority', 'priority'],
  ['Assignee', 'assigneeId'],
  ['Sprint', 'sprintId'],
];

const toNamedItem = ({ id, name }: NamedDocument): NamedItem => ({
  id: String(id),
  name: name ?? '',
});

const isSameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

const findIdsByName = (items: NamedItem[], name: string) =>
  items.filter((item) => isSameName(item.name, name)).map((item) => item.id);

// A draft field is only filled when the name points to exactly one item
const findOnlyId = (ids: string[]) => (ids.length === 1 ? ids[0] : undefined);

const loadProjectOptions = async (req: Request): Promise<ProjectOptions> => {
  const { details, users, ticketTypes, sprints, statuses } = await projectDetails(req);
  return {
    key: details.key,
    types: ticketTypes.map(toNamedItem),
    members: users.map(toNamedItem),
    sprints: sprints
      .filter((sprint: SprintDocument) => sprint.status !== 'completed')
      .map((sprint: SprintDocument) => ({ ...toNamedItem(sprint), status: sprint.status ?? '' })),
    statuses: statuses.map(toNamedItem),
  };
};

const toOptionNames = (options: ProjectOptions): ChatOptionNames => ({
  types: options.types.map((type) => type.name),
  members: options.members.map((member) => member.name),
  sprints: options.sprints.map((sprint) => sprint.name),
});

const findSprintIds = (sprint: string, options: ProjectOptions) => {
  if (isSameName(sprint, 'current')) {
    return options.sprints.filter((item) => item.status === 'active').map((item) => item.id);
  }
  return findIdsByName(options.sprints, sprint);
};

const findAssigneeIds = (req: Request, assignee: string, options: ProjectOptions) => {
  if (isSameName(assignee, 'me')) return [String(req.userId)];
  if (isSameName(assignee, 'unassigned')) return ['unassigned'];
  return findIdsByName(options.members, assignee);
};

// Every filter Claude understood becomes a chip; a name that isn't in this project matches nothing
const toSearchFilters = (req: Request, search: ChatSearchFields, options: ProjectOptions) => {
  const filters: BacklogSearchFilters = {};
  const chips: AiChatFilter[] = [];
  let matchesNothing = false;

  if (search.keyword) {
    filters.title = search.keyword;
    chips.push({ label: 'Keyword', value: search.keyword });
  }
  if (search.type) {
    const typeIds = findIdsByName(options.types, search.type);
    filters.ticketTypes = typeIds.join(',');
    matchesNothing = matchesNothing || typeIds.length === 0;
    chips.push({ label: 'Type', value: search.type });
  }
  if (search.priority) {
    filters.priority = PRIORITIES.find((priority) => priority === search.priority);
    chips.push({ label: 'Priority', value: search.priority });
  }
  if (search.assignee) {
    const userIds = findAssigneeIds(req, search.assignee, options);
    filters.users = userIds.join(',');
    matchesNothing = matchesNothing || userIds.length === 0;
    chips.push({ label: 'Assignee', value: search.assignee });
  }
  if (search.sprint) {
    const [sprintId] = findSprintIds(search.sprint, options);
    filters.sprintId = sprintId;
    matchesNothing = matchesNothing || !sprintId;
    chips.push({ label: 'Sprint', value: search.sprint });
  }
  return { filters, chips, matchesNothing };
};

const toTicketSummary = (ticket: PopulatedTicket, options: ProjectOptions): TicketSummary => ({
  id: ticket.id,
  key: `${options.key}-${ticket.ticketNumber}`,
  title: ticket.title,
  type: ticket.type?.name ?? null,
  status: options.statuses.find((status) => status.id === String(ticket.status))?.name ?? null,
  priority: ticket.priority,
  assignee: ticket.assign?.name ?? null,
});

const toFoundText = (total: number) => {
  if (total === 0) return 'No tickets match.';
  return `Found ${total} ${total === 1 ? 'ticket' : 'tickets'}.`;
};

const toSearchReply = async (
  req: Request,
  search: ChatSearchFields,
  options: ProjectOptions,
): Promise<AiChatReply> => {
  const { filters, chips, matchesNothing } = toSearchFilters(req, search, options);
  const tickets = matchesNothing
    ? []
    : await findBacklogTickets(req.dbConnection, req.tenantsConnection, req.params.id, filters);
  // findTickets returns the error instead of throwing it
  if (!Array.isArray(tickets)) {
    throw new Error('Failed to search tickets');
  }
  return {
    kind: 'search_results',
    text: toFoundText(tickets.length),
    filters: chips,
    total: tickets.length,
    tickets: tickets.slice(0, MAX_SEARCH_ROWS).map((ticket) => toTicketSummary(ticket, options)),
  };
};

const toDraftReply = (
  req: Request,
  ticket: ChatTicketFields,
  options: ProjectOptions,
): AiChatReply => {
  const assigneeIds = ticket.assignee ? findAssigneeIds(req, ticket.assignee, options) : [];
  const draft: TicketDraft = {
    title: ticket.title.trim(),
    typeId: findOnlyId(findIdsByName(options.types, ticket.type)),
    priority: PRIORITIES.find((priority) => priority === ticket.priority),
    assigneeId: findOnlyId(assigneeIds.filter((id) => id !== 'unassigned')),
    sprintId: ticket.sprint ? findOnlyId(findSprintIds(ticket.sprint, options)) : undefined,
    description: ticket.description.trim() || undefined,
  };
  return {
    kind: 'ticket_draft',
    text: 'Here is a draft.',
    draft,
    missingFields: OPTIONAL_DRAFT_FIELDS.filter(([, field]) => !draft[field]).map(([label]) => label),
  };
};

export const replyToChatMessage = async (req: Request): Promise<AiChatResponse> => {
  const accessStatus = await getProjectAccessStatus(req, req.params.id);
  if (accessStatus !== httpStatus.OK) return { status: accessStatus };

  const options = await loadProjectOptions(req);
  const { intent, ticket, search } = await detectChatIntentByClaude(
    req.body.message,
    toOptionNames(options),
  );

  if (intent === 'search') {
    return { status: httpStatus.OK, result: await toSearchReply(req, search, options) };
  }
  if (intent === 'create') {
    return { status: httpStatus.OK, result: toDraftReply(req, ticket, options) };
  }
  return { status: httpStatus.OK, result: OUT_OF_SCOPE_REPLY };
};
