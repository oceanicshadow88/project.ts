import React, { useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import Modal from '../../../../../lib/Modal/Modal';
import DefaultModalHeader from '../../../../../lib/Modal/ModalHeader/DefaultModalHeader/DefaultModalHeader';
import InputV3 from '../../../../../lib/FormV3/InputV3/InputV3';
import ButtonV2 from '../../../../../lib/FormV2/ButtonV2/ButtonV2';
import { createProjectLabel } from '../../../../../api/label/label';
import { ILabelData } from '../../../../../types';
import styles from './CreateLabelModal.module.scss';

const DEFAULT_COLOR = '#6a2add';
const LABEL_NAME_MAX_LENGTH = 30;
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

interface ICreateLabelModal {
  projectId: string;
  existingLabels: ILabelData[];
  onClose: () => void;
  onCreated: (label: ILabelData) => void;
}

const validateName = (name: string, existingLabels: ILabelData[]) => {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return 'Label name is required';
  }
  if (trimmedName.length > LABEL_NAME_MAX_LENGTH) {
    return `Label name must be ${LABEL_NAME_MAX_LENGTH} characters or fewer`;
  }
  const isDuplicate = existingLabels.some(
    (label) => label.name.toLowerCase() === trimmedName.toLowerCase()
  );
  return isDuplicate ? 'Label already exists' : null;
};

export default function CreateLabelModal(props: ICreateLabelModal) {
  const { projectId, existingLabels, onClose, onCreated } = props;
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isColorValid = HEX_COLOR.test(color);

  useEffect(() => {
    const nameInput = document.querySelector('input[name="create-label-name"]') as HTMLInputElement;
    nameInput?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const error = validateName(name, existingLabels);
    setNameError(error);
    if (error || !isColorValid || saving) {
      return;
    }

    try {
      setSaving(true);
      const response = await createProjectLabel(projectId, { name: name.trim(), color });
      toast.success('Label created', { theme: 'colored' });
      onCreated(response.data);
    } catch (err) {
      // axios 0.27 types response.data as unknown, so give it the API's error shape.
      const errorResponse = axios.isAxiosError(err)
        ? (err as AxiosError<{ message?: string }>).response
        : undefined;
      if (errorResponse?.status === 403) {
        toast.error("You don't have permission to create labels", { theme: 'colored' });
        onClose();
      } else if (errorResponse?.status === 409 || errorResponse?.status === 422) {
        setNameError(errorResponse.data?.message || 'Invalid label');
      } else {
        toast.error('Failed to create label', { theme: 'colored' });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal classesName={styles.modal}>
      <DefaultModalHeader title="Create label" onClickClose={onClose} classesName={styles.header} />
      <form className={styles.form} onSubmit={handleSubmit}>
        <InputV3
          label="Label Name"
          name="create-label-name"
          value={name}
          required
          error={nameError}
          classes={nameError ? styles.fieldWithError : ''}
          onValueChanged={(e) => {
            setName(e.target.value);
            setNameError(null);
          }}
          dataTestId="create-label-name"
        />
        <div className={[styles.colorRow, isColorValid ? '' : styles.fieldWithError].join(' ')}>
          <input
            type="color"
            aria-label="Pick label color"
            className={styles.colorInput}
            value={isColorValid ? color : DEFAULT_COLOR}
            onChange={(e) => setColor(e.target.value)}
            data-testid="create-label-color-picker"
          />
          <InputV3
            label="Color"
            name="create-label-color"
            value={color}
            placeHolder={DEFAULT_COLOR}
            error={isColorValid ? null : 'Color must be a hex code like #6a2add'}
            onValueChanged={(e) => setColor(e.target.value.trim())}
            dataTestId="create-label-color"
            classes={styles.colorText}
          />
        </div>
        <div className={styles.preview}>
          <span>Preview</span>
          <span
            className={styles.previewChip}
            style={{ backgroundColor: isColorValid ? color : DEFAULT_COLOR }}
            data-testid="create-label-preview"
          >
            {name.trim() || 'Label name'}
          </span>
        </div>
        <div className={styles.actions}>
          <ButtonV2
            text="Cancel"
            btnType="button"
            customStyles={styles.cancelButton}
            onClick={onClose}
            dataTestId="create-label-cancel"
          />
          <ButtonV2
            text="Create"
            fill
            btnType="submit"
            customStyles={styles.submitButton}
            onClick={() => {}}
            loading={saving}
            disabled={saving || !isColorValid}
            dataTestId="create-label-submit"
          />
        </div>
      </form>
    </Modal>
  );
}
