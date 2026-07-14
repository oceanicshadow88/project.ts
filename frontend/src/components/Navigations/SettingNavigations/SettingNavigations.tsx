import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AiOutlineSetting, AiOutlineUnorderedList } from 'react-icons/ai';
import { BsBriefcase } from 'react-icons/bs';
import { MdLabel, MdCheckCircle } from 'react-icons/md';
import styles from './SettingNavigations.module.scss';
import checkAccess from '../../../utils/helpers';

interface IItem {
  name: string;
  icon: React.ReactNode;
  dataTestId: string;
  url?: string;
  isDisable?: boolean;
  checkAccess?: string;
  action?: () => void;
  active?: boolean;
}

export default function SettingNavigations() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const { projectId = '' } = useParams();

  const buttons = [
    {
      name: 'Project Details',
      url: `/projects/${projectId}/settings`,
      icon: <AiOutlineSetting />,
      dataTestId: 'preference',
      active: location.pathname === `/projects/${projectId}/settings`
    },
    {
      name: 'Project members',
      checkAccess: 'view:members',
      url: `/projects/${projectId}/members`,
      icon: <BsBriefcase />,
      dataTestId: 'project-members',
      active: location.pathname === `/projects/${projectId}/members`
    },
    {
      name: 'Labels',
      url: `/projects/${projectId}/settings/labels`,
      icon: <MdLabel />,
      dataTestId: 'labels',
      active: location.pathname === `/projects/${projectId}/settings/labels`
    },
    {
      name: 'Statuses',
      url: `/projects/${projectId}/settings/statuses`,
      icon: <MdCheckCircle />,
      dataTestId: 'statuses',
      active: location.pathname === `/projects/${projectId}/settings/statuses`
    },
    {
      name: 'Custom Fields (WIP)',
      url: `/custom-fields/${projectId}`,
      icon: <AiOutlineUnorderedList />,
      dataTestId: 'custom-fields',
      isDisable: true,
      active: location.pathname === `/custom-fields/${projectId}`
    }
  ];

  const renderBtn = (item: IItem) => {
    return (
      <button
        data-testid={item.dataTestId}
        className={[item.isDisable ? 'opacity-40 cursor-not-allowed' : ''].join(' ')}
        onClick={() => {
          if (item.isDisable) {
            return;
          }

          if (item.url) {
            navigate(item.url);
          }
          if (item.action) {
            item.action();
          }
        }}
        key={item.name}
      >
        {item.icon}
        <span>{item.name}</span>
      </button>
    );
  };

  const renderMenu = () => {
    return (
      <ul className={[styles.menu, isMenuOpen ? '' : styles.menuCollapsed].join(' ')}>
        {buttons
          .filter((item) => !item.checkAccess || checkAccess(item.checkAccess, projectId))
          .map((item) => {
            return (
              <li
                className={[styles.menuItem, item.active ? styles.active : ''].join(' ')}
                style={{
                  borderBottom: item.isDisable ? 'none' : ''
                }}
                key={item.name}
              >
                {renderBtn(item)}
              </li>
            );
          })}
      </ul>
    );
  };

  useEffect(() => {
    const handleResize = () => {
      if (typeof globalThis.window === 'undefined') return;
      if (globalThis.window.innerWidth < 1280) {
        setIsMenuOpen(false);
      } else {
        setIsMenuOpen(true);
      }
    };

    handleResize();
    globalThis.window.addEventListener('resize', handleResize);
    return () => {
      globalThis.window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="background-transparent border-radius-8 border-bottom-1 border-color-light">
      <button
        type="button"
        className={styles.menuToggle}
        onClick={() => {
          setIsMenuOpen((prev) => !prev);
        }}
        aria-expanded={isMenuOpen}
      >
        <span className={styles.menuToggleIcon} />
        <span className={styles.menuToggleLabel}>Settings menu</span>
      </button>
      {renderMenu()}
    </div>
  );
}
