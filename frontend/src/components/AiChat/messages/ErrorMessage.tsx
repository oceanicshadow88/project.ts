import React from 'react';
import ButtonV2 from '../../../lib/FormV2/ButtonV2/ButtonV2';
import styles from '../AiChat.module.scss';

interface IErrorMessage {
  onRetry: () => void;
}

export default function ErrorMessage({ onRetry }: IErrorMessage) {
  return (
    <div className={styles.errorCard} data-testid="ai-error">
      <p className={styles.errorText}>Something went wrong. Please try again.</p>
      <ButtonV2
        text="Retry"
        danger
        size="button-xs"
        customStyles={styles.dangerButton}
        onClick={onRetry}
        dataTestId="ai-retry"
      />
    </div>
  );
}
