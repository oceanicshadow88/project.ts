/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useEffect, useState } from 'react';
import { ILabelData } from '../../../../types';
import useOutsideAlerter from '../../../../hooks/OutsideAlerter';
import { showLabel, createLabel } from '../../../../api/label/label';
import LabelDropdown from '../../../Form/LabelDropdown/LabelDropdown';
import LabelTag from '../../../Form/LabelTag/LabelTag';

interface ITicketStatusDropDown {
  ticketLabels: ILabelData[];
  ticketId: string;
  projectId: string;
  onTicketLabelsChange: (ticketLabels: ILabelData[]) => void;
  dataTestId: string;
  // isDisabled: boolean;
}

export default function TicketStatusDropDown({
  ticketLabels,
  ticketId,
  projectId,
  onTicketLabelsChange,
  dataTestId
}: // isDisabled
ITicketStatusDropDown) {
  const { myRef } = useOutsideAlerter(false);

  const [availableLabels, setAvailableLabels] = useState<ILabelData[]>([]);

  const [showNewLabel, setShowNewLabel] = useState(false);

  const [inputLabelName, setInputLabelName] = useState('');

  const buildAvailableLabels = async () => {
    const res = await showLabel(projectId);
    setAvailableLabels(res.data.filter((label) => !ticketLabels.some((t) => t.id === label.id)));
  };

  useEffect(() => {
    buildAvailableLabels();
  }, [ticketLabels]);

  const handleInputLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setInputLabelName(e.target.value);

    if (inputValue === '') {
      setShowNewLabel(false);
      return;
    }

    const hasLabel = [...ticketLabels, ...availableLabels].some(
      (label) => label.name.toLowerCase() === inputValue.toLowerCase()
    );

    setShowNewLabel(!hasLabel);
  };

  const clearInput = () => {
    handleInputLabelChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
  };

  const handleCreateNewLabel = async () => {
    const res = await createLabel(ticketId, {
      name: inputLabelName,
      slug: inputLabelName.toLowerCase().replaceAll(' ', '-')
    });

    if (!res?.data) return;
    onTicketLabelsChange([...ticketLabels, res.data]);
    setShowNewLabel(false);
    clearInput();
  };

  const handleDeleteTag = (labelId: string) => {
    onTicketLabelsChange(ticketLabels.filter((t) => t.id !== labelId));
  };

  const handleAddLabelToTicket = (label: ILabelData) => {
    onTicketLabelsChange([...ticketLabels, label]);
  };

  useEffect(() => {
    buildAvailableLabels();
  }, [ticketLabels]);

  const renderExistingLabels = () => {
    return ticketLabels.map((label) => (
      <div key={label.id} className="m-2">
        <LabelTag label={label} onRemoveLabel={handleDeleteTag} />
      </div>
    ));
  };

  const filteredLabels = availableLabels.filter((label) =>
    label.name.toLowerCase().includes(inputLabelName.toLowerCase())
  );

  return (
    <div
      ref={myRef}
      className="text-xs h-full w-full"
      data-testid={dataTestId}
      onClick={() => {
        setShowNewLabel(!showNewLabel);
      }}
      style={{ minHeight: '28px' }}
    >
      <div className="flex flex-wrap items-center w-full">
        <div className="w-full flex flex-col">{renderExistingLabels()}</div>
        <LabelDropdown
          isOpen={showNewLabel}
          searchTerm={inputLabelName}
          setSearchTerm={setInputLabelName}
          filteredLabels={filteredLabels}
          loading={false}
          canCreateNewLabel={showNewLabel}
          handleLabelClick={(labelId: string) => {
            const label = availableLabels.find((l) => l.id === labelId);
            if (label) {
              handleAddLabelToTicket(label);
            }
          }}
          handleCreateNewLabel={handleCreateNewLabel}
        />
      </div>
    </div>
  );
}
