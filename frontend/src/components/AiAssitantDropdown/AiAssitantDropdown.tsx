import React, { useState } from 'react';
import { FaRobot } from 'react-icons/fa';
import type { IMinEvent } from '../../types';
import Dropdown from '../../lib/FormV3/Dropdown/Dropdown';
import TicketTitleValidationModal from '../TicketTitleValidationModal/TicketTitleValidationModal';
import styles from './AiAssitantDropdown.module.scss';

interface IAiAssitantDropdown {
  ticketId: string;
  onUserStory: () => void;
  onTitleValidationDecision: (accepted: boolean) => void;
  isDisabled: boolean;
}

const AI_ASSISTANT_OPTIONS = [
  { label: 'User Story', value: 'user-story' },
  { label: 'Ticket Title Validation', value: 'ticket-title-validation' }
].map((option) => ({
  ...option,
  icon: (
    <span className={styles.triggerIcon} role="img" aria-label="AI Assistant">
      <FaRobot size={12} aria-hidden="true" />
      <span className={styles.tooltip} aria-hidden="true">
        AI Assistant
      </span>
    </span>
  )
}));

export default function AiAssitantDropdown({
  ticketId,
  onUserStory,
  onTitleValidationDecision,
  isDisabled
}: IAiAssitantDropdown) {
  const [selectedAction, setSelectedAction] = useState(AI_ASSISTANT_OPTIONS[0].value);
  const [showValidation, setShowValidation] = useState(false);

  const closeValidation = (accepted: boolean) => {
    onTitleValidationDecision(accepted && !isDisabled);
    setShowValidation(false);
  };

  const handleValueChanged = ({ target }: IMinEvent) => {
    if (target.value === 'user-story') {
      setSelectedAction(target.value);
      onUserStory();
    }
    if (target.value === 'ticket-title-validation') {
      setSelectedAction(target.value);
      setShowValidation(true);
    }
  };

  return (
    <div role="presentation" onClick={(event) => event.stopPropagation()}>
      <Dropdown
        label="AI Assistant"
        name={`ai-assistant-${ticketId}`}
        value={selectedAction}
        options={AI_ASSISTANT_OPTIONS}
        onValueChanged={handleValueChanged}
        hasBorder={false}
        displayIcon
        buttonClassName={styles.triggerButton}
        dataTestId={`ai-assistant-dropdown-${ticketId}`}
      />
      {showValidation && (
        <TicketTitleValidationModal
          ticketId={ticketId}
          onAccept={() => closeValidation(true)}
          onClose={() => closeValidation(false)}
        />
      )}
    </div>
  );
}
