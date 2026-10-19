import React, { useState } from 'react';
import { MdWarning } from 'react-icons/md';
import { IPermissions, IRole } from '../../../../types';
import styles from './PermissionSelector.module.scss';
import PermissionCategory from '../PermissionCategory/PermissionCategory';
import Modal from '../../../../lib/Modal/Modal';
import DefaultModalHeader from '../../../../lib/Modal/ModalHeader/DefaultModalHeader/DefaultModalHeader';
import InputV2 from '../../../../lib/FormV2/InputV2/InputV2';
import ButtonV2 from '../../../../lib/FormV2/ButtonV2/ButtonV2';

interface IProps {
  isNewRole?: boolean;
  submitRoleHandler: (roleName: string, permissions: Array<string>) => void;
  closeHandler: () => void;
  deleteRoleHandler?: (roleId: string) => Promise<void>;
  permissions: IPermissions[];
  role?: IRole;
}

const operationList = [
  'projects',
  'boards',
  'members',
  'roles',
  'shortcuts',
  'tickets',
  'settings'
];

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const getOperation = (permission: IPermissions) => permission?.slug.split(':')[1];

function PermissionSelector(props: IProps) {
  const {
    isNewRole = false,
    submitRoleHandler,
    closeHandler,
    deleteRoleHandler,
    permissions,
    role
  } = props;
  const [roleName, setRoleName] = useState(role?.name ?? '');
  const [errorMsg, setErrorMsg] = useState('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isReadOnly = role?.isPublic ?? false;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set((role?.permissions ?? []).map((permission) => permission.id))
  );

  const setPermissionsSelected = (permissionIds: string[], checked: boolean) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      permissionIds.forEach((id) => {
        if (checked) {
          next.add(id);
        } else {
          next.delete(id);
        }
      });
      return next;
    });
    setErrorMsg('');
  };

  const togglePermission = (permissionId: string, checked: boolean) => {
    setPermissionsSelected([permissionId], checked);
  };

  const getTitle = () => {
    if (isNewRole) return 'Add Role';
    if (isReadOnly) return `View Role: ${role?.name ?? ''}`;
    return `Edit Role: ${role?.name ?? ''}`;
  };

  const submitHandler = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const updatedPermissions = Array.from(selectedIds);
    const trimmedName = roleName.trim();

    if (!trimmedName) {
      setErrorMsg('Enter a role name.');
      return;
    }

    if (updatedPermissions.length === 0) {
      setErrorMsg('Select at least one permission.');
      return;
    }

    submitRoleHandler(trimmedName, updatedPermissions);
  };

  const confirmDeleteHandler = async () => {
    if (!role || !deleteRoleHandler) return;
    try {
      setIsDeleting(true);
      await deleteRoleHandler(role.id);
    } finally {
      setIsDeleting(false);
      setIsConfirmingDelete(false);
    }
  };

  const canDelete = !isNewRole && !isReadOnly && !!role && !!deleteRoleHandler;

  return (
    <Modal classesName={styles.modal}>
      <DefaultModalHeader title={getTitle()} onClickClose={closeHandler} />
      <form
        data-testid="permission-selector"
        onSubmit={submitHandler}
        onChange={() => setErrorMsg('')}
        className={styles['form-container']}
      >
        {isReadOnly && (
          <p className={styles['read-only-note']}>
            Default roles are shared by all projects and can&apos;t be edited.
          </p>
        )}

        {!isReadOnly && (
          <InputV2
            label="Role name"
            name="roleName"
            dataTestId="role-input"
            defaultValue={role?.name}
            onValueChanged={(e) => setRoleName(e.target.value)}
          />
        )}

        <div className={styles['permission-groups']}>
          {operationList.map((operation) => (
            <PermissionCategory
              key={operation}
              name={capitalise(operation)}
              permissions={permissions.filter(
                (permission) => getOperation(permission) === operation
              )}
              selectedIds={selectedIds}
              onTogglePermission={togglePermission}
              onToggleAll={setPermissionsSelected}
              disabled={isReadOnly}
            />
          ))}
        </div>

        {errorMsg && <p className={styles['error-message']}>{errorMsg}</p>}

        <div className={styles['button-container']}>
          {canDelete && (
            <ButtonV2
              text="Delete"
              danger
              customStyles={styles['delete-btn']}
              onClick={() => setIsConfirmingDelete(true)}
              btnType="button"
              dataTestId="delete-role-btn"
            />
          )}
          <ButtonV2
            text={isReadOnly ? 'Close' : 'Cancel'}
            onClick={closeHandler}
            btnType="button"
            customStyles={styles['cancel-btn']}
          />
          {!isReadOnly && (
            <ButtonV2
              text={isNewRole ? 'Create Role' : 'Save'}
              onClick={() => {}}
              btnType="submit"
              dataTestId="submit-btn"
              fill
            />
          )}
        </div>
      </form>

      {isConfirmingDelete && (
        <Modal>
          <div className={styles['confirm-modal']}>
            <div className={styles['confirm-header']}>
              <MdWarning size={18} />
              <span>Delete role?</span>
            </div>
            <p className={styles['confirm-text']}>
              {`Are you sure you want to delete ${
                role?.name ?? 'this role'
              }? This cannot be undone.`}
            </p>
            <p className={styles['confirm-text']}>
              Anyone with this role will be moved to the Guest role.
            </p>
            <div className={styles['confirm-actions']}>
              <ButtonV2 text="Cancel" fill onClick={() => setIsConfirmingDelete(false)} />
              <ButtonV2 text="Delete" danger disabled={isDeleting} onClick={confirmDeleteHandler} />
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
}

export default PermissionSelector;
