// The reply of POST /projects/:id/ai/chat. Same shapes as frontend/src/types/aiChat.ts: change both together
export type TicketPriority = 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest';

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

// The frontend makes the error reply itself when the request fails
export type AiChatReply =
  | { kind: 'ticket_draft'; text: string; draft: TicketDraft; missingFields: string[] }
  | {
    kind: 'search_results';
    text: string;
    filters: AiChatFilter[];
    total: number;
    tickets: TicketSummary[];
  }
  | { kind: 'out_of_scope'; text: string };
