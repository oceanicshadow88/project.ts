import { useContext, useEffect } from 'react';
import { AiChatProject, IAiChatAssistantMessage } from '../api/ai/entity/chat';
import { AiChatContext } from '../context/AiChatProvider';
import { ProjectDetailsContext } from '../context/ProjectDetailsProvider';
import {
  addMessage,
  canSendMessage,
  ConversationUpdate,
  createAssistantMessage,
  createRequestId,
  createUserMessage,
  EMPTY_CONVERSATION,
  fetchReply,
  finishRequest,
  isDemoMode,
  isWaitingForReply,
  removeMessage,
  shouldShowAiChat,
  startRequest,
  updateConversationIn
} from '../utils/aiChatService';

// DashboardLayout tells the chat which project is open, and gets back whether to show the panel
export function useAiChatProject(projectId: string | null) {
  const { isOpen, setIsOpen, setActiveProjectId } = useContext(AiChatContext);

  useEffect(() => {
    setActiveProjectId(projectId);
  }, [projectId]);

  // Outside the project pages the Ask AI button is disabled, so the panel has to close
  useEffect(
    () => () => {
      setActiveProjectId(null);
      setIsOpen(false);
    },
    []
  );

  return shouldShowAiChat(isOpen, projectId);
}

export function useAiChat(projectId: string) {
  const { setIsOpen, conversations, setConversations } = useContext(AiChatContext);
  const { details, ticketTypes, users, sprints } = useContext(ProjectDetailsContext);
  const conversation = conversations[projectId] ?? EMPTY_CONVERSATION;
  const isPending = isWaitingForReply(conversation);
  const project: AiChatProject = { key: details.key, ticketTypes, users, sprints };

  const updateConversation = (update: ConversationUpdate) => {
    setConversations((prev) => updateConversationIn(prev, projectId, update));
  };

  const requestReply = async (text: string) => {
    const requestId = createRequestId();
    updateConversation((current) => startRequest(current, requestId));
    const reply = await fetchReply(projectId, text, project);
    const message = createAssistantMessage(reply, text);
    updateConversation((current) => finishRequest(current, requestId, message));
  };

  // Returns false if nothing was sent, so the input keeps its text
  const send = (input: string) => {
    if (!canSendMessage(input, isPending)) {
      return false;
    }
    const text = input.trim();
    const message = createUserMessage(text);
    updateConversation((current) => addMessage(current, message));
    requestReply(text);
    return true;
  };

  const retry = (failed: IAiChatAssistantMessage) => {
    if (isPending) {
      return;
    }
    updateConversation((current) => removeMessage(current, failed.id));
    requestReply(failed.requestText);
  };

  return {
    messages: conversation.messages,
    isPending,
    isDemoMode: isDemoMode(),
    projectName: details.name,
    send,
    retry,
    startNewChat: () => updateConversation(() => EMPTY_CONVERSATION),
    closePanel: () => setIsOpen(false)
  };
}
