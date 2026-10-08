import React from 'react';
import { RiEditLine, RiDeleteBinLine } from 'react-icons/ri';
import styles from './RoleTable.module.scss';
import PermissionIndicator from '../PermissionIndicator/PermissionIndicator';

import { IRole } from '../../../../types';

interface IRoleTable {
  roles: IRole[];
  onEditRole: (role: IRole) => void;
  deleteRole: (roleId: string) => void;
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

function RoleTable(props: IRoleTable) {
  const { roles, onEditRole, deleteRole } = props;

  return (
    <div className={styles['table-card']}>
      <table data-testid="role-table" className={styles['roles-table']}>
        <thead>
          <tr>
            <th scope="col" className={styles['role-name']}>
              Role
            </th>
            {operationList.map((operation) => (
              <th scope="col" key={operation}>
                {capitalise(operation)}
              </th>
            ))}
            <th scope="col" className={styles.actions}>
              <span className={styles['visually-hidden']}>Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role.id}>
              <th scope="row" className={styles['role-name']}>
                {role.name}
                {role.isPublic && <span className={styles['default-badge']}>Default</span>}
              </th>
              {operationList.map((operation) => {
                const allowedActions = getAllowedActions(operation, role.permissions);
                const shownActions = actionList.filter((action) => allowedActions.includes(action));
                return (
                  <td key={operation}>
                    {shownActions.length > 0 ? (
                      <div className={styles['permission-list']}>
                        {shownActions.map((action) => (
                          <PermissionIndicator key={action} content={capitalise(action)} />
                        ))}
                      </div>
                    ) : (
                      <span className={styles['no-permission']} aria-label="No access">
                        –
                      </span>
                    )}
                  </td>
                );
              })}
              <td data-testid="more-btn" className={styles.actions}>
                <div data-testid="more-list" className={styles['action-buttons']}>
                  <button
                    type="button"
                    data-testid="edit-btn"
                    className={styles['edit-btn']}
                    onClick={() => onEditRole(role)}
                    aria-label={`Edit ${role.name}`}
                    title={`Edit ${role.name}`}
                  >
                    <RiEditLine size="16px" />
                    <span>Edit</span>
                  </button>
                  {role.allowDelete && (
                    <button
                      type="button"
                      className={styles['delete-btn']}
                      onClick={() => deleteRole(role.id)}
                      aria-label={`Delete ${role.name}`}
                      title={`Delete ${role.name}`}
                    >
                      <RiDeleteBinLine size="16px" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RoleTable;
