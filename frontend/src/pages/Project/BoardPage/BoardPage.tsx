/* eslint-disable react/jsx-props-no-spreading */
import React, { useContext, useEffect, useState, useMemo } from 'react';
import { DragDropContext, DropResult, Droppable } from 'react-beautiful-dnd';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { IProjectDetails, ProjectDetailsContext } from '../../../context/ProjectDetailsProvider';
import { getSprintTickets } from '../../../api/board/board';
import BoardToolbar, { IFilterData } from '../../../components/Board/BoardSearch/TicketSearch';
import { IMinEvent, ISprint, ISprintTicket, IStatus } from '../../../types';
import DroppableColumn from './components/DroppableColumn/DroppableColumn';
import DraggableBoardCard from './components/DraggableBoardCard/DraggableBoardCard';
import ProjectHOC from '../../../components/HOC/ProjectHOC';
import CreateBoardTicket from './components/CreateBoardTicket/CreateBoardTicket';
import ButtonV2 from '../../../lib/FormV2/ButtonV2/ButtonV2';
import { getSprintById } from '../../../utils/sprintUtils';
import { getQuestionsByProject } from '../../../api/question/question';
import { IQuestion } from '../../../api/question/entity/question';
import Dropdown from '../../../lib/FormV3/Dropdown/Dropdown';
import AddBoardColumn from './components/AddBoardColumn/AddBoardColumn';
import checkAccess from '../../../utils/helpers';
import BoardColumnsPlaceholder from '../../../components/Loading/BoardColumnsPlaceholder';
import useBoardColumns from './hooks/useBoardColumns';
import useTicketRanking from './hooks/useTicketRanking';

interface IGroupedTickets {
  status: IStatus;
  tickets: ISprintTicket[];
}

