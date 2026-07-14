import React, { useContext } from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { ProjectDetailsContext } from '../../../context/ProjectDetailsProvider';
import TicketItem from '../../../pages/BacklogPage/components/TicketItem/TicketItem';
import { ITicketBasic, ITicketInput } from '../../../types';
import checkAccess from '../../../utils/helpers';
import { Permission } from '../../../utils/permission';
import { IQuestion } from '../../../api/question/entity/question';

interface IProps {
  onTicketChanged: () => void;
  data: ITicketBasic[];
  isBacklog?: boolean;
  droppableId: string;
  onLabelClick?: (labelId: string) => void;
  onAIClick?: (ticketId: string, data: ITicketInput) => void;
  unresolvedQuestionsByTicket?: { [ticketId: string]: IQuestion[] };
}

export default function DroppableTicketItems({
  onTicketChanged,
  data,
  isBacklog = false,
  droppableId,
  onLabelClick,
  onAIClick,
  unresolvedQuestionsByTicket = {}
}: IProps) {
  const projectDetails = useContext(ProjectDetailsContext);
  const projectId = projectDetails.details.id;

  const calculateShowDropDownTop = () => {
    if (!isBacklog) {
      return false;
    }
    let totalIncompleteSprint = 0;
    projectDetails.sprints.forEach((sprint) => {
      if (sprint.status !== 'completed') {
        totalIncompleteSprint += 1;
      }
    });
    if (totalIncompleteSprint > 3) {
      return true;
    }
    let totalTicket = 0;

    totalTicket += data?.length ?? 0;
    return totalTicket > 7;
  };
  return (
    <Droppable droppableId={droppableId}>
      {(provided) => {
        return (
          <div
            /* eslint-disable react/jsx-props-no-spreading */
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {data?.map((ticket, index) => {
              return (
                <Draggable key={ticket.id} draggableId={ticket.id ?? ''} index={index}>
                  {(provided2) => {
                    return (
                      <div
                        ref={provided2.innerRef}
                        {...provided2.dragHandleProps}
                        {...provided2.draggableProps}
                        aria-hidden="true"
                      >
                        {checkAccess(Permission.viewTickets, projectId) && (
                          <TicketItem
                            ticket={ticket}
                            showDropDownOnTop={
                              (calculateShowDropDownTop() && index > data?.length) ?? 0 - 6
                            }
                            onTicketChanged={onTicketChanged}
                            isReadOnly={!checkAccess(Permission.EditTickets, projectId)}
                            onLabelClick={onLabelClick}
                            onAIClick={onAIClick}
                            unresolvedQuestions={unresolvedQuestionsByTicket[ticket.id] || []}
                          />
                        )}
                      </div>
                    );
                  }}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        );
      }}
    </Droppable>
  );
}
