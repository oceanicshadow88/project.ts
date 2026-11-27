import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Modal from '../../../../../lib/Modal/Modal';
import DefaultModalHeader from '../../../../../lib/Modal/ModalHeader/DefaultModalHeader/DefaultModalHeader';
import DefaultModalBody from '../../../../../lib/Modal/ModalBody/DefaultModalHeader/DefaultModalBody';
import styles from './RevokeApiTokenModal.module.scss';
import ButtonV2 from '../../../../../lib/FormV2/ButtonV2/ButtonV2';

interface IRevokeApiTokenModalProps {
  tokenName: string;
  onClose: () => void;
  onRevoke: () => Promise<boolean>;
}

export default function RevokeApiTokenModal({
  tokenName,
  onClose,
  onRevoke
}: Readonly<IRevokeApiTokenModalProps>) {
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    if (!loading) onClose();
  };

  const handleRevoke = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onRevoke();
      toast.success('API token revoked', {
        theme: 'colored',
        className: 'primaryColorBackground'
      });
    } catch {
      toast.error('Unable to revoke the API token. Please try again.');
    } finally {
      setLoading(false);
    }
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
