import React from 'react';

interface IPropsButtonV2 {
  text: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  customStyles?: string;
  danger?: boolean;
  loading?: boolean;
  fill?: boolean;
  icon?: React.ReactNode;
  size?: 'button-xs' | 'button-md' | 'button-lg';
  dataTestId?: string;
  disabled?: boolean;
  btnType?: 'button' | 'submit' | 'reset';
}

export default function ButtonV2(props: IPropsButtonV2) {
  const {
    text,
    customStyles = '',
    onClick,
    danger = false,
    loading = false,
    fill = false,
    icon = null,
    size = 'button-md',
    dataTestId = '',
    disabled = false,
    btnType
  } = props;
  return (
    <button
      type={btnType}
      className={[
        'color-primary',
        'text-center',
        'relative',
        'm-0',
        'p-0',
        'flex',
        'justify-around',
        'items-center',
        'uppercase',
        'border-box',
        'cursor-pointer',
        'border-radius-6',
        'font-weight-700',
        'border-1-primary',
        'transition-all-default',
        'font-size-11',
        'line-height-1-82',
        'letter-spacing-1-54',
        'min-w-125',
        'hover-bg-primary',
        'hover-text-white',
        'disabled-button',
        customStyles || '',
        danger ? 'button-danger' : '',
        fill ? 'button-fill' : '',
        fill ? '' : 'background-transparent',
        size
      ].join(' ')}
      onClick={onClick}
      disabled={loading || disabled}
      data-testid={dataTestId}
    >
      {icon}
      {text}
    </button>
  );
}

ButtonV2.defaultProps = {
  customStyles: '',
  danger: false,
  loading: false,
  fill: false,
  icon: null,
  size: 'button-md',
  dataTestId: '',
  disabled: false,
  btnType: 'button'
};
