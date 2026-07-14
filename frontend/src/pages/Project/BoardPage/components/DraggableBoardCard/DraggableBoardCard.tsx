/* eslint-disable react/jsx-props-no-spreading */
import React, { useContext } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { MdContentCopy, MdTitle } from 'react-icons/md';
import { HiChevronDoubleUp, HiChevronUp, HiChevronDown, HiChevronDoubleDown } from 'react-icons/hi';
import { FiMinus } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { BsQuestionCircle } from 'react-icons/bs';
import { IoWarning } from 'react-icons/io5';
import { removeTicket, updateTicket } from '../../../../../api/ticket/ticket';
import TicketDetailCard from '../../../../../components/TicketDetailCard/TicketDetailCard';
import styles from './DraggableBoardCard.module.scss';
import { ModalContext } from '../../../../../context/ModalProvider';
import { ISprintTicket, ITicketDetails } from '../../../../../types';
import Avatar from '../../../../../components/Avatar/Avatar';
import { Permission } from '../../../../../utils/permission';
import checkAccess from '../../../../../utils/helpers';
import { ProjectDetailsContext } from '../../../../../context/ProjectDetailsProvider';
import IconButton from '../../../../../components/Form/Button/IconButton/IconButton';
import { IQuestion } from '../../../../../api/question/entity/question';

interface IDraggableBoardCard {
  item: ISprintTicket;
  index: number;
  projectId: string;
  onTicketUpdated: () => void;
  unresolvedQuestions?: IQuestion[];
}

export default function DraggableBoardCard(props: IDraggableBoardCard) {
  const { item, index, projectId, onTicketUpdated, unresolvedQuestions = [] } = props;
  const { showModal } = useContext(ModalContext);
  const projectDetails = useContext(ProjectDetailsContext);

  const handleDeletedTicket = async (id: string) => {
    await removeTicket(id);
    onTicketUpdated();
  };

  const handleSavedTicket = async (data: ITicketDetails) => {
    const updateData = {
      ...data,
      ...{ project: data.project.id },
      ...{ labels: data.labels?.map((tag) => tag.id) }
    };
    await updateTicket(data.id, updateData);
    onTicketUpdated();
  };

  const onClickCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/tickets/${item.id}`);
    toast.success('Copied', {
      theme: 'colored',
      className: 'primaryColorBackground'
    });
  };

  const onClickCopyTitle = () => {
    const ticketNumber = `${projectDetails.details.key}-${item.ticketNumber}`;
    const fullTitle = `${ticketNumber}: ${item.title}`;
    navigator.clipboard.writeText(fullTitle);
    toast.success('Title Copied', {
      theme: 'colored',
      className: 'primaryColorBackground'
    });
  };

  const renderPriorityIcon = () => {
    const p = item.priority ?? '';
    const colorMap: Record<string, string> = {
      Highest: '#dc2626',
      High: '#f97316',
      Medium: '#6b7280',
      Low: '#0ea5e9',
      Lowest: '#22c55e'
    };
    const color = colorMap[p] ?? '#6b7280';
    if (p === 'Highest') return <HiChevronDoubleUp size={16} color={color} aria-label={p} />;
    if (p === 'High') return <HiChevronUp size={16} color={color} aria-label={p} />;
    if (p === 'Medium') return <FiMinus size={14} color={color} aria-label={p} />;
    if (p === 'Low') return <HiChevronDown size={16} color={color} aria-label={p} />;
    if (p === 'Lowest') return <HiChevronDoubleDown size={16} color={color} aria-label={p} />;
    return null;
  };

  return (
    <Draggable draggableId={item.id ?? ''} index={index}>
      {(provided2) => {
        return (
          <div
            className={styles.card}
            ref={provided2.innerRef}
            {...provided2.dragHandleProps}
            {...provided2.draggableProps}
            aria-hidden="true"
            onDoubleClick={() => {
              showModal(
                'ticketDetailCard',
                <TicketDetailCard
                  projectId={projectId}
                  ticketId={item.id ?? ''}
                  onDeletedTicket={handleDeletedTicket}
                  onSavedTicket={handleSavedTicket}
                  isReadOnly={!checkAccess(Permission.EditTickets, projectId)}
                />
              );
            }}
            data-testid={`ticket-${item.id}`}
          >
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }} className="mb-2">
              {unresolvedQuestions.some((q) => !q.isClear) ? (
                <IoWarning fontSize={20} className="text-alert" />
              ) : null}
              {unresolvedQuestions.length > 0 && (
                <BsQuestionCircle className="text-alert" size={18} title="Unresolved questions" />
              )}
            </div>
            {/* Ticket Number and Action Buttons at Top */}
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderLeft}>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span className={styles.priorityIcon}>{renderPriorityIcon()}</span>
                  <span
                    className={styles.ticketNumber}
                  >{`${projectDetails.details.key}-${item.ticketNumber}`}</span>
                </div>
                {/* Action Buttons Section */}
                <div className={styles.actionButtons}>
                  <IconButton
                    icon={<MdContentCopy size={12} />}
                    ticketId={item.id}
                    tooltip="Copy Link"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClickCopyLink();
                    }}
                  />
                  <IconButton
                    icon={<MdTitle size={12} />}
                    ticketId={item.id}
                    tooltip="Copy Title"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClickCopyTitle();
                    }}
                  />
                </div>
              </div>
            </div>

            <span data-testid="ticket-labels">
              {' '}
              {item.tags?.map((tag) => {
                return (
                  <div className={styles.tag} key={tag.id}>
                    <span>{tag.name}</span>
                  </div>
                );
              })}
            </span>

            {/* Title and Assignee Column */}
            <div className={styles.titleAssigneeSection}>
              <p className={styles.titleLine}>
                {item?.title
                  ?.split(' ')
                  .map((word: string) => {
                    return word.length > 27 ? `${word.substring(0, 27)}...` : word;
                  })
                  .join(' ')}
              </p>
              <div className={styles.assigneeContainer}>
                <Avatar avatarIcon={item?.assign?.avatarIcon} name={item?.assign?.name} />
              </div>
            </div>
          </div>
        );
      }}
    </Draggable>
  );
}
