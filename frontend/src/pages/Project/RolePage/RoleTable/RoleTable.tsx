import React from 'react';
import RoleItem from '../RoleItem/RoleItem';
import { IRole } from '../../../../types';
import styles from './RoleTable.module.scss';

interface IRoleTable {
  roles: IRole[];
  onEditRole: (role: IRole) => void;
}

function RoleTable({ roles, onEditRole }: Readonly<IRoleTable>) {
  return (
    <ul data-testid="role-table" className={styles['role-list']}>
      {roles.map((role) => (
        <RoleItem key={role.id} role={role} onEditRole={onEditRole} />
      ))}
    </ul>
  );
}

export default RoleTable;
