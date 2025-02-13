'use client';
import { useState, useEffect } from "react";

const useSessionStorage = (key: string, initialValue: any) => {
  const [value, setValue] = useState(() => {
      const storedValue = typeof sessionStorage !== 'undefined' ? sessionStorage?.getItem(key) : undefined;
      return storedValue ? JSON.parse(storedValue) : initialValue;
  });

  useEffect(() => {
      sessionStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
};

export default useSessionStorage;

