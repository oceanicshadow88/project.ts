/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
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
  buttonClassName?: string;
  fixedMenu?: boolean;
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
    padding = false,
    buttonClassName = '',
    fixedMenu = false
  } = props;

  const [isActive, setIsActive] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const dropDownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // screen position for the fixed menu, taken from the button when it opens
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });

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
      const target = e.target as Node;
      // the fixed menu is outside dropDownRef, so clicks in it don't count as outside
      if (
        dropDownRef.current &&
        !dropDownRef.current.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setShowMenu(false);
        setIsActive(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // the fixed menu doesn't move with the page, so close it when anything scrolls or resizes
  useEffect(() => {
    if (!fixedMenu || !showMenu) return undefined;
    const closeMenu = (e: Event) => {
      // scrolling the menu's own list shouldn't close it
      if (menuRef.current?.contains(e.target as Node)) return;
      setShowMenu(false);
      setIsActive(false);
    };
    window.addEventListener('scroll', closeMenu, true);
    window.addEventListener('resize', closeMenu);
    return () => {
      window.removeEventListener('scroll', closeMenu, true);
      window.removeEventListener('resize', closeMenu);
    };
  }, [fixedMenu, showMenu]);

  if (loading) {
    return <div className={styles.skeleton} />;
  }

  const toggleMenu = () => {
    if (fixedMenu && !showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({ top: rect.bottom, left: rect.left, width: rect.width });
    }
    setShowMenu(!showMenu);
    setIsActive(true);
  };

  const getDisplayLabel = () => {
    if (displayIcon) {
      return null;
    }
    return labelDisplay ?? placeHolder;
  };

  const renderStyledDropdown = () => {
    const menu = (
      <div
        ref={menuRef}
        className={defaultStyles.dropDownList}
        style={fixedMenu ? { position: 'fixed', ...menuPosition } : undefined}
      >
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
    );
    if (fixedMenu) {
      return ReactDOM.createPortal(menu, document.body);
    }
    return <div className="relative">{menu}</div>;
  };

  const renderDropdown = () => {
    if (!showMenu) {
      return null;
    }
    if (typeof options[0]?.label !== 'string') {
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
          className={['no-style-button', buttonClassName].filter(Boolean).join(' ')}
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
        ref={buttonRef}
        type={type}
        onClick={toggleMenu}
        onBlur={handleValueBlur}
        className={[styles.input, buttonClassName].filter(Boolean).join(' ')}
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
