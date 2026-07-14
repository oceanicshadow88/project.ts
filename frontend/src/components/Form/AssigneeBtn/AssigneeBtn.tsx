import React from 'react';
import Dropdown from '../../../lib/FormV3/Dropdown/Dropdown';
import { IUserInfo, IMinEvent } from '../../../types';
import { updateTicket } from '../../../api/ticket/ticket';
import Avatar from '../../Avatar/Avatar';

interface IAssigneeBtn {
  assigneeId?: string | null;
  ticketId: string;
  userList: IUserInfo[];
  getBacklogDataApi?: () => void;
  isDisabled?: boolean;
  displayIcon?: boolean;
  name: string;
  onChange?: (value?: string | null) => void;
}

export default function AssigneeBtn({
  assigneeId,
  userList,
  ticketId,
  getBacklogDataApi,
  isDisabled = false,
  displayIcon = false,
  name,
  onChange
}: IAssigneeBtn) {
  // Create dropdown options from user list
  const dropdownOptions = [
    {
      value: null,
      label: 'Unassigned',
      icon: <Avatar className={!displayIcon ? 'mr-2' : ''} />
    },
    ...userList.map((user) => ({
      value: user.id,
      label: user.name,
      icon: (
        <Avatar
          avatarIcon={user?.avatarIcon}
          name={user?.name}
          backgroundColor={user.backgroundColor}
          className={!displayIcon ? 'mr-2' : ''}
        />
      )
    }))
  ];

  const onAssigneeChange = async (e: IMinEvent) => {
    if (isDisabled) return;
    if (onChange) {
      onChange(e.target.value);
      return;
    }

    const data = { [name]: e.target.value };
    await updateTicket(ticketId, data);
    getBacklogDataApi?.();
  };

  return (
    <Dropdown
      label=""
      name={`assignee-${ticketId}`}
      value={assigneeId || null}
      options={dropdownOptions}
      onValueChanged={onAssigneeChange}
      placeHolder="Unassigned"
      dataTestId={`assignee-dropdown-${ticketId}`}
      hasBorder={false}
      displayIcon={displayIcon}
      addNullOptions={false}
      overWriteButtonStyle={{ padding: '2px' }}
    />
  );
}
