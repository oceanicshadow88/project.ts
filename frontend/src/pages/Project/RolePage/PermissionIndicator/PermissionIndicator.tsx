import React from 'react';
import styles from './PermissionIndicator.module.scss';

interface IPermissionIndicator {
  content: string;
}

function PermissionIndicator({ content }: IPermissionIndicator) {
  return <span className={styles.indicator}>{content}</span>;
}

export default PermissionIndicator;
