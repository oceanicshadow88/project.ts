/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useContext, useEffect, useRef } from 'react';
import styles from './BoardSearch.module.scss';
import UserFilter from './components/UserFilter/UserFilter';
import SearchForBoard from './components/SearchForBoard/SearchForBoard';
import TicketTypeFilter from './components/TicketTypeFilter/TicketTypeFilter';
import TicketLabelFilter from './components/TicketLabelFilter/TicketLabelFilter';
import { ILabelData, ITypes } from '../../../types';
import { ProjectDetailsContext } from '../../../context/ProjectDetailsProvider';
import TicketEpicFilter from './components/TicketEpicFilter/TicketEpicFilter';
import ShowCompletedSprintsCheckbox from './components/ShowCompletedSprintsCheckbox/ShowCompletedSprintsCheckbox';

export interface IFilterData {
  userIds: string[] | null;
  ticketTypesIds: string[] | null;
  ticketEpicsIds: string[] | null;
  labelIds: string[] | null;
  title: string;
}

interface IBoardToolbarProps {
  onChangeFilter: (filterData: IFilterData) => void;
  actions?: React.ReactNode;
  showCompletedSprints?: {
    checked: boolean;
    onChange: (checked: boolean) => void;
  };
}

function BoardToolbar(props: IBoardToolbarProps) {
  const { onChangeFilter, actions, showCompletedSprints } = props;
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<ILabelData[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<ITypes[]>([]);
  const [selectedEpics, setSelectedEpics] = useState<any[]>([]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isStuck, setIsStuck] = useState(false);
  const stickySentinelRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const projectDetails = useContext(ProjectDetailsContext);

  useEffect(() => {
    const sentinel = stickySentinelRef.current;
    const toolbar = toolbarRef.current;
    if (!sentinel || !toolbar) return undefined;
    let frame = 0;
    const checkStuck = () => {
      frame = 0;
      const stickyTop = parseFloat(getComputedStyle(toolbar).top) || 0;
      setIsStuck(sentinel.getBoundingClientRect().bottom <= stickyTop);
    };
    const scheduleCheck = () => {
      if (!frame) frame = requestAnimationFrame(checkStuck);
    };
    checkStuck();
    window.addEventListener('scroll', scheduleCheck, { passive: true });
    window.addEventListener('resize', scheduleCheck);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleCheck);
      window.removeEventListener('resize', scheduleCheck);
    };
  }, []);

  const changeSelectedItems = (isExist, selectedItems, item) => {
    if (!isExist) {
      return [...selectedItems, item];
    }
    return selectedItems.filter((selectedItem) => selectedItem.id !== item.id);
  };

  useEffect(() => {
    onChangeFilter({
      userIds: selectedUsers.length === 0 ? null : selectedUsers.map((item) => item.id),
      ticketTypesIds: selectedTypes.length === 0 ? null : selectedTypes.map((item) => item.id),
      ticketEpicsIds: selectedEpics.length === 0 ? null : selectedEpics.map((item) => item.id),
      labelIds: selectedLabels.length === 0 ? null : selectedLabels.map((item) => item.id),
      title: inputQuery
    });
  }, [selectedUsers, selectedTypes, selectedEpics, selectedLabels, inputQuery]);

  return (
    <>
      <div ref={stickySentinelRef} className={styles.stickySentinel} aria-hidden="true" />
      <div
        ref={toolbarRef}
        className={`${styles.searchBarContainer} ${isStuck ? styles.searchBarContainerStuck : ''}`}
      >
        <div className={styles.searchInputContainer}>
          <SearchForBoard setInputQuery={setInputQuery} />
        </div>
        <UserFilter
          selectedUsers={selectedUsers}
          setSelectedUsers={setSelectedUsers}
          changeSelectedUsers={changeSelectedItems}
          userList={projectDetails.users}
        />
        <TicketTypeFilter
          selectedTypes={selectedTypes}
          setSelectedTypes={setSelectedTypes}
          changeSelectedTypes={changeSelectedItems}
          dataTestId="type-filter"
        />
        <TicketEpicFilter
          selectedEpics={selectedEpics}
          setSelectedEpics={setSelectedEpics}
          changeSelectedEpics={changeSelectedItems}
          dataTestId="epic-filter"
        />
        {showCompletedSprints && (
          <ShowCompletedSprintsCheckbox
            checked={showCompletedSprints.checked}
            onChange={showCompletedSprints.onChange}
            dataTestId="backlog-toggle-completed-sprints-btn"
          />
        )}
        <TicketLabelFilter selectedLabels={selectedLabels} setSelectedLabels={setSelectedLabels} />
        {actions && <div className={styles.addNewButtonContainer}>{actions}</div>}
      </div>
    </>
  );
}

export default React.memo(BoardToolbar);
