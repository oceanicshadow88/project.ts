/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, DraggableLocation, DropResult } from 'react-beautiful-dnd';
import { IoCloseCircle } from 'react-icons/io5';
import ProjectHOC from '../../../components/HOC/ProjectHOC';
import { ISprint, ITicketBasic, ITicketInput } from '../../../types';
import { ProjectDetailsContext } from '../../../context/ProjectDetailsProvider';
import { getBacklogTickets } from '../../../api/backlog/backlog';
import SectionTitle from '../../../components/SectionTitle/SectionTitle';
import SprintSection from '../../BacklogPage/components/SprintSection/SprintSection';
import DroppableTicketItems from '../../../components/Projects/DroppableTicketItems/DroppableTicketItems';
import CreateIssue, { ICreateIssue } from '../../../components/Projects/CreateIssue/CreateIssue';
import { useUserStoryValidation } from '../../../hooks/useUserStoryValidation';
import { migrateTicketRanks, updateTicketSprint, updateTicket } from '../../../api/ticket/ticket';
import { customCompare, generateKeyBetween } from '../../../utils/lexoRank';
import { getQuestionsByProject } from '../../../api/question/question';
import { IQuestion } from '../../../api/question/entity/question';
import { ModalContext } from '../../../context/ModalProvider';
import StatusRow from './components/StatusRow/StatusRow';

