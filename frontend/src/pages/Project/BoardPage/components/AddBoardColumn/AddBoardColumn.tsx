import React, { useState } from 'react';
import styles from './AddBoardColumn.module.scss';

interface IAddBoardColumn {
  onAdd: (name: string) => Promise<void>;
}

export default function AddBoardColumn({ onAdd }: Readonly<IAddBoardColumn>) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');

  const close = () => {
    setIsOpen(false);
    setName('');
  };

  const submit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onAdd(trimmedName)
      .then(close)
      .catch(() => {
        // keep the input open so the user can retry
      });
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        className={styles.addBtn}
        onClick={() => setIsOpen(true)}
        aria-label="Add column"
      >
        +
      </button>
    );
  }

  return (
    <div className={styles.form}>
      <input
        className={styles.input}
        value={name}
        maxLength={30}
        placeholder="Column name"
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') close();
        }}
      />
      <div className={styles.actions}>
        <button type="button" className={styles.actionBtn} onClick={submit} aria-label="Confirm">
          ✓
        </button>
        <button type="button" className={styles.actionBtn} onClick={close} aria-label="Cancel">
          ✕
        </button>
      </div>
    </div>
  );
}
