import React, { useContext, useState } from 'react';
import { ModalContext } from '../../../../../context/ModalProvider';
import Modal from '../../../../../lib/Modal/Modal';
import DefaultModalHeader from '../../../../../lib/Modal/ModalHeader/DefaultModalHeader/DefaultModalHeader';
import DefaultModalBody from '../../../../../lib/Modal/ModalBody/DefaultModalHeader/DefaultModalBody';
import type { ICreatedApiToken } from '../../../../../types/serviceAccount';
import CreateApiTokenForm from '../CreateApiTokenForm/CreateApiTokenForm';
import styles from './CreateApiTokenModal.module.scss';

interface ICreateApiTokenModalProps {
  onCreate: (name: string) => Promise<ICreatedApiToken | null>;
  onCreated: (token: ICreatedApiToken) => void;
}

export default function CreateApiTokenModal({
  onCreate,
  onCreated
}: Readonly<ICreateApiTokenModalProps>) {
  const { closeModal } = useContext(ModalContext);
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    if (!submitting) closeModal('create-api-token');
  };

  const handleSubmit = async (name: string) => {
    if (submitting) return;
    setSubmitting(true);
    const token = await onCreate(name);
    if (!token) {
      setSubmitting(false);
      return;
    }
    closeModal('create-api-token');
    onCreated(token);
  };

  return (
    <Modal classesName={styles.modal}>
      <DefaultModalHeader title="Create API token" onClickClose={handleClose} />
      <DefaultModalBody defaultPadding={false} classesName={styles.body}>
        <CreateApiTokenForm loading={submitting} onSubmit={handleSubmit} onCancel={handleClose} />
      </DefaultModalBody>
    </Modal>
  );
}
