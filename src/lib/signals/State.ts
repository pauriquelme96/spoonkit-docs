import { signal, Signal } from "@preact/signals-core";
import { Calc } from "./Calc";
import { monitor } from "./Monitor";

export function state<T>(value?: T | State<T> | Calc<T>): State<T> {
  return new State<T>().set(value);
}

export class State<T> {
  private self: Signal<T> = signal<T>(null);
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
    if (value instanceof State || value instanceof Calc) {
      this.disposePrevious();

      const disposeGetter = monitor(() => {
        const v = value.get();
        this.self.value = v;
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
      this.self.value = value;
    }

    return this;
  }
}
