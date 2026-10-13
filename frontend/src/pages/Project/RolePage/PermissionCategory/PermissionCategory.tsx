import React, { useEffect, useId, useRef, useState } from 'react';
import { BiChevronDown, BiChevronRight } from 'react-icons/bi';
import { IPermissions } from '../../../../types';
import SelectorIndicator from '../SelectorIndicator/SelectorIndicator';
import styles from './PermissionCategory.module.scss';

interface IProps {
  name: string;
  permissions: IPermissions[];
  selectedIds: Set<string>;
  onTogglePermission: (permissionId: string, checked: boolean) => void;
  onToggleAll: (permissionIds: string[], checked: boolean) => void;
  disabled?: boolean;
}

function PermissionCategory({
  name,
  permissions,
  selectedIds,
  onTogglePermission,
  onToggleAll,
  disabled = false
}: Readonly<IProps>) {
  const [isExpanded, setIsExpanded] = useState(true);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const bodyId = useId();

  const permissionIds = permissions.map((permission) => permission.id);
  const selectedCount = permissionIds.filter((id) => selectedIds.has(id)).length;
  const isAllSelected = permissionIds.length > 0 && selectedCount === permissionIds.length;
  const isPartlySelected = selectedCount > 0 && !isAllSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isPartlySelected;
    }
  }, [isPartlySelected]);

  return (
    <div className={styles.category}>
      <div className={styles.header}>
        <input
          ref={selectAllRef}
          type="checkbox"
          className={styles['select-all']}
          checked={isAllSelected}
          onChange={() => onToggleAll(permissionIds, !isAllSelected)}
          disabled={disabled || permissionIds.length === 0}
          aria-label={`Select all ${name} permissions`}
        />
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setIsExpanded((expanded) => !expanded)}
          aria-expanded={isExpanded}
          aria-controls={bodyId}
        >
          {isExpanded ? <BiChevronDown aria-hidden /> : <BiChevronRight aria-hidden />}
          <span className={styles.name}>{name}</span>
          <span className={styles.count}>
            {selectedCount} of {permissionIds.length}
          </span>
        </button>
      </div>
      {isExpanded && (
        <div id={bodyId} className={styles.options}>
          {permissions.map((permission) => (
            <SelectorIndicator
              key={permission.id}
              checked={selectedIds.has(permission.id)}
              permission={permission}
              onChange={onTogglePermission}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default PermissionCategory;
