import React from 'react';
import styles from './TicketDetailCard.module.scss';

interface ITicketDetailCardShellProps {
  children: React.ReactNode;
}

/* Shell which contains ticket background and container, skeleton and card both render these two which contain animations, shell plays ticket open animation only once */
export default function TicketDetailCardShell({ children }: ITicketDetailCardShellProps) {
  return (
    <div className={styles.background}>
      <div className={styles.container}>{children}</div>
    </div>
  );
}
