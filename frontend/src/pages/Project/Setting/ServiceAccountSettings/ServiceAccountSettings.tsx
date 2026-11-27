import React, { useContext, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { IoIosAdd } from 'react-icons/io';
import ProjectSettingHOC from '../../../../components/HOC/ProjectSettingHOC/ProjectSettingHOC';
import SettingCard from '../../../../components/SettingCard/SettingCard';
import { UserContext } from '../../../../context/UserInfoProvider';
import ButtonV2 from '../../../../lib/FormV2/ButtonV2/ButtonV2';
import { createApiToken } from '../../../../api/serviceAccount/serviceAccount';
import type { ICreatedApiToken } from '../../../../types/serviceAccount';
import ApiTokenModal from './ApiTokenModal/ApiTokenModal';
import styles from './ServiceAccountSettings.module.scss';

export default function ServiceAccountSettings() {
  const currentUser = useContext(UserContext);
  const { projectId = '' } = useParams();
  const [loading, setLoading] = useState(false);
  const [createdToken, setCreatedToken] = useState<ICreatedApiToken | null>(null);

  const handleCloseModal = () => setCreatedToken(null);
  const handleCreateToken = async () => {
    if (loading || !currentUser.id || !projectId) return;
    setLoading(true);
    try {
      const result = await createApiToken(projectId);
      setCreatedToken(result);
    } catch {
      toast.error('Unable to create an API token. Please try again.');
    } finally {
      setLoading(false);
    }
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
            onClick={handleCreateToken}
          />
        }
      >
        <p className={styles.emptyState}> Create an API token to connect to the MCP server </p>
      </SettingCard>
      {createdToken && <ApiTokenModal token={createdToken.token} onClose={handleCloseModal} />}
    </ProjectSettingHOC>
  );
}
