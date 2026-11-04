import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import MainMenuV2 from '../../../components/Navigations/MainMenuV2';
import AiChatPanel from '../../../components/AiChat/AiChatPanel';
import { useAiChatProject } from '../../../hooks/useAiChat';
import styles from './DashboardLayout.module.scss';

export default function DashboardLayout() {
  const { projectId = null } = useParams();
  const showAiChat = useAiChatProject(projectId);

  return (
    <div className={styles.container}>
      <MainMenuV2 />
      <div className={[styles.childrenContainer, showAiChat ? styles.withAiChat : ''].join(' ')}>
        <Outlet />
      </div>
      {showAiChat && projectId && <AiChatPanel projectId={projectId} />}
    </div>
  );
}
