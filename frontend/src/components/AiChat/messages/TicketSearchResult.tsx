import React from 'react';
import { Link } from 'react-router-dom';
import { PriorityIcon } from '../../Form/PriorityBtn/PriorityBtn';
import { AiChatFilter, TicketSummary } from '../../../api/ai/entity/chat';
import { getShownTickets, getTicketStatusName } from '../../../utils/aiChatService';
import styles from '../AiChat.module.scss';

interface ITicketSearchResult {
  filters: AiChatFilter[];
  total: number;
  tickets: TicketSummary[];
  backlogUrl: string;
}

export default function TicketSearchResult({
  filters,
  total,
  tickets,
  backlogUrl
}: ITicketSearchResult) {
  const chips = (
    <div className={styles.chips}>
      {filters.map((filter) => (
        <span key={`${filter.label}-${filter.value}`} className={styles.chip}>
          {filter.label}: {filter.value}
        </span>
      ))}
    </div>
  );

  if (tickets.length === 0) {
    return (
      <div className={styles.card} data-testid="ai-search-empty">
        <p>No tickets match</p>
        {chips}
        <p className={styles.mutedText}>Try fewer conditions, or check the name.</p>
      </div>
    );
  }

  const shownTickets = getShownTickets(tickets);

  return (
    <div className={styles.card} data-testid="ai-search-results">
      <p>{total === 1 ? 'Found 1 ticket.' : `Found ${total} tickets.`} I searched for:</p>
      {chips}
      <ul className={styles.ticketList}>
        {shownTickets.map((ticket) => (
          <li key={ticket.id} className={styles.ticketRow}>
            <div className={styles.ticketLine}>
              <span className={styles.ticketKey}>{ticket.key}</span>
              <span className={styles.ticketTitle}>{ticket.title}</span>
            </div>
            <div className={styles.ticketLine}>
              <span className={styles.statusPill}>{getTicketStatusName(ticket).toUpperCase()}</span>
              <span className={styles.priority}>
                <PriorityIcon p={ticket.priority} />
                {ticket.priority}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <p className={styles.mutedText}>
        Showing {shownTickets.length} of {total}
      </p>
      <Link to={backlogUrl} className={styles.link}>
        View in Backlog ›
      </Link>
    </div>
  );
}
