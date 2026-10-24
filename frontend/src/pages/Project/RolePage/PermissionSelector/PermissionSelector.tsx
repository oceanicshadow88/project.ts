import React, { useEffect, useId, useState } from 'react';
import { MdWarning } from 'react-icons/md';
import { IPermissions, IRole, IRoleMember, IRoleReassignment } from '../../../../types';
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
  // delete-related props are only passed when editing a role, not when adding one
  deleteRoleHandler?: (roleId: string, reassignments: IRoleReassignment[]) => Promise<void>;
  loadRoleMembers?: (roleId: string) => Promise<IRoleMember[]>;
  roles?: IRole[];
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
    loadRoleMembers,
    roles = [],
    permissions,
    role
  } = props;
  const [roleName, setRoleName] = useState(role?.name ?? '');
  const [errorMsg, setErrorMsg] = useState('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  // null while loading, [] when nobody holds the role
  const [members, setMembers] = useState<IRoleMember[] | null>(null);
  const [hasMembersLoadError, setHasMembersLoadError] = useState(false);
  // each member's chosen role, keyed by user id
  const [newRoleIds, setNewRoleIds] = useState<Record<string, string>>({});
  // disables the confirm button while the request runs
  const [isDeleting, setIsDeleting] = useState(false);
  // prefix for each dropdown's id so its label can point at it
  const selectIdPrefix = useId();

  const isReadOnly = role?.isPublic ?? false;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set((role?.permissions ?? []).map((permission) => permission.id))
  );

  // load who holds the role each time the delete confirmation opens
  useEffect(() => {
    if (!isConfirmingDelete || !role || !loadRoleMembers) return undefined;
    let isCancelled = false;
    // ignore a late result if the confirmation was closed before it arrived
    loadRoleMembers(role.id)
      .then((res) => {
        if (!isCancelled) setMembers(res);
      })
      .catch(() => {
        if (!isCancelled) setHasMembersLoadError(true);
      });
    return () => {
      isCancelled = true;
    };
  }, [isConfirmingDelete, role, loadRoleMembers]);

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

  // clear anything left from opening the confirmation earlier
  const openDeleteConfirm = () => {
    setMembers(null);
    setHasMembersLoadError(false);
    setNewRoleIds({});
    setIsConfirmingDelete(true);
  };

  const confirmDeleteHandler = async () => {
    if (!role || !deleteRoleHandler || !members) return;
    try {
      setIsDeleting(true);
      // one { userId, roleId } per member, as the backend expects
      await deleteRoleHandler(
        role.id,
        members.map((member) => ({ userId: member.id, roleId: newRoleIds[member.id] }))
      );
    } finally {
      // RolePage closes the whole popup on success; on failure this returns to the edit popup
      setIsDeleting(false);
      setIsConfirmingDelete(false);
    }
  };

  const canDelete = !isNewRole && !isReadOnly && !!role && !!deleteRoleHandler && !!loadRoleMembers;
  // true once the list has loaded and everyone has a role picked (also true for an empty list)
  const everyMemberHasNewRole = !!members && members.every((member) => newRoleIds[member.id]);
  const canConfirmDelete = !isDeleting && !hasMembersLoadError && everyMemberHasNewRole;
  // members can't be moved to the role being deleted
  const replacementRoles = roles.filter((item) => item.id !== role?.id);

  // load error, loading, nobody holds the role, or one row per member with a role dropdown
  const renderDeleteBody = () => {
    const deletedRoleName = role?.name ?? 'this role';
    if (hasMembersLoadError) {
      return (
        <p className={styles['confirm-text']}>
          Couldn&apos;t check who has this role. Close this and try again.
        </p>
      );
    }
    if (members === null) {
      return <p className={styles['confirm-text']}>Checking who has this role…</p>;
    }
    if (members.length === 0) {
      return (
        <p className={styles['confirm-text']}>
          {`Are you sure you want to delete ${deletedRoleName}? This cannot be undone.`}
        </p>
      );
    }
    const peopleText = members.length === 1 ? '1 person has' : `${members.length} people have`;
    return (
      <>
        <p className={styles['confirm-text']}>
          {`${peopleText} the ${deletedRoleName} role. Choose a new role for each person before deleting it.`}
        </p>
        <ul className={styles['member-list']}>
          {members.map((member) => {
            // name is optional on users, so fall back to email
            const memberName = member.name ?? member.email;
            const selectId = `${selectIdPrefix}-${member.id}`;
            return (
              <li key={member.id}>
                <label htmlFor={selectId} className={styles.member}>
                  <span className={styles['member-name']}>{memberName}</span>
                  <select
                    id={selectId}
                    className={styles['role-select']}
                    value={newRoleIds[member.id] ?? ''}
                    // copy the existing choices so React sees a new object and re-renders
                    onChange={(e) =>
                      setNewRoleIds((previous) => ({ ...previous, [member.id]: e.target.value }))
                    }
                    aria-label={`New role for ${memberName}`}
                    data-testid={`new-role-${member.id}`}
                  >
                    <option value="" disabled>
                      Select a role
                    </option>
                    {replacementRoles.map((replacementRole) => (
                      <option key={replacementRole.id} value={replacementRole.id}>
                        {replacementRole.name}
                      </option>
                    ))}
                  </select>
                </label>
              </li>
            );
          })}
        </ul>
      </>
    );
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
              onClick={openDeleteConfirm}
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

      {/* opens on top of the edit popup, outside the form */}
      {isConfirmingDelete && (
        <Modal>
          <div className={styles['confirm-modal']}>
            <div className={styles['confirm-header']}>
              <MdWarning size={18} />
              <span>Delete role?</span>
            </div>
            {renderDeleteBody()}
            <div className={styles['confirm-actions']}>
              <ButtonV2 text="Cancel" fill onClick={() => setIsConfirmingDelete(false)} />
              <ButtonV2
                text="Delete"
                danger
                customStyles={styles['confirm-delete-btn']}
                disabled={!canConfirmDelete}
                onClick={confirmDeleteHandler}
                dataTestId="confirm-delete-role-btn"
              />
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
}

export default PermissionSelector;
