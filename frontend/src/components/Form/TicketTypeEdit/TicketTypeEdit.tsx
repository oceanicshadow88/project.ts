import React, { useContext } from 'react';
import { ProjectDetailsContext } from '../../../context/ProjectDetailsProvider';
import { ITypes, IMinEvent } from '../../../types';
import Dropdown from '../../../lib/FormV3/Dropdown/Dropdown';

type SelectProps = {
  ticketId: string;
  value?: ITypes;
  onChange: (value: ITypes | undefined) => void;
  updateTicketType: (newTypeId: string) => Promise<void>;
  isDisabled: boolean;
};

export default function TicketTypeEdit({
  ticketId,
  value,
  onChange,
  updateTicketType,
  isDisabled
}: SelectProps) {
  const projectDetails = useContext(ProjectDetailsContext);

  // Create dropdown options from ticket types
  const dropdownOptions = projectDetails.ticketTypes.map((type: ITypes) => ({
    value: type.id,
    label: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img src={type.icon} alt={type.name} style={{ width: '16px', height: '16px' }} />
        <span>{type.name}</span>
      </div>
    ),
    icon: <img src={type.icon} alt={type.name} style={{ width: '16px', height: '16px' }} />
  }));

  const onTypeChange = async (e: IMinEvent) => {
    if (isDisabled) return;

    const selectedType = projectDetails.ticketTypes.find(
      (type: ITypes) => type.id === e.target.value
    );
    if (selectedType) {
      onChange(selectedType);
      await updateTicketType(selectedType.id);
    }
  };

  return (
    <div data-testid={`types-btn-${ticketId}`} style={{ paddingLeft: '10px' }}>
      <Dropdown
        label=""
        name={`ticket-type-${ticketId}`}
        value={value?.id || ''}
        options={dropdownOptions}
        onValueChanged={onTypeChange}
        placeHolder="Select Type"
        dataTestId={`ticket-type-dropdown-${ticketId}`}
        hasBorder={false}
        displayIcon
      />
    </div>
  );
}
