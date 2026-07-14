/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/jsx-no-constructed-context-values */
/* eslint-disable no-unused-vars */
import React from 'react';
import SettingNavigations from '../../Navigations/SettingNavigations/SettingNavigations';

interface ProjectSettingHOCProps {
  children: React.ReactNode;
}

// Modal provider component
export default function ProjectSettingHOC({ children }: ProjectSettingHOCProps) {
  return (
    <div className="flex flex-col gap-4 px-6 mt-8 max-w-1100 w-full mx-auto primary-color">
      <SettingNavigations />
      {children}
    </div>
  );
}
