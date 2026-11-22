import React, { createContext, Dispatch, SetStateAction, useMemo, useState } from 'react';
import { AiChatConversations } from '../types/aiChat';

interface IAiChatContext {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  activeProjectId: string | null;
  setActiveProjectId: Dispatch<SetStateAction<string | null>>;
  conversations: AiChatConversations;
  setConversations: Dispatch<SetStateAction<AiChatConversations>>;
}

export const AiChatContext = createContext<IAiChatContext>({
  isOpen: false,
  setIsOpen: () => {},
  activeProjectId: null,
  setActiveProjectId: () => {},
  conversations: {},
  setConversations: () => {}
});

interface IAiChatProvider {
  children: React.ReactNode;
}

export default function AiChatProvider({ children }: IAiChatProvider) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<AiChatConversations>({});

  const value = useMemo(
    () => ({
      isOpen,
      setIsOpen,
      activeProjectId,
      setActiveProjectId,
      conversations,
      setConversations
    }),
    [isOpen, activeProjectId, conversations]
  );

  return <AiChatContext.Provider value={value}>{children}</AiChatContext.Provider>;
}
