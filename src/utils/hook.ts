import { RefObject, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from '@/store'

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()

export const useOutsideClick = <T extends HTMLElement>(
    ref: RefObject<T>,
    handleClickOutside: () => void
  ) => {
    useEffect(() => {
      const handleClick = (event: MouseEvent) => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
          handleClickOutside();
        }
      };
  
      document.addEventListener('click', handleClick);
  
      return () => document.removeEventListener('click', handleClick);
    }, [ref, handleClickOutside]);
  };

export const useDebounce = <T>(value:T, delay:number, initValue?:T) => {
  const [debouncedValue, setDebouncedValue] = useState(initValue);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export function useScroll() {
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = () => {
    setIsScrolled(true);
  };

  useEffect(() => {
    const element = window; // Adjust based on your component's scrollable area
    element.addEventListener("scroll", handleScroll);

    return () => {
      element.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return isScrolled;
}