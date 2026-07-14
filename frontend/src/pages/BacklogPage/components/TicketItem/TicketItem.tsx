/* eslint-disable no-unused-vars */
import React, { useContext, useEffect, useState } from 'react';
import { FaPen, FaRobot } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { MdContentCopy, MdTitle } from 'react-icons/md';
import { IoWarning } from 'react-icons/io5';
import { useParams } from 'react-router-dom';
import { BsQuestionCircle } from 'react-icons/bs';
import IconButton from '../../../../components/Form/Button/IconButton/IconButton';
import OverFlowMenuBtn from '../OverFlowMenuBtn/OverFlowMenuBtn';
import PriorityBtn from '../../../../components/Form/PriorityBtn/PriorityBtn';
import AssigneeBtn from '../../../../components/Form/AssigneeBtn/AssigneeBtn';
import useOutsideAlerter from '../../../../hooks/OutsideAlerter';
import TicketTypeDropDown from '../../../../components/Form/TicketTypeDropDown/TicketTypeDropDown';
import { ProjectDetailsContext } from '../../../../context/ProjectDetailsProvider';
import StatusBtn from '../../../../components/Form/StatusBtn/StatusBtn';
import { ITicketBasic, ITicketDetails, ITicketInput, ITypes } from '../../../../types';
import {
  updateTicket,
  deleteTicket,
  updateTicketSprint,
  removeTicket
} from '../../../../api/ticket/ticket';
import { IQuestion } from '../../../../api/question/entity/question';
import TicketDetailCard from '../../../../components/TicketDetailCard/TicketDetailCard';
import { ModalContext } from '../../../../context/ModalProvider';
import checkAccess from '../../../../utils/helpers';
import { Permission } from '../../../../utils/permission';
import LabelPicker from '../../../../components/Form/LabelPicker/LabelPicker';
import LabelTag from '../../../../components/Form/LabelTag/LabelTag';
import Dropdown from '../../../../lib/FormV3/Dropdown/Dropdown';
import { hackConfig } from '../../../../config/hack';

interface ITicketInputProps {
  readonly ticket: ITicketBasic;
  readonly showDropDownOnTop?: boolean;
  readonly onTicketChanged: () => void;
  readonly isReadOnly: boolean;
  readonly onLabelClick?: (labelId: string) => void;
  onAIClick?: (id: string, data: ITicketInput) => void;
  unresolvedQuestions?: IQuestion[];
}
export default function TicketItem({
  ticket,
  showDropDownOnTop,
  onTicketChanged,
  isReadOnly,
  onLabelClick,
  onAIClick,
  unresolvedQuestions = []
}: ITicketInputProps) {
  const [title, setTitle] = useState(ticket.title);
  const [value, setValue] = useState(ticket.type);
  const [epicId, setEpicId] = useState<string | null>(ticket.epic);
  const projectDetails = useContext(ProjectDetailsContext);
  const { showModal } = useContext(ModalContext);
  const { projectId = '' } = useParams();

  const updateTicketTitleContent = async () => {
    if (title.trim() === ticket.title) {
      return;
    }
    const data = { title: title.trim() };
    await updateTicket(ticket.id, data);
    onTicketChanged();
  };

  const updateTicketType = async (newTypeId: string) => {
    const data = { type: newTypeId };
    await updateTicket(ticket.id, data);
    onTicketChanged();
  };

  const { visible, setVisible, myRef } = useOutsideAlerter(false);

  const saveKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return;
    }
    updateTicketTitleContent();
    setVisible(false);
    onTicketChanged();
  };

  const onClickDelete = async () => {
    await deleteTicket(ticket.id);
    onTicketChanged();
    setVisible(false);
  };

  const onClickAddToBacklog = async () => {
    await updateTicketSprint(ticket.id, null);
    onTicketChanged();
    setVisible(false);
  };

  const onClickAddToSprint = async (sprintId: string) => {
    await updateTicketSprint(ticket.id, sprintId);
    onTicketChanged();
    setVisible(false);
  };

  const onClickCopyLink = () => {
    navigator.clipboard.writeText(`${globalThis.location.origin}/tickets/${ticket.id}`);
    toast.success('Copied', {
      theme: 'colored',
      className: 'primaryColorBackground'
    });
  };

  const onClickCopyTitle = () => {
    const ticketNumber = `${projectDetails.details.key}-${ticket.ticketNumber}`;
    const fullTitle = `${ticketNumber}: ${ticket.title}`;
    navigator.clipboard.writeText(fullTitle);
    toast.success('Title Copied', {
      theme: 'colored',
      className: 'primaryColorBackground'
    });
  };

  const onAddLabelToTicket = async (labelId: string) => {
    // Get current labels and add the new one
    const currentLabels = (ticket as any).labels || [];
    const newLabels = [...currentLabels.map((label: any) => label.id), labelId];

    await updateTicket(ticket.id, { labels: newLabels });
    onTicketChanged();

    toast.success('Label added to ticket', {
      theme: 'colored',
      className: 'primaryColorBackground'
    });
  };

  const onRemoveLabelFromTicket = async (labelId: string) => {
    try {
      const currentLabels = (ticket as any).labels || [];
      const newLabels = currentLabels
        .filter((label: any) => label.id !== labelId)
        .map((label: any) => label.id);

      await updateTicket(ticket.id, { labels: newLabels });
      onTicketChanged();

      toast.success('Label removed from ticket', {
        theme: 'colored',
        className: 'primaryColorBackground'
      });
    } catch {
      toast.error('Failed to remove label', {
        theme: 'colored',
        className: 'primaryColorBackground'
      });
    }
  };

  const onSavedTicket = async (data: ITicketDetails) => {
    const updateData = {
      ...data,
      project: data.project.id,
      labels: data.labels?.map((tag) => tag.id)
    };

    await updateTicket(data.id, updateData);
    onTicketChanged();
  };

  const onChangeEpic = async (ticketId: string, updatedEpicId: string | null) => {
    await updateTicket(ticketId, { epic: updatedEpicId });
    setEpicId(updatedEpicId);
    onTicketChanged();
  };

  const isTicketStale = () => {
    if (!ticket.updatedAt) return false;
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - hackConfig.updateAtCheck);
    return new Date(ticket.updatedAt) < threeMonthsAgo;
  };

  useEffect(() => {
    setTitle(ticket.title);
    setValue(ticket.type);
  }, [ticket]);

  if (projectDetails.isLoadingDetails) {
    return <></>;
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className="group flex justify-between items-center cursor-pointer py-1.25 border border-b border-light bg-white text-15 hover:shadow-md"
      data-testid={`ticket-hover-${ticket.id}`}
      data-testid-count="filter-issues"
      ref={myRef}
      onDoubleClick={() => {
        showModal(
          'ticketDetailCard',
          <TicketDetailCard
            projectId={projectId}
            ticketId={ticket.id}
            onDeletedTicket={removeTicket}
            onSavedTicket={onSavedTicket}
            isReadOnly={isReadOnly}
          />
        );
      }}
    >
      <div className="flex w-full h-full items-center" style={{ maxWidth: '60%' }}>
        <TicketTypeDropDown
          value={value}
          ticketTypes={projectDetails.ticketTypes as unknown as ITypes[]}
          onChange={async (fieldName: string, selectedType: ITypes) => {
            setValue(selectedType);
            await updateTicketType(selectedType.id);
          }}
          isDisabled={isReadOnly}
          showButtonText={false}
          size="md"
        />
        <p>{`${projectDetails.details.key}-${ticket.ticketNumber}`}</p>
        {visible ? (
          <input
            type="text"
            defaultValue={ticket.title}
            onKeyDown={saveKeyPress}
            className="min-w-70 text-15 border-2 border-light rounded-md px-3 py-2 ml-1.75 bg-white transition-all outline-none shadow-sm focus:border-primary focus:shadow-focus focus:bg-gray-50 hover:border-blue hover:bg-gray-50 placeholder:text-gray-500"
            data-testid={'ticket-title-input-'.concat(ticket.id)}
            onChange={(e) => {
              setTitle(e.target.value);
            }}
          />
        ) : (
          <div
            className="flex flex-col items-start mx-2.5 overflow-hidden w-auto"
            data-testid={`ticket-${ticket.id}`}
            style={{ maxWidth: '60%' }}
          >
            <div className="truncate overflow-hidden w-full mb-1">{ticket.title}</div>
            {(ticket as any).labels && (ticket as any).labels.length > 0 && (
              <div className="flex flex-wrap gap-2.5 mt-1">
                {[...((ticket as any).labels || [])]
                  .sort((a: any, b: any) => a.name.localeCompare(b.name))
                  .map((label: any) => (
                    <LabelTag
                      key={label.id}
                      label={label}
                      projectLabels={projectDetails?.labels}
                      isReadOnly={isReadOnly}
                      onLabelClick={onLabelClick}
                      onRemoveLabel={onRemoveLabelFromTicket}
                    />
                  ))}
              </div>
            )}
          </div>
        )}
        {!visible && (
          <div className="invisible group-hover:visible flex items-center mr-2.5 gap-2">
            <IconButton
              icon={<MdContentCopy size={12} />}
              ticketId={ticket.id}
              tooltip="Copy Link"
              onClick={onClickCopyLink}
            />
            <IconButton
              icon={<MdTitle size={12} />}
              ticketId={ticket.id}
              tooltip="Copy Title"
              onClick={onClickCopyTitle}
            />
            {!isReadOnly && (
              <IconButton
                icon={<FaPen size={12} />}
                ticketId={ticket.id}
                tooltip="Edit"
                onClick={() => {
                  setVisible(true);
                }}
              />
            )}
            {onLabelClick && (
              <LabelPicker
                projectId={projectId}
                ticketId={ticket.id}
                onLabelClick={onAddLabelToTicket}
                isDisabled={isReadOnly}
                currentLabels={(ticket as any).labels || []}
              />
            )}
            {onAIClick && (
              <IconButton
                icon={<FaRobot size={15} />}
                ticketId={ticket.id}
                tooltip="AI Assistant"
                onClick={() => onAIClick(ticket.id, ticket as any)}
              />
            )}
          </div>
        )}
      </div>
      <div className="flex items-center justify-end gap-2 mr-2.5 w-auto">
        {isTicketStale() && (
          <IoWarning
            className="text-alert"
            size={20}
            title="Ticket hasn't been updated in over 3 months"
          />
        )}
        {unresolvedQuestions.length > 0 && (
          <BsQuestionCircle className="text-alert" size={18} title="Unresolved questions" />
        )}
        <PriorityBtn
          ticketId={ticket.id}
          priority={ticket.priority}
          getBacklogDataApi={onTicketChanged}
          isDisabled={isReadOnly}
          displayIcon
        />
        <Dropdown
          options={projectDetails.epics.map((item) => {
            return {
              label: item.title,
              value: item.id
            };
          })}
          label="Epic"
          name="epic"
          onValueChanged={(e) => {
            onChangeEpic(ticket.id, e.target.value);
          }}
          value={epicId}
          hasBorder={false}
          placeHolder="None"
          addNullOptions
          color={projectDetails.epics.find((item) => item.id === epicId)?.color}
          alignCenter
        />
        <StatusBtn
          statusId={ticket?.status}
          ticketId={ticket?.id}
          statusOptions={projectDetails.statuses}
          getBacklogDataApi={onTicketChanged}
          isDisabled={isReadOnly}
        />
        <AssigneeBtn
          ticketId={ticket.id}
          assigneeId={ticket?.assign}
          userList={projectDetails.users}
          getBacklogDataApi={onTicketChanged}
          isDisabled={isReadOnly}
          displayIcon
          name="assign"
        />
        <OverFlowMenuBtn
          ticketId={ticket.id}
          showDropDownOnTop={showDropDownOnTop}
          className="invisible group-hover:visible"
          items={[
            {
              name: 'Copy issue link',
              onClick: onClickCopyLink,
              show: true
            },
            {
              name: 'Copy title',
              onClick: onClickCopyTitle,
              show: true
            },
            {
              name: 'Delete',
              onClick: onClickDelete,
              show: checkAccess(Permission.DeleteTickets, projectId)
            },
            ...(isReadOnly
              ? []
              : [
                  {
                    name: 'Add to Backlog',
                    onClick: onClickAddToBacklog,
                    show: Boolean(ticket.sprint)
                  },
                  ...projectDetails.sprints
                    .filter((item) => item.status !== 'completed')
                    .map((item) => ({
                      name: `Add to ${item.name}`,
                      onClick: () => onClickAddToSprint(item.id),
                      show: !ticket.sprint
                    }))
                ])
          ]}
        />
      </div>
    </div>
  );
}
TicketItem.defaultProps = {
  showDropDownOnTop: false
};
