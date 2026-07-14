import React, { useContext, useEffect, useState, useMemo } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { IProjectDetails, ProjectDetailsContext } from '../../../context/ProjectDetailsProvider';
import { getSprintTickets } from '../../../api/board/board';
import { createNewTicket, updateTicketStatus } from '../../../api/ticket/ticket';
import BoardToolbar, { IFilterData } from '../../../components/Board/BoardSearch/TicketSearch';
import { IBoard, IMinEvent, ISprint, ISprintTicket, IStatus } from '../../../types';
import DroppableColumn from './components/DroppableColumn/DroppableColumn';
import DraggableBoardCard from './components/DraggableBoardCard/DraggableBoardCard';
import ProjectHOC from '../../../components/HOC/ProjectHOC';
import CreateBoardTicket from './components/CreateBoardTicket/CreateBoardTicket';
import ButtonV2 from '../../../lib/FormV2/ButtonV2/ButtonV2';
import { getSprintById } from '../../../utils/sprintUtils';
import { generateKeyBetween, customCompare } from '../../../utils/lexoRank';
import { getQuestionsByProject } from '../../../api/question/question';
import { IQuestion } from '../../../api/question/entity/question';
import Dropdown from '../../../lib/FormV3/Dropdown/Dropdown';

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
  const [boardDetails, setBoardDetails] = useState<IBoard>();
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

  const onTicketCreate = async (newTicket: ISprintTicket) => {
    const allTicketsSorted = tickets.sort((a, b) => customCompare(a?.rank, b?.rank));

    const newRank =
      allTicketsSorted.length > 0
        ? generateKeyBetween(allTicketsSorted[allTicketsSorted.length - 1]?.rank, null)
        : generateKeyBetween(null, null);

    const res = await createNewTicket({ ...newTicket, rank: newRank });
    setTickets([...tickets, res.data]);
  };

  const getNewGlobalRank = (
    destinationIndex: number,
    allTicketsSorted: ISprintTicket[],
    destinationTickets: ISprintTicket[]
  ): string => {
    const lastTicketInColumnIndex = destinationTickets.length - 1;
    const lastTicketGlobalIndex = allTicketsSorted.length - 1;
    if (lastTicketGlobalIndex < 0) {
      return generateKeyBetween(null, null);
    }
    const nextTicketInColumn =
      lastTicketInColumnIndex >= destinationIndex
        ? destinationTickets[destinationIndex]
        : undefined;

    let prev: string | null = null;
    let after: string | null = null;
    if (nextTicketInColumn) {
      // find the most nearest ticket that smaller than this nextTicketInColumn
      const nextTicketInColumnGlobalIndex = allTicketsSorted.findIndex(
        (ticket) => ticket.rank === nextTicketInColumn.rank
      );
      if (nextTicketInColumnGlobalIndex !== undefined) {
        after = nextTicketInColumn.rank ?? null;
        if (nextTicketInColumnGlobalIndex - 1 >= 0) {
          const nearestSmallerRankTicket = allTicketsSorted[nextTicketInColumnGlobalIndex - 1];
          prev = nearestSmallerRankTicket.rank ?? null;
        }
      }
    } else {
      // get the greatest rank
      const greatestRankTicket = allTicketsSorted[lastTicketGlobalIndex];
      prev = greatestRankTicket?.rank ?? null;
    }
    return generateKeyBetween(prev, after);
  };

  const onTicketDrop = async (dropResult: DropResult) => {
    const { destination, source, draggableId: currentTicketId } = dropResult;
    if (!destination) {
      return;
    }

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const currentTicket = tickets.find((item) => item.id === currentTicketId);
    if (!currentTicket) {
      return;
    }

    const allTicketsSorted = tickets
      .filter((t) => t.id !== currentTicketId)
      .sort((a, b) => customCompare(a?.rank, b?.rank));

    const destinationTicketsSorted = allTicketsSorted.filter(
      (t) => t.status === destination.droppableId
    );

    const newRank = getNewGlobalRank(destination.index, allTicketsSorted, destinationTicketsSorted);

    const updatedTicket = {
      ...currentTicket,
      status: destination.droppableId,
      rank: newRank
    };

    setTickets(tickets.map((item) => (item.id === currentTicketId ? updatedTicket : item)));
    await updateTicketStatus(currentTicketId, destination.droppableId, newRank);
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
      await fetchSprintTickets();
      await fetchBoardDetails();
    })();
  }, [selectedSprint]);

  // Fetch unresolved questions when projectId changes
  useEffect(() => {
    fetchUnresolvedQuestions();
  }, [projectId]);

  if (isLoadingProjectDetails) {
    return <></>;
  }

  return (
    <ProjectHOC title="Board">
      <div className="px-5">
        {!hasSprint && <p>No Active Sprint</p>}
        {hasSprint && (
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
              <DragDropContext onDragEnd={onTicketDrop}>
                {ticketsByStatus.map(({ status, tickets: groupedSortedTickets }) => (
                  <DroppableColumn
                    key={status.id}
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
                ))}
              </DragDropContext>
            </div>
          </>
        )}
      </div>
    </ProjectHOC>
  );
}
