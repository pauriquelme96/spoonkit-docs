import { useEffect, useState } from "react";
import { Ctrl } from "./Ctrl";
import type { Class } from "./types/Class.type";
import type { PropModel } from "./PropTypes";
import type { UseCtrlHook } from "./types/UseCtrlHook.type";
import { state } from "./signals/State";
import { monitor } from "./signals/Monitor";
import { equal } from "./equal";

export function useCtrl<T extends Ctrl>(
  ctrlToken: Class<T> | T,
  initProps: PropModel<T> = {}
): UseCtrlHook<T> {
  // -------------------------
  // INIT CTRL
  // -------------------------
  const [ctrl] = useState<Ctrl>(() => {
    const instance = ctrlToken instanceof Ctrl ? ctrlToken : new ctrlToken();
    instance.set(initProps);
    return instance;
  });

  // -------------------------
  // INIT SELF
  // -------------------------
  const [_state, setState] = useState(() => ctrl.get());

  // -------------------------
  // BIND LIFECYCLE & PROP CHANGES
  // -------------------------
  useEffect(() => {
    ctrl.onStart.next(ctrl);

    let skipFirst = state(true);
    let lastState: any = _state;
    const dispose = monitor(() => {
      if (skipFirst.get()) skipFirst.set(false);
      else {
        const props = ctrl.get();
        if (equal(lastState, props)) return;
        lastState = props;
        setState(props);
      }
    });

    return () => {
      ctrl.onDestroy.next();
      dispose();
    };
  }, []);

  //console.log("DEBUG RENDERS", ctrl?.constructor?.name, _state);

  return {
    self: ctrl,
    state: _state,
    setState: (props) => ctrl.set(props),
  } as any;
}
