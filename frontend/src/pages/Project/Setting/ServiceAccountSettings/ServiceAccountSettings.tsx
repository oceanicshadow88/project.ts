import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { IoIosAdd } from 'react-icons/io';
import ProjectSettingHOC from '../../../../components/HOC/ProjectSettingHOC/ProjectSettingHOC';
import SettingCard from '../../../../components/SettingCard/SettingCard';
import { ModalContext } from '../../../../context/ModalProvider';
import { UserContext } from '../../../../context/UserInfoProvider';
import useApiTokens from '../../../../hooks/useApiTokens';
import ButtonV2 from '../../../../lib/FormV2/ButtonV2/ButtonV2';
import type { IApiTokenRecord, ICreatedApiToken } from '../../../../types/serviceAccount';
import ApiTokenTable from './ApiTokenTable/ApiTokenTable';
import CopyApiTokenModal from './CopyApiTokenModal/CopyApiTokenModal';
import CreateApiTokenModal from './CreateApiTokenModal/CreateApiTokenModal';
import RevokeApiTokenModal from './RevokeApiTokenModal/RevokeApiTokenModal';
import styles from './ServiceAccountSettings.module.scss';

export default function ServiceAccountSettings() {
  const currentUser = useContext(UserContext);
  const { showModal } = useContext(ModalContext);
  const { projectId = '' } = useParams();
  const { apiTokens, refresh, revoke } = useApiTokens(projectId);
  const [tokenToCopy, setTokenToCopy] = useState<ICreatedApiToken | null>(null);

  useEffect(() => {
    if (!tokenToCopy) return;
    showModal('copy-api-token', <CopyApiTokenModal token={tokenToCopy.token} />);
    setTokenToCopy(null);
  }, [tokenToCopy, showModal]);

  const handleTokenCreated = (token: ICreatedApiToken) => {
    setTokenToCopy(token);
    refresh();
  };
  const openCreateModal = () => {
    if (!currentUser.id || !projectId) return;
    showModal(
      'create-api-token',
      <CreateApiTokenModal projectId={projectId} onCreated={handleTokenCreated} />
    );
  };

  const openRevokeModal = (token: IApiTokenRecord) => {
    showModal(
      'revoke-api-token',
      <RevokeApiTokenModal tokenName={token.name} onRevoke={() => revoke(token.id)} />
    );
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
            onClick={openCreateModal}
          />
        }
      >
        {apiTokens.length === 0 ? (
          <p className={styles.emptyState}>Create an API token to connect to the MCP server</p>
        ) : (
          <ApiTokenTable apiTokens={apiTokens} onRevoke={openRevokeModal} />
        )}
      </SettingCard>
    </ProjectSettingHOC>
  );
}
