import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiViewBoards } from 'react-icons/hi';
import { BsQuestionCircle } from 'react-icons/bs';
import { FiSettings } from 'react-icons/fi';
import { IoMdList } from 'react-icons/io';
import { FaDailymotion } from 'react-icons/fa';
import { MdOutlineDashboard } from 'react-icons/md';
import { VscNewFile } from 'react-icons/vsc';
import { TiClipboard } from 'react-icons/ti';
import checkAccess from '../../utils/helpers';

interface IItem {
  name: string;
  icon: React.ReactNode;
  dataTestId: string;
  url?: string;
  isDisable?: boolean;
  checkAccess: string;
  action?: () => void;
}

export default function MainMenuV2() {
  const navigate = useNavigate();
  const { projectId } = useParams();

  // Only show if we're inside a project
  if (!projectId) {
    return null;
  }

  const buttons = [
    {
      name: 'Dashboard',
      checkAccess: 'view:dashboard',
      url: `/projects/${projectId}/dashboard`,
      icon: <MdOutlineDashboard />,
      dataTestId: 'dashboard-btn',
      isDisable: false
    },
    {
      name: 'Planning',
      checkAccess: 'view:boards',
      icon: <TiClipboard />,
      url: `/projects/${projectId}/planning`,
      dataTestId: 'planning-btn'
    },
    {
      name: 'Daily standup(WIP)',
      checkAccess: 'view:standup',
      icon: <FaDailymotion />,
      dataTestId: 'dailyscrum-btn',
      isDisable: true
    },
    {
      name: 'Questions',
      checkAccess: 'view:boards',
      url: `/projects/${projectId}/questions`,
      icon: <BsQuestionCircle />,
      dataTestId: 'questions-btn'
    },
    {
      name: 'Board',
      checkAccess: 'view:boards',
      url: `/projects/${projectId}/board`,
      icon: <HiViewBoards />,
      dataTestId: 'board-btn'
    },
    {
      name: 'Sprint(s)',
      checkAccess: 'view:backlog',
      url: `/projects/${projectId}/backlog`,
      icon: <IoMdList />,
      dataTestId: 'backlog-btn'
    },
    {
      name: 'Retro',
      checkAccess: 'view:retro',
      url: `/projects/${projectId}/retro`,
      icon: <HiViewBoards />,
      dataTestId: 'retro-btn'
    },
    {
      name: 'Epic',
      checkAccess: 'view:epics',
      url: `/projects/${projectId}/epic`,
      icon: <VscNewFile />,
      dataTestId: 'epic-btn',
      isDisable: false
    },
    {
      name: 'Shortcut',
      checkAccess: 'view:shortcuts',
      url: `/projects/${projectId}/shortcuts/`,
      icon: <VscNewFile />,
      dataTestId: 'shortcut-btn'
    },
    {
      name: 'Settings',
      checkAccess: 'view:settings',
      url: `/projects/${projectId}/settings`,
      icon: <FiSettings />,
      dataTestId: 'project-settings-btn'
    }
  ];

  const handleNavigation = (item: IItem) => {
    if (item.isDisable) {
      return;
    }

    if (item.url) {
      navigate(item.url);
    }
    if (item.action) {
      item.action();
    }
  };

  return (
    <div className="fixed left-0 top-15 bottom-0 w-64 shadow-sm z-40 overflow-y-auto main-menu-curve">
      <div className="p-4 pt-12">
        <nav className="space-y-1">
          {buttons
            .filter((item) => checkAccess(item.checkAccess, projectId))
            .map((item) => (
              <button
                key={item.name}
                data-testid={item.dataTestId}
                className={`w-full flex items-center gap-3 px-3 py-4 text-lg text-white hover:bg-white hover:bg-opacity-20 transition-all bg-transparent border-0  ${
                  item.isDisable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:left-1'
                }`}
                onClick={() => handleNavigation(item)}
                disabled={item.isDisable}
              >
                <div className="w-5 h-5 flex items-center justify-center">{item.icon}</div>
                <span className="font-medium">{item.name}</span>
              </button>
            ))}
        </nav>
      </div>
    </div>
  );
}
