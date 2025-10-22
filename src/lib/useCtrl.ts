import { useEffect, useRef } from "react";
import { Ctrl } from "./Ctrl";

export type Class<T> = (new (...args: unknown[]) => T) & { prototype: T };

export function useCtrl<T extends Ctrl>(
  ctrlToken: Class<T> | T,
  initProps?: any //PropModel<T> = {}
) {
  const selfRef = useRef<T | null>(null);

  if (selfRef.current === null) {
    selfRef.current = ctrlToken instanceof Ctrl ? ctrlToken : new ctrlToken();
    selfRef.current.set(initProps ?? {});
    selfRef.current?.onStart.next(selfRef.current);
  }

  useEffect(() => {
    return () => selfRef.current?.onDestroy.next();
  }, []);

  return selfRef.current;
}
