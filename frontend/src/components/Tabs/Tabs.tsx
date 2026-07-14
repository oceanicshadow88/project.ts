import React, { useState, ReactNode } from 'react';
import TabPanel, { ITabPanelProps } from './@components/TabPanel/TabPanel';
import TabLabel, { ITabLabelProps } from './@components/TabLabel/TabLabel';

interface ITabsProps {
  children: ReactNode;
}

function Tabs({ children }: ITabsProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const labels = React.Children.toArray(children)
    .filter((child) => React.isValidElement<ITabLabelProps>(child) && child.type === TabLabel)
    .map((child) =>
      React.cloneElement(child as React.ReactElement<ITabLabelProps>, {
        onClick: setActiveIndex,
        isActive: activeIndex === (child as React.ReactElement<ITabLabelProps>).props.index
      })
    );

  const panels = React.Children.toArray(children)
    .filter((child) => React.isValidElement<ITabPanelProps>(child) && child.type === TabPanel)
    .map((child) =>
      React.cloneElement(child as React.ReactElement<ITabPanelProps>, { activeIndex })
    );

  return (
    <div className="w-full px-5 flex-shrink-0">
      <div className="w-full flex gap-0 mb-4 border-b border-light">{labels}</div>
      <div>{panels}</div>
    </div>
  );
}

export { Tabs, TabLabel, TabPanel };
