import React, { useContext } from 'react';
import { UserContext } from '../../../context/UserInfoProvider';
import AuthNavBar from './@components/AuthNavBar';
import NoAuthNavBar from './@components/NoAuthNavBar';

interface TopNavBarProps {
  children?: React.ReactNode;
  className?: string;
  transparent?: boolean;
  fixed?: boolean;
}

function TopNavBar({ className = '', fixed = true }: Readonly<TopNavBarProps>) {
  const userInfo = useContext(UserContext);
  const { email } = userInfo;

  const baseClasses = `w-full ${fixed ? 'fixed top-0 left-0 right-0 z-50' : 'relative'}`;
  const backgroundClasses = 'bg-white border-b border-light shadow-sm';
  const combinedClasses = `${baseClasses} ${backgroundClasses} ${className}`.trim();

  return <nav className={combinedClasses}>{email ? <AuthNavBar /> : <NoAuthNavBar />}</nav>;
}

export default TopNavBar;
