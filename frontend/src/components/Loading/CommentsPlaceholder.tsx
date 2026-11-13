import React from 'react';
import Placeholder from './Placeholder';
import styles from './CommentsPlaceholder.module.scss';

interface ICommentsPlaceholderProps {
  rows?: number;
  dataTestId?: string;
}

/* Placeholder rows in comment section layout
 * Rows: number of placeholders
 */
export default function CommentsPlaceholder({ rows = 2, dataTestId }: ICommentsPlaceholderProps) {
  const rowKeys = Array.from({ length: rows }, (_, index) => `row-${index}`);

  return (
    <div className={styles.list} data-testid={dataTestId}>
      {rowKeys.map((rowKey) => (
        <div key={rowKey} className={styles.item}>
          <div className={styles.header}>
            <Placeholder width={25} height={25} radius="50%" />
            <Placeholder width={100} height={12} />
          </div>
          <Placeholder width="80%" height={12} className={styles.line} />
          <Placeholder width="50%" height={12} className={styles.line} />
        </div>
      ))}
    </div>
  );
}
