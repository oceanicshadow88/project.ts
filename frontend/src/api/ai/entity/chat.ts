import { ISprint, ITypes, IUserInfo } from '../../../types';

export type TicketPriority = 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest';

export const TICKET_PRIORITIES: TicketPriority[] = ['Highest', 'High', 'Medium', 'Low', 'Lowest'];

export const DEFAULT_PRIORITY: TicketPriority = 'Medium';

export interface TicketDraft {
  title: string;
  typeId?: string;
  priority?: TicketPriority;
  assigneeId?: string;
  sprintId?: string | null;
  description?: string;
}

export interface TicketSummary {
  id: string;
  key: string;
  title: string;
  type: string | null;
  status: string | null;
  priority: TicketPriority;
  assignee: string | null;
}

export interface AiChatFilter {
  label: string;
  value: string;
}

export type AiChatReply =
  | { kind: 'ticket_draft'; text: string; draft: TicketDraft; missingFields: string[] }
  | {
      kind: 'search_results';
      text: string;
      filters: AiChatFilter[];
      total: number;
      tickets: TicketSummary[];
    }
  | { kind: 'out_of_scope'; text: string }
  | { kind: 'error'; text: string };

export interface CreatedTicket {
  id: string;
  key: string;
  title: string;
  type: string;
  priority: TicketPriority;
  assignee: string | null;
  sprint: string | null;
}

// Frontend only: the project data that turns ids into names and builds ticket keys
export interface AiChatProject {
  key: string;
  ticketTypes: ITypes[];
  users: IUserInfo[];
  sprints: ISprint[];
}

// Frontend only: the conversation state kept in AiChatProvider
export interface IAiChatUserMessage {
  id: string;
  role: 'user';
  text: string;
}

export interface IAiChatAssistantMessage {
  id: string;
  role: 'assistant';
  reply: AiChatReply;
  requestText: string;
  editedDraft?: TicketDraft;
  createdTicket?: CreatedTicket;
  isCancelled?: boolean;
}

export type AiChatMessage = IAiChatUserMessage | IAiChatAssistantMessage;

export interface IAiChatConversation {
  messages: AiChatMessage[];
  pendingRequestId: string | null;
}

export type AiChatConversations = Record<string, IAiChatConversation>;
