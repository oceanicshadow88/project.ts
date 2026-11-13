import React from 'react';
import Placeholder from './Placeholder';
import styles from './TicketRowsPlaceholder.module.scss';

interface ITicketRowsPlaceholderProps {
  rows?: number;
  dataTestId?: string;
}

// TicketItem Classes
const ROW_CLASSES =
  'flex justify-between items-center py-1.25 border border-b border-light bg-white text-15';
const DETAIL_CLASSES = 'flex items-center justify-end gap-2 mr-2.5 w-auto';

export default function TicketRowsPlaceholder({
  rows = 3,
  dataTestId
}: ITicketRowsPlaceholderProps) {
  const rowKeys = Array.from({ length: rows }, (_, index) => `row-${index}`);

  return (
    <div data-testid={dataTestId}>
      {rowKeys.map((rowKey) => (
        <div key={rowKey} className={ROW_CLASSES}>
          <div className={`flex items-center ${styles.ticketName}`}>
            <Placeholder width={20} height={20} radius={4} />
            <Placeholder width={60} height={14} />
            <Placeholder width={260} height={14} />
          </div>
          <div className={DETAIL_CLASSES}>
            <Placeholder width={90} height={24} radius={4} />
            <Placeholder width={28} height={28} radius="50%" />
            <div className={styles.menuSpacer} />
          </div>
        </div>
      ))}
    </div>
  );
}
