import React from 'react';
import styles from './TicketDetailCard.module.scss';

const DETAIL_ROWS = ['type', 'status', 'assignee', 'priority', 'labels', 'dueDate'];
const DESCRIPTION_LINES = ['line1', 'line2', 'line3', 'line4'];

/* Background and container come from TicketDetailCardShell */
export default function TicketDetailCardSkeleton() {
  return (
    <>
      {/* Header including ticket-type icon and ticket id */}
      <header className={styles.ticketHeader}>
        <div className={styles.ticketTypeSection}>
          {/* Skeleton for header icon and id */}
          <span className={`${styles.skeletonBlock} ${styles.skeletonIcon}`} />
          <span className={`${styles.skeletonBlock} ${styles.skeletonLabel}`} />
        </div>
      </header>

      {/* Skeleton for title bar */}
      <div className={styles.ticketTitleContainer}>
        <span className={`${styles.skeletonBlock} ${styles.skeletonTitle}`} />
      </div>

      <div className={styles.contentWrapper}>
        {/* Left column skeleton */}
        <div className={styles.leftColumn}>
          <div className={styles.ticketDetailsSession}>
            {DETAIL_ROWS.map((row) => (
              <span key={row} className={`${styles.skeletonBlock} ${styles.skeletonRow}`} />
            ))}
          </div>
        </div>

        {/* Right column skeleton */}
        <div className={styles.rightColumn}>
          {DESCRIPTION_LINES.map((line) => (
            <span key={line} className={`${styles.skeletonBlock} ${styles.skeletonLine}`} />
          ))}
          <div className={`${styles.skeletonBlock} ${styles.skeletonTabs}`} />
        </div>
      </div>
    </>
  );
}
