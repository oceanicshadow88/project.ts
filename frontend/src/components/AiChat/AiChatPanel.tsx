import React, { useRef, useState } from 'react';
import { AiOutlineClose, AiOutlinePlus } from 'react-icons/ai';
import { FaRobot } from 'react-icons/fa';
import { useAiChat } from '../../hooks/useAiChat';
import IconButton from '../Form/Button/IconButton/IconButton';
import AiChatConversation, { IAiChatActions } from './AiChatConversation';
import AiChatInput from './AiChatInput';
import styles from './AiChat.module.scss';

interface IAiChatPanel {
  projectId: string;
}

export default function AiChatPanel({ projectId }: IAiChatPanel) {
  const chat = useAiChat(projectId);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (chat.send(input)) {
      setInput('');
    }
  };

  const handlePickExample = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
  };

  const handleNewChat = () => {
    chat.startNewChat();
    setInput('');
    inputRef.current?.focus();
  };

  const handleClose = () => {
    chat.closePanel();
  };

  const actions: IAiChatActions = {
    onPickExample: handlePickExample,
    onRetry: chat.retry
  };

  return (
    <aside className={styles.panel} aria-label="TechScrum AI" data-testid="ai-chat-panel">
      <div className={styles.header}>
        <FaRobot className={styles.headerIcon} aria-hidden="true" />
        <h2 className={styles.headerTitle}>TechScrum AI</h2>
        {chat.isDemoMode && <span className={styles.demoTag}>Demo data</span>}
        <div className={styles.headerActions}>
          <IconButton
            icon={<AiOutlinePlus aria-label="New chat" />}
            tooltip="New chat"
            overrideStyle={styles.headerButton}
            onClick={handleNewChat}
          />
          <IconButton
            icon={<AiOutlineClose aria-label="Close" />}
            tooltip="Close"
            overrideStyle={styles.headerButton}
            onClick={handleClose}
          />
        </div>
      </div>
      <AiChatConversation
        messages={chat.messages}
        isPending={chat.isPending}
        backlogUrl={`/projects/${projectId}/backlog`}
        actions={actions}
      />
      <AiChatInput
        value={input}
        projectName={chat.projectName}
        isPending={chat.isPending}
        inputRef={inputRef}
        onChange={setInput}
        onSend={handleSend}
        onClose={handleClose}
      />
    </aside>
  );
}
