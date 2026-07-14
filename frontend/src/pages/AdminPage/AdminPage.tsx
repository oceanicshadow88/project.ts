import React from 'react';
import VerifyPageBackground from '../Auth/VerifyPageV2/VerifyPageBackground/VerifyPageBackground';
import styles from './AdminPage.module.scss';
import AdminMain from './AdminMain/AdminMain';

export default function RegistePager() {
  return (
    <div className={styles.registerContainer}>
      <VerifyPageBackground>
        <AdminMain />
      </VerifyPageBackground>
    </div>
  );
}
