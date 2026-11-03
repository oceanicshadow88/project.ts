import { ITicketInput } from '../../types';
import {
  AiChatFilter,
  AiChatProject,
  AiChatReply,
  SavedTicket,
  TicketDraft,
  TicketSummary
} from './entity/chat';

const MOCK_DELAY_MS = 800;

const FILTER_RULES: { pattern: RegExp; filter: AiChatFilter }[] = [
  { pattern: /\bmy\b/, filter: { label: 'Assignee', value: 'me' } },
  { pattern: /\bsprint/, filter: { label: 'Sprint', value: 'current' } },
  { pattern: /\bbug/, filter: { label: 'Type', value: 'Bug' } },
  { pattern: /\bhigh\b/, filter: { label: 'Priority', value: 'High' } }
];

let nextTicketNumber = 16;

const wait = () =>
  new Promise((resolve) => {
    setTimeout(resolve, MOCK_DELAY_MS);
  });

const sampleTickets = (projectKey: string): TicketSummary[] => [
  {
    id: 'mock-ticket-12',
    key: `${projectKey}-12`,
    title: 'Fix login redirect loop',
    type: 'Bug',
    status: 'In Progress',
    priority: 'High',
    assignee: 'Alex'
  },
  {
    id: 'mock-ticket-15',
    key: `${projectKey}-15`,
    title: 'Login button does nothing on Safari',
    type: 'Bug',
    status: 'To Do',
    priority: 'Highest',
    assignee: null
  },
  {
    id: 'mock-ticket-09',
    key: `${projectKey}-09`,
    title: 'Update the README for the new setup steps',
    type: 'Task',
    status: 'Done',
    priority: 'Medium',
    assignee: 'Sam'
  }
];

const buildDraft = (message: string, project: AiChatProject): AiChatReply => {
  const lowerCase = message.toLowerCase();
  const typeName = lowerCase.includes('bug') ? 'bug' : 'task';
  const draft: TicketDraft = {
    title: message.slice(message.indexOf(':') + 1).trim(),
    typeId: project.ticketTypes.find((type) => type.name.toLowerCase() === typeName)?.id,
    priority: lowerCase.includes('high') ? 'High' : undefined
  };
  return {
    kind: 'ticket_draft',
    text: 'Here is a draft.',
    draft,
    missingFields: ['Assignee', 'Sprint']
  };
};

const buildSearch = (lowerCase: string, project: AiChatProject): AiChatReply => {
  const tickets = sampleTickets(project.key);
  return {
    kind: 'search_results',
    text: `Found ${tickets.length} tickets.`,
    filters: FILTER_RULES.filter(({ pattern }) => pattern.test(lowerCase)).map(
      ({ filter }) => filter
    ),
    total: tickets.length,
    tickets
  };
};

export async function mockSendAiChat(
  message: string,
  project: AiChatProject
): Promise<AiChatReply> {
  await wait();
  const lowerCase = message.toLowerCase();
  if (lowerCase.includes('fail')) {
    throw new Error('Mock request failed');
  }
  // Checked before 'nothing', so the welcome example "...does nothing on Safari" gives a draft
  if (/^(create|add|new)\b/.test(lowerCase)) {
    return buildDraft(message, project);
  }
  if (lowerCase.includes('nothing')) {
    return {
      kind: 'search_results',
      text: 'No tickets match.',
      filters: [{ label: 'Keyword', value: 'nothing' }],
      total: 0,
      tickets: []
    };
  }
  if (/\b(find|show|search|list)/.test(lowerCase)) {
    return buildSearch(lowerCase, project);
  }
  return { kind: 'out_of_scope', text: "That's outside what I can do right now." };
}

export async function mockCreateTicket(input: ITicketInput): Promise<SavedTicket> {
  await wait();
  if (input.title.toLowerCase().includes('fail')) {
    throw new Error('Mock create failed');
  }
  const ticketNumber = nextTicketNumber;
  nextTicketNumber += 1;
  return { id: `mock-ticket-${ticketNumber}`, ticketNumber };
}
