/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';
import styles from './SearchForBoard.module.scss';
import search from '../../../../../assets/search-line.svg';

interface ISearchForBoard {
  setInputQuery: any;
  placeholder?: string;
  dataTestId?: string;
  debounceMs?: number;
}

export default function SearchForBoard(props: ISearchForBoard) {
  const {
    setInputQuery,
    placeholder = 'Search ticket title',
    dataTestId = 'ticket-search',
    debounceMs = 500
  } = props;
  const [searchValue, setSearchValue] = useState('');
  const myRef = useRef<HTMLInputElement>(null);

  const searchHandler = (event) => {
    setSearchValue(event.target.value);
  };
  useEffect(() => {
    const identifier = setTimeout(() => {
      setInputQuery(searchValue);
    }, debounceMs);

    return () => {
      clearTimeout(identifier);
    };
  }, [searchValue]);

  return (
    <div className={styles.inputContainer}>
      <input
        type="text"
        name="search"
        ref={myRef}
        placeholder={placeholder}
        onChange={searchHandler}
        data-testid={dataTestId}
      />
      <span>
        <img
          className={
            styles.inputImg ||
            'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460__480.png'
          }
          src={search}
          alt="search"
        />
      </span>
    </div>
  );
}
