"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Estado persistido en localStorage.
 *
 * El primer render usa `defaults`; recién después de intentar leer lo
 * guardado se habilita el guardado, para no pisar datos existentes con los
 * valores por defecto en el instante entre el primer render y la lectura.
 */
export function usePersistentState<T>(
  storageKey: string,
  defaults: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(defaults);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<T>;
        setValue({ ...defaults, ...parsed });
      }
    } catch {
      // Ignoramos: nos quedamos con los valores por defecto.
    } finally {
      hasHydratedRef.current = true;
    }
    // defaults is stable for our use cases (module-level constants)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!hasHydratedRef.current) return;
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  }, [storageKey, value]);

  return [value, setValue];
}
