import React, { useEffect, useState, useContext } from 'react';
import { AiOutlineCalendar } from 'react-icons/ai';
import { BiLabel } from 'react-icons/bi';
import { GoPeople, GoTag } from 'react-icons/go';
import { IoPersonOutline } from 'react-icons/io5';
import { MdOutlineCategory } from 'react-icons/md';
import { RiFlag2Line } from 'react-icons/ri';
import styles from './TicketDetailCard.module.scss';
import { ILabelData, ITicketDetails } from '../../types';
import useOutsideAlerter from '../../hooks/OutsideAlerter';
import { showTicket } from '../../api/ticket/ticket';
import { ProjectDetailsContext } from '../../context/ProjectDetailsProvider';
import { ModalContext } from '../../context/ModalProvider';
import { UserContext } from '../../context/UserInfoProvider';
import TicketTypeDropDown from '../Form/TicketTypeDropDown/TicketTypeDropDown';
import Placeholder from '../Loading/Placeholder';
import { Tabs, TabLabel, TabPanel } from '../Tabs/Tabs';
import ActivitiesSession from './@components/ActivitiesSession/ActivitiesSession';
import CommentsSession from './@components/CommentsSession/CommentsSession';
import DescriptionSession from './@components/DescriptionSession/DescriptionSession';
import DueDatePicker from '../Form/DueDatePicker/DueDatePicker';
import LabelDropDownV2 from './@components/LabelsDropdown/LabelsDropDownV2';
import checkAccess from '../../utils/helpers';
import { Permission } from '../../utils/permission';
import SVGPaths from '../../assets/ticketDetailCard/ticketDetailCardSvgPath';
import Dropdown from '../../lib/FormV3/Dropdown/Dropdown';
import PriorityBtn from '../Form/PriorityBtn/PriorityBtn';
import StatusBtn from '../Form/StatusBtn/StatusBtn';
import AssigneeBtn from '../Form/AssigneeBtn/AssigneeBtn';
import CreateEditEpic from '../../pages/Project/EpicPage/components/CreateEditEpic/CreateEditEpic';

const NEW_EPIC_OPTION = '_new_epic_';

// Widths vary per row, so each row is mapped to its own Placeholder.
// Only for Ticket Card Placeholder.
const DETAIL_ROWS = [
  { id: 'type', width: '80%' },
  { id: 'status', width: '70%' },
  { id: 'assignee', width: '80%' },
  { id: 'priority', width: '70%' },
  { id: 'labels', width: '80%' },
  { id: 'dueDate', width: '70%' }
];

const DESCRIPTION_LINES = [
  { id: 'line1', width: '80%' },
  { id: 'line2', width: '80%' },
  { id: 'line3', width: '80%' },
  { id: 'line4', width: '50%' }
];

interface ITicketDetailCardProps {
  ticketId: string;
  onDeletedTicket: (id: string) => void;
  onSavedTicket: (data: any) => void;
  projectId: string;
  isReadOnly: boolean;
}

