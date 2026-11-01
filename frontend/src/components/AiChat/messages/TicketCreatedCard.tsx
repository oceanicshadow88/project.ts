import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AiOutlineCheckCircle } from 'react-icons/ai';
import ButtonV2 from '../../../lib/FormV2/ButtonV2/ButtonV2';
import { CreatedTicket } from '../../../api/ai/entity/chat';
import { getCreatedTicketSummary } from '../../../utils/aiChatService';
import styles from '../AiChat.module.scss';

interface ITicketCreatedCard {
  ticket: CreatedTicket;
  backlogUrl: string;
}

export default function TicketCreatedCard({ ticket, backlogUrl }: ITicketCreatedCard) {
  const navigate = useNavigate();
  const summary = getCreatedTicketSummary(ticket);

  return (
    <div className={styles.card} data-testid="ai-created-card">
      <p className={styles.cardTitle}>
        <AiOutlineCheckCircle className={styles.successIcon} aria-hidden="true" />
        Created
        <span className={styles.ticketKey}>{ticket.key}</span>
      </p>
      <p className={styles.ticketTitle}>{ticket.title}</p>
      <p className={styles.mutedText}>{summary}</p>
      <div className={styles.cardActions}>
        <ButtonV2
          text="Go to Backlog"
          size="button-xs"
          customStyles={styles.outlineButton}
          onClick={() => navigate(backlogUrl)}
        />
      </div>
    </div>
  );
}
