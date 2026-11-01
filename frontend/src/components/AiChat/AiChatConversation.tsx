import React, { useEffect, useRef } from 'react';
import { FaRobot } from 'react-icons/fa';
import { AiChatMessage, IAiChatAssistantMessage } from '../../api/ai/entity/chat';
import AiChatWelcome from './AiChatWelcome';
import ErrorMessage from './messages/ErrorMessage';
import OutOfScopeNotice from './messages/OutOfScopeNotice';
import TicketSearchResult from './messages/TicketSearchResult';
import styles from './AiChat.module.scss';

export interface IAiChatActions {
  onPickExample: (text: string) => void;
  onRetry: (message: IAiChatAssistantMessage) => void;
}

interface IAiChatConversationProps {
  messages: AiChatMessage[];
  isPending: boolean;
  backlogUrl: string;
  actions: IAiChatActions;
}

export default function AiChatConversation({
  messages,
  isPending,
  backlogUrl,
  actions
}: IAiChatConversationProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages.length, isPending]);

  const renderReply = (message: IAiChatAssistantMessage) => {
    const { reply } = message;
    switch (reply.kind) {
      case 'search_results':
        return (
          <TicketSearchResult
            filters={reply.filters}
            total={reply.total}
            tickets={reply.tickets}
            backlogUrl={backlogUrl}
          />
        );
      case 'out_of_scope':
        return <OutOfScopeNotice onPickExample={actions.onPickExample} />;
      default:
        // 'error', an unknown kind, or a failed request
        return <ErrorMessage onRetry={() => actions.onRetry(message)} />;
    }
  };

  return (
    <div className={styles.conversation} aria-live="polite" data-testid="ai-chat-conversation">
      {messages.length === 0 && !isPending && (
        <AiChatWelcome onPickExample={actions.onPickExample} />
      )}
      {messages.map((message) =>
        message.role === 'user' ? (
          <p key={message.id} className={styles.userMessage} data-testid="ai-user-message">
            {message.text}
          </p>
        ) : (
          <div key={message.id} className={styles.assistantMessage}>
            {renderReply(message)}
          </div>
        )
      )}
      {isPending && (
        <div className={styles.thinking} data-testid="ai-thinking">
          <FaRobot aria-hidden="true" />
          Thinking…
          <span className={styles.dots} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
