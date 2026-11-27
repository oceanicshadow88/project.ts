import { body } from 'express-validator';
import type {
  ChatIntentResult,
  ChatSearchFields,
  ChatTicketFields,
} from '../types/chatIntentResult';

const PRIORITIES = ['', 'Highest', 'High', 'Medium', 'Low', 'Lowest'];
const TICKET_FIELDS = ['title', 'type', 'priority', 'assignee', 'sprint', 'description'];
const SEARCH_FIELDS = ['keyword', 'type', 'priority', 'assignee', 'sprint'];

// ticket and search may be left out, for example when the intent is "other"
const validations = [
  body().isObject(),
  body('intent').isIn(['create', 'search', 'other']),
  body('ticket').optional().isObject(),
  body('search').optional().isObject(),
  ...TICKET_FIELDS.map((field) => body(`ticket.${field}`).optional().isString()),
  ...SEARCH_FIELDS.map((field) => body(`search.${field}`).optional().isString()),
  body('ticket.priority').optional().isIn(PRIORITIES),
  body('search.priority').optional().isIn(PRIORITIES),
];

const toFields = (fields: string[], value?: Record<string, string>) =>
  Object.fromEntries(fields.map((field) => [field, value?.[field] ?? '']));

export const validateChatIntentResult = async (value: unknown): Promise<ChatIntentResult> => {
  const request = { body: value };
  for (const validation of validations) {
    const result = await validation.run(request);

    if (!result.isEmpty()) {
      throw new Error('Invalid chat intent result');
    }
  }
  const result = value as Partial<ChatIntentResult>;
  return {
    intent: result.intent as ChatIntentResult['intent'],
    ticket: toFields(TICKET_FIELDS, result.ticket) as ChatTicketFields,
    search: toFields(SEARCH_FIELDS, result.search) as ChatSearchFields,
  };
};
