/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useState, useRef, useEffect } from 'react';
import { RiArrowDropDownLine } from 'react-icons/ri';
import { IMinEvent, IOptions } from '../../../types';
import styles from '../../FormV2/FormV2.module.scss';
import defaultStyles from './Dropdown.module.scss';

interface IDropdown {
  label: string;
  name: string;
  value?: string | null;
  options: IOptions[];
  onValueChanged: (e: IMinEvent) => void;
  onValueBlur?: (e: React.ChangeEvent<HTMLButtonElement>) => void;
  placeHolder?: string;
  required?: boolean;
  type?: 'button' | 'submit' | 'reset';
  error?: string | null;
  loading?: boolean;
  hasBorder?: boolean;
  dataTestId?: string;
  color?: string;
  addNullOptions?: boolean;
  displayIcon?: boolean;
  overWriteButtonStyle?: React.CSSProperties;
  alignCenter?: boolean;
  padding?: boolean;
}

function Dropdown(props: IDropdown) {
  const {
    value = '',
    name,
    label,
    placeHolder = 'None',
    type = 'button',
    error = null,
    required = false,
    options,
    onValueChanged,
    onValueBlur = null,
    loading = false,
    dataTestId = null,
    hasBorder = true,
    addNullOptions = false,
    color,
    displayIcon = false,
    overWriteButtonStyle,
    alignCenter = false,
    padding = false
  } = props;

  const [isActive, setIsActive] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const dropDownRef = useRef<HTMLDivElement>(null);

  const displayOption = options?.find((item) => item?.value?.toString() === value?.toString());

  const labelDisplay = displayOption?.label;
  const iconDisplay = displayOption?.icon;

  const handleSelect = (val: string | null) => {
    const e = { target: { value: val, name } };
    onValueChanged(e);
    setShowMenu(false);
    setIsActive(false);
  };

  const handleValueBlur = (e: React.ChangeEvent<HTMLButtonElement>) => {
    onValueBlur?.(e);
    setIsActive(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropDownRef.current && !dropDownRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setIsActive(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (loading) {
    return <div className={styles.skeleton} />;
  }

  const getDisplayLabel = () => {
    if (displayIcon) {
      return null;
    }
    return labelDisplay ?? placeHolder;
  };

  const renderStyledDropdown = () => {
    return (
      <div className="relative">
        <div className={defaultStyles.dropDownList}>
          {addNullOptions && (
            <button onClick={() => handleSelect(null)} data-testid="leader-name-null">
              None
            </button>
          )}
          {options?.length > 0
            ? options.map((item) => {
                return (
                  <button
                    key={item.value}
                    className={item.value === value ? defaultStyles.selected : undefined}
                    onClick={() => handleSelect(item.value)}
                    data-testid={`leader-name-${
                      typeof item.label === 'string' ? item.label : item.value
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                );
              })
            : !addNullOptions && (
                <button onClick={() => handleSelect(null)} data-testid="leader-name-null">
                  No Content
                </button>
              )}
        </div>
      </div>
    );
  };

  const renderDropdown = () => {
    if (!showMenu) {
      return null;
    }
    if (typeof options[0].label !== 'string') {
      return (
        <div className="relative">
          <div className="absolute top-0 left-0 z-10 bg-white box-shadow-input">
            {options
              .filter((item) => item.value !== value)
              .map((item) => {
                return (
                  <div key={item.value} onClick={() => handleSelect(item.value)}>
                    {item.label}
                  </div>
                );
              })}
          </div>
        </div>
      );
    }
    return renderStyledDropdown();
  };

  const placeHolderCss = hasBorder ? defaultStyles.placeHolder : defaultStyles.placeHolderNoBorder;
  const textStyle = labelDisplay ? defaultStyles.val : placeHolderCss;

  if (typeof options[0]?.label !== 'string') {
    return (
      <div ref={dropDownRef} data-testid={dataTestId}>
        <button
          type={type}
          onClick={() => {
            setShowMenu(!showMenu);
            setIsActive(true);
          }}
          onBlur={handleValueBlur}
          className="no-style-button"
        >
          {labelDisplay ?? placeHolder}
          {required && <span className={styles.errorRed}>*</span>}
        </button>
        {renderDropdown()}
      </div>
    );
  }

  return (
    <div
      ref={dropDownRef}
      className={[
        'relative',
        hasBorder ? styles.inputContainer : styles.inputContainerNoBorder,
        hasBorder && 'mt-2',
        isActive && 'outline-none',
        error && 'form-error-red',
        displayIcon && 'unset-min-width'
      ].join(' ')}
      data-testid={dataTestId}
    >
      <button
        type={type}
        onClick={() => {
          setShowMenu(!showMenu);
          setIsActive(true);
        }}
        onBlur={handleValueBlur}
        className={styles.input}
        style={{
          ...(overWriteButtonStyle || {}),
          ...(padding || hasBorder ? { padding: '8px 15px' } : {})
        }}
      >
        {hasBorder && (
          <label
            className={[styles.label, error && styles.errorRed, isActive && styles.active].join(
              ' '
            )}
            htmlFor={name}
          >
            {label}
            {required && <span className={styles.errorRed}>*</span>}
          </label>
        )}
        <span
          className={[
            textStyle,
            !value && styles.lightGrey,
            'flex',
            'items-center',
            alignCenter ? 'justify-center' : 'justify-start'
          ].join(' ')}
          style={color ? { color } : undefined}
        >
          {iconDisplay}
          {getDisplayLabel()}
        </span>
        {hasBorder && <RiArrowDropDownLine className={defaultStyles.dropDown} />}
      </button>
      {error && <p className={styles.errorMessage}>{error}</p>}
      {renderDropdown()}
    </div>
  );
}
export default Dropdown;
