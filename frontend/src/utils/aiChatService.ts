import { v4 as uuidv4 } from 'uuid';
import { sendAiChat } from '../api/ai/chat';
import {
  AiChatConversations,
  AiChatMessage,
  AiChatProject,
  AiChatReply,
  CreatedTicket,
  DEFAULT_PRIORITY,
  IAiChatAssistantMessage,
  IAiChatConversation,
  TicketDraft,
  TicketSummary
} from '../api/ai/entity/chat';
import config from '../config/config';
import { ISprint, ITypes, IUserInfo } from '../types';
import checkAccess from './helpers';
import { Permission } from './permission';

const MAX_SEARCH_ROWS = 10;
// The draft dropdowns use this value for Unassigned and Backlog
const NO_SELECTION = '';
const ERROR_REPLY: AiChatReply = { kind: 'error', text: 'Something went wrong. Please try again.' };

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

export const fetchReply = (projectId: string, text: string, project: AiChatProject) =>
  sendAiChat(projectId, text, project).catch(() => ERROR_REPLY);

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
