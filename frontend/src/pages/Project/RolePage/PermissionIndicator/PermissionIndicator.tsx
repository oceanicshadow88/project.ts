import React from 'react';
import styles from './PermissionIndicator.module.scss';

interface IPermissionIndicator {
  content: string;
}

function PermissionIndicator({ content }: Readonly<IPermissionIndicator>) {
  return <span className={styles.indicator}>{content}</span>;
}

export default PermissionIndicator;
