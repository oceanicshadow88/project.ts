import React from 'react';
import styles from './EmailSection.module.scss';
import ButtonGetStart from '../ButtonGetStart/ButtonGetStart';

interface Props {
  onRegisterClick?: () => void;
}

function EmailSection({ onRegisterClick }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.emailSection}>
        <div className={styles.wrapper}>
          <h3 className={styles.header}>
            Save one day every week with
            <br />
            TechScrum&apos;s Board view.
          </h3>
          <div className={styles.form}>
            <ButtonGetStart onClick={onRegisterClick} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailSection;
