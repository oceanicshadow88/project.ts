import { v4 as uuidv4 } from 'uuid';
import { createTicketFromDraft, sendAiChat } from '../api/ai/chat';
import {
  AiChatConversations,
  AiChatMessage,
  AiChatProject,
  AiChatReply,
  CreatedTicket,
  DEFAULT_PRIORITY,
  IAiChatAssistantMessage,
  IAiChatConversation,
  SavedTicket,
  TicketDraft,
  TicketSummary
} from '../api/ai/entity/chat';
import config from '../config/config';
import { ISprint, ITicketInput, ITypes, IUserInfo } from '../types';
import checkAccess from './helpers';
import { Permission } from './permission';

const MAX_SEARCH_ROWS = 10;
// The draft dropdowns use this value for Unassigned and Backlog
const NO_SELECTION = '';
const ERROR_REPLY: AiChatReply = { kind: 'error', text: 'Something went wrong. Please try again.' };
const REPLY_KINDS: AiChatReply['kind'][] = [
  'ticket_draft',
  'search_results',
  'out_of_scope',
  'error'
];

export type ConversationUpdate = (conversation: IAiChatConversation) => IAiChatConversation;

export type AssistantMessagePatch = Partial<Omit<IAiChatAssistantMessage, 'id' | 'role'>>;

export type AskAiButtonState = 'enabled' | 'disabled' | 'hidden';

export const EMPTY_CONVERSATION: IAiChatConversation = { messages: [], pendingRequestId: null };

export const canUseAiChat = (projectId: string) => checkAccess(Permission.viewTickets, projectId);

export const canCreateTickets = (projectId: string) =>
  checkAccess(Permission.CreateTickets, projectId);

export const getAskAiButtonState = (activeProjectId: string | null): AskAiButtonState => {
  if (!activeProjectId) {
    return 'disabled';
  }
  return canUseAiChat(activeProjectId) ? 'enabled' : 'hidden';
};

export const shouldShowAiChat = (isOpen: boolean, projectId: string | null) =>
  isOpen && projectId !== null && canUseAiChat(projectId);

export const updateConversationIn = (
  conversations: AiChatConversations,
  projectId: string,
  update: ConversationUpdate
): AiChatConversations => ({
  ...conversations,
  [projectId]: update(conversations[projectId] ?? EMPTY_CONVERSATION)
});

export const isDemoMode = () => config.aiChatMock;

export const isWaitingForReply = (conversation: IAiChatConversation) =>
  conversation.pendingRequestId !== null;

export const canSendMessage = (input: string, isPending: boolean) =>
  input.trim() !== '' && !isPending;

export const createRequestId = () => uuidv4();

export const createUserMessage = (text: string): AiChatMessage => ({
  id: uuidv4(),
  role: 'user',
  text
});

export const createAssistantMessage = (reply: AiChatReply, requestText: string): AiChatMessage => ({
  id: uuidv4(),
  role: 'assistant',
  reply,
  requestText
});

export const addMessage = (
  conversation: IAiChatConversation,
  message: AiChatMessage
): IAiChatConversation => ({
  ...conversation,
  messages: [...conversation.messages, message]
});

export const removeMessage = (
  conversation: IAiChatConversation,
  id: string
): IAiChatConversation => ({
  ...conversation,
  messages: conversation.messages.filter((message) => message.id !== id)
});

export const startRequest = (
  conversation: IAiChatConversation,
  requestId: string
): IAiChatConversation => ({ ...conversation, pendingRequestId: requestId });

// New chat clears the wait, so a late reply is dropped
export const finishRequest = (
  conversation: IAiChatConversation,
  requestId: string,
  message: AiChatMessage
): IAiChatConversation =>
  conversation.pendingRequestId === requestId
    ? { messages: [...conversation.messages, message], pendingRequestId: null }
    : conversation;

export const updateAssistantMessage = (
  conversation: IAiChatConversation,
  id: string,
  patch: AssistantMessagePatch
): IAiChatConversation => ({
  ...conversation,
  messages: conversation.messages.map((message) =>
    message.id === id && message.role === 'assistant' ? { ...message, ...patch } : message
  )
});

// A missing reply or an unknown kind shows the error card, like a failed request
const toKnownReply = (reply: AiChatReply | undefined): AiChatReply =>
  reply && REPLY_KINDS.includes(reply.kind) ? reply : ERROR_REPLY;

export const fetchReply = (projectId: string, text: string, project: AiChatProject) =>
  sendAiChat(projectId, { message: text }, project)
    .then(toKnownReply)
    .catch(() => ERROR_REPLY);

export const getShownTickets = (tickets: TicketSummary[]) => tickets.slice(0, MAX_SEARCH_ROWS);

export const getTicketStatusName = (ticket: TicketSummary) => ticket.status ?? 'Backlog';

export const isDraftValid = (draft: TicketDraft) =>
  draft.title.trim() !== '' && Boolean(draft.typeId);

export const getDraftOptions = (ticketTypes: ITypes[], users: IUserInfo[], sprints: ISprint[]) => ({
  types: ticketTypes.map((type) => ({ label: type.name, value: type.id })),
  assignees: [
    { label: 'Unassigned', value: NO_SELECTION },
    ...users.map((user) => ({ label: user.name, value: user.id }))
  ],
  sprints: [
    { label: 'Backlog', value: NO_SELECTION },
    ...sprints.map((sprint) => ({ label: sprint.name, value: sprint.id }))
  ]
});

export const getDraftFieldValues = (draft: TicketDraft) => ({
  typeId: draft.typeId ?? NO_SELECTION,
  priority: draft.priority ?? DEFAULT_PRIORITY,
  assigneeId: draft.assigneeId ?? NO_SELECTION,
  sprintId: draft.sprintId ?? NO_SELECTION
});

export const applyDraftField = (
  draft: TicketDraft,
  name: string,
  value: string | null
): TicketDraft => ({ ...draft, [name]: value || undefined });

export const getCreatedTicketSummary = (ticket: CreatedTicket) =>
  [ticket.type, ticket.priority, ticket.assignee ?? 'Unassigned', ticket.sprint ?? 'Backlog'].join(
    ' · '
  );

const findName = (items: { id?: string; name?: string }[], id?: string | null) =>
  id ? items.find((item) => item.id === id)?.name ?? null : null;

// The body for POST /tickets
export const toTicketInput = (draft: TicketDraft, projectId: string): ITicketInput => ({
  title: draft.title.trim(),
  type: draft.typeId,
  priority: draft.priority ?? DEFAULT_PRIORITY,
  assign: draft.assigneeId,
  sprintId: draft.sprintId ?? null,
  description: draft.description,
  projectId
});

export const toCreatedTicket = (
  draft: TicketDraft,
  saved: SavedTicket,
  project: AiChatProject
): CreatedTicket => ({
  id: saved.id,
  key: `${project.key}-${saved.ticketNumber}`,
  title: draft.title.trim(),
  type: findName(project.ticketTypes, draft.typeId) ?? '',
  priority: draft.priority ?? DEFAULT_PRIORITY,
  assignee: findName(project.users, draft.assigneeId),
  sprint: findName(project.sprints, draft.sprintId)
});

export const createDraftTicket = async (
  projectId: string,
  draft: TicketDraft,
  project: AiChatProject
): Promise<CreatedTicket> => {
  const saved = await createTicketFromDraft(toTicketInput(draft, projectId));
  return toCreatedTicket(draft, saved, project);
};
