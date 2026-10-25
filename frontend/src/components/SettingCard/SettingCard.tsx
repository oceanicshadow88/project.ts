/* eslint-disable react-hooks/exhaustive-deps */
import React from 'react';

interface ISettingCard {
  children: React.ReactNode | string;
  title: string;
  action?: React.ReactNode;
}

export default function SettingCard(props: ISettingCard) {
  const { title, children, action } = props;

  const heading = (
    <h2 className="inline-block text-xl font-normal text-gray break-word leading-143 tracking-1 uppercase">
      {title}
    </h2>
  );

  return (
    <div className="my-6 p-8 px-10 rounded-lg bg-white shadow-card">
      {action ? (
        <div className="flex items-center justify-between gap-3 mb-5">
          {heading}
          {action}
        </div>
      ) : (
        heading
      )}
      {children}
    </div>
  );
}

SettingCard.defaultProps = {
  action: null
};
