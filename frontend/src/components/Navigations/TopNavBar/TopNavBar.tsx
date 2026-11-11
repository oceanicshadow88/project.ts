import React, { useContext, useLayoutEffect, useRef } from 'react';
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
  const navRef = useRef<HTMLElement>(null);

  // Sticky elements below the nav (e.g. the board filter toolbar) read --top-nav-height
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!fixed || !nav || typeof ResizeObserver === 'undefined') return undefined;
    const rootStyle = document.documentElement.style;
    const updateHeight = () =>
      rootStyle.setProperty('--top-nav-height', `${nav.getBoundingClientRect().height}px`);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(nav);
    return () => {
      observer.disconnect();
      rootStyle.removeProperty('--top-nav-height');
    };
  }, [fixed]);

  const baseClasses = `w-full ${fixed ? 'fixed top-0 left-0 right-0 z-50' : 'relative'}`;
  const backgroundClasses = 'bg-white border-b border-light shadow-sm';
  const combinedClasses = `${baseClasses} ${backgroundClasses} ${className}`.trim();

  return (
    <nav ref={navRef} className={combinedClasses}>
      {email ? <AuthNavBar /> : <NoAuthNavBar />}
    </nav>
  );
}

export default TopNavBar;
