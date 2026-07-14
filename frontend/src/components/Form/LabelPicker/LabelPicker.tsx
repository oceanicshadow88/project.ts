import React, { useEffect, useRef, useState } from 'react';
import { MdLabel } from 'react-icons/md';
import { ILabelData } from '../../../types';
import { createLabel, showLabel } from '../../../api/label/label';
import LabelDropdown from '../LabelDropdown/LabelDropdown';
import styles from './LabelPicker.module.scss';

interface ILabelPickerProps {
  readonly projectId: string;
  readonly ticketId: string;
  readonly onLabelClick: (labelId: string) => void;
  readonly isDisabled?: boolean;
  readonly currentLabels?: ILabelData[];
}

export default function LabelPicker({
  projectId,
  ticketId,
  onLabelClick,
  isDisabled,
  currentLabels = []
}: ILabelPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [labels, setLabels] = useState<ILabelData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadLabels = async () => {
    if (labels.length === 0) {
      setLoading(true);
      try {
        const response = await showLabel(projectId);
        setLabels(response.data || []);
      } catch {
        // Failed to load labels
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggle = () => {
    if (isDisabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      loadLabels();
      setSearchTerm('');
      // Focus input after dropdown opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const handleLabelClick = (labelId: string) => {
    onLabelClick(labelId);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Filter labels to exclude already selected ones and apply search filter
  const currentLabelIds = new Set(currentLabels.map((label) => label.id));
  const availableLabels = labels
    .filter((label) => !currentLabelIds.has(label.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  const filteredLabels = availableLabels.filter((label) =>
    label.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const hasExistingLabel =
    normalizedSearch.length > 0 &&
    [...labels, ...currentLabels].some((label) => label.name.toLowerCase() === normalizedSearch);
  const canCreateNewLabel = normalizedSearch.length > 0 && !hasExistingLabel;

  const handleCreateNewLabel = async () => {
    if (!canCreateNewLabel) {
      return;
    }

    try {
      const name = searchTerm.trim();
      const response = await createLabel(ticketId, {
        name,
        slug: name.toLowerCase().replaceAll(' ', '-')
      });

      if (!response?.data) {
        return;
      }

      const newLabel = response.data as ILabelData;
      setLabels((prev) => [...prev, newLabel]);
      // Also attach to ticket using existing flow
      onLabelClick(newLabel.id);
      setIsOpen(false);
      setSearchTerm('');
    } catch {
      // Swallow error silently; ticket screen already has global error handling
    }
  };

  return (
    <div className={styles.labelPicker} ref={dropdownRef}>
      <button
        className={styles.iconButton}
        onClick={handleToggle}
        disabled={isDisabled}
        type="button"
        data-testid={`icon-btn-select-label-${projectId}`}
      >
        <MdLabel size={12} />
        <span className={styles.tooltip}>Select Label</span>
      </button>

      {isOpen && (
        <LabelDropdown
          isOpen={isOpen}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filteredLabels={filteredLabels}
          loading={loading}
          canCreateNewLabel={canCreateNewLabel}
          handleLabelClick={handleLabelClick}
          handleCreateNewLabel={handleCreateNewLabel}
        />
      )}
    </div>
  );
}
