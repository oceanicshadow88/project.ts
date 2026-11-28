import React, { useContext, useEffect } from 'react';
import { ModalContext } from '../../../../../context/ModalProvider';
import useCreateApiToken from '../../../../../hooks/useCreateApiToken';
import Modal from '../../../../../lib/Modal/Modal';
import DefaultModalHeader from '../../../../../lib/Modal/ModalHeader/DefaultModalHeader/DefaultModalHeader';
import DefaultModalBody from '../../../../../lib/Modal/ModalBody/DefaultModalHeader/DefaultModalBody';
import type { ICreatedApiToken } from '../../../../../types/serviceAccount';
import CreateApiTokenForm from '../CreateApiTokenForm/CreateApiTokenForm';
import styles from './CreateApiTokenModal.module.scss';

interface ICreateApiTokenModalProps {
  projectId: string;
  onCreated: (token: ICreatedApiToken) => void;
}

export default function CreateApiTokenModal({
  projectId,
  onCreated
}: Readonly<ICreateApiTokenModalProps>) {
  const { closeModal } = useContext(ModalContext);
  const { create, loading, createdToken } = useCreateApiToken(projectId);

  useEffect(() => {
    if (!createdToken) return;
    closeModal('create-api-token');
    onCreated(createdToken);
  }, [createdToken, closeModal, onCreated]);

  const handleClose = () => {
    if (!loading) closeModal('create-api-token');
  };

  return (
    <Modal classesName={styles.modal}>
      <DefaultModalHeader title="Create API token" onClickClose={handleClose} />
      <DefaultModalBody defaultPadding={false} classesName={styles.body}>
        <CreateApiTokenForm loading={loading} onSubmit={create} onCancel={handleClose} />
      </DefaultModalBody>
    </Modal>
  );
}
