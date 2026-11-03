import React, { useContext, useState } from 'react';
import ButtonV2 from '../../../lib/FormV2/ButtonV2/ButtonV2';
import Dropdown from '../../../lib/FormV3/Dropdown/Dropdown';
import InputV3 from '../../../lib/FormV3/InputV3/InputV3';
import formStyles from '../../../lib/FormV2/FormV2.module.scss';
import { PriorityIcon } from '../../Form/PriorityBtn/PriorityBtn';
import { ProjectDetailsContext } from '../../../context/ProjectDetailsProvider';
import { TICKET_PRIORITIES, TicketDraft } from '../../../api/ai/entity/chat';
import {
  applyDraftField,
  getDraftFieldValues,
  getDraftOptions,
  isDraftValid
} from '../../../utils/aiChatService';
import { IMinEvent } from '../../../types';
import styles from '../AiChat.module.scss';

const PRIORITY_OPTIONS = TICKET_PRIORITIES.map((priority) => ({
  label: priority,
  value: priority,
  icon: <PriorityIcon p={priority} />
}));

interface ITicketDraftCard {
  draft: TicketDraft;
  missingFields: string[];
  canCreate: boolean;
  onChange: (draft: TicketDraft) => void;
  onCancel: () => void;
  onCreate: (draft: TicketDraft) => Promise<void>;
}

export default function TicketDraftCard({
  draft,
  missingFields,
  canCreate,
  onChange,
  onCancel,
  onCreate
}: ITicketDraftCard) {
  const { details, ticketTypes, users, sprints } = useContext(ProjectDetailsContext);
  const [isCreating, setIsCreating] = useState(false);
  const [hasError, setHasError] = useState(false);
  const options = getDraftOptions(ticketTypes, users, sprints);
  const values = getDraftFieldValues(draft);

  const handleDropdownChange = ({ target }: IMinEvent) => {
    onChange(applyDraftField(draft, target.name, target.value));
  };

  const handleCreate = async () => {
    setIsCreating(true);
    setHasError(false);
    try {
      await onCreate(draft);
    } catch {
      // On success this card is replaced by the created card, so only failure resets it
      setHasError(true);
      setIsCreating(false);
    }
  };

  return (
    <div className={styles.card} data-testid="ai-draft-card">
      <p>Here is a draft. Nothing is created until you click Create.</p>
      <div className={styles.cardHeader}>
        <span className={styles.badge}>NEW TICKET · DRAFT</span>
        <span className={styles.chip}>Project: {details.key}</span>
      </div>
      <fieldset className={styles.fieldset} disabled={isCreating}>
        <InputV3
          label="Title"
          name="title"
          value={draft.title}
          required
          onValueChanged={(e) => onChange({ ...draft, title: e.target.value })}
          dataTestId="ai-draft-title"
        />
        <Dropdown
          label="Type"
          name="typeId"
          value={values.typeId}
          options={options.types}
          required
          placeHolder="Select type"
          onValueChanged={handleDropdownChange}
          listClassName={styles.draftOptions}
          dataTestId="ai-draft-type"
        />
        <Dropdown
          label="Priority"
          name="priority"
          value={values.priority}
          options={PRIORITY_OPTIONS}
          onValueChanged={handleDropdownChange}
          listClassName={styles.draftOptions}
          dataTestId="ai-draft-priority"
        />
        <Dropdown
          label="Assignee"
          name="assigneeId"
          value={values.assigneeId}
          options={options.assignees}
          onValueChanged={handleDropdownChange}
          listClassName={styles.draftOptions}
          dataTestId="ai-draft-assignee"
        />
        <Dropdown
          label="Sprint"
          name="sprintId"
          value={values.sprintId}
          options={options.sprints}
          onValueChanged={handleDropdownChange}
          listClassName={styles.draftOptions}
          dataTestId="ai-draft-sprint"
        />
        {/* TextAreaV2 has an inline min-width of 600px, so it does not fit the 400px panel */}
        <div className={['relative', 'mt-2', formStyles.inputContainer].join(' ')}>
          <span className={formStyles.label}>Description</span>
          <textarea
            aria-label="Description"
            className={[formStyles.input, styles.descriptionInput].join(' ')}
            rows={3}
            value={draft.description ?? ''}
            onChange={(e) => onChange({ ...draft, description: e.target.value })}
            data-testid="ai-draft-description"
          />
        </div>
        {missingFields.length > 0 && (
          <p className={styles.missingFields}>
            Not in your message: {missingFields.join(', ')} (optional)
          </p>
        )}
        {hasError && (
          <p className={styles.errorText}>Couldn&apos;t create the ticket. Please try again.</p>
        )}
        <div className={styles.cardActions}>
          <ButtonV2
            text="Cancel"
            size="button-xs"
            customStyles={styles.outlineButton}
            onClick={onCancel}
            dataTestId="ai-draft-cancel"
          />
          <span title={canCreate ? undefined : "You don't have permission to create tickets"}>
            <ButtonV2
              text={isCreating ? 'Creating…' : 'Create'}
              fill
              size="button-xs"
              loading={isCreating}
              disabled={!canCreate || !isDraftValid(draft)}
              onClick={() => {
                handleCreate();
              }}
              dataTestId="ai-draft-create"
            />
          </span>
        </div>
      </fieldset>
    </div>
  );
}
