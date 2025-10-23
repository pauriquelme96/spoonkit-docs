import type { PropModel } from "./PropTypes";
import { $batch } from "./signals/$batch";
import { Emitter, emitter } from "./signals/Emitter";

export class Ctrl {
  key = Math.random().toString(36).slice(2);

  onStart = emitter<this>();
  onDestroy = emitter<void>();

  constructor() {
    this.onStart.subscribe(() => {
      this["ctrlStart"]?.();
    });

    this.onDestroy.subscribe(() => {
      this["ctrlDestroy"]?.();
    });
  }

  public set(propsFn: (ctrl: this) => PropModel<this>): this;
  public set(props: PropModel<this>): this;
  public set(props: PropModel<this> | ((ctrl: this) => PropModel<this>)) {
    if (props instanceof Function) {
      props = props(this);
    }

    $batch(() => {
      for (const key in props) {
        const value = props[key];
        const target = this[key];

        if (target instanceof Emitter && typeof value === "function") {
          // Si es un Emitter y el valor es una función, suscribirse
          target.subscribe(value as any);
        } else if (target?.set instanceof Function) {
          // Si tiene método set (State o Calc), usar set
          target.set(value);
        }
      }
    });

    return this;
  }

  // TODO: Replace with PropValues
  public get(): PropModel<this> {
    const values = {} as PropModel<this>;

    for (const key in this) {
      if (this[key]["get"] instanceof Function) {
        values[key as string] = this[key]["get"]();
      }
    }

    return values;
  }
}

export interface CtrlOnStart {
  ctrlStart(): void;
}

export interface CtrlOnDestroy {
  ctrlDestroy(): void;
}
