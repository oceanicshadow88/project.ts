/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useContext, useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { AiOutlineCalendar, AiOutlineFolderOpen, AiOutlineSearch } from 'react-icons/ai';
import { FiSettings } from 'react-icons/fi';
import { MdList, MdLogout } from 'react-icons/md';
import { TbReportMoney, TbReportSearch } from 'react-icons/tb';
import { VscChecklist } from 'react-icons/vsc';
import { Link, useNavigate } from 'react-router-dom';
import { IoIosColorPalette } from 'react-icons/io';
import { UserContext, UserDispatchContext } from '../../../../context/UserInfoProvider';
import Avatar from '../../../Avatar/Avatar';
import { createCustomerPortal, getCustomerId } from '../../../../api/payment/payment';
import Icon from './IconTab/IconTab';

const btnsForDomainOwner = [
  {
    id: 'projects',
    name: 'Projects',
    url: `/projects`,
    icon: <AiOutlineFolderOpen />,
    dataTestId: 'projects-nav-btn'
  },
  {
    id: 'prompts',
    name: 'Prompts',
    url: `/prompts`,
    icon: <MdList />,
    dataTestId: 'prompts-nav-btn'
  },
  {
    id: 'myWork',
    name: 'My Work(WIP)',
    url: `/my-work`,
    icon: <VscChecklist />,
    dataTestId: 'my-work-nav-btn',
    isDisable: true
  },
  {
    id: 'Gantt chart',
    name: 'Gantt chart(WIP)',
    checkAccess: 'view:calendar',
    url: `/my-calendar`,
    icon: <AiOutlineCalendar />,
    dataTestId: 'my-calendar-nav-btn',
    isDisable: true
  },
  {
    id: 'report',
    name: 'Report(WIP)',
    checkAccess: 'view:reports',
    url: `/my-report`,
    icon: <TbReportSearch />,
    dataTestId: 'my-report-nav-btn',
    isDisable: true
  }
];

const btnsForOthers = btnsForDomainOwner.filter((e) => e.id !== 'billing');

