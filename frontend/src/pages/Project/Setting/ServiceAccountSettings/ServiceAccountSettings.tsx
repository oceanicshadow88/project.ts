import React, { useContext, useState } from 'react';
import { useParams } from 'react-router-dom';
import { IoIosAdd } from 'react-icons/io';
import ProjectSettingHOC from '../../../../components/HOC/ProjectSettingHOC/ProjectSettingHOC';
import SettingCard from '../../../../components/SettingCard/SettingCard';
import { UserContext } from '../../../../context/UserInfoProvider';
import ButtonV2 from '../../../../lib/FormV2/ButtonV2/ButtonV2';
import type { ICreatedApiToken } from '../../../../types/serviceAccount';
import ApiTokenModal from './ApiTokenModal/ApiTokenModal';
import CreateApiTokenModal from './CreateApiTokenModal/CreateApiTokenModal';
import styles from './ServiceAccountSettings.module.scss';

export default function ServiceAccountSettings() {
  const currentUser = useContext(UserContext);
  const { projectId = '' } = useParams();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createdToken, setCreatedToken] = useState<ICreatedApiToken | null>(null);

  const handleCloseModal = () => setCreatedToken(null);
  const handleCreateModal = () => {
    if (!currentUser.id || !projectId) return;
    setShowCreateModal(true);
  };
  const handleCreateToken = (token: ICreatedApiToken) => {
    setShowCreateModal(false);
    setCreatedToken(token);
  };

  return (
    <ProjectSettingHOC>
      <SettingCard
        title="Service Account"
        action={
          <ButtonV2
            text="Create API token"
            icon={<IoIosAdd className="w-5 h-5" />}
            fill
            customStyles={styles.createButton}
            onClick={handleCreateModal}
          />
        }
      >
        <p className={styles.emptyState}> Create an API token to connect to the MCP server </p>
      </SettingCard>
      {showCreateModal && (
        <CreateApiTokenModal
          projectId={projectId}
          onCreated={handleCreateToken}
          onClose={() => setShowCreateModal(false)}
        />
      )}
      {createdToken && <ApiTokenModal token={createdToken.token} onClose={handleCloseModal} />}
    </ProjectSettingHOC>
  );
}
