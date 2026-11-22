import React, { useContext } from 'react';
import { FaRobot } from 'react-icons/fa';
import { UserContext } from '../../context/UserInfoProvider';
import styles from './AiChat.module.scss';

const EXAMPLES = [
  'Create a bug: login button does nothing on Safari',
  'Show my tickets in the current sprint',
  'Find high priority bugs'
];

interface IAiChatWelcome {
  onPickExample: (text: string) => void;
}

export default function AiChatWelcome({ onPickExample }: IAiChatWelcome) {
  const { name } = useContext(UserContext);
  const firstName = name?.trim().split(' ')[0];

  return (
    <div className={styles.welcome}>
      <FaRobot className={styles.welcomeIcon} aria-hidden="true" />
      <h3 className={styles.welcomeTitle}>
        {firstName ? `How can I help, ${firstName}?` : 'How can I help?'}
      </h3>
      {EXAMPLES.map((example) => (
        <button
          key={example}
          type="button"
          className={styles.exampleButton}
          onClick={() => onPickExample(example)}
        >
          {example}
        </button>
      ))}
    </div>
  );
}
