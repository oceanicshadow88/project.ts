import React from 'react';
import Placeholder from '../../Loading/Placeholder';
import styles from './TicketTitleValidationPlaceholder.module.scss';

const RESULT_PLACEHOLDERS: {
  id: string;
  labelWidth: number;
  valueLines: { id: string; width: string | number }[];
}[] = [
  { id: 'currentTitle', labelWidth: 110, valueLines: [{ id: 'line1', width: '70%' }] },
  { id: 'recommendedTitle', labelWidth: 160, valueLines: [{ id: 'line1', width: '80%' }] },
  { id: 'classification', labelWidth: 115, valueLines: [{ id: 'line1', width: 80 }] },
  {
    id: 'reason',
    labelWidth: 60,
    valueLines: [
      { id: 'line1', width: '100%' },
      { id: 'line2', width: '100%' },
      { id: 'line3', width: '100%' },
      { id: 'line4', width: '60%' }
    ]
  }
];

export default function TicketTitleValidationPlaceholder() {
  return (
    <div className={styles.container}>
      {RESULT_PLACEHOLDERS.map((section) => (
        <div key={section.id}>
          <Placeholder
            width={section.labelWidth}
            height="1.5em"
            className={styles.placeholderLabel}
          />
          <p>
            {section.valueLines.map((line) => (
              <Placeholder
                key={line.id}
                width={line.width}
                height="1em"
                className={styles.placeholderLine}
              />
            ))}
          </p>
        </div>
      ))}
    </div>
  );
}
