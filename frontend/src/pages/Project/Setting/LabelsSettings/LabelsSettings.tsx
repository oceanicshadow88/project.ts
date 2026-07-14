import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from './LabelsSettings.module.scss';
import { showLabel, updateLabel, deleteLabel } from '../../../../api/label/label';
import { ILabelData } from '../../../../types';
import SettingCard from '../../../../components/SettingCard/SettingCard';
import ButtonV2 from '../../../../lib/FormV2/ButtonV2/ButtonV2';
import InputV3 from '../../../../lib/FormV3/InputV3/InputV3';
import Modal from '../../../../lib/Modal/Modal';
import ProjectSettingHOC from '../../../../components/HOC/ProjectSettingHOC/ProjectSettingHOC';

interface EditableLabel extends ILabelData {
  editingName: boolean;
  editingColor: boolean;
  tempName: string;
  tempColor: string;
}

export default function LabelsSettings() {
  const { projectId = '' } = useParams();
  const [labels, setLabels] = useState<EditableLabel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [labelToDelete, setLabelToDelete] = useState<string | null>(null);
  const colorInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const fetchLabels = async () => {
    try {
      setLoading(true);
      const response = await showLabel(projectId);
      const labelsData = (response.data || [])
        .map((label: ILabelData) => ({
          ...label,
          editingName: false,
          editingColor: false,
          tempName: label.name,
          tempColor: label.color || '#6a2add'
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setLabels(labelsData);
    } catch (error) {
      toast.error('Failed to load labels', { theme: 'colored' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabels();
  }, [projectId]);

  const handleStartEditName = (labelId: string) => {
    setLabels((prev) =>
      prev.map((label) =>
        label.id === labelId ? { ...label, editingName: true, tempName: label.name } : label
      )
    );
    // Focus input immediately after state update
    setTimeout(() => {
      const nameInput = document.querySelector(`input[name="name-${labelId}"]`) as HTMLInputElement;
      if (nameInput) {
        nameInput.focus();
        nameInput.select();
      }
    }, 0);
  };

  const handleStartEditColor = (labelId: string) => {
    setLabels((prev) =>
      prev.map((label) =>
        label.id === labelId
          ? { ...label, editingColor: true, tempColor: label.color || '#6a2add' }
          : label
      )
    );
    // Open color picker immediately after state update
    setTimeout(() => {
      const colorInput = colorInputRefs.current[labelId];
      if (colorInput) {
        colorInput.click();
      }
    }, 0);
  };

  const handleCancelEdit = (labelId: string, field: 'name' | 'color') => {
    setLabels((prev) =>
      prev.map((label) => {
        if (label.id === labelId) {
          if (field === 'name') {
            return { ...label, editingName: false, tempName: label.name };
          }
          return { ...label, editingColor: false, tempColor: label.color || '#6a2add' };
        }
        return label;
      })
    );
  };

  const handleNameChange = (labelId: string, value: string) => {
    setLabels((prev) =>
      prev.map((label) => (label.id === labelId ? { ...label, tempName: value } : label))
    );
  };

  const handleColorChange = (labelId: string, value: string) => {
    setLabels((prev) =>
      prev.map((label) => (label.id === labelId ? { ...label, tempColor: value } : label))
    );
  };

  const handleSaveName = async (labelId: string) => {
    const label = labels.find((l) => l.id === labelId);
    if (!label || !label.tempName.trim()) {
      toast.error('Label name cannot be empty', { theme: 'colored' });
      return;
    }

    try {
      await updateLabel(labelId, {
        name: label.tempName.trim(),
        slug: label.tempName.trim().toLowerCase().replace(/ /g, '-'),
        color: label.color
      });
      setLabels((prev) =>
        prev.map((l) =>
          l.id === labelId ? { ...l, name: label.tempName.trim(), editingName: false } : l
        )
      );
      toast.success('Label name updated', { theme: 'colored' });
      // Refetch labels to ensure consistency
      fetchLabels();
    } catch (error) {
      toast.error('Failed to update label name', { theme: 'colored' });
      handleCancelEdit(labelId, 'name');
    }
  };

  const handleSaveColor = async (labelId: string) => {
    const label = labels.find((l) => l.id === labelId);
    if (!label) return;

    try {
      await updateLabel(labelId, {
        name: label.name,
        slug: label.slug,
        color: label.tempColor
      });
      setLabels((prev) =>
        prev.map((l) =>
          l.id === labelId ? { ...l, color: label.tempColor, editingColor: false } : l
        )
      );
      toast.success('Label color updated', { theme: 'colored' });
      // Refetch labels to ensure consistency
      fetchLabels();
    } catch (error) {
      toast.error('Failed to update label color', { theme: 'colored' });
      handleCancelEdit(labelId, 'color');
    }
  };

  const handleDeleteLabel = (labelId: string) => {
    setLabelToDelete(labelId);
    setShowDeleteModal(true);
  };

  const confirmDeleteLabel = async () => {
    if (!labelToDelete) return;

    try {
      await deleteLabel(labelToDelete);
      setLabels((prev) => prev.filter((label) => label.id !== labelToDelete));
      toast.success('Label deleted', { theme: 'colored' });
      // Refetch labels to ensure consistency
      fetchLabels();
    } catch (error) {
      toast.error('Failed to delete label', { theme: 'colored' });
    } finally {
      setShowDeleteModal(false);
      setLabelToDelete(null);
    }
  };

  const renderContent = () => {
    if (loading) {
      return <div className={styles.loading}>Loading labels...</div>;
    }
    if (labels.length === 0) {
      return <div className={styles.emptyState}>No labels found. Create labels from tickets.</div>;
    }
    return (
      <div className={styles.labelsList}>
        {labels.map((label) => (
          <div key={label.id} className={styles.labelItem}>
            <div className={styles.labelPreview}>
              <div
                className={styles.labelChip}
                style={{ backgroundColor: label.tempColor || '#6a2add' }}
              >
                {label.editingName ? label.tempName : label.name}
              </div>
            </div>
            <div className={styles.labelControls}>
              {label.editingName ? (
                <div className={styles.editRow}>
                  <InputV3
                    label="Label Name"
                    value={label.tempName}
                    onValueChanged={(e) => handleNameChange(label.id, e.target.value)}
                    name={`name-${label.id}`}
                    dataTestId={`label-name-input-${label.id}`}
                  />
                  <div className={styles.editActions}>
                    <ButtonV2
                      text="Save"
                      size="button-xs"
                      onClick={() => handleSaveName(label.id)}
                      dataTestId={`save-name-${label.id}`}
                    />
                    <ButtonV2
                      text="Cancel"
                      size="button-xs"
                      fill
                      onClick={() => handleCancelEdit(label.id, 'name')}
                      dataTestId={`cancel-name-${label.id}`}
                    />
                  </div>
                </div>
              ) : (
                <div
                  className={styles.labelNameClickable}
                  onClick={() => handleStartEditName(label.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleStartEditName(label.id);
                    }
                  }}
                  data-testid={`edit-name-${label.id}`}
                >
                  <span className={styles.labelName}>{label.name}</span>
                </div>
              )}
              {label.editingColor ? (
                <div className={styles.editRow}>
                  <div className={styles.colorInputGroup}>
                    <span className={styles.colorLabel}>Color</span>
                    <div className={styles.colorPickerRow}>
                      <label htmlFor={`color-${label.id}`} className={styles.colorInputLabel}>
                        <input
                          ref={(el) => {
                            colorInputRefs.current[label.id] = el;
                          }}
                          type="color"
                          id={`color-${label.id}`}
                          value={label.tempColor || '#6a2add'}
                          onChange={(e) => handleColorChange(label.id, e.target.value)}
                          className={styles.colorInput}
                          data-testid={`color-input-${label.id}`}
                        />
                      </label>
                      <InputV3
                        label=""
                        value={label.tempColor || '#6a2add'}
                        onValueChanged={(e) => handleColorChange(label.id, e.target.value)}
                        name={`color-${label.id}`}
                        dataTestId={`color-text-input-${label.id}`}
                        placeHolder="#6a2add"
                      />
                    </div>
                  </div>
                  <div className={styles.editActions}>
                    <ButtonV2
                      text="Save"
                      size="button-xs"
                      onClick={() => handleSaveColor(label.id)}
                      dataTestId={`save-color-${label.id}`}
                    />
                    <ButtonV2
                      text="Cancel"
                      size="button-xs"
                      fill
                      onClick={() => handleCancelEdit(label.id, 'color')}
                      dataTestId={`cancel-color-${label.id}`}
                    />
                  </div>
                </div>
              ) : (
                <div
                  className={styles.colorDisplayClickable}
                  onClick={() => handleStartEditColor(label.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleStartEditColor(label.id);
                    }
                  }}
                  data-testid={`edit-color-${label.id}`}
                >
                  <span className={styles.colorLabel}>Color:</span>
                  <div
                    className={styles.colorPreview}
                    style={{ backgroundColor: label.color || '#6a2add' }}
                  />
                  <span className={styles.colorValue}>{label.color || '#6a2add'}</span>
                </div>
              )}
              <ButtonV2
                text="Delete"
                size="button-xs"
                danger
                onClick={() => handleDeleteLabel(label.id)}
                dataTestId={`delete-label-${label.id}`}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <ProjectSettingHOC>
      <SettingCard title="Project Labels">{renderContent()}</SettingCard>
      {showDeleteModal && (
        <Modal classesName={styles.modal}>
          <p>Are you sure you want to delete this label?</p>
          <div className={styles.modalBtn}>
            <ButtonV2
              text="Confirm"
              danger
              onClick={confirmDeleteLabel}
              dataTestId="confirm-delete-label"
            />
            <ButtonV2
              text="Cancel"
              fill
              onClick={() => {
                setShowDeleteModal(false);
                setLabelToDelete(null);
              }}
              dataTestId="cancel-delete-label"
            />
          </div>
        </Modal>
      )}
    </ProjectSettingHOC>
  );
}
