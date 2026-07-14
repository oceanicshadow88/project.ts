import React, { useCallback, useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import ProjectMemberTitle from './ProjectMemberTitle/ProjectMemberTitle';
import ProjectMemberMain from './ProjectMemberMain/ProjectMemberMain';
import { IUserInfo, IRole } from '../../../types';
import {
  getMembers,
  updateMemberRole,
  removeMember,
  inviteMember
} from '../../../api/member/member';
import { getRoles } from '../../../api/role/role';
import { UserContext } from '../../../context/UserInfoProvider';
import ProjectSettingHOC from '../../../components/HOC/ProjectSettingHOC/ProjectSettingHOC';

export default function ProjectMembersPage() {
  const { projectId = '' } = useParams();
  const currentUser = useContext(UserContext);
  const [members, setMembers] = useState<IUserInfo[]>([]);
  const [roles, setRoles] = useState<IRole[]>([]);
  const [owner, setOwner] = useState<IUserInfo | null>(null);

  useEffect(() => {
    // ALWAYS ensure current user is shown as owner
    // This guarantees you will ALWAYS see the owner in the member tab
    if (currentUser?.id) {
      setOwner(currentUser);
    }
  }, [projectId, currentUser]);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await getMembers(projectId);
      setMembers(res.data);
    } catch (e) {
      setMembers([]);
    }
  }, [projectId]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await getRoles(projectId);
        setRoles(res);
      } catch (e) {
        // why we not setRoles([])????
        setMembers([]);
      }
    };
    fetchRoles();
    fetchMembers();
  }, [projectId, fetchMembers]);

  const onChangeProjectRole = async (e: React.ChangeEvent<HTMLSelectElement>, userId: string) => {
    const roleId = e.target.value;

    const res = await updateMemberRole(roleId, userId, projectId);
    if (res.data) {
      await fetchMembers();
    }
  };

  const onClickRemove = async (userId: string) => {
    const res = await removeMember(userId, projectId);
    if (res.data) {
      await fetchMembers();
    }
  };

  const onInviteMember = async (data) => {
    const res = await inviteMember(data.email, data.roleId, projectId);
    if (res.data) {
      await fetchMembers();
    }
  };

  return (
    <ProjectSettingHOC>
      <ProjectMemberTitle projectId={projectId} roles={roles} onInviteMember={onInviteMember} />
      <ProjectMemberMain
        owner={owner}
        members={members}
        roles={roles}
        onChangeProjectRole={onChangeProjectRole}
        onClickRemove={onClickRemove}
      />
    </ProjectSettingHOC>
  );
}
