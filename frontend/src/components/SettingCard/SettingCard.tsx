/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';

interface ISettingCard {
  children: React.ReactNode | string;
  title: string;
}

export default function SettingCard(props: ISettingCard) {
  const { title, children } = props;

  return (
    <div className="my-6 p-8 px-10 rounded-lg bg-white shadow-card">
      <h2 className="inline-block text-xl font-normal text-gray break-word leading-143 tracking-1 uppercase">
        {title}
      </h2>
      {children}
    </div>
  );
}
