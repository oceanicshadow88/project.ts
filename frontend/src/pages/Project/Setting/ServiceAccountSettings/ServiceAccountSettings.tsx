import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { IoIosAdd } from 'react-icons/io';
import ProjectSettingHOC from '../../../../components/HOC/ProjectSettingHOC/ProjectSettingHOC';
import SettingCard from '../../../../components/SettingCard/SettingCard';
import { UserContext } from '../../../../context/UserInfoProvider';
import ButtonV2 from '../../../../lib/FormV2/ButtonV2/ButtonV2';
import { getApiTokens, revokeApiToken } from '../../../../api/serviceAccount/serviceAccount';
import type { IApiTokenRecord, ICreatedApiToken } from '../../../../types/serviceAccount';
import ApiTokenTable from './ApiTokenTable/ApiTokenTable';
import CopyApiTokenModal from './CopyApiTokenModal/CopyApiTokenModal';
import CreateApiTokenModal from './CreateApiTokenModal/CreateApiTokenModal';
import RevokeApiTokenModal from './RevokeApiTokenModal/RevokeApiTokenModal';
import styles from './ServiceAccountSettings.module.scss';

export default function ServiceAccountSettings() {
  const currentUser = useContext(UserContext);
  const { projectId = '' } = useParams();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createdToken, setCreatedToken] = useState<ICreatedApiToken | null>(null);
  const [apiTokens, setApiTokens] = useState<IApiTokenRecord[]>([]);
  const [revokeToken, setRevokeToken] = useState<IApiTokenRecord | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    setApiTokens([]);
    setRevokeToken(null);

    const fetchApiTokens = async () => {
      try {
        const records = await getApiTokens(projectId);
        if (active) setApiTokens(records);
      } catch {
        if (active) toast.error('Unable to load API tokens. Please try again.');
      }
    };

    if (projectId) fetchApiTokens();

    return () => {
      active = false;
    };
  }, [projectId, count]);

  const handleCreateModal = () => {
    if (!currentUser.id || !projectId) return;
    setShowCreateModal(true);
  };
  const handleCreateToken = (token: ICreatedApiToken) => {
    setShowCreateModal(false);
    setCreatedToken(token);
    setCount((value) => value + 1);
  };

  const handleRevokeToken = async () => {
    if (!revokeToken) return false;
    const response = await revokeApiToken(projectId, revokeToken.id);
    if (!response) return false;
    setRevokeToken(null);
    setCount((value) => value + 1);
    return true;
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
        {apiTokens.length === 0 ? (
          <p className={styles.emptyState}>Create an API token to connect to the MCP server</p>
        ) : (
          <ApiTokenTable apiTokens={apiTokens} onRevoke={setRevokeToken} />
        )}
      </SettingCard>
      {showCreateModal && (
        <CreateApiTokenModal
          projectId={projectId}
          onCreated={handleCreateToken}
          onClose={() => setShowCreateModal(false)}
        />
      )}
      {createdToken && (
        <CopyApiTokenModal token={createdToken.token} onClose={() => setCreatedToken(null)} />
      )}
      {revokeToken && (
        <RevokeApiTokenModal
          tokenName={revokeToken.name}
          onClose={() => setRevokeToken(null)}
          onRevoke={handleRevokeToken}
        />
      )}
    </ProjectSettingHOC>
  );
}
