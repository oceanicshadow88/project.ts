import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import InviteMemberFloatForm from '../InviteMemberFloatForm/InviteMemberFloatForm';
import { ModalContext } from '../../../../context/ModalProvider';
import ButtonV2 from '../../../../lib/FormV2/ButtonV2/ButtonV2';

interface Props {
  projectId: string;
  roles: any;
  onInviteMember: (data: any) => void;
}

export default function ProjectMemberTitle({ projectId, roles, onInviteMember }: Props) {
  const navigate = useNavigate();
  const { showModal } = useContext(ModalContext);

  return (
    <div className="flex flex-row justify-end items-center mb-4">
      <div className="flex flex-row justify-end gap-2">
        <ButtonV2
          text="Add Member"
          onClick={() =>
            showModal(
              'invite-member',
              <InviteMemberFloatForm roles={roles} onInviteMember={onInviteMember} />
            )
          }
          dataTestId="invite-members"
          fill
        />
        <ButtonV2
          text="Manage Role"
          onClick={() => navigate(`/projects/${projectId}/roles`)}
          dataTestId="manage-role-btn"
          fill
        />
      </div>
    </div>
  );
}
