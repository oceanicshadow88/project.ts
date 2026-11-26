import React from 'react';
import { AiOutlineInfoCircle } from 'react-icons/ai';
import ButtonV2 from '../../../lib/FormV2/ButtonV2/ButtonV2';
import styles from '../AiChat.module.scss';

const CAPABILITIES = [
  { name: 'Create a ticket', example: 'Create a task to update the README' },
  { name: 'Search tickets', example: 'Show my open bugs' }
];

interface IOutOfScopeNotice {
  onPickExample: (text: string) => void;
}

export default function OutOfScopeNotice({ onPickExample }: IOutOfScopeNotice) {
  return (
    <div className={styles.card} data-testid="ai-out-of-scope">
      <p className={styles.cardTitle}>
        <AiOutlineInfoCircle className={styles.infoIcon} aria-hidden="true" />
        That&apos;s outside what I can do right now.
      </p>
      <p>I can currently:</p>
      <ul className={styles.capabilityList}>
        {CAPABILITIES.map((capability) => (
          <li key={capability.name}>
            <strong>{capability.name}</strong> — e.g. “{capability.example}”
          </li>
        ))}
      </ul>
      <div className={styles.cardActions}>
        {CAPABILITIES.map((capability) => (
          <ButtonV2
            key={capability.name}
            text={capability.name}
            size="button-xs"
            customStyles={styles.outlineButton}
            onClick={() => onPickExample(capability.example)}
          />
        ))}
      </div>
    </div>
  );
}
