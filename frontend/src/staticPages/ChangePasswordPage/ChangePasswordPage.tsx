import React from 'react';
import ChangePasswordBackground from './ChangePasswordBackground/ChangePasswordBackground';
import ChangePasswordMain from './ChangePasswordMain/ChangePasswordMain';

export default function RegistePager() {
  return (
    <div className="relative w-full h-screen flex flex-col justify-around">
      <ChangePasswordBackground>
        <ChangePasswordMain />
      </ChangePasswordBackground>
    </div>
  );
}
