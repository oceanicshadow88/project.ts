import React, { useEffect } from 'react';
import { AiOutlineSend } from 'react-icons/ai';
import { canSendMessage } from '../../utils/aiChatService';
import styles from './AiChat.module.scss';

interface IAiChatInput {
  value: string;
  projectName: string;
  isPending: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  onChange: (value: string) => void;
  onSend: () => void;
  onClose: () => void;
}

export default function AiChatInput({
  value,
  projectName,
  isPending,
  inputRef,
  onChange,
  onSend,
  onClose
}: IAiChatInput) {
  const canSend = canSendMessage(value, isPending);

  // Focus when the panel opens and again when a reply arrives
  useEffect(() => {
    if (!isPending) {
      inputRef.current?.focus();
    }
  }, [isPending]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) {
        onSend();
      }
    }
  };

  return (
    <div className={styles.footer}>
      <span className={styles.chip}>Project: {projectName}</span>
      <div className={styles.inputRow}>
        <textarea
          ref={inputRef}
          className={styles.input}
          rows={2}
          value={value}
          placeholder="Ask AI to create or find tickets…"
          disabled={isPending}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Message TechScrum AI"
          data-testid="ai-chat-input"
        />
        <button
          type="button"
          className={styles.sendButton}
          onClick={onSend}
          disabled={!canSend}
          aria-label="Send"
          data-testid="ai-chat-send"
        >
          <AiOutlineSend />
        </button>
      </div>
      <p className={styles.disclaimer}>AI can make mistakes. Verify before creating.</p>
    </div>
  );
}
