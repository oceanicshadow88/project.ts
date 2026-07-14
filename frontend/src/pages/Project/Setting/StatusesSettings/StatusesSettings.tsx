import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from './StatusesSettings.module.scss';
import { getStatuses, updateStatus, deleteStatus } from '../../../../api/status/status';
import { IStatus } from '../../../../types';
import SettingCard from '../../../../components/SettingCard/SettingCard';
import ButtonV2 from '../../../../lib/FormV2/ButtonV2/ButtonV2';
import InputV3 from '../../../../lib/FormV3/InputV3/InputV3';
import Modal from '../../../../lib/Modal/Modal';
import ProjectSettingHOC from '../../../../components/HOC/ProjectSettingHOC/ProjectSettingHOC';

interface EditableStatus extends IStatus {
  editingName: boolean;
  editingColor: boolean;
  tempName: string;
  tempColor: string;
}

export default function StatusesSettings() {
  const { projectId = '' } = useParams();
  const [statuses, setStatuses] = useState<EditableStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [statusToDelete, setStatusToDelete] = useState<string | null>(null);
  const colorInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const response = await getStatuses(projectId);
      const statusesData = (response || [])
        .map((status: IStatus) => ({
          ...status,
          editingName: false,
          editingColor: false,
          tempName: status.name,
          tempColor: status.color || '#6a2add'
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setStatuses(statusesData);
    } catch (error) {
      toast.error('Failed to load statuses', { theme: 'colored' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, [projectId]);

  const handleStartEditName = (statusId: string) => {
    setStatuses((prev) =>
      prev.map((status) =>
        status.id === statusId ? { ...status, editingName: true, tempName: status.name } : status
      )
    );
    // Focus input immediately after state update
    setTimeout(() => {
      const nameInput = document.querySelector(
        `input[name="name-${statusId}"]`
      ) as HTMLInputElement;
      if (nameInput) {
        nameInput.focus();
        nameInput.select();
      }
    }, 0);
  };

  const handleStartEditColor = (statusId: string) => {
    setStatuses((prev) =>
      prev.map((status) =>
        status.id === statusId
          ? { ...status, editingColor: true, tempColor: status.color || '#6a2add' }
          : status
      )
    );
    // Open color picker immediately after state update
    setTimeout(() => {
      const colorInput = colorInputRefs.current[statusId];
      if (colorInput) {
        colorInput.click();
      }
    }, 0);
  };

  const handleCancelEdit = (statusId: string, field: 'name' | 'color') => {
    setStatuses((prev) =>
      prev.map((status) => {
        if (status.id === statusId) {
          if (field === 'name') {
            return { ...status, editingName: false, tempName: status.name };
          }
          return { ...status, editingColor: false, tempColor: status.color || '#6a2add' };
        }
        return status;
      })
    );
  };

  const handleNameChange = (statusId: string, value: string) => {
    setStatuses((prev) =>
      prev.map((status) => (status.id === statusId ? { ...status, tempName: value } : status))
    );
  };

  const handleColorChange = (statusId: string, value: string) => {
    setStatuses((prev) =>
      prev.map((status) => (status.id === statusId ? { ...status, tempColor: value } : status))
    );
  };

  const handleSaveName = async (statusId: string) => {
    const status = statuses.find((s) => s.id === statusId);
    if (!status || !status.tempName.trim()) {
      toast.error('Status name cannot be empty', { theme: 'colored' });
      return;
    }

    try {
      await updateStatus(projectId, statusId, {
        name: status.tempName.trim(),
        color: status.color
      });
      setStatuses((prev) =>
        prev.map((s) =>
          s.id === statusId ? { ...s, name: status.tempName.trim(), editingName: false } : s
        )
      );
      toast.success('Status name updated', { theme: 'colored' });
      // Refetch statuses to ensure consistency
      fetchStatuses();
    } catch (error) {
      toast.error('Failed to update status name', { theme: 'colored' });
      handleCancelEdit(statusId, 'name');
    }
  };

  const handleSaveColor = async (statusId: string) => {
    const status = statuses.find((s) => s.id === statusId);
    if (!status) return;

    try {
      await updateStatus(projectId, statusId, {
        name: status.name,
        color: status.tempColor
      });
      setStatuses((prev) =>
        prev.map((s) =>
          s.id === statusId ? { ...s, color: status.tempColor, editingColor: false } : s
        )
      );
      toast.success('Status color updated', { theme: 'colored' });
      // Refetch statuses to ensure consistency
      fetchStatuses();
    } catch (error) {
      toast.error('Failed to update status color', { theme: 'colored' });
      handleCancelEdit(statusId, 'color');
    }
  };

  const handleDeleteStatus = (statusId: string) => {
    const status = statuses.find((s) => s.id === statusId);
    if (status?.isDefault) {
      toast.error('Cannot delete default status', { theme: 'colored' });
      return;
    }

    setStatusToDelete(statusId);
    setShowDeleteModal(true);
  };

  const confirmDeleteStatus = async () => {
    if (!statusToDelete) return;

    try {
      await deleteStatus(projectId, statusToDelete);
      setStatuses((prev) => prev.filter((s) => s.id !== statusToDelete));
      toast.success('Status deleted', { theme: 'colored' });
      // Refetch statuses to ensure consistency
      fetchStatuses();
    } catch (error) {
      toast.error('Failed to delete status', { theme: 'colored' });
    } finally {
      setShowDeleteModal(false);
      setStatusToDelete(null);
    }
  };

  const renderContent = () => {
    if (loading) {
      return <div className={styles.loading}>Loading statuses...</div>;
    }
    if (statuses.length === 0) {
      return (
        <div className={styles.emptyState}>
          No statuses found. Statuses are created automatically.
        </div>
      );
    }
    return (
      <div className={styles.statusesList}>
        {statuses.map((status) => (
          <div key={status.id} className={styles.statusItem}>
            <div className={styles.statusPreview}>
              <div
                className={styles.statusChip}
                style={{ backgroundColor: status.tempColor || '#6a2add' }}
              >
                {status.editingName ? status.tempName.toUpperCase() : status.name.toUpperCase()}
              </div>
            </div>
            <div className={styles.statusControls}>
              {status.editingName ? (
                <div className={styles.editRow}>
                  <InputV3
                    label="Status Name"
                    value={status.tempName}
                    onValueChanged={(e) => handleNameChange(status.id, e.target.value)}
                    name={`name-${status.id}`}
                    dataTestId={`status-name-input-${status.id}`}
                  />
                  <div className={styles.editActions}>
                    <ButtonV2
                      text="Save"
                      size="button-xs"
                      onClick={() => handleSaveName(status.id)}
                      dataTestId={`save-name-${status.id}`}
                    />
                    <ButtonV2
                      text="Cancel"
                      size="button-xs"
                      fill
                      onClick={() => handleCancelEdit(status.id, 'name')}
                      dataTestId={`cancel-name-${status.id}`}
                    />
                  </div>
                </div>
              ) : (
                <div
                  className={styles.statusNameClickable}
                  onClick={() => handleStartEditName(status.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleStartEditName(status.id);
                    }
                  }}
                  data-testid={`edit-name-${status.id}`}
                >
                  <span className={styles.statusName}>{status.name.toUpperCase()}</span>
                  {status.isDefault && <span className={styles.defaultBadge}>(Default)</span>}
                </div>
              )}
              {status.editingColor ? (
                <div className={styles.editRow}>
                  <div className={styles.colorInputGroup}>
                    <span className={styles.colorLabel}>Color</span>
                    <div className={styles.colorPickerRow}>
                      <label htmlFor={`color-${status.id}`} className={styles.colorInputLabel}>
                        <input
                          ref={(el) => {
                            colorInputRefs.current[status.id] = el;
                          }}
                          type="color"
                          id={`color-${status.id}`}
                          value={status.tempColor || '#6a2add'}
                          onChange={(e) => handleColorChange(status.id, e.target.value)}
                          className={styles.colorInput}
                          data-testid={`color-input-${status.id}`}
                        />
                      </label>
                      <InputV3
                        label=""
                        value={status.tempColor || '#6a2add'}
                        onValueChanged={(e) => handleColorChange(status.id, e.target.value)}
                        name={`color-${status.id}`}
                        dataTestId={`color-text-input-${status.id}`}
                        placeHolder="#6a2add"
                      />
                    </div>
                  </div>
                  <div className={styles.editActions}>
                    <ButtonV2
                      text="Save"
                      size="button-xs"
                      onClick={() => handleSaveColor(status.id)}
                      dataTestId={`save-color-${status.id}`}
                    />
                    <ButtonV2
                      text="Cancel"
                      size="button-xs"
                      fill
                      onClick={() => handleCancelEdit(status.id, 'color')}
                      dataTestId={`cancel-color-${status.id}`}
                    />
                  </div>
                </div>
              ) : (
                <div
                  className={styles.colorDisplayClickable}
                  onClick={() => handleStartEditColor(status.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleStartEditColor(status.id);
                    }
                  }}
                  data-testid={`edit-color-${status.id}`}
                >
                  <span className={styles.colorLabel}>Color:</span>
                  <div
                    className={styles.colorPreview}
                    style={{ backgroundColor: status.color || '#6a2add' }}
                  />
                  <span className={styles.colorValue}>{status.color || '#6a2add'}</span>
                </div>
              )}
              <ButtonV2
                text="Delete"
                size="button-xs"
                danger
                onClick={() => handleDeleteStatus(status.id)}
                dataTestId={`delete-status-${status.id}`}
                disabled={status.isDefault}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <ProjectSettingHOC>
      <SettingCard title="Project Statuses">{renderContent()}</SettingCard>
      {showDeleteModal && (
        <Modal classesName={styles.modal}>
          <p>Are you sure you want to delete this status?</p>
          <div className={styles.modalBtn}>
            <ButtonV2
              text="Confirm"
              danger
              onClick={confirmDeleteStatus}
              dataTestId="confirm-delete-status"
            />
            <ButtonV2
              text="Cancel"
              fill
              onClick={() => {
                setShowDeleteModal(false);
                setStatusToDelete(null);
              }}
              dataTestId="cancel-delete-status"
            />
          </div>
        </Modal>
      )}
    </ProjectSettingHOC>
  );
}
