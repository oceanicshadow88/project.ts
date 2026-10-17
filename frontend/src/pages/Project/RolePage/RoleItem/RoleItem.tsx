import React, { useId, useState } from 'react';
import { BiChevronRight } from 'react-icons/bi';
import { RiEditLine, RiDeleteBinLine, RiEyeLine } from 'react-icons/ri';
import { MdWarning } from 'react-icons/md';
import Modal from '../../../../lib/Modal/Modal';
import ButtonV2 from '../../../../lib/FormV2/ButtonV2/ButtonV2';
import PermissionIndicator from '../PermissionIndicator/PermissionIndicator';
import { IRole } from '../../../../types';
import styles from './RoleItem.module.scss';

interface IProps {
  role: IRole;
  onEditRole: (role: IRole) => void;
  deleteRole: (roleId: string) => Promise<void>;
}

const actionList = ['view', 'add', 'edit', 'delete'];

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

const getAllowedActions = (operation: string, permissions: Array<any>) => {
  return permissions
    .filter((permission) => permission.slug.split(':')[1] === operation)
    .map((permission) => permission.slug.split(':')[0]);
};

function RoleItem({ role, onEditRole, deleteRole }: Readonly<IProps>) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const bodyId = useId();
  const openActionLabel = role.isPublic ? 'View' : 'Edit';

  return (
    <li className={styles.role}>
      <div className={styles.header}>
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setIsExpanded((expanded) => !expanded)}
          aria-expanded={isExpanded}
          aria-controls={bodyId}
        >
          <BiChevronRight
            aria-hidden
            className={`${styles.chevron} ${isExpanded ? styles['chevron-open'] : ''}`}
          />
          <span className={styles.name}>{role.name}</span>
          {role.isPublic && <span className={styles['read-only-badge']}>Read-only</span>}
        </button>
        <div data-testid="more-list" className={styles['action-buttons']}>
          <button
            type="button"
            data-testid="edit-btn"
            className={styles['edit-btn']}
            onClick={() => onEditRole(role)}
            aria-label={`${openActionLabel} ${role.name}`}
            title={`${openActionLabel} ${role.name}`}
          >
            {role.isPublic ? <RiEyeLine size="16px" /> : <RiEditLine size="16px" />}
            <span>{openActionLabel}</span>
          </button>
          {!role.isPublic && (
            <button
              type="button"
              className={styles['delete-btn']}
              onClick={() => setIsConfirmingDelete(true)}
              aria-label={`Delete ${role.name}`}
              title={`Delete ${role.name}`}
            >
              <RiDeleteBinLine size="16px" />
            </button>
          )}
        </div>
      </div>

      <div id={bodyId} className={`${styles.body} ${isExpanded ? styles['body-open'] : ''}`}>
        <div className={styles['body-inner']}>
          <dl className={styles['permission-groups']}>
            {operationList.map((operation) => {
              const allowedActions = getAllowedActions(operation, role.permissions);
              const shownActions = actionList.filter((action) => allowedActions.includes(action));
              return (
                <div key={operation} className={styles['permission-group']}>
                  <dt>{capitalise(operation)}</dt>
                  <dd>
                    {shownActions.length > 0 ? (
                      shownActions.map((action) => (
                        <PermissionIndicator key={action} content={capitalise(action)} />
                      ))
                    ) : (
                      <span className={styles['no-permission']} aria-label="No access">
                        –
                      </span>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      </div>

      {isConfirmingDelete && (
        <Modal>
          <div className={styles['confirm-modal']}>
            <div className={styles['confirm-header']}>
              <MdWarning size={18} />
              <span>Delete role?</span>
            </div>
            <p className={styles['confirm-text']}>
              {`Are you sure you want to delete ${
                role.name ?? 'this role'
              }? This cannot be undone.`}
            </p>
            <div className={styles['confirm-actions']}>
              <ButtonV2 text="Cancel" fill onClick={() => setIsConfirmingDelete(false)} />
              <ButtonV2
                text="Delete"
                danger
                disabled={isDeleting}
                onClick={async () => {
                  try {
                    setIsDeleting(true);
                    await deleteRole(role.id);
                  } finally {
                    setIsDeleting(false);
                    setIsConfirmingDelete(false);
                  }
                }}
              />
            </div>
          </div>
        </Modal>
      )}
    </li>
  );
}

export default RoleItem;
