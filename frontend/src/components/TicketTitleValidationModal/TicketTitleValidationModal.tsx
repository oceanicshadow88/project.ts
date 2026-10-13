import React, { useEffect, useState } from 'react';
import { validateTicketTitle } from '../../api/ticket/ticket';
import Modal from '../../lib/Modal/Modal';
import DefaultModalHeader from '../../lib/Modal/ModalHeader/DefaultModalHeader/DefaultModalHeader';
import DefaultModalBody from '../../lib/Modal/ModalBody/DefaultModalHeader/DefaultModalBody';
import styles from './TicketTitleValidationModal.module.scss';

interface ITicketTitleValidationResult {
  title: string;
  classification: 'clear' | 'unclear' | 'ambiguous';
  reason?: string;
}

interface ITicketTitleValidationModal {
  ticketId: string;
  onAccept: () => void;
  onClose: () => void;
}

export default function TicketTitleValidationModal({
  ticketId,
  onAccept,
  onClose
}: Readonly<ITicketTitleValidationModal>) {
  const [result, setResult] = useState<ITicketTitleValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setResult(null);
    setError('');
    const loadValidation = async () => {
      try {
        const { data } = await validateTicketTitle(ticketId);
        if (!data?.classification) {
          throw new Error('Missing ticket title validation result');
        }
        if (active) setResult(data);
      } finally {
        setLoading(false);
      }
    };

    loadValidation().catch(() => {
      setError('Unable to validate the ticket title.');
    });
    return () => {
      active = false;
    };
  }, [ticketId]);

  return (
    <Modal classesName={styles.ticketTitleValidationModal}>
      <DefaultModalHeader title="Ticket Title Validation" onClickClose={onClose} />
      <DefaultModalBody defaultPadding={false} classesName={styles.container}>
        <div className={styles.content}>
          {loading && <output>Validating ticket title...</output>}
          {result && (
            <>
              <p className={styles.ticketTitle}>{result.title}</p>
              <p>
                Classification: <strong>{result.classification}</strong>
              </p>
              {result.classification !== 'clear' && <p>Reason: {result.reason}</p>}
            </>
          )}
          {error && <p role="alert">{error}</p>}
        </div>
        <div className={styles.btnContainer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.acceptBtn}
            disabled={loading || !result}
            onClick={onAccept}
          >
            Accept
          </button>
        </div>
      </DefaultModalBody>
    </Modal>
  );
}
