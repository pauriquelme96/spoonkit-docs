import { useEffect, useReducer, useRef } from "react";
import { Ctrl } from "./Ctrl";
import type { PropModel } from "./PropTypes";
import { monitor } from "./signals/Monitor";
import type { Class } from "./useCtrl2";
import { equal } from "./equal";

export function useCtrl<T extends Ctrl>(
  ctrlToken: Class<T> | T,
  initProps: PropModel<T> = {}
) {
  const selfRef = useRef<T | null>(null);
  const [_, forceUpdate] = useReducer((x) => x + 1, 0);

  if (selfRef.current === null) {
    selfRef.current = ctrlToken instanceof Ctrl ? ctrlToken : new ctrlToken();
    selfRef.current.set(initProps ?? {});
    selfRef.current?.onStart.next(selfRef.current);
  }

  useEffect(() => {
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
