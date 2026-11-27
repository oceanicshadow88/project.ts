import React, { useState } from 'react';
import { toast } from 'react-toastify';
import ButtonV2 from '../../../../../lib/FormV2/ButtonV2/ButtonV2';
import { createApiToken } from '../../../../../api/serviceAccount/serviceAccount';
import type { ICreatedApiToken } from '../../../../../types/serviceAccount';
import Modal from '../../../../../lib/Modal/Modal';
import DefaultModalHeader from '../../../../../lib/Modal/ModalHeader/DefaultModalHeader/DefaultModalHeader';
import DefaultModalBody from '../../../../../lib/Modal/ModalBody/DefaultModalHeader/DefaultModalBody';
import styles from './CreateApiTokenModal.module.scss';

interface ICreateApiTokenModalProps {
  projectId: string;
  onCreated: (token: ICreatedApiToken) => void;
  onClose: () => void;
}

export default function CreateApiTokenModal({
  projectId,
  onCreated,
  onClose
}: Readonly<ICreateApiTokenModalProps>) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    if (!loading) onClose();
  };

  const handleCreate = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || !name.trim()) event.preventDefault();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading || !projectId || !name.trim()) return;
    setLoading(true);
    try {
      const token = await createApiToken(projectId, name.trim());
      toast.success('API token created', {
        theme: 'colored',
        className: 'primaryColorBackground'
      });
      onCreated(token);
    } catch {
      toast.error('Unable to create an API token. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal classesName={styles.modal}>
      <DefaultModalHeader title="Create API token" onClickClose={handleClose} />
      <DefaultModalBody defaultPadding={false} classesName={styles.body}>
        <form onSubmit={handleSubmit}>
          <label htmlFor="api-token-name">
            <span className={styles.description}>Token name</span>
            <input
              id="api-token-name"
              className={styles.name}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Please enter your token name"
              maxLength={30}
              required
              disabled={loading}
            />
          </label>
          <div className={styles.btnContainer}>
            <ButtonV2
              text="Cancel"
              customStyles={styles.cancelButton}
              onClick={handleClose}
              disabled={loading}
            />
            <ButtonV2
              text={loading ? 'Creating…' : 'Create'}
              btnType="submit"
              fill
              customStyles={styles.createButton}
              disabled={loading || !name.trim()}
              onClick={handleCreate}
            />
          </div>
        </form>
      </DefaultModalBody>
    </Modal>
  );
}
