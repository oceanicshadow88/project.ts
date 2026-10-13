import React, { useState } from 'react';
import { IPermissions, IRole } from '../../../../types';
import styles from './PermissionSelector.module.scss';
import PermissionCategory from '../PermissionCategory/PermissionCategory';
import Modal from '../../../../lib/Modal/Modal';
import DefaultModalHeader from '../../../../lib/Modal/ModalHeader/DefaultModalHeader/DefaultModalHeader';
import InputV2 from '../../../../lib/FormV2/InputV2/InputV2';
import ButtonV2 from '../../../../lib/FormV2/ButtonV2/ButtonV2';

interface IProps {
  isNewRole?: boolean;
  submitRoleHandler: (role: string, permissions: Array<string>, newRole: boolean) => void;
  closeHandler: () => void;
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
  const { isNewRole = false, submitRoleHandler, closeHandler, permissions, role } = props;
  const [roleName, setRoleName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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

    if (updatedPermissions.length === 0) {
      setErrorMsg('Select at least one permission.');
      return;
    }

    submitRoleHandler(isNewRole ? roleName : role?.id ?? '', updatedPermissions, isNewRole);
  };

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

        {isNewRole && (
          <InputV2
            label="Role name"
            name="roleName"
            dataTestId="role-input"
            onValueChanged={(e) => setRoleName(e.target.value)}
            required
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
          <ButtonV2
            text={isReadOnly ? 'Close' : 'Cancel'}
            onClick={closeHandler}
            btnType="button"
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
    </Modal>
  );
}

export default PermissionSelector;
