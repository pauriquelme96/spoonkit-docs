import { useEffect, useReducer, useRef } from "react";
import { Ctrl } from "./Ctrl";
import type { PropModel } from "./PropTypes";
import { monitor } from "./signals/Monitor";
import { equal } from "./equal";

export type Class<T> = (new (...args: unknown[]) => T) & { prototype: T };

export function useCtrl<T extends Ctrl>(
  ctrlToken: Class<T> | T,
  initProps: PropModel<T> = {}
) {
  const selfRef = useRef<T | null>(null);
  const skip = useRef(true);
  const [_, forceUpdate] = useReducer((x) => x + 1, 0);

  if (selfRef.current === null) {
    selfRef.current = ctrlToken instanceof Ctrl ? ctrlToken : new ctrlToken();
    selfRef.current.set(initProps ?? {});
  }

  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }

    selfRef.current?.onStart.next(selfRef.current);

    let lastState: any = {};
    const dispose = monitor(() => {
      const props = selfRef.current?.get();
      if (equal(lastState, props)) return;
      lastState = props;
      forceUpdate();
    });

    return () => {
      dispose();
      selfRef.current?.onDestroy.next();
    };
  }, []);

  return {
    self: selfRef.current,
  };
}
