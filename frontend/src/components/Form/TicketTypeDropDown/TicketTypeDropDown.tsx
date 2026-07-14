import React from 'react';
import { ITypes, IMinEvent } from '../../../types';
import Dropdown from '../../../lib/FormV3/Dropdown/Dropdown';
import TypeIcon from '../../shared/TypeIcon/TypeIcon';

export interface ISelectProps {
  value?: ITypes;
  ticketTypes: ITypes[];
  showButtonText?: boolean;
  onChange: (fieldName: string, value: any) => void;
  isDisabled: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const iconSizeMap = {
  sm: 16,
  md: 20,
  lg: 25
};

export default function TicketTypeDropDown({
  value,
  ticketTypes,
  onChange,
  isDisabled,
  showButtonText = false,
  size = 'md'
}: ISelectProps) {
  const iconSize = iconSizeMap[size];

  const options = ticketTypes.map((type) => ({
    label: type.name,
    value: type.id,
    icon: (
      <TypeIcon
        imgUrl={type.icon}
        name={type.name}
        iconSize={iconSize}
        className={showButtonText ? 'mr-2' : ''}
      />
    )
  }));

  const handleValueChanged = (e: IMinEvent) => {
    if (isDisabled) return;
    const selectedType = ticketTypes.find((t) => t.id === e.target.value);
    if (selectedType) {
      onChange('type', selectedType);
    }
  };

  return (
    <Dropdown
      label=""
      name="type"
      value={value?.id || null}
      options={options}
      onValueChanged={handleValueChanged}
      hasBorder={false}
      displayIcon={!showButtonText}
      placeHolder={showButtonText ? value?.name || 'Select Type' : ''}
      overWriteButtonStyle={{ padding: '5px 10px' }}
    />
  );
}
