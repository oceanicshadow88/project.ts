import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MdDeleteOutline, MdWarning } from 'react-icons/md';
import { IUserInfo, IRole } from '../../../../types';
import Avatar from '../../../../components/Avatar/Avatar';
import Modal from '../../../../lib/Modal/Modal';
import ButtonV2 from '../../../../lib/FormV2/ButtonV2/ButtonV2';
import styles from './ProjectMemberMain.module.scss';

interface Props {
  owner: IUserInfo | null;
  members: IUserInfo[];
  roles: IRole[];
  onChangeProjectRole: (e: React.ChangeEvent<HTMLSelectElement>, userId: string) => void;
  onClickRemove: (userId: string) => void;
}

export default function ProjectMemberMain({
  owner,
  members,
  roles,
  onChangeProjectRole,
  onClickRemove
}: Props) {
  const { projectId = '' } = useParams();
  const [confirmUser, setConfirmUser] = useState<{ id: string; name?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  return (
    <div
      className={`${styles.projectMemberMainContainer} relative mb-6 p-0 bg-white border rounded-lg shadow-md overflow-hidden`}
    >
      <table aria-label="Projects details" className="border-collapse w-full table-fixed m-0">
        <thead className="border-b bg-[#f9fafb]">
          <tr>
            <th
              className={`${styles.names} px-3 py-2.5 border-none text-left text-xs font-semibold whitespace-nowrap`}
            >
              <span>Name</span>
            </th>
            <th
              className={`${styles.email} px-3 py-2.5 border-none text-left text-xs font-semibold whitespace-nowrap`}
            >
              <span>Email</span>
            </th>
            <th
              className={`${styles.role} px-3 py-2.5 border-none text-left text-xs font-semibold whitespace-nowrap`}
            >
              <span>Role</span>
            </th>
            <th className={`${styles.buttons} px-3 py-2.5 border-none text-left`}>
              <span />
            </th>
          </tr>
        </thead>
        <tbody className="w-full">
          {owner && (
            <tr className="border-b hover:bg-[#f9fafb]">
              <th
                className={`${styles.name} flex items-center gap-2 px-3 py-3 flex-1 flex-row w-full whitespace-nowrap overflow-hidden`}
              >
                <Avatar
                  avatarIcon={owner.avatarIcon}
                  backgroundColor={owner.backgroundColor}
                  name={owner.name}
                />
                <span className="truncate text-sm font-normal">{owner.name}</span>
              </th>
              <th
                className={`${styles.email} text-left px-3 py-3 whitespace-nowrap overflow-hidden`}
              >
                <span className="truncate text-sm font-normal">{owner.email ?? '-'}</span>
              </th>
              <th className={`${styles.role} overflow-hidden border-none text-left px-3 py-3`}>
                <span>
                  <select
                    value="Owner"
                    disabled
                    className="w-full h-8 border rounded-md bg-white px-2.5 text-sm outline-none transition-all"
                  >
                    <option value={owner.id}>Owner</option>
                  </select>
                </span>
              </th>
              <th className={`${styles.buttons} px-3 py-3 flex items-center justify-end`}>
                <span />
              </th>
            </tr>
          )}
          {members.map((member) => {
            return (
              <tr key={member.id} className="border-b hover:bg-[#f9fafb]">
                <th
                  className={`${styles.name} flex items-center gap-2 px-3 py-3 flex-1 flex-row w-full whitespace-nowrap overflow-hidden`}
                >
                  <Avatar
                    avatarIcon={member?.avatarIcon}
                    backgroundColor={member?.backgroundColor}
                    name={member?.name}
                  />
                  <span className="truncate text-sm font-normal">{member.name}</span>
                </th>
                <th
                  className={`${styles.email} text-left px-3 py-3 whitespace-nowrap overflow-hidden`}
                >
                  <span className="truncate text-sm font-normal">{member.email ?? '-'}</span>
                </th>
                <th className={`${styles.role} overflow-hidden border-none text-left px-3 py-3`}>
                  <span>
                    <select
                      className="w-full h-8 border rounded-md bg-white px-2.5 text-sm outline-none transition-all"
                      value={
                        member?.projectsRoles?.find(
                          (projectRole) => projectRole.project === projectId
                        )?.role ?? ''
                      }
                      onChange={(e) => {
                        onChangeProjectRole(e, member.id ?? '');
                      }}
                    >
                      {roles.map((role: IRole) => {
                        return (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        );
                      })}
                    </select>
                  </span>
                </th>
                <th className={`${styles.buttons} px-3 py-3 flex items-center justify-end`}>
                  <ButtonV2
                    text=""
                    icon={<MdDeleteOutline size={16} />}
                    customStyles={styles.iconDangerBtn}
                    onClick={() => {
                      setConfirmUser({ id: member.id ?? '', name: member.name });
                    }}
                    dataTestId={`remove-member-${member.id}`}
                  />
                </th>
              </tr>
            );
          })}
        </tbody>
      </table>
      {confirmUser && (
        <Modal>
          <div className={`${styles.confirmModal} p-4 min-w-[320px]`}>
            <div
              className={`${styles.confirmHeader} flex items-center gap-2.5 text-[#ef4444] font-semibold`}
            >
              <MdWarning size={18} />
              <span>Remove member?</span>
            </div>
            <p className={`${styles.confirmText} mt-2 text-sm`}>
              {`Are you sure you want to remove ${
                confirmUser?.name ?? 'this member'
              } from this project?`}
            </p>
            <div className={`${styles.confirmActions} flex gap-2 justify-end mt-4`}>
              <ButtonV2
                text="Cancel"
                fill
                onClick={() => {
                  setConfirmUser(null);
                }}
              />
              <ButtonV2
                text="Confirm"
                danger
                onClick={async () => {
                  if (!confirmUser?.id) return;
                  try {
                    setSubmitting(true);
                    await onClickRemove(confirmUser.id);
                  } finally {
                    setSubmitting(false);
                    setConfirmUser(null);
                  }
                }}
                disabled={submitting}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
