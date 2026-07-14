import React from 'react';

interface IButtonGroupEnd {
  children?: React.ReactNode;
}

export default function ButtonGroupEnd(props: IButtonGroupEnd) {
  const { children } = props;
  return <div className="flex flex-nowrap items-center gap-2 justify-end my-5">{children}</div>;
}

ButtonGroupEnd.defaultProps = {
  children: null
};
