import { computed, ReadonlySignal } from "@preact/signals-core";

export const calc = <T>(fn: () => T) => new Calc<T>(fn);

export class Calc<T> {
  private self: ReadonlySignal<T>;

  public get() {
    return this.self.value;
  }

  public peek() {
    return this.self.peek();
  }

  constructor(calcFn: () => T) {
    this.self = computed(calcFn);
  }
}
