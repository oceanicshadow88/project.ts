import React, { useContext, useState, useEffect } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getBacklogTickets } from '../../../api/backlog/backlog';
import { createNewTicket, updateTicketEpic } from '../../../api/ticket/ticket';
import BoardToolbar, { IFilterData } from '../../../components/Board/BoardSearch/TicketSearch';
import Button from '../../../components/Form/Button/Button';
import ProjectHOC from '../../../components/HOC/ProjectHOC';
import ProjectSectionHOC from '../../../components/HOC/ProjectSectionHOC/ProjectSectionHOC';
import CreateIssue, { ICreateIssue } from '../../../components/Projects/CreateIssue/CreateIssue';
import DroppableTicketItems from '../../../components/Projects/DroppableTicketItems/DroppableTicketItems';
import { ModalContext } from '../../../context/ModalProvider';
import { ProjectDetailsContext } from '../../../context/ProjectDetailsProvider';
import { ITicketBasic, ITicketInput } from '../../../types';
import CreateEditEpic from './components/CreateEditEpic/CreateEditEpic';
import styles from './EpicPage.module.scss';
import ButtonGroupEnd from '../../../lib/FormV2/ButtonGroupEnd/ButtonGroupEnd';

function EpicPage() {
  const { projectId = '' } = useParams();
  const [tickets, setTickets] = useState<ITicketBasic[]>([]);
  const [currentFilter, setCurrentFilter] = useState<IFilterData | null>(null);
  const { showModal, closeModal } = useContext(ModalContext);
  const projectDetails = useContext(ProjectDetailsContext);

  const fetchBacklogData = async (filterData?: IFilterData | null) => {
    try {
      const data = await getBacklogTickets(projectId, filterData);
      setTickets(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Temporary Server Error. Try Again.', {
        theme: 'colored'
      });
    }
  };

  useEffect(() => {
    fetchBacklogData();
  }, [projectId]);

  const onChangeFilter = (data: IFilterData) => {
    setCurrentFilter(data);
    fetchBacklogData(data);
  };

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

  const onDragEventHandler = async (result: DropResult) => {
    const { destination, draggableId } = result;

    const currentTicket = tickets.find((item) => item.id === draggableId);
    if (!currentTicket) {
      return;
    }

    const droppedFailed = destination?.droppableId === currentTicket.epic;
    if (droppedFailed) {
      return;
    }
    const epicId = destination?.droppableId;
    await updateTicketEpic(draggableId, epicId);
    fetchBacklogData(null);
  };

  const onIssueCreate = async (data: ITicketInput) => {
    await createNewTicket(data);
    fetchBacklogData();
  };

  const showCreateModal = () => {
    showModal(
      'create-epic',
      <CreateEditEpic
        type="Create"
        projectId={projectId}
        projectDetails={projectDetails}
        onClickCloseModal={() => {
          closeModal('create-epic');
        }}
      />
    );
  };

  const epicDataFromBackend = projectDetails?.epics ?? [];

  const ticketsByEpicId = tickets?.groupBy('epic') ?? {};
  return (
    <ProjectHOC title="Epic">
      <div className={styles.scrollContainer}>
        <BoardToolbar onChangeFilter={onChangeFilter} />

        {/* Filter Status Display */}
        {hasActiveFilters() && (
          <div className={styles.filterStatus}>
            <div className={styles.filterInfo}>
              <span className={styles.filterText}>Active filters:</span>

              {/* Show active label filters */}
              {getActiveFilterLabels().map((label) => (
                <span key={label.id} className={styles.activeFilter}>
                  Label: {label.name}
                  <button
                    className={styles.removeFilter}
                    onClick={() => onLabelClick(label.id)}
                    type="button"
                    title="Remove filter"
                  >
                    ×
                  </button>
                </span>
              ))}

              {/* Show other active filters */}
              {currentFilter?.userIds?.length && (
                <span className={styles.activeFilter}>
                  Users: {currentFilter.userIds.length} selected
                </span>
              )}

              {currentFilter?.ticketTypesIds?.length && (
                <span className={styles.activeFilter}>
                  Types: {currentFilter.ticketTypesIds.length} selected
                </span>
              )}

              {currentFilter?.ticketEpicsIds?.length && (
                <span className={styles.activeFilter}>
                  Epics: {currentFilter.ticketEpicsIds.length} selected
                </span>
              )}

              {currentFilter?.title?.trim() && (
                <span className={styles.activeFilter}>
                  Title: &quot;{currentFilter.title}&quot;
                </span>
              )}
            </div>

            <button className={styles.clearAllFilters} onClick={clearAllFilters} type="button">
              Clear all filters
            </button>
          </div>
        )}

        <ButtonGroupEnd>
          <Button onClick={showCreateModal} dataTestId="epic-create-epic-btn">
            Create epic
          </Button>
        </ButtonGroupEnd>
        <DragDropContext
          onDragEnd={(result) => {
            onDragEventHandler(result);
          }}
        >
          {epicDataFromBackend
            .filter((epic) => {
              return !epic.isComplete;
            })
            .map((epic) => {
              return (
                <ProjectSectionHOC
                  key={epic.id}
                  title={epic.title}
                  startDate={epic.startDate}
                  endDate={epic.dueAt}
                  epic={epic}
                  totalIssue={ticketsByEpicId[epic.id]?.length ?? 0}
                  dataTestId={`epic-${epic.id}`}
                >
                  <DroppableTicketItems
                    onTicketChanged={fetchBacklogData}
                    data={ticketsByEpicId[epic.id]}
                    droppableId={epic.id}
                    onLabelClick={onLabelClick}
                  />
                  <CreateIssue
                    onIssueCreate={(data: ICreateIssue) =>
                      onIssueCreate({
                        title: data.name,
                        type: data.type,
                        projectId,
                        epicId: epic.id,
                        dueAt: new Date(),
                        description: ''
                      })
                    }
                  />
                </ProjectSectionHOC>
              );
            })}
        </DragDropContext>
      </div>
    </ProjectHOC>
  );
}

export default EpicPage;