export default function BoardPage() {
  const { projectId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectDetails: IProjectDetails = useContext(ProjectDetailsContext);

  const [tickets, setTickets] = useState<ISprintTicket[]>([]);
  const [isTicketsLoading, setIsTicketsLoading] = useState(true);
  const { boardDetails, setBoardDetails, onColumnDrop, onAddColumn } = useBoardColumns(
    projectId,
    projectDetails.onUpdateBoard
  );
  const { onTicketCreate, onTicketDrop } = useTicketRanking(tickets, setTickets);
  const [selectedSprint, setSelectedSprint] = useState<ISprint | undefined>();
  const [unresolvedQuestionsByTicket, setUnresolvedQuestionsByTicket] = useState<{
    [ticketId: string]: IQuestion[];
  }>({});

  const hasSprint = selectedSprint && boardDetails;
  const isLoadingProjectDetails = projectDetails.isLoadingDetails;
  const sprintsOptions = useMemo(
    () =>
      projectDetails.sprints
        .filter((item) => item.status === 'active')
        .map((item) => ({
          label: item.name,
          value: item.id
        })),
    [projectDetails]
  );
  const ticketByStatus = tickets?.groupBy('status') ?? [];

  const ticketsByStatus = useMemo(() => {
    const res: IGroupedTickets[] =
      boardDetails?.statuses?.map((status: IStatus) => {
        const groupedSortedTickets = ticketByStatus[status.id] ?? [];
        return { status, tickets: groupedSortedTickets };
      }) ?? [];
    return res;
  }, [tickets, boardDetails]);

  const fetchUnresolvedQuestions = async () => {
    if (!projectId) return;
    try {
      const result = await getQuestionsByProject(projectId);
      const questionsData = (result?.data || []) as IQuestion[];
      // Filter unresolved questions and group by ticket ID
      const unresolved = questionsData.filter((q) => !q.isResolved);
      const questionsByTicket: { [ticketId: string]: IQuestion[] } = {};
      unresolved.forEach((question) => {
        const ticketId = typeof question.ticket === 'string' ? question.ticket : question.ticket.id;
        if (ticketId && !questionsByTicket[ticketId]) {
          questionsByTicket[ticketId] = [];
        }
        if (ticketId) {
          questionsByTicket[ticketId].push(question);
        }
      });
      setUnresolvedQuestionsByTicket(questionsByTicket);
    } catch (error) {
      setUnresolvedQuestionsByTicket({});
    }
  };

  const fetchSprintTickets = async (filterData?: IFilterData) => {
    if (!selectedSprint?.id) return;
    const res = await getSprintTickets(selectedSprint.id, filterData);
    setTickets(res);
    // Refresh questions when tickets are updated
    await fetchUnresolvedQuestions();
  };

  const fetchBoardDetails = async () => {
    if (!selectedSprint?.board) return;
    const board = projectDetails.boards.find((item) => item.id === selectedSprint.board);
    // eslint-disable-next-line no-console
    if (!board) console.error('Board not found', selectedSprint.board);
    setBoardDetails(board);
  };

  const onDragEnd = (dropResult: DropResult) => {
    if (dropResult.type === 'COLUMN') {
      onColumnDrop(dropResult);
      return;
    }
    // Reload the tickets if saving the move fails, so the board matches the server
    onTicketDrop(dropResult).catch(() => fetchSprintTickets());
  };

  const onChangeFilter = async (filterData: IFilterData) => {
    await fetchSprintTickets(filterData);
  };

  const onChangeSprint = (e: IMinEvent) => {
    setSelectedSprint(getSprintById(e.target.value as string, projectDetails));
  };

  // 1) initialize selectedSprint
  useEffect(() => {
    if (isLoadingProjectDetails) {
      return;
    }
    const sprintId = searchParams.get('sprintId');
    const currentSprint = sprintId
      ? projectDetails.sprints.find((item) => item.id === sprintId)
      : projectDetails.sprints.find((item) => item.status === 'active');

    if (!currentSprint) {
      // Clear the previous project's board when switching to a project with no active sprint
      setSelectedSprint(undefined);
      setBoardDetails(undefined);
      setTickets([]);
      setIsTicketsLoading(false);
      return;
    }
    setSelectedSprint(currentSprint);
  }, [isLoadingProjectDetails, searchParams]);

  // 2) initialize board details and board tickets
  useEffect(() => {
    if (!selectedSprint) {
      return;
    }
    (async () => {
      try {
        await Promise.all([fetchSprintTickets(), fetchBoardDetails()]);
      } finally {
        setIsTicketsLoading(false);
      }
    })();
  }, [selectedSprint]);

  // Fetch unresolved questions when projectId changes
  useEffect(() => {
    fetchUnresolvedQuestions();
  }, [projectId]);

  // Statuses are not known yet at this point, so the column count is a guess.
  if (isLoadingProjectDetails) {
    return (
      <ProjectHOC title="Board">
        <div className="px-5">
          <BoardColumnsPlaceholder withToolbar dataTestId="board-loading" />
        </div>
      </ProjectHOC>
    );
  }

  return (
    <ProjectHOC title="Board">
      <div className="px-5">
        {isTicketsLoading && (
          <BoardColumnsPlaceholder
            withToolbar
            columns={projectDetails.statuses?.length || undefined}
            dataTestId="board-loading"
          />
        )}
        {!isTicketsLoading && !hasSprint && <p>No Active Sprint</p>}
        {!isTicketsLoading && hasSprint && (
          <>
            <div className="flex justify-between items-center">
              <div style={{ maxWidth: '250px', width: '100%' }}>
                <Dropdown
                  label="Sprint"
                  dataTestId="Sprint"
                  onValueChanged={onChangeSprint}
                  onValueBlur={() => {}}
                  value={selectedSprint?.id}
                  name="sprint"
                  options={sprintsOptions}
                />
              </div>
              <ButtonV2
                text="Retro Board"
                fill
                onClick={() => {
                  navigate(`/projects/${projectId}/retro?sprintId=${selectedSprint?.id}`);
                }}
              />
            </div>
            <BoardToolbar onChangeFilter={onChangeFilter} />
            <div
              className="relative flex justify-start flex-row overflow-x-auto"
              style={{ maxWidth: '1920px' }}
            >
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="board-columns" direction="horizontal" type="COLUMN">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="flex">
                      {ticketsByStatus.map(
                        ({ status, tickets: groupedSortedTickets }, columnIndex) => (
                          <DroppableColumn
                            key={status.id}
                            index={columnIndex}
                            name={status.name}
                            id={status.id}
                            totalTicket={groupedSortedTickets.length ?? 0}
                            projectId={projectId}
                            sprintId={selectedSprint?.id}
                            createBtn={
                              <CreateBoardTicket
                                onTicketCreate={(data) => {
                                  onTicketCreate({
                                    title: data.name,
                                    status: status.id,
                                    type: data.type,
                                    projectId,
                                    sprintId: selectedSprint.id,
                                    dueAt: new Date()
                                  });
                                }}
                                className="cardAddNewCard"
                              />
                            }
                          >
                            {groupedSortedTickets?.map((item, index) => (
                              <DraggableBoardCard
                                key={item.id}
                                item={item}
                                index={index}
                                projectId={projectId}
                                onTicketUpdated={() => fetchSprintTickets()}
                                unresolvedQuestions={
                                  item.id ? unresolvedQuestionsByTicket[item.id] || [] : []
                                }
                              />
                            ))}
                          </DroppableColumn>
                        )
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
                {checkAccess('edit:boards', projectId) && <AddBoardColumn onAdd={onAddColumn} />}
              </DragDropContext>
            </div>
          </>
        )}
      </div>
    </ProjectHOC>
  );
}
