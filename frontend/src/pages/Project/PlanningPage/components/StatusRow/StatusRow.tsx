import React from 'react';
import { IoCheckmarkCircle } from 'react-icons/io5';

interface StatusRowProps {
  iconColor: string;
  text: string;
}

export default function StatusRow({ iconColor, text }: StatusRowProps) {
  return (
    <div className="group flex justify-between items-center p-4 border border-b border-light bg-white text-15 hover:shadow-md">
      <div className="flex items-center gap-3 flex-1">
        <IoCheckmarkCircle className={`${iconColor} flex-shrink-0`} size={24} />
        <div className="flex-1">
          <p className="m-0 text-sm font-medium text-gray-700">{text}</p>
        </div>
      </div>
    </div>
  );
}
