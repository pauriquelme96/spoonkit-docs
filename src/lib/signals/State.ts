import { signal, Signal } from "@preact/signals-core";
import { Calc } from "./Calc";
import { monitor } from "./Monitor";

export function state<T>(initValue?: T | State<T> | Calc<T>): State<T> {
  return new State<T>(initValue);
}
export class State<T = unknown> {
  private self: Signal<T>;

  constructor(initValue?: T | State<T> | Calc<T>) {
    this.set(initValue);
  }

  private disposers: (() => void)[] = [];

  public get() {
    return this.self.value;
  }

  public peek() {
    return this.self.peek();
  }

  private disposePrevious() {
    this.disposers.forEach((dispose) => dispose());
  }

  public set(value: T | State<T> | Calc<T>): this {
    if (value === undefined && arguments.length === 0) {
      throw new TypeError("State.set() requires a value argument");
    }

    if (value instanceof State || value instanceof Calc) {
      this.disposePrevious();

      const disposeGetter = monitor(() => {
        const v = value.get();
        if (!this.self) this.self = signal<T>(v);
        else this.self.value = v;
      });

      this.disposers.push(disposeGetter);

      if (value instanceof State) {
        const disposeSetter = monitor(() => {
          const v = this.get();
          value.set(v);
        });

        this.disposers.push(disposeSetter);
      }
    } else {
      if (!this.self) this.self = signal<T>(value);
      else this.self.value = value;
    }

    return this;
  }
}
