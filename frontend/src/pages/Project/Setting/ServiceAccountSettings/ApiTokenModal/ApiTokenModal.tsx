import React from 'react';
import { toast } from 'react-toastify';
import Modal from '../../../../../lib/Modal/Modal';
import DefaultModalHeader from '../../../../../lib/Modal/ModalHeader/DefaultModalHeader/DefaultModalHeader';
import DefaultModalBody from '../../../../../lib/Modal/ModalBody/DefaultModalHeader/DefaultModalBody';
import styles from './ApiTokenModal.module.scss';

interface IApiTokenModalProps {
  token: string;
  onClose: () => void;
}

export default function ApiTokenModal({ token, onClose }: Readonly<IApiTokenModalProps>) {
  const onClickCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(token);
      toast.success('API Token Copied', {
        theme: 'colored',
        className: 'primaryColorBackground'
      });
    } catch {
      toast.error('Unable to copy API token. Please try again.');
    }
  };

  return (
    <Modal classesName={styles.modal}>
      <DefaultModalHeader title="Your API token" onClickClose={onClose} />
      <DefaultModalBody defaultPadding={false} classesName={styles.body}>
        <p id="api-token-description" className={styles.description}>
          Please copy your API token now. You won&apos;t be able to see it again.
        </p>
        <input type="text" aria-label="API token" className={styles.token} value={token} />
        <div className={styles.btnContainer}>
          <button type="button" className={styles.doneButton} onClick={onClose}>
            Done
          </button>
          <button type="button" className={styles.copyButton} onClick={onClickCopyToken}>
            Copy
          </button>
        </div>
      </DefaultModalBody>
    </Modal>
  );
}
