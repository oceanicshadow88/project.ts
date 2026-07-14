import React, { useState } from 'react';
import { HiChevronDoubleUp, HiChevronUp, HiChevronDown, HiChevronDoubleDown } from 'react-icons/hi';
import { FiMinus } from 'react-icons/fi';
import Dropdown from '../../../lib/FormV3/Dropdown/Dropdown';
import { updateTicket } from '../../../api/ticket/ticket';
import { IMinEvent } from '../../../types';

interface IPriorityBtn {
  priority: string;
  ticketId: string;
  isDisabled?: boolean;
  onChange?: (value?: string | null) => void;
  getBacklogDataApi?: () => void;
  displayIcon?: boolean;
}

function PriorityIcon({
  imgUrl,
  p,
  displayIcon = false
}: {
  imgUrl?: string;
  p: string;
  displayIcon?: boolean;
}) {
  const [error, setError] = useState(false);
  const colorMap: Record<string, string> = {
    Highest: '#dc2626',
    High: '#f97316',
    Medium: '#6b7280',
    Low: '#0ea5e9',
    Lowest: '#22c55e'
  };
  const color = colorMap[p] || '#6b7280';
  if (!error && imgUrl) {
    return <img src={imgUrl} alt={p} onError={() => setError(true)} />;
  }
  const baseStyle = { verticalAlign: 'middle', marginRight: displayIcon ? '0px' : '5px' };
  // Chevron icons + color per priority
  if (p === 'Highest')
    return <HiChevronDoubleUp size={20} color={color} aria-label={p} style={baseStyle} />;
  if (p === 'High') return <HiChevronUp size={20} color={color} aria-label={p} style={baseStyle} />;
  if (p === 'Medium') return <FiMinus size={18} color={color} aria-label={p} style={baseStyle} />;
  if (p === 'Low')
    return <HiChevronDown size={20} color={color} aria-label={p} style={baseStyle} />;
  if (p === 'Lowest')
    return <HiChevronDoubleDown size={20} color={color} aria-label={p} style={baseStyle} />;
  return <FiMinus size={18} color={color} aria-label={p} style={baseStyle} />;
}

export default function PriorityBtn({
  priority,
  ticketId,
  getBacklogDataApi,
  isDisabled = false,
  onChange,
  displayIcon = false
}: IPriorityBtn) {
  const allPriorities = [
    {
      priority: 'Highest',
      imgUrl: 'https://010001.atlassian.net/images/icons/priorities/highest.svg'
    },
    { priority: 'High', imgUrl: 'https://010001.atlassian.net/images/icons/priorities/high.svg' },
    {
      priority: 'Medium',
      imgUrl: 'https://010001.atlassian.net/images/icons/priorities/medium.svg'
    },
    { priority: 'Low', imgUrl: 'https://010001.atlassian.net/images/icons/priorities/low.svg' },
    {
      priority: 'Lowest',
      imgUrl: 'https://010001.atlassian.net/images/icons/priorities/lowest.svg'
    }
  ];

  const dropdownOptions = allPriorities.map((item) => ({
    value: item.priority,
    label: item.priority,
    icon: <PriorityIcon imgUrl={item.imgUrl} p={item.priority} displayIcon={displayIcon} />
  }));

  const onPriorityChange = async (e: IMinEvent) => {
    if (isDisabled || e.target.value === priority) return;

    const data = { priority: e.target.value };
    await updateTicket(ticketId, data);
    if (onChange) {
      onChange(e.target.value);
      return;
    }
    if (getBacklogDataApi) {
      getBacklogDataApi();
    }
  };

  return (
    <Dropdown
      label=""
      name={`priority-${ticketId}`}
      value={priority}
      options={dropdownOptions}
      onValueChanged={onPriorityChange}
      placeHolder="Select Priority"
      dataTestId={`priority-dropdown-${ticketId}`}
      hasBorder={false}
      displayIcon={displayIcon}
    />
  );
}
