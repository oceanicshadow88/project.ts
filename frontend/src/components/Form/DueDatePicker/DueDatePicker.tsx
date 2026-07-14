import React from 'react';
import { DatePicker } from '@atlaskit/datetime-picker';
import { ITicketDetails } from '../../../types';
import style from './DueDatePicker.module.scss';

interface Props {
  ticketInfo: ITicketDetails;
  dueDateOnchange: (ticketInfo: ITicketDetails) => void;
  isDisabled: boolean;
}

export default function DueDatePicker({ ticketInfo, dueDateOnchange, isDisabled }: Props) {
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) {
      return '';
    }

    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;

      // Check if date is valid
      if (Number.isNaN(dateObj.getTime())) {
        return '';
      }

      // Format as MM-DD-YYYY
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const year = dateObj.getFullYear();

      return `${month}-${day}-${year}`;
    } catch (error) {
      return '';
    }
  };

  const getDateValue = (date: Date | string | null | undefined): string | undefined => {
    if (!date) {
      return undefined;
    }

    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;

      // Check if date is valid
      if (Number.isNaN(dateObj.getTime())) {
        return undefined;
      }

      // Return ISO string for DatePicker value
      return dateObj.toISOString().split('T')[0];
    } catch (error) {
      return undefined;
    }
  };

  return (
    <div className={style.customDatePicker}>
      <DatePicker
        appearance="subtle"
        dateFormat="MM-DD-YYYY"
        value={getDateValue(ticketInfo.dueAt)}
        placeholder={formatDate(ticketInfo.dueAt ?? null)}
        onChange={async (date) => {
          const updatedTicketInfo = { ...ticketInfo };
          updatedTicketInfo.dueAt = new Date(date);
          dueDateOnchange(updatedTicketInfo);
        }}
        testId="dueDatePicker"
        isDisabled={isDisabled}
      />
    </div>
  );
}
