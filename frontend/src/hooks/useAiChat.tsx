import { useContext, useEffect } from 'react';
import { AiChatContext } from '../context/AiChatProvider';
import { EMPTY_CONVERSATION, shouldShowAiChat, updateConversationIn } from '../utils/aiChatService';

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
  const { setIsOpen, setConversations } = useContext(AiChatContext);

  return {
    startNewChat: () => {
      setConversations((prev) => updateConversationIn(prev, projectId, () => EMPTY_CONVERSATION));
    },
    closePanel: () => setIsOpen(false)
  };
}
