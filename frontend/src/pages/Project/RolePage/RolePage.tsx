import React, { useState, useEffect, useCallback, useContext } from 'react';
import { toast } from 'react-toastify';
import { useParams } from 'react-router-dom';
import Loading from '../../../components/Loading/Loading';
import RoleTable from './RoleTable/RoleTable';
import PermissionSelector from './PermissionSelector/PermissionSelector';
import ButtonV2 from '../../../lib/FormV2/ButtonV2/ButtonV2';
import { IPermissions, IRole } from '../../../types';
import { getRoles, addRole, updateRole, deleteRole, getPermissions } from '../../../api/role/role';
import styles from './RolePage.module.scss';
import RoleNav from './RoleNav/roleNav';
import { ModalContext } from '../../../context/ModalProvider';

function RolePage() {
  const [loader, setLoader] = useState(false);
  const { projectId = '' } = useParams();
  const [roles, setRoles] = useState<IRole[]>([]);
  const [permissions, setPermissions] = useState<IPermissions[]>([]);
  const { showModal, closeModal } = useContext(ModalContext);

  const fetchRoles = useCallback(async () => {
    try {
      setLoader(true);
      const res = await getRoles(projectId);
      setRoles(res);
    } catch (err) {
      setLoader(false);
      toast.error('Temporary Server Error. Try Again.', { theme: 'colored' });
    } finally {
      setLoader(false);
    }
  }, [projectId]);

  useEffect(() => {
    getPermissions()
      .then((res) => setPermissions(res))
      .catch(() => toast.error('Temporary Server Error. Try Again.', { theme: 'colored' }));
    fetchRoles();
  }, [fetchRoles]);

  const submitEditHandler = async (
    roleName: string,
    newPermissions: Array<string>,
    roleId?: string
  ) => {
    try {
      setLoader(true);
      if (roleId) {
        await updateRole(projectId, roleId, roleName, newPermissions);
        toast.success('Role updated.', { theme: 'colored' });
      } else {
        await addRole(projectId, roleName, newPermissions);
        toast.success('Role created.', { theme: 'colored' });
      }
      closeModal('selectedRole');
    } catch (err) {
      setLoader(false);
      toast.error('Temporary Server Error. Try Again.', { theme: 'colored' });
    } finally {
      fetchRoles();
    }
  };

  const newRoleHandler = () => {
    showModal(
      'selectedRole',
      <PermissionSelector
        isNewRole
        submitRoleHandler={submitEditHandler}
        closeHandler={() => closeModal('selectedRole')}
        permissions={permissions}
      />
    );
  };

  const deleteRoleHanlder = async (roleId: string) => {
    try {
      setLoader(true);
      await deleteRole(projectId, roleId);
      closeModal('selectedRole');
    } catch (err) {
      setLoader(false);
      toast.error('Temporary Server Error. Try Again.', { theme: 'colored' });
    } finally {
      fetchRoles();
    }
  };

  const onEditRole = (role: IRole) => {
    showModal(
      'selectedRole',
      <PermissionSelector
        submitRoleHandler={submitEditHandler}
        closeHandler={() => closeModal('selectedRole')}
        deleteRoleHandler={deleteRoleHanlder}
        permissions={permissions}
        role={role}
      />
    );
    // const Role = await getRoleById(projectId, roleId);
    // setEditRole(roleId);
    // setSelectedRole(Role);
    // setOpenEdit(true);
  };

  return (
    <div className={[styles['page-container']].join(' ')}>
      <div className={styles['main-container']}>
        <RoleNav />
        <div className={styles['header-container']}>
          <h1>Manage Roles</h1>
          <ButtonV2 text="Add Role" onClick={newRoleHandler} dataTestId="add-role-btn" fill />
        </div>
        {loader && roles.length === 0 ? (
          <Loading />
        ) : (
          <RoleTable roles={roles} onEditRole={onEditRole} />
        )}
      </div>
    </div>
  );
}

export default RolePage;