function AuthNavBar() {
  const navigate = useNavigate();
  const [showUserSettingsModal, setShowUserSettingsModal] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [customerId, setCustomerId] = useState('');
  const searchRef = useRef<HTMLFormElement>(null);
  const setUserInfo = useContext(UserDispatchContext);
  const userInfo = useContext(UserContext);
  const { isCurrentUserOwner } = userInfo;

  const btnsArray = isCurrentUserOwner ? btnsForDomainOwner : btnsForOthers;

  const logout = () => {
    localStorage.clear();
    setUserInfo({});
    navigate('/');
  };

  useEffect(() => {
    getCustomerId().then((data) => {
      setCustomerId(data?.data);
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchValue !== '') {
        return;
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchExpanded(false);
        setSearchValue('');
      }
    };

    if (isSearchExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchExpanded, searchValue]);

  const handleManageSubscriptionClick = (subscriberId: string) => {
    createCustomerPortal(subscriberId).then((data) => {
      if (!data) {
        navigate(`/projects`);
        return;
      }
      globalThis.location = data.data;
    });
  };

  const handleSearchClick = () => {
    setIsSearchExpanded(true);
    if (isSearchExpanded === false) {
      // Focus on input when expanding
      setTimeout(() => {
        const searchInput = document.getElementById('search-input');
        searchInput?.focus();
      }, 100);
    }
  };

  const renderModals = () => {
    return (
      showUserSettingsModal &&
      ReactDOM.createPortal(
        <div className="fixed top-15 right-4 bg-white rounded-xl shadow-lg border border-light z-1000 w-64">
          <div className="flex items-center gap-2 p-3 border-b border-light">
            <div className="relative">
              <Avatar
                avatarIcon={userInfo.avatarIcon}
                backgroundColor={userInfo.backgroundColor}
                name={userInfo.name}
              />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{userInfo.name}</p>
              <p className="text-xs text-gray">{userInfo.email}</p>
            </div>
          </div>

          <div>
            <Link
              to="/me"
              className="hover:border-left-primary no-underline flex items-center gap-2 p-3 text-sm text-gray-700 hover:text-primary transition-all"
            >
              <div className="w-8 h-8 bg-gray-50 hover:bg-primary-light rounded-lg flex items-center justify-center transition-all">
                <FiSettings className="w-4 h-4" />
              </div>
              <span className="font-medium">User Settings</span>
            </Link>

            <button className="hover:border-left-primary  w-full flex items-center gap-2 p-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-all text-left border-0 bg-transparent">
              <div className="w-8 h-8 bg-gray-50 hover:bg-primary-light rounded-lg flex items-center justify-center transition-all">
                <MdList className="w-4 h-4" />
              </div>
              <span className="font-medium">Preferences</span>
              <span className="text-xs text-gray ml-auto">WIP</span>
            </button>

            <button className="hover:border-left-primary  w-full flex items-center gap-2 p-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-all text-left border-0 bg-transparent">
              <div className="w-8 h-8 bg-gray-50 hover:bg-primary-light rounded-lg flex items-center justify-center transition-all">
                <IoIosColorPalette className="w-4 h-4" />
              </div>
              <span className="font-medium">Theme</span>
              <span className="text-xs text-gray ml-auto">WIP</span>
            </button>

            {isCurrentUserOwner && (
              <button
                onClick={() => handleManageSubscriptionClick(customerId)}
                className="hover:border-left-primary w-full flex items-center gap-2 p-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-all text-left border-0 bg-transparent"
              >
                <div className="w-8 h-8 bg-gray-50 hover:bg-primary-light rounded-lg flex items-center justify-center transition-all">
                  <TbReportMoney className="w-4 h-4" />
                </div>
                <span className="font-medium">Plan & Billing</span>
              </button>
            )}
          </div>

          <div className="border-t border-light p-2">
            <button
              className="w-full flex items-center gap-2 p-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all text-left border-0 bg-transparent"
              onClick={logout}
            >
              <div className="w-8 h-8 bg-red-100 hover:bg-red-200 rounded-lg flex items-center justify-center transition-all">
                <MdLogout className="w-4 h-4" />
              </div>
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>,
        document.body
      )
    );
  };

  return (
    <div className="mx-auto px-6 flex items-center justify-between">
      <div className="flex items-center gap-1">
        <Icon />

        {/* Navigation Items */}
        {btnsArray.map((item) => (
          <button
            key={item.name}
            className="flex items-center gap-2 px-4 py-5 mx-1 text-gray-700 hover:text-primary hover:bg-gray-50 transition-all text-sm font-medium bg-transparent border-0 nav-top-item"
            data-testid={item.dataTestId}
            onClick={() => {
              if (item.url) {
                navigate(item.url);
              }
            }}
            disabled={item.isDisable}
          >
            <div className="hover:scale-105 transition-transform">{item.icon}</div>
            {item.name}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 justify-end overflow-hidden">
        <div
          onClick={handleSearchClick}
          className="transition-all-slow flex items-center gap-2 bg-transparent text-black font-medium rounded-full hover:opacity-90 transition-all text-sm border-2 border-solid border-primary overflow-hidden"
          style={isSearchExpanded ? { width: '100%' } : { width: '40%' }}
        >
          <form
            ref={searchRef}
            className="relative flex items-center gap-2 px-6 py-2 bg-transparent border-0 outline-0 overflow-hidden"
          >
            <AiOutlineSearch className="w-4 h-4 flex-shrink-0" />
            <input
              id="search-input"
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search"
              className="transition-all-slow flex-1 bg-transparent border-0 outline-0 text-sm placeholder-gray-500 font-medium no-border p-1 outline-none overflow-hidden"
              autoComplete="off"
            />
          </form>
        </div>
        <button
          className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-primary hover:bg-gray-50 rounded transition-all text-sm font-medium bg-transparent border-0"
          data-testid="user-settings"
          onClick={() => {
            setShowUserSettingsModal(!showUserSettingsModal);
          }}
        >
          <div className="hover:scale-105 transition-transform">
            <Avatar avatarIcon={userInfo.avatarIcon} name={userInfo.name} size={30} />
          </div>
        </button>
      </div>
      {renderModals()}
    </div>
  );
}

export default AuthNavBar;
