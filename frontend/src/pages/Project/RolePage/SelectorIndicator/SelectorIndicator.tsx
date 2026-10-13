import React from 'react';
import { IPermissions } from '../../../../types';
import styles from './SelectorIndicator.module.scss';

interface IProps {
  checked: boolean;
  permission: IPermissions;
  onChange: (permissionId: string, checked: boolean) => void;
  disabled?: boolean;
}

function SelectorIndicator({ checked, permission, onChange, disabled = false }: Readonly<IProps>) {
  return (
    <label data-testid="permission-option" htmlFor={permission.id} className={styles.permission}>
      <input
        type="checkbox"
        id={permission.id}
        onChange={(e) => onChange(permission.id, e.target.checked)}
        checked={checked}
        disabled={disabled}
      />
      {permission.description}
    </label>
  );
}

export default SelectorIndicator;
