import React from 'react';
import styles from './ShowCompletedSprintsCheckbox.module.scss';

interface ShowCompletedSprintsCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  dataTestId?: string;
}

export default function ShowCompletedSprintsCheckbox(props: ShowCompletedSprintsCheckboxProps) {
  const { checked, onChange, dataTestId } = props;
  const inputId = React.useId();

  return (
    <label className={styles.label} htmlFor={inputId} data-testid={dataTestId}>
      <input
        id={inputId}
        type="checkbox"
        className={styles.checkbox}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className={styles.text}>Show completed sprints</span>
    </label>
  );
}
