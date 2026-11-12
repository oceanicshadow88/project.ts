import React from 'react';
import Placeholder from './Placeholder';
import styles from './BoardColumnsPlaceholder.module.scss';

interface IBoardColumnsPlaceholderProps {
  columns?: number;
  cardsPerColumn?: number;
  dropdowns?: number;
  cardHeight?: number;
  withToolbar?: boolean;
  dataTestId?: string;
}

export default function BoardColumnsPlaceholder({
  columns = 4,
  cardsPerColumn = 3,
  dropdowns = 1,
  cardHeight = 130,
  withToolbar = false,
  dataTestId
}: IBoardColumnsPlaceholderProps) {
  const columnKeys = Array.from({ length: columns }, (_, index) => `column-${index}`);
  const cardKeys = Array.from({ length: cardsPerColumn }, (_, index) => `card-${index}`);
  const dropdownKeys = Array.from({ length: dropdowns }, (_, index) => `column-${index}`);

  return (
    <div data-testid={dataTestId}>
      <div className={styles.pageHeader}>
        {dropdownKeys.map((dropdownKey) => (
          <div key={dropdownKey} className={styles.boardDropdown}>
            <Placeholder width="100%" height={40} radius={4} />
          </div>
        ))}
      </div>
      {withToolbar && (
        <>
          <div className={styles.toolbar}>
            <Placeholder width={500} height={36} radius={4} />
          </div>
        </>
      )}
      <div className={styles.columnsRow}>
        {columnKeys.map((columnKey) => (
          <div key={columnKey} className={styles.columnsContainer}>
            <div className={styles.columnInfo}>
              <Placeholder width={150} height={30} />
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
