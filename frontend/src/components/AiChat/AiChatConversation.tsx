import React, { useEffect, useRef } from 'react';
import { FaRobot } from 'react-icons/fa';
import { AiChatMessage, IAiChatAssistantMessage, TicketDraft } from '../../types/aiChat';
import AiChatWelcome from './AiChatWelcome';
import ErrorMessage from './messages/ErrorMessage';
import OutOfScopeNotice from './messages/OutOfScopeNotice';
import TicketCreatedCard from './messages/TicketCreatedCard';
import TicketDraftCard from './messages/TicketDraftCard';
import TicketSearchResult from './messages/TicketSearchResult';
import styles from './AiChat.module.scss';

export interface IAiChatActions {
  onPickExample: (text: string) => void;
  onRetry: (message: IAiChatAssistantMessage) => void;
  onDraftChange: (message: IAiChatAssistantMessage, draft: TicketDraft) => void;
  onCancelDraft: (message: IAiChatAssistantMessage) => void;
  onCreate: (message: IAiChatAssistantMessage, draft: TicketDraft) => Promise<void>;
}

interface IAiChatConversationProps {
  messages: AiChatMessage[];
  isPending: boolean;
  canCreate: boolean;
  backlogUrl: string;
  actions: IAiChatActions;
}

export default function AiChatConversation({
  messages,
  isPending,
  canCreate,
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
      case 'ticket_draft':
        if (message.createdTicket) {
          return <TicketCreatedCard ticket={message.createdTicket} backlogUrl={backlogUrl} />;
        }
        if (message.isCancelled) {
          return <p className={styles.mutedText}>Cancelled</p>;
        }
        return (
          <TicketDraftCard
            draft={message.editedDraft ?? reply.draft}
            missingFields={reply.missingFields}
            canCreate={canCreate}
            onChange={(draft) => actions.onDraftChange(message, draft)}
            onCancel={() => actions.onCancelDraft(message)}
            onCreate={(draft) => actions.onCreate(message, draft)}
          />
        );
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
