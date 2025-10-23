import { useState, useEffect } from "react";
import { Ctrl } from "./Ctrl";
import type { PropModel } from "./PropTypes";
import { monitor } from "./signals/Monitor";
import { state } from "./signals/State";
import type { Class } from "./useCtrl2";
import { equal } from "./equal";


export function useCtrl<T extends Ctrl>(ctrlToken: Class<T> | T, initProps: PropModel<T> = {}) {
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

    //console.log("DEBUG RENDERS", self?.constructor?.name, props);

    // TODO: Review this typing errors when removing as any
    return {
        self: ctrl,
        state: _state,
        setState: (props) => ctrl.set(props),
    } as any;
}
