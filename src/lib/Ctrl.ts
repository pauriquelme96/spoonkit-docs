import { batch } from "@legendapp/state";
import { Emitter, emitter } from "./Emitter";
import type { PropModel } from "./PropTypes";

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

    batch(() => {
      for (const key in props) {
        if (this[key].set instanceof Function) {
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
