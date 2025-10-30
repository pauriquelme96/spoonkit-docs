import type { ComponentType } from "react";
import type { PropModel } from "./PropTypes";
import { $batch } from "./signals/$batch";
import { Calc } from "./signals/Calc";
import { emitter, Emitter } from "./signals/Emitter";
import { State } from "./signals/State";

export class Ctrl {
  component?: ComponentType<any>;
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
        if (this[key] instanceof State) {
          this[key].set(props[key]);
        } else if (this[key] instanceof Emitter) {
          this[key].subscribe(props[key]);
        }
      }
    });

    return this;
  }

  // TODO: Replace with PropValues
  public get(): PropModel<this> {
    const values = {} as PropModel<this>;

    for (const key in this) {
      if (this[key] instanceof State || this[key] instanceof Calc) {
        values[key as string] = this[key].get();
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
