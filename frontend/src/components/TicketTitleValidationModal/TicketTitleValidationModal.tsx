import React, { useEffect, useState } from 'react';
import { validateTicketTitle } from '../../api/ticket/ticket';
import { ITicketTitleValidationResult } from '../../api/ticket/entity/ticket';
import Modal from '../../lib/Modal/Modal';
import DefaultModalHeader from '../../lib/Modal/ModalHeader/DefaultModalHeader/DefaultModalHeader';
import DefaultModalBody from '../../lib/Modal/ModalBody/DefaultModalHeader/DefaultModalBody';
import styles from './TicketTitleValidationModal.module.scss';

interface ITicketTitleValidationModal {
  ticketId: string;
  onAccept: (title: string) => Promise<void>;
  onClose: () => void;
  isDisabled: boolean;
}

export default function TicketTitleValidationModal({
  ticketId,
  onAccept,
  onClose,
  isDisabled
}: Readonly<ITicketTitleValidationModal>) {
  const [result, setResult] = useState<ITicketTitleValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setResult(null);
    setError('');
    validateTicketTitle(ticketId)
      .then(({ data }) => {
        if (active) setResult(data);
      })
      .catch(() => {
        if (active) setError('Unable to validate the ticket title.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [ticketId]);

  const handleAccept = async () => {
    if (!result || saving || isDisabled) return;
    if (result.classification === 'clear') {
      onClose();
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onAccept(result.recommendedTitle.trim());
    } catch {
      setError('Failed to update the ticket title.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal classesName={styles.ticketTitleValidationModal}>
      <DefaultModalHeader title="Improve Ticket Title" onClickClose={onClose} />
      <DefaultModalBody defaultPadding={false} classesName={styles.container}>
        <div className={styles.content}>
          {loading && <output>Improving ticket title...</output>}
          {result && (
            <div className={styles.result}>
              <strong>Current Title</strong>
              <p>{result.title}</p>
              {result.classification !== 'clear' && (
                <>
                  <strong>Recommended Title</strong>
                  <p>{result.recommendedTitle}</p>
                </>
              )}
              <strong>Classification</strong>
              <p>{result.classification}</p>
              {result.classification !== 'clear' && (
                <>
                  <strong>Reason</strong>
                  <p>{result.reason}</p>
                </>
              )}
            </div>
          )}
          {error && <p role="alert">{error}</p>}
        </div>
        <div className={styles.btnContainer}>
          <button type="button" className={styles.cancelBtn} disabled={saving} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.acceptBtn}
            disabled={loading || !result || saving || isDisabled}
            onClick={handleAccept}
          >
            Accept
          </button>
        </div>
      </DefaultModalBody>
    </Modal>
  );
}
