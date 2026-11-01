import { AiChatConversations, IAiChatConversation } from '../api/ai/entity/chat';
import checkAccess from './helpers';
import { Permission } from './permission';

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
