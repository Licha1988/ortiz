"use client";

import { useEffect, useState } from "react";

/**
 * Estado persistido en localStorage con hidratación diferida
 * (evita setState síncrono dentro de useEffect).
 */
export function usePersistentState<T>(
  storageKey: string,
  defaults: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(defaults);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<T>;
        window.setTimeout(() => {
          setValue({ ...defaults, ...parsed });
        }, 0);
      }
    } catch {
      window.setTimeout(() => setValue(defaults), 0);
    }
    // defaults is stable for our use cases (module-level constants)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  }, [storageKey, value]);

  return [value, setValue];
}
