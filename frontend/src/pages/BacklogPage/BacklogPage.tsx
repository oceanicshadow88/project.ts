import React, { useState, useContext, useMemo, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, DraggableLocation, DropResult } from 'react-beautiful-dnd';
import BacklogSection from './components/BacklogSection/BacklogSection';
import MoveIncompleteTicketsModal from './components/MoveIncompleteTicketsModal/MoveIncompleteTicketsModal';
import { getBacklogTickets } from '../../api/backlog/backlog';
import SprintSection from './components/SprintSection/SprintSection';
import Loading from '../../components/Loading/Loading';
import CreateEditSprint from './components/CreateEditSprint/CreateEditSprint';
import Button from '../../components/Form/Button/Button';
import { ProjectDetailsContext } from '../../context/ProjectDetailsProvider';
import CreateIssue, { ICreateIssue } from '../../components/Projects/CreateIssue/CreateIssue';
import DroppableTicketItems from '../../components/Projects/DroppableTicketItems/DroppableTicketItems';
import BoardToolbar, { IFilterData } from '../../components/Board/BoardSearch/TicketSearch';
import { ModalContext } from '../../context/ModalProvider';
import { useUserStoryValidation } from '../../hooks/useUserStoryValidation';
import { ISprint, ITicketBasic, ITicketInput } from '../../types';
import { migrateTicketRanks, updateTicketSprint, updateTicket } from '../../api/ticket/ticket';
import ProjectHOC from '../../components/HOC/ProjectHOC';
import checkAccess from '../../utils/helpers';
import { Permission } from '../../utils/permission';
import { customCompare, generateKeyBetween } from '../../utils/lexoRank';
import { getQuestionsByProject } from '../../api/question/question';
import { IQuestion } from '../../api/question/entity/question';
import ButtonGroupEnd from '../../lib/FormV2/ButtonGroupEnd/ButtonGroupEnd';

