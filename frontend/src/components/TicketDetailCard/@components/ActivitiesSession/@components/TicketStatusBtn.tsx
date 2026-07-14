import React from 'react';
import Button from '../../../../Form/Button/Button';

export interface ITicketStatusBtnProps {
  status: string;
  color?: string;
  onClick?: () => void;
  children?: React.ReactNode | string;
}
export default function TicketStatusBtn({
  status,
  color = '#6a2add',
  onClick,
  children
}: ITicketStatusBtnProps) {
  return (
    <Button
      overrideStyle="text-sm bg-transparent text-black h-5 rounded-md m-2 mr-12 ml-1"
      onClick={onClick}
      style={{ border: `1px solid ${color}`, borderLeft: `5px solid ${color}` }}
    >
      <span className="mx-2">{children || status.toUpperCase()}</span>
    </Button>
  );
}
