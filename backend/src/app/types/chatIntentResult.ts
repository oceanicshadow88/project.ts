export type ChatIntent = 'create' | 'search' | 'other';

// Every field is a name or plain text from the message; "" means the user didn't mention it
export type ChatTicketFields = {
  title: string;
  type: string;
  priority: string;
  assignee: string;
  sprint: string;
  description: string;
};

export type ChatSearchFields = {
  keyword: string;
  type: string;
  priority: string;
  assignee: string;
  sprint: string;
};

export type ChatIntentResult = {
  intent: ChatIntent;
  ticket: ChatTicketFields;
  search: ChatSearchFields;
};

// Sent to Claude with the message, so it picks names that exist in this project
export type ChatOptionNames = {
  types: string[];
  members: string[];
  sprints: string[];
};
