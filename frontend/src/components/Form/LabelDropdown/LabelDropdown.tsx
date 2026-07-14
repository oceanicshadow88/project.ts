import React, { useRef, useEffect } from 'react';
import styles from './LabelDropdown.module.scss';

interface ILabel {
  id: string;
  name: string;
}

interface ILabelDropdownProps {
  readonly isOpen: boolean;
  readonly searchTerm: string;
  readonly setSearchTerm: (value: string) => void;
  readonly filteredLabels: ILabel[];
  readonly loading: boolean;
  readonly canCreateNewLabel: boolean;
  readonly handleLabelClick: (labelId: string) => void;
  readonly handleCreateNewLabel: () => void;
}

function LabelDropdown({
  isOpen,
  searchTerm,
  setSearchTerm,
  filteredLabels,
  loading,
  canCreateNewLabel,
  handleLabelClick,
  handleCreateNewLabel
}: ILabelDropdownProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.dropdown}>
      <div className={styles.dropdownHeader}>Select Label</div>
      <div className={styles.searchContainer}>
        <input
          ref={inputRef}
          type="text"
          className={styles.searchInput}
          placeholder="Search labels..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className={styles.labelList}>
        {loading && <div className={styles.loadingItem}>Loading...</div>}
        {!loading && filteredLabels.length === 0 && !canCreateNewLabel && (
          <div className={styles.emptyItem}>
            {searchTerm ? 'No matching labels found' : 'No labels available'}
          </div>
        )}
        {!loading &&
          filteredLabels.length > 0 &&
          filteredLabels.map((label) => (
            <button
              key={label.id}
              className={styles.labelItem}
              onClick={() => handleLabelClick(label.id)}
              type="button"
            >
              {label.name}
            </button>
          ))}
        {!loading && canCreateNewLabel && (
          <>
            {filteredLabels.length > 0 && <div className={styles.divider} />}
            <button
              type="button"
              className={styles.createLabelButton}
              onClick={handleCreateNewLabel}
            >
              {searchTerm} (New Label)
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default LabelDropdown;
