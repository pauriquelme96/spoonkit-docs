import { useEffect, useRef, useState } from "react";
import { useRefresh } from "./useRefresh";
import { monitor } from "./signals";
import { Ctrl } from "./Ctrl";

export type Class<T> = (new (...args: unknown[]) => T) & { prototype: T };

export function useCtrl<T extends Ctrl>(
  ctrlToken: Class<T> | T,
  initProps?: any //PropModel<T> = {}
) {
  const hasExecuted = useRef(false);

  // -------------------------
  // INIT CTRL
  // -------------------------
  const [ctrl] = useState<T>(() => {
    const instance = ctrlToken instanceof Ctrl ? ctrlToken : new ctrlToken();
    return instance.set(initProps ?? {});
  });

  const refresh = useRefresh();

  // -------------------------
  // BIND LIFECYCLE & PROP CHANGES
  // -------------------------
  useEffect(() => {
    if (hasExecuted.current) return;
    hasExecuted.current = true;

    ctrl.onStart.next(ctrl);

    const dispose = monitor(() => {
      ctrl.get();
      refresh();
    });

    return () => {
      ctrl.onDestroy.next();
      dispose();
    };
  }, []);

  return ctrl;
}
