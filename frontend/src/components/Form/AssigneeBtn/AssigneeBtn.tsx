import React from 'react';
import Dropdown from '../../../lib/FormV3/Dropdown/Dropdown';
import { IUserInfo, IMinEvent, IAssign } from '../../../types';
import { updateTicket } from '../../../api/ticket/ticket';
import Avatar from '../../Avatar/Avatar';

interface IAssigneeBtn {
  // the ticket endpoints populate `assign` into a user object, while the detail
  // card and the question list pass the raw id, so accept either shape
  assigneeId?: string | IAssign | null;
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
  const selectedAssigneeId = typeof assigneeId === 'object' ? assigneeId?.id : assigneeId;

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
      value={selectedAssigneeId || null}
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
