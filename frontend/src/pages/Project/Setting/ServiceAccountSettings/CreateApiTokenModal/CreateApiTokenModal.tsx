import React, { useState } from 'react';
import { toast } from 'react-toastify';
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
            <span className={`${styles.description} block`}>Token name</span>
            <input
              id="api-token-name"
              className={styles.token}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. MCP token"
              maxLength={30}
              required
              disabled={loading}
            />
          </label>
          <div className={styles.btnContainer}>
            <button
              type="button"
              className={styles.doneButton}
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.copyButton}
              disabled={loading || !name.trim()}
              onClick={handleCreate}
            >
              {loading ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </DefaultModalBody>
    </Modal>
  );
}
