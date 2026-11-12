import React from 'react';
import Placeholder from './Placeholder';
import styles from './BoardColumnsPlaceholder.module.scss';

interface IBoardColumnsPlaceholderProps {
  columns?: number;
  cardsPerColumn?: number;
  cardHeight?: number;
  withHeader?: boolean;
  dataTestId?: string;
}

export default function BoardColumnsPlaceholder({
  columns = 4,
  cardsPerColumn = 3,
  cardHeight = 130,
  withHeader = false,
  dataTestId
}: IBoardColumnsPlaceholderProps) {
  const columnKeys = Array.from({ length: columns }, (_, index) => `column-${index}`);
  const cardKeys = Array.from({ length: cardsPerColumn }, (_, index) => `card-${index}`);

  return (
    <div data-testid={dataTestId}>
      {withHeader && (
        <>
          <div className={styles.pageHeader}>
            <div className={styles.sprintField}>
              <Placeholder width="100%" height={40} radius={4} />
            </div>
            <Placeholder width={110} height={36} radius={4} />
          </div>
          <div className={styles.toolbar}>
            <Placeholder width={500} height={36} radius={4} />
          </div>
        </>
      )}
      <div className={styles.columnsRow}>
        {columnKeys.map((columnKey) => (
          <div key={columnKey} className={styles.columnsContainer}>
            <div className={styles.columnInfo}>
              <Placeholder width={150} height={20} />
            </div>
            <div className={styles.column}>
              {cardKeys.map((cardKey) => (
                <Placeholder key={cardKey} height={cardHeight} className={styles.card} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