export default function BacklogPage() {
  const { projectId = '' } = useParams();
  const [tickets, setTickets] = useState<ITicketBasic[]>([]);
  const [currentFilter, setCurrentFilter] = useState<IFilterData | null>(null);
  const [showCompletedSprints, setShowCompletedSprints] = useState(false);
  const [unresolvedQuestionsByTicket, setUnresolvedQuestionsByTicket] = useState<{
    [ticketId: string]: IQuestion[];
  }>({});
  const projectDetails = useContext(ProjectDetailsContext);
  const { showModal, closeModal } = useContext(ModalContext);
  const [isMigrating, setIsMigrating] = useState(false);

  // User story validation hook
  const { validateAndCreateIssue, validateAndUpdateIssue } = useUserStoryValidation();

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
        if (!questionsByTicket[ticketId]) {
          questionsByTicket[ticketId] = [];
        }
        questionsByTicket[ticketId].push(question);
      });
      setUnresolvedQuestionsByTicket(questionsByTicket);
    } catch (error) {
      setUnresolvedQuestionsByTicket({});
    }
  };

  const fetchBacklogData = async (filterData?: IFilterData | null) => {
    try {
      const response = await getBacklogTickets(projectId, filterData);
      const ticketsData = response || [];
      const needsMigration = ticketsData.some((ticket) => !ticket.rank);

      if (needsMigration && !isMigrating) {
        setIsMigrating(true);
        try {
          await migrateTicketRanks(projectId);

          const updatedResponse = await getBacklogTickets(projectId, filterData);
          setTickets(updatedResponse || []);
        } catch (error) {
          // eslint-disable-next-line no-alert
          alert('Migrate Ticket Ranks Failed!');
        } finally {
          setIsMigrating(false);
        }
      } else {
        setTickets(ticketsData);
      }
      // Refresh questions when tickets are updated
      await fetchUnresolvedQuestions();
    } catch (error) {
      setTickets([]);
    }
  };

  const onChangeFilter = (data: IFilterData) => {
    setCurrentFilter(data);
    fetchBacklogData(data);
  };

  useEffect(() => {
    fetchBacklogData();
  }, [projectId]);

  useEffect(() => {
    fetchUnresolvedQuestions();
  }, [projectId]);

  const onLabelClick = (labelId: string) => {
    // Check if this label is already being filtered
    const isCurrentlyFiltered = currentFilter?.labelIds?.includes(labelId);

    if (isCurrentlyFiltered) {
      // Remove the filter (clear it)
      setCurrentFilter(null);
      fetchBacklogData();
    } else {
      // Apply the filter
      const filterData: IFilterData = {
        userIds: null,
        ticketTypesIds: null,
        ticketEpicsIds: null,
        labelIds: [labelId],
        title: ''
      };
      setCurrentFilter(filterData);
      fetchBacklogData(filterData);
    }
  };

  const clearAllFilters = () => {
    setCurrentFilter(null);
    fetchBacklogData();
  };

  const hasActiveFilters = () => {
    return (
      currentFilter &&
      ((currentFilter.userIds && currentFilter.userIds.length > 0) ||
        (currentFilter.ticketTypesIds && currentFilter.ticketTypesIds.length > 0) ||
        (currentFilter.ticketEpicsIds && currentFilter.ticketEpicsIds.length > 0) ||
        (currentFilter.labelIds && currentFilter.labelIds.length > 0) ||
        (currentFilter.title && currentFilter.title.trim().length > 0))
    );
  };

  const getActiveFilterLabels = () => {
    if (!currentFilter?.labelIds?.length) return [];
    return (
      projectDetails?.labels?.filter((label) => currentFilter.labelIds?.includes(label.id)) || []
    );
  };

  const getUpdatedStatusId = (
    currentTicket: ITicketBasic,
    source: DraggableLocation,
    destination?: DraggableLocation | null
  ) => {
    const movingToSprint = destination?.droppableId !== 'backlog';
    const movingFromBacklog = source.droppableId === 'backlog';
    if (movingToSprint && movingFromBacklog) {
      return projectDetails?.statuses?.[0]?.id;
    }
    return !movingToSprint ? null : currentTicket?.status;
  };

  const shouldShowAlert = (result: DropResult) => {
    const { destination, source } = result;
    const isTargetBackLog = destination?.droppableId === 'backlog';
    const isSourceBackLog = source.droppableId === 'backlog';
    if (!isTargetBackLog && isSourceBackLog) {
      const targetSprint = projectDetails?.sprints?.find(
        (item) => item.id === destination?.droppableId
      );
      if (targetSprint?.status === 'active') {
        return true;
      }
    }

    if (!isTargetBackLog && !isSourceBackLog) {
      const targetSprint = projectDetails?.sprints?.find(
        (item) => item.id === destination?.droppableId
      );
      const sourceSprint = projectDetails?.sprints?.find((item) => item.id === source?.droppableId);

      if (targetSprint?.status === 'active' && sourceSprint?.status !== 'active') {
        return true;
      }
    }
    return false;
  };

  function calculateNewRank(destination, source, draggableId) {
    const sectionTickets =
      destination.droppableId === 'backlog'
        ? tickets.filter((t) => !t.sprint)
        : tickets.filter(
            (t) => t.sprint && String(t.sprint.id ?? t.sprint) === destination.droppableId
          );

    const sortedTickets = [...sectionTickets].sort((a, b) => customCompare(a?.rank, b?.rank));

    const ticketsWithoutCurrent =
      source.droppableId === destination.droppableId
        ? sortedTickets.filter((t) => t.id !== draggableId)
        : sortedTickets;

    if (destination.index === 0) {
      const firstTicket = ticketsWithoutCurrent[0];
      return generateKeyBetween(null, firstTicket?.rank || null);
    }
    if (destination.index >= ticketsWithoutCurrent.length) {
      const lastTicket = ticketsWithoutCurrent[ticketsWithoutCurrent.length - 1];
      return generateKeyBetween(lastTicket?.rank || null, null);
    }
    const prevTicket = ticketsWithoutCurrent[destination.index - 1];
    const nextTicket = ticketsWithoutCurrent[destination.index];
    return generateKeyBetween(prevTicket?.rank || null, nextTicket?.rank || null);
  }

  const onDragEventHandler = async (result: DropResult) => {
    const { destination, draggableId, source } = result;

    if (!destination) {
      return;
    }

    if (shouldShowAlert(result)) {
      // eslint-disable-next-line no-alert
      alert(
        'Unless it can be finished within this sprint, Please consider move a ticket out of the sprint first, or put the new ticket in next sprint if it cannot be finished'
      );
    }

    const droppedFailed =
      destination.droppableId === source.droppableId && source.index === destination.index;

    if (droppedFailed) return;

    const currentTicket = tickets.find((item) => item.id === draggableId);
    if (!currentTicket) return;

    const sprintId = destination.droppableId === 'backlog' ? null : destination.droppableId;
    const statusId = getUpdatedStatusId(currentTicket, source, destination);

    const newRank = calculateNewRank(destination, source, draggableId);

    const sprintObj = projectDetails?.sprints?.find((s) => s.id === sprintId) || undefined;

    const updatedTicket: ITicketBasic = {
      ...currentTicket,
      rank: newRank,
      sprint: sprintObj,
      status: statusId
    };

    setTickets((prevTickets) =>
      prevTickets.map((ticket) => (ticket.id === draggableId ? updatedTicket : ticket))
    );

    try {
      await updateTicketSprint(draggableId, sprintId, { status: statusId, rank: newRank });
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert('Failed to update Ticket!');
    }
  };

  const onIssueCreate = async (issueData: ITicketInput) => {
    if (issueData.sprintId) {
      const sprint = projectDetails?.sprints?.find((item) => item.id === issueData.sprintId);
      if (sprint?.status === 'active') {
        // eslint-disable-next-line no-alert
        alert(
          'Unless it can be finished within this sprint, Please consider move a ticket out of the sprint first, or put it the new ticket in next sprint if it cannot be finished'
        );
      }
    }
    const sectionTickets = issueData.sprintId
      ? tickets.filter((t) => t.sprint && String(t.sprint.id ?? t.sprint) === issueData.sprintId)
      : tickets.filter((t) => !t.sprint);

    const sorted = [...sectionTickets].sort((a, b) => customCompare(a?.rank, b?.rank));
    const lastRank = sorted.length > 0 ? sorted[sorted.length - 1].rank : null;
    const newRank = generateKeyBetween(lastRank, null);

    const ticketData = { ...issueData, ...{ rank: newRank, dueAt: new Date() } };

    await validateAndCreateIssue(
      {
        title: ticketData.title,
        type: ticketData.type,
        projectId,
        sprintId: ticketData.sprintId,
        dueAt: ticketData.dueAt
      },
      fetchBacklogData
    );
  };

  const calculateShowDropDownTop = () => {
    let totalIncompleteSprint = 0;
    projectDetails?.sprints?.forEach((sprint) => {
      if (sprint.status !== 'completed') {
        totalIncompleteSprint += 1;
      }
    });
    if (totalIncompleteSprint > 3) {
      return true;
    }
    const totalTicket = 0;

    return totalTicket > 7;
  };

  const showCreateModal = () => {
    showModal(
      'create-sprint',
      <CreateEditSprint
        type="Create"
        projectId={projectId}
        projectDetails={projectDetails}
        onClickCloseModal={() => {
          closeModal('create-sprint');
        }}
      />
    );
  };

  // Sort sprints: active -> planning -> completed
  const sortedSprintData = useMemo(() => {
    const sprints = projectDetails?.sprints ?? [];
    const statusOrder = { active: 0, planning: 1, completed: 2 };
    return [...sprints].sort((a, b) => {
      const statusA = (a.status || 'planning') as keyof typeof statusOrder;
      const statusB = (b.status || 'planning') as keyof typeof statusOrder;
      return statusOrder[statusA] - statusOrder[statusB];
    });
  }, [projectDetails?.sprints]);

  const sprintData = showCompletedSprints
    ? sortedSprintData
    : sortedSprintData.filter((sprint) => sprint.status !== 'completed');

  const getNormalizedSprintId = (sprint: string | ISprint | null | undefined): string => {
    if (!sprint) return 'backlog';
    if (typeof sprint === 'string') return sprint;
    return sprint.id;
  };

  const ticketsBySprintId = useMemo(() => {
    const grouped: Record<string, ITicketBasic[]> = { backlog: [] };

    tickets?.forEach((ticket) => {
      const sprintId = getNormalizedSprintId(ticket.sprint);

      if (!grouped[sprintId]) {
        grouped[sprintId] = [];
      }

      grouped[sprintId].push(ticket);
    });

    Object.keys(grouped).forEach((key) => {
      grouped[key] = grouped[key].sort((a, b) => customCompare(a?.rank, b?.rank));
    });

    return grouped;
  }, [tickets]);

  const onSprintComplete = useCallback(
    async (sprintId: string) => {
      const sprintTickets = ticketsBySprintId[sprintId];
      const statusDone = projectDetails.statuses.find((s) => s.slug === 'done');
      const incompleteTickets = sprintTickets.filter((ticket) => ticket.status !== statusDone?.id);
      const incompleteSprints = projectDetails.sprints.filter(
        (sprint) => sprint.status !== 'completed' && sprint.id !== sprintId
      );

      const onClickConfirmModal = async (target: 'sprint' | 'backlog') => {
        const closestSprint = incompleteSprints[0];
        await Promise.all(
          incompleteTickets.map((ticket) =>
            updateTicket(ticket.id, {
              sprint: target === 'sprint' ? closestSprint.id : null,
              status: target === 'sprint' ? ticket.status : null
            })
          )
        );

        closeModal('move-incomplete-tickets');
        await fetchBacklogData();
      };

      const showMoveIncompleteTicketsModal = async () =>
        new Promise<'sprint' | 'backlog' | null>((resolve) => {
          showModal(
            'move-incomplete-tickets',
            <MoveIncompleteTicketsModal
              onConfirm={async (target: 'sprint' | 'backlog') => {
                await onClickConfirmModal(target);
                resolve(target);
              }}
              onClickCloseModal={() => {
                closeModal('move-incomplete-tickets');
                resolve(null);
              }}
            />
          );
        });

      const hasIncompleteTickets = incompleteTickets.length > 0;
      const hasNextSprint = incompleteSprints.length > 0;

      if (hasIncompleteTickets && hasNextSprint) {
        const result = await showMoveIncompleteTicketsModal();
        if (!result) return false;
      } else if (hasIncompleteTickets) {
        await onClickConfirmModal('backlog');
      }
      return true;
    },
    [ticketsBySprintId, projectDetails, showModal, closeModal, fetchBacklogData]
  );

  if (projectDetails.isLoadingDetails) {
    return <Loading />;
  }

  return (
    <ProjectHOC title="Backlog">
      <BoardToolbar onChangeFilter={onChangeFilter} />

      {/* Filter Status Display */}
      {hasActiveFilters() && (
        <div className="bg-gray-100 border border-light rounded-md py-3 px-4 m-4 flex justify-between items-center gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-700 text-sm">Active filters:</span>

            {/* Show active label filters */}
            {getActiveFilterLabels().map((label) => {
              const labelColor = label.color || '#6a2add';
              return (
                <span
                  key={label.id}
                  className="bg-primary text-white py-1 px-2 rounded-xl text-xs flex items-center gap-1"
                  style={{ backgroundColor: labelColor }}
                >
                  Label: {label.name}
                  <button
                    className="bg-transparent border-none text-white cursor-pointer text-sm leading-none p-0 ml-1 rounded-full w-4 h-4 flex items-center justify-center"
                    onClick={() => onLabelClick(label.id)}
                    type="button"
                    title="Remove filter"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    ×
                  </button>
                </span>
              );
            })}

            {/* Show other active filters */}
            {currentFilter?.userIds?.length && (
              <span className="bg-primary text-white py-1 px-2 rounded-xl text-xs flex items-center gap-1">
                Users: {currentFilter.userIds.length} selected
              </span>
            )}

            {currentFilter?.ticketTypesIds?.length && (
              <span className="bg-primary text-white py-1 px-2 rounded-xl text-xs flex items-center gap-1">
                Types: {currentFilter.ticketTypesIds.length} selected
              </span>
            )}

            {currentFilter?.ticketEpicsIds?.length && (
              <span className="bg-primary text-white py-1 px-2 rounded-xl text-xs flex items-center gap-1">
                Epics: {currentFilter.ticketEpicsIds.length} selected
              </span>
            )}

            {currentFilter?.title?.trim() && (
              <span className="bg-primary text-white py-1 px-2 rounded-xl text-xs flex items-center gap-1">
                Title: &quot;{currentFilter.title}&quot;
              </span>
            )}
          </div>

          <button
            className="bg-blue text-white border-none py-1.5 px-3 rounded-md text-sm cursor-pointer whitespace-nowrap hover:bg-blue-dark active:bg-blue-darker"
            onClick={clearAllFilters}
            type="button"
            style={{
              backgroundColor: '#0052cc'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0065ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#0052cc';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.backgroundColor = '#003d99';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.backgroundColor = '#0065ff';
            }}
          >
            Clear all filters
          </button>
        </div>
      )}

      <DragDropContext
        onDragEnd={(result) => {
          onDragEventHandler(result);
        }}
      >
        {sprintData.map((sprint) => {
          return (
            <SprintSection
              key={sprint.id}
              sprint={sprint}
              totalIssue={ticketsBySprintId[sprint.id]?.length ?? 0}
              onSprintComplete={onSprintComplete}
              dataTestId={`sprint-${sprint.id}`}
            >
              <DroppableTicketItems
                onTicketChanged={fetchBacklogData}
                data={ticketsBySprintId[sprint.id]}
                droppableId={sprint.id}
                onLabelClick={onLabelClick}
                onAIClick={(id: string, data: ITicketInput) =>
                  validateAndUpdateIssue(id, data, fetchBacklogData)
                }
                unresolvedQuestionsByTicket={unresolvedQuestionsByTicket}
              />
              <CreateIssue
                onIssueCreate={(data: ICreateIssue) =>
                  onIssueCreate({
                    title: data.name,
                    type: data.type,
                    sprintId: sprint.id
                  })
                }
              />
            </SprintSection>
          );
        })}
        <ButtonGroupEnd>
          <Button
            onClick={() => setShowCompletedSprints(!showCompletedSprints)}
            dataTestId="backlog-toggle-completed-sprints-btn"
          >
            {showCompletedSprints ? 'Hide Completed Sprints' : 'Show Completed Sprints'}
          </Button>
          {checkAccess(Permission.CreateSprints, projectId) && (
            <Button onClick={showCreateModal} dataTestId="backlog-create-sprint-btn">
              Create sprint
            </Button>
          )}
        </ButtonGroupEnd>
        <BacklogSection
          data-testid="backlog-section"
          totalIssue={ticketsBySprintId?.backlog?.length ?? 0}
        >
          <DroppableTicketItems
            onTicketChanged={fetchBacklogData}
            data={ticketsBySprintId.backlog}
            isBacklog
            droppableId="backlog"
            unresolvedQuestionsByTicket={unresolvedQuestionsByTicket}
            onLabelClick={onLabelClick}
          />
          <CreateIssue
            onIssueCreate={(data: ICreateIssue) =>
              onIssueCreate({
                title: data.name,
                type: data.type,
                sprintId: null
              })
            }
            showDropDownOnTop={calculateShowDropDownTop()}
          />
        </BacklogSection>
      </DragDropContext>
      {Object.values(ticketsBySprintId).flat().length === 0 && (
        <div className="mt-8 text-center">
          <div data-testid="empty-ticket-result" className="empty-state">
            There is nothing that matches this filter.
          </div>
        </div>
      )}
    </ProjectHOC>
  );
}
