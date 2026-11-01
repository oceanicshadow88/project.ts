import { v4 as uuidv4 } from 'uuid';
import { sendAiChat } from '../api/ai/chat';
import {
  AiChatConversations,
  AiChatMessage,
  AiChatProject,
  AiChatReply,
  IAiChatConversation
} from '../api/ai/entity/chat';
import config from '../config/config';
import checkAccess from './helpers';
import { Permission } from './permission';

const ERROR_REPLY: AiChatReply = { kind: 'error', text: 'Something went wrong. Please try again.' };

export type ConversationUpdate = (conversation: IAiChatConversation) => IAiChatConversation;

export type AskAiButtonState = 'enabled' | 'disabled' | 'hidden';

export const EMPTY_CONVERSATION: IAiChatConversation = { messages: [], pendingRequestId: null };

export const canUseAiChat = (projectId: string) => checkAccess(Permission.viewTickets, projectId);

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

export const fetchReply = (projectId: string, text: string, project: AiChatProject) =>
  sendAiChat(projectId, text, project).catch(() => ERROR_REPLY);
