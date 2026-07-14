import React from 'react';

interface SectionTitleProps {
  children: React.ReactNode;
  count?: number;
  countLabel?: string;
  withBorder?: boolean;
  subText?: string;
}

function SectionTitle({
  children,
  count,
  countLabel = 'items',
  withBorder = false,
  subText
}: Readonly<SectionTitleProps>) {
  const borderClasses = withBorder ? 'border-b-2 border-gray-200 pb-2 mb-4' : '';

  return (
    <div className={`flex items-center justify-between mb-4 ${borderClasses}`}>
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mt-0 mb-1">{children}</h2>
        {subText && <p className="mt-1 mb-0 text-sm italic text-secondary opacity-80">{subText}</p>}
      </div>
      {count !== undefined && (
        <div className="text-sm text-gray-500">
          {count} {count === 1 ? countLabel.replace(/s$/, '') : countLabel}
        </div>
      )}
    </div>
  );
}

export default SectionTitle;
