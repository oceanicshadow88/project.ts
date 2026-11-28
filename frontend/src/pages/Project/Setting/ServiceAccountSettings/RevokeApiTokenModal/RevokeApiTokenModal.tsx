import React, { useContext, useState } from 'react';
import { ModalContext } from '../../../../../context/ModalProvider';
import Modal from '../../../../../lib/Modal/Modal';
import DefaultModalHeader from '../../../../../lib/Modal/ModalHeader/DefaultModalHeader/DefaultModalHeader';
import DefaultModalBody from '../../../../../lib/Modal/ModalBody/DefaultModalHeader/DefaultModalBody';
import styles from './RevokeApiTokenModal.module.scss';
import ButtonV2 from '../../../../../lib/FormV2/ButtonV2/ButtonV2';

interface IRevokeApiTokenModalProps {
  tokenName: string;
  onRevoke: () => Promise<boolean>;
}

export default function RevokeApiTokenModal({
  tokenName,
  onRevoke
}: Readonly<IRevokeApiTokenModalProps>) {
  const { closeModal } = useContext(ModalContext);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    if (!loading) closeModal('revoke-api-token');
  };

  const handleRevoke = async () => {
    if (loading) return;
    setLoading(true);
    const success = await onRevoke();
    if (!success) {
      setLoading(false);
      return;
    }
    closeModal('revoke-api-token');
  };

  return (
    <Modal classesName={styles.modal}>
      <DefaultModalHeader title="Revoke API token" onClickClose={handleClose} />
      <DefaultModalBody defaultPadding={false} classesName={styles.body}>
        <div id="revoke-api-token-message" className={styles.message}>
          <p>Are you sure you want to revoke API token &quot;{tokenName}&quot;?</p>
          <p>
            This token will be revoked immediately. The MCP server will reject requests using it.
          </p>
        </div>
        <div className={styles.btnContainer}>
          <ButtonV2
            text="Cancel"
            customStyles={styles.cancelButton}
            onClick={handleClose}
            disabled={loading}
          />
          <ButtonV2
            text={loading ? 'Revoking…' : 'Revoke'}
            danger
            customStyles={styles.revokeButton}
            onClick={handleRevoke}
            disabled={loading}
          />
        </div>
      </DefaultModalBody>
    </Modal>
  );
}
