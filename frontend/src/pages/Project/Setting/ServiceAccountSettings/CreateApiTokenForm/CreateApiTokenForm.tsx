import React, { useState } from 'react';
import ButtonV2 from '../../../../../lib/FormV2/ButtonV2/ButtonV2';
import styles from './CreateApiTokenForm.module.scss';

interface ICreateApiTokenFormProps {
  loading: boolean;
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
}

export default function CreateApiTokenForm({
  loading,
  onSubmit,
  onCancel
}: Readonly<ICreateApiTokenFormProps>) {
  const [name, setName] = useState('');
  const tokenName = name.trim();
  const isSubmitDisabled = loading || tokenName === '';

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitDisabled) return;
    onSubmit(tokenName);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="api-token-name">
        <span className={styles.description}>Token name</span>
        <input
          id="api-token-name"
          className={styles.name}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Please enter your token name"
          maxLength={30}
          required
          disabled={loading}
        />
      </label>
      <div className={styles.btnContainer}>
        <ButtonV2
          text="Cancel"
          customStyles={styles.cancelButton}
          onClick={onCancel}
          disabled={loading}
        />
        <ButtonV2
          text={loading ? 'Creating…' : 'Create'}
          btnType="submit"
          onClick={() => {}}
          fill
          customStyles={styles.createButton}
          disabled={isSubmitDisabled}
        />
      </div>
    </form>
  );
}
