import React from 'react';
import { AiOutlineClose, AiOutlinePlus } from 'react-icons/ai';
import { FaRobot } from 'react-icons/fa';
import { useAiChat } from '../../hooks/useAiChat';
import IconButton from '../Form/Button/IconButton/IconButton';
import styles from './AiChat.module.scss';

interface IAiChatPanel {
  projectId: string;
}

export default function AiChatPanel({ projectId }: IAiChatPanel) {
  const chat = useAiChat(projectId);

  const handleNewChat = () => {
    chat.startNewChat();
  };

  const handleClose = () => {
    chat.closePanel();
  };

  return (
    <aside className={styles.panel} aria-label="TechScrum AI" data-testid="ai-chat-panel">
      <div className={styles.header}>
        <FaRobot className={styles.headerIcon} aria-hidden="true" />
        <h2 className={styles.headerTitle}>TechScrum AI</h2>
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
      <div className={styles.conversation} />
    </aside>
  );
}
