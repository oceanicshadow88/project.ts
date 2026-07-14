import React from 'react';
import SectionTitle from '../../../../components/SectionTitle/SectionTitle';

interface IBacklogSection {
  totalIssue: number;
  children?: React.ReactNode | string;
}

export default function BacklogSection({ totalIssue, children }: IBacklogSection) {
  return (
    <section className="w-full">
      <SectionTitle count={totalIssue} countLabel="tickets">
        Backlog
      </SectionTitle>
      {children}
    </section>
  );
}
