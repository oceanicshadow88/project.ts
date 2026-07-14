import React from 'react';
import Dropdown from '../../../lib/FormV3/Dropdown/Dropdown';
import { IStatus, IMinEvent } from '../../../types';
import { updateTicketStatus } from '../../../api/ticket/ticket';
import Button from '../Button/Button';

interface IToolBar {
  statusId?: any;
  ticketId: string;
  statusOptions: IStatus[];
  getBacklogDataApi?: () => void;
  isDisabled: boolean;
}

export default function StatusBtn({
  statusId,
  ticketId,
  statusOptions,
  getBacklogDataApi,
  isDisabled
}: IToolBar) {
  const currentStatus = statusOptions.find((item) => item.id === statusId);
  const statusColor = currentStatus?.color || '#6a2add';
  const statusName = currentStatus?.name?.toUpperCase() ?? 'BACKLOG';

  const options = statusOptions.map((status) => ({
    label: (
      <Button
        overrideStyle={[
          statusId === status.id ? 'background-light-grey' : 'background-transparent',
          statusId === status.id ? 'background-light-grey' : 'hover-background-light-grey',
          'w-full',
          'p-0',
          'justify-start'
        ].join(' ')}
        dataTestId={`status-drop-item-${ticketId}-${status.id}`}
        style={{
          borderLeft: `5px solid ${status.color}`,
          height: statusId === status.id ? '1.5rem' : '2.0rem'
        }}
      >
        <span>{status.name.toUpperCase()}</span>
      </Button>
    ),
    value: status.id
  }));

  const handleValueChanged = async (e: IMinEvent) => {
    if (isDisabled) return;
    const updateStatusId = e.target.value;
    if (updateStatusId && updateStatusId !== statusId) {
      await updateTicketStatus(ticketId, updateStatusId);
      if (getBacklogDataApi) getBacklogDataApi();
    }
  };

  return (
    <div data-testid={`status-container-${ticketId}`}>
      <Dropdown
        name={`status-${ticketId}`}
        label=""
        value={statusId || null}
        options={options}
        onValueChanged={handleValueChanged}
        placeHolder={statusName}
        hasBorder={false}
        dataTestId={`status-drop-btn-${ticketId}`}
        color={statusColor}
      />
    </div>
  );
}
