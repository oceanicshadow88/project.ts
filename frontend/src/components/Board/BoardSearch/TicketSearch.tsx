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

// Must match $top-nav-height in BoardSearch.module.scss
const TOP_NAV_HEIGHT = 62;

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

  const projectDetails = useContext(ProjectDetailsContext);

  useEffect(() => {
    const sentinel = stickySentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      ([entry]) =>
        setIsStuck(!entry.isIntersecting && entry.boundingClientRect.top < TOP_NAV_HEIGHT),
      { rootMargin: `-${TOP_NAV_HEIGHT}px 0px 0px 0px` }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
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
