import React from 'react';
import Placeholder from './Placeholder';
import styles from './SettingRowsPlaceholder.module.scss';

interface ISettingRowsPlaceholderProps {
  rows?: number;
}

/* Project settings list configuration for placeholder skeletons
 * Rows: number of placeholder rows
 */
export default function SettingRowsPlaceholder({ rows = 3 }: ISettingRowsPlaceholderProps) {
  const rowKeys = Array.from({ length: rows }, (_, index) => `row-${index}`);

  return (
    <div className={styles.list}>
      {rowKeys.map((rowKey) => (
        <div key={rowKey} className={styles.item}>
          <div className={styles.preview}>
            <Placeholder width={60} height={60} radius={16} />
          </div>
          <div className={styles.controls}>
            <Placeholder width="25%" height={20} />
            <Placeholder width="35%" height={20} />
            <Placeholder width="80%" height={24} radius={4} />
          </div>
        </div>
      ))}
    </div>
  );
}