function TicketDetailCard({
  ticketId,
  onDeletedTicket,
  onSavedTicket,
  projectId,
  isReadOnly
}: ITicketDetailCardProps) {
  const [ticketInfo, setTicketInfo] = useState<ITicketDetails | null>(null);
  const { visible, setVisible, myRef } = useOutsideAlerter(false);
  const [editTitle, setEditTitle] = useState(false);
  const { showModal, closeModal } = useContext(ModalContext);
  const userInfo = useContext(UserContext);
  const projectDetails = useContext(ProjectDetailsContext);
  const { users, ticketTypes } = projectDetails;

  const fetchTicketDetails = async () => {
    const res = await showTicket(ticketId);
    setTicketInfo(res.data);
  };

  useEffect(() => {
    if (!ticketId) {
      return;
    }

    fetchTicketDetails();
  }, [ticketId]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') {
      return;
    }
    (e.target as HTMLInputElement).blur();
    setEditTitle(false);
  };

  const handleTitleInputBlur = () => {
    onSavedTicket(ticketInfo);
    setEditTitle(false);
  };

  const onDefaultChange = async (fieldName: string, value: any) => {
    if (!ticketInfo) return;
    const updatedTicketInfo = { ...ticketInfo, [fieldName]: value };
    onSavedTicket(updatedTicketInfo);
    setTicketInfo(updatedTicketInfo);
  };

  const onDefaultSubmit = (data: any) => {
    const updatedTicketInfo = { ...ticketInfo, ...data };
    onSavedTicket(updatedTicketInfo);
    setTicketInfo(updatedTicketInfo);
  };

  // On-click before ticket details are fetched, render the placeholder. The outer two
  // elements match the loaded return below, so React updates them in place instead
  // of recreating them and fadeIn / slideUp play once per open.
  if (!ticketInfo) {
    return (
      <div className={styles.background}>
        <div className={styles.container}>
          {/* Header including ticket-type icon and ticket id */}
          <header className={styles.ticketHeader}>
            <div className={styles.ticketTypeSection}>
              {/* Placeholder for header icon and id */}
              <Placeholder width={28} height={28} radius={4} />
              <Placeholder width={90} height={14} />
            </div>
          </header>

          {/* Placeholder for title bar */}
          <div className={styles.ticketTitleContainer}>
            <Placeholder width="55%" height={28} className={styles.placeholderTitle} />
          </div>

          <div className={styles.contentWrapper}>
            {/* Left column placeholder */}
            <div className={styles.leftColumn}>
              <div className={styles.ticketDetailsSession}>
                {DETAIL_ROWS.map((row) => (
                  <Placeholder
                    key={row.id}
                    width={row.width}
                    height={32}
                    className={styles.placeholderRow}
                  />
                ))}
              </div>
            </div>

            {/* Right column placeholder */}
            <div className={styles.rightColumn}>
              {DESCRIPTION_LINES.map((line) => (
                <Placeholder
                  key={line.id}
                  width={line.width}
                  height={14}
                  className={styles.placeholderLine}
                />
              ))}
              <Placeholder height={40} className={styles.placeholderTabs} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderHeader = () => {
    return (
      <header className={styles.ticketHeader}>
        <div className={styles.ticketTypeSection}>
          <TicketTypeDropDown
            value={ticketInfo?.type}
            ticketTypes={ticketTypes}
            onChange={onDefaultChange}
            isDisabled={isReadOnly}
            size="md"
          />
          <span>{`${ticketInfo?.id}`}</span>
        </div>
        <div className={styles.actionMenu}>
          <div className={styles.deleteSession} ref={myRef}>
            <button onClick={() => setVisible(!visible)} type="button">
              <img src={SVGPaths.kebabMenuIcon} alt="" />
            </button>
            {visible && checkAccess(Permission.DeleteTickets, projectId) && (
              <div className={styles.dropdownContainer}>
                <button
                  onClick={() => {
                    closeModal('ticketDetailCard');
                    onDeletedTicket(ticketId);
                  }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
          <button type="button" onClick={() => closeModal('ticketDetailCard')}>
            <img src={SVGPaths.closeIcon} alt="" />
          </button>
        </div>
      </header>
    );
  };

  const renderDetails = () => {
    const tagItems = [
      {
        icon: BiLabel,
        text: 'Type',
        render: (
          <div className={styles.ticketDetailInfoItem}>
            <TicketTypeDropDown
              value={ticketInfo?.type}
              ticketTypes={ticketTypes}
              showButtonText
              onChange={(fieldName: string, value: any) => {
                onDefaultChange(fieldName, value);
              }}
              isDisabled={isReadOnly}
            />
          </div>
        )
      },
      {
        icon: MdOutlineCategory,
        text: 'Status',
        render: (
          <div className={styles.ticketDetailInfoItem}>
            <StatusBtn
              statusId={ticketInfo?.status}
              ticketId={ticketId}
              statusOptions={projectDetails.statuses}
              isDisabled={isReadOnly}
            />
          </div>
        )
      },
      {
        icon: GoTag,
        text: 'Label',
        render: (
          <LabelDropDownV2
            ticketLabels={ticketInfo.labels || []}
            ticketId={ticketInfo.id}
            projectId={ticketInfo.project.id}
            onTicketLabelsChange={(value: ILabelData[]) => {
              onDefaultChange('labels', value);
            }}
            dataTestId="labels"
            // isDisabled={isReadOnly}
          />
        )
      },
      {
        icon: AiOutlineCalendar,
        text: 'Due Date',
        render: (
          <div className={styles.ticketDetailInfoItem}>
            <DueDatePicker
              ticketInfo={ticketInfo}
              dueDateOnchange={(updatedTicketInfo: ITicketDetails) => {
                onDefaultChange('dueAt', updatedTicketInfo.dueAt);
              }}
              isDisabled={isReadOnly}
            />
          </div>
        )
      },
      {
        icon: RiFlag2Line,
        text: 'Priority',
        render: (
          <div className={styles.ticketDetailInfoItem}>
            <PriorityBtn
              priority={ticketInfo.priority}
              onChange={(value?: string | null) => {
                onDefaultChange('priority', value);
              }}
              ticketId={ticketId}
              isDisabled={isReadOnly}
            />
          </div>
        )
      },
      {
        icon: GoPeople,
        text: 'Reporter',
        render: (
          <div className={styles.ticketDetailInfoItem}>
            <AssigneeBtn
              assigneeId={ticketInfo.reporter}
              userList={users}
              ticketId={ticketId}
              onChange={(value) => onDefaultChange('reporter', value)}
              isDisabled={isReadOnly}
              name="reporter"
            />
          </div>
        )
      },
      {
        icon: IoPersonOutline,
        text: 'Assignee',
        render: (
          <div className={styles.ticketDetailInfoItem}>
            <AssigneeBtn
              assigneeId={ticketInfo.assign}
              userList={users}
              ticketId={ticketId}
              onChange={(value) => onDefaultChange('assign', value)}
              isDisabled={isReadOnly}
              name="assign"
            />
          </div>
        )
      },

      {
        icon: GoTag,
        text: 'Epic',
        render: (
          <Dropdown
            options={[
              ...projectDetails.epics.map((item) => ({
                label: item.title,
                value: item.id
              })),
              { label: '+ New epic', value: NEW_EPIC_OPTION }
            ]}
            label="Epic"
            name="epic"
            onValueChanged={(e) => {
              if (e.target.value === NEW_EPIC_OPTION) {
                showModal(
                  'create-epic',
                  <CreateEditEpic
                    type="Create"
                    projectId={projectId}
                    projectDetails={projectDetails}
                    onClickCloseModal={() => closeModal('create-epic')}
                  />
                );
                return;
              }
              onDefaultChange('epic', e.target.value);
            }}
            value={ticketInfo.epic}
            hasBorder={false}
            placeHolder="None"
          />
        )
      }
    ];

    return (
      <div className={styles.ticketDetailsContent}>
        {tagItems.map((item) => (
          <div key={item.text} className={styles.ticketDetailRow}>
            <div className={styles.ticketDetailTagItem}>
              <item.icon className={styles.reactIcon} />
              <p>{item.text}</p>
            </div>
            <div className={styles.ticketDetailInfoItem}>{item?.render}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.background}>
      <div className={styles.container}>
        {renderHeader()}
        <div className={styles.ticketTitleContainer}>
          {editTitle ? (
            <input
              type="text"
              value={ticketInfo.title}
              onKeyDown={handleKeyPress}
              onBlur={handleTitleInputBlur}
              onChange={(e) => {
                onDefaultChange('title', e.target.value);
              }}
            />
          ) : (
            <button
              data-testid="ticket-detail-title"
              onClick={() => {
                if (isReadOnly) return;
                setEditTitle(true);
              }}
            >
              {ticketInfo.title || 'Click to add title'}
            </button>
          )}
        </div>

        <div className={styles.contentWrapper}>
          <div className={styles.leftColumn}>
            <div className={styles.ticketDetailsSession}>{renderDetails()}</div>
          </div>
          <div className={styles.rightColumn}>
            <DescriptionSession
              description={ticketInfo.description}
              attachmentUrls={ticketInfo.attachmentUrls}
              onSubmitForm={onDefaultSubmit}
              users={users}
              isDisabled={isReadOnly}
              ticketId={ticketId}
              projectId={projectId}
              userId={userInfo.id ?? ''}
            />
            <Tabs>
              <TabLabel index={0}>Comment</TabLabel>
              <TabLabel index={1}>Activity</TabLabel>
              <TabPanel index={0}>
                <CommentsSession
                  userId={userInfo.id ?? ''}
                  users={users}
                  ticketId={ticketId}
                  projectId={projectId}
                />
              </TabPanel>
              <TabPanel index={1}>
                <ActivitiesSession ticketId={ticketId} ticketInfo={ticketInfo ?? null} />
              </TabPanel>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TicketDetailCard;