function PlanningPage() {
  const { projectId = '' } = useParams();
  const [tickets, setTickets] = useState<ITicketBasic[]>([]);
  const [isMigrating, setIsMigrating] = useState(false);
  const [unresolvedQuestionsByTicket, setUnresolvedQuestionsByTicket] = useState<{
    [ticketId: string]: IQuestion[];
  }>({});
  const [allQuestions, setAllQuestions] = useState<IQuestion[]>([]);
  const projectDetails = useContext(ProjectDetailsContext);
  const { showModal, closeModal } = useContext(ModalContext);
  const { validateAndCreateIssue, validateAndUpdateIssue } = useUserStoryValidation();

  const fetchUnresolvedQuestions = async () => {
    if (!projectId) return;
    try {
      const result = await getQuestionsByProject(projectId);
      const questionsData = (result?.data || []) as IQuestion[];
      setAllQuestions(questionsData);
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
      setAllQuestions([]);
    }
  };

  const fetchPlanningTickets = async () => {
    try {
      const response = await getBacklogTickets(projectId);
      const ticketsData = response || [];
      const needsMigration = ticketsData.some((ticket) => !ticket.rank);

      if (needsMigration && !isMigrating) {
        setIsMigrating(true);
        try {
          await migrateTicketRanks(projectId);
          const updatedResponse = await getBacklogTickets(projectId);
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
      await fetchUnresolvedQuestions();
    } catch (error) {
      setTickets([]);
    }
  };

  useEffect(() => {
    fetchPlanningTickets();
  }, [projectId]);

  useEffect(() => {
    fetchUnresolvedQuestions();
  }, [projectId]);

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

  // Filter to only planning sprints and sort them
  const planningSprintData = useMemo(() => {
    const sprints = projectDetails?.sprints ?? [];
    return sprints.filter((sprint) => sprint.status === 'planning');
  }, [projectDetails?.sprints]);

  // Calculate max ticket time based on sprint length
  const maxTicketTimeInfo = useMemo(() => {
    if (planningSprintData.length === 0) {
      return null;
    }

    // Use the first planning sprint for calculation
    const sprint = planningSprintData[0];
    if (!sprint.startDate || !sprint.endDate) {
      return null;
    }

    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    const sprintLengthDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (sprintLengthDays <= 0) {
      return null;
    }

    const reviewTime = sprintLengthDays * 0.25;
    const buffer = sprintLengthDays * 0.2;
    const maxTicketTime = sprintLengthDays - reviewTime - buffer;

    return {
      sprintLengthDays,
      reviewTime,
      buffer,
      maxTicketTime: Math.round(maxTicketTime)
    };
  }, [planningSprintData]);

  // Calculate status metrics
  const statusMetrics = useMemo(() => {
    const unresolvedQuestions = allQuestions.filter((q) => !q.isResolved);

    // Get planning sprint IDs
    const planningSprintIds = planningSprintData.map((s) => s.id);

    // Filter questions to only those in planning sprints
    const questionsInPlanningSprints = unresolvedQuestions.filter((q) => {
      const ticket = typeof q.ticket === 'string' ? null : q.ticket;
      if (!ticket || !ticket.sprint) return false;
      return planningSprintIds.includes(ticket.sprint.id);
    });

    // Questions waiting for PO (waitingForStakeholder = true) in planning sprints
    const poQuestions = questionsInPlanningSprints.filter((q) => q.waitingForStakeholder);

    // Questions waiting for Business team (assigned to business team members or waiting)
    // For now, we'll use waitingForStakeholder as a proxy, but you might want to filter by assignee role
    const businessQuestions = questionsInPlanningSprints.filter(
      (q) => q.waitingForStakeholder && !poQuestions.includes(q)
    );

    // Dev team status - check workload in planning sprints
    const activeTicketsInPlanning = tickets.filter(
      (t) => t.sprint && planningSprintData.some((s) => s.id === t.sprint?.id)
    );
    const inProgressTickets = activeTicketsInPlanning.filter(
      (t) => t.status && !['Done', 'done', 'Completed', 'completed'].includes(t.status)
    );
    const completedTickets = activeTicketsInPlanning.filter((t) =>
      ['Done', 'done', 'Completed', 'completed'].includes(t.status || '')
    );

    // Calculate workload recommendation
    // If there are many in-progress tickets, suggest reducing work
    // If there are few tickets, suggest they can take more
    const totalActiveTickets = inProgressTickets.length;
    const workloadThreshold = 10; // Threshold for "at capacity"

    let devTeamStatus: string;
    let workloadRecommendation: number | null = null;

    if (totalActiveTickets >= workloadThreshold) {
      // Team is at capacity, recommend reducing work
      const excessWork = totalActiveTickets - workloadThreshold;
      workloadRecommendation = excessWork;
      devTeamStatus = 'at-capacity';
    } else if (totalActiveTickets > 0) {
      // Team has work but not at capacity
      devTeamStatus = 'operational';
    } else {
      // Team is idle
      devTeamStatus = 'idle';
    }

    return {
      poQuestionsCount: poQuestions.length,
      businessQuestionsCount: businessQuestions.length,
      devTeamStatus,
      workloadRecommendation
    };
  }, [allQuestions, tickets, planningSprintData]);

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
      await fetchPlanningTickets();
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert('Failed to update Ticket!');
    }
  };

  const onIssueCreate = async (issueData: ITicketInput) => {
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
      fetchPlanningTickets
    );
  };

  const onSprintComplete = async (sprintId: string) => {
    return new Promise<boolean>((resolve) => {
      // eslint-disable-next-line no-alert
      const confirmed = window.confirm(
        'Are you sure you want to complete this sprint? This will move incomplete tickets to the backlog.'
      );
      resolve(confirmed);
    });
  };

  return (
    <ProjectHOC title="Planning">
      <div className="flex-1 pl-5 overflow-x-hidden">
        {/* Status Overview Section */}
        <div className="mb-6 flex flex-col">
          {/* PO Questions Status */}
          <StatusRow
            iconColor={statusMetrics.poQuestionsCount > 0 ? 'text-amber' : 'text-emerald'}
            text={
              statusMetrics.poQuestionsCount > 0
                ? `${statusMetrics.poQuestionsCount} question${
                    statusMetrics.poQuestionsCount > 1 ? 's' : ''
                  } remaining for Project Owner`
                : 'No remaining questions for Project Owner'
            }
          />

          {/* Business Team Questions Status */}
          <StatusRow
            iconColor={statusMetrics.businessQuestionsCount > 0 ? 'text-orange' : 'text-teal'}
            text={
              statusMetrics.businessQuestionsCount > 0
                ? `${statusMetrics.businessQuestionsCount} question${
                    statusMetrics.businessQuestionsCount > 1 ? 's' : ''
                  } remaining for Business team`
                : 'No remaining questions for Business team'
            }
          />

          {/* Dev Team Status */}
          <StatusRow
            iconColor="text-teal"
            text={(() => {
              if (statusMetrics.workloadRecommendation !== null) {
                return `${statusMetrics.workloadRecommendation} ticket(s)${
                  statusMetrics.workloadRecommendation > 1 ? 's' : ''
                } recommended to reduce for optimal capacity`;
              }
              if (statusMetrics.devTeamStatus === 'operational') {
                return 'Development team operating at optimal capacity';
              }
              return 'Development team does not require workload reduction';
            })()}
          />
        </div>

        {/* Planning Sprint Tickets Section */}
        <div className="rounded-xl p-6 mb-6">
          <div className="flex justify-between items-start mb-5">
            <div className="flex-1">
              <SectionTitle>Planning Sprints</SectionTitle>
              {maxTicketTimeInfo ? (
                <div className="mt-3 mb-0 p-4 bg-primary-light border-l-4 border-primary rounded-r-md">
                  <p className="m-0 text-base font-bold text-primary">
                    NOTE: Consider adjusting ticket scope or breaking down tickets if total ticket
                    workload exceeds{' '}
                    <span className="text-primary text-lg">{maxTicketTimeInfo.maxTicketTime}</span>{' '}
                    days per sprint. Exceeding this limit may result in sprint delivery delays and
                    compromised quality.
                  </p>
                </div>
              ) : (
                <p className="mt-1 mb-0 text-sm italic text-secondary opacity-80">
                  Tickets in planning sprints, break down ticket is needed
                </p>
              )}
            </div>
          </div>

          <DragDropContext
            onDragEnd={(result) => {
              onDragEventHandler(result);
            }}
          >
            {planningSprintData.map((sprint) => {
              return (
                <SprintSection
                  key={sprint.id}
                  sprint={sprint}
                  totalIssue={ticketsBySprintId[sprint.id]?.length ?? 0}
                  onSprintComplete={onSprintComplete}
                  dataTestId={`sprint-${sprint.id}`}
                >
                  <DroppableTicketItems
                    onTicketChanged={fetchPlanningTickets}
                    data={ticketsBySprintId[sprint.id]}
                    droppableId={sprint.id}
                    onAIClick={(id: string, ticketData: ITicketInput) =>
                      validateAndUpdateIssue(id, ticketData, fetchPlanningTickets)
                    }
                    unresolvedQuestionsByTicket={unresolvedQuestionsByTicket}
                  />
                  <CreateIssue
                    onIssueCreate={(issueData: ICreateIssue) =>
                      onIssueCreate({
                        title: issueData.name,
                        type: issueData.type,
                        sprintId: sprint.id
                      })
                    }
                  />
                </SprintSection>
              );
            })}
          </DragDropContext>
        </div>
      </div>
    </ProjectHOC>
  );
}

export default PlanningPage;
