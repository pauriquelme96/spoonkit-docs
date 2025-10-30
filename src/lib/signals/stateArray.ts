import { Calc, calc } from "./Calc";
import { State, state } from "./State";
import type { StateLike } from "./StateLike";

type ExtractValue<T extends StateLike> = T extends { get(): infer V }
  ? V
  : never;

export function stateArray<T extends StateLike>(
  fn: () => T,
  initSignals: T[] = []
): StateArray<T> {
  return new StateArray<T>(fn, initSignals);
}

export class StateArray<T extends StateLike> extends State<any> {
  private signals = state<T[]>([]);
  private value = calc<ExtractValue<T>[]>(() =>
    this.signals.get().map((signal) => signal.get() as ExtractValue<T>)
  );

  constructor(
    private fn: (
      value: ExtractValue<T>,
      index: number,
      array: ExtractValue<T>[]
    ) => T,
    initSignals: T[] = []
  ) {
    super();
    this.signals.set(initSignals);
  }

  public override get(): ExtractValue<T>[] {
    return [...this.value.get()];
  }

  public override peek(): ExtractValue<T>[] {
    return [...this.value.peek()];
  }

  public override set(newValues: ExtractValue<T>[]): this {
    if (!Array.isArray(newValues)) {
      throw new TypeError(
        `stateArray.set() expects an array, but received ${typeof newValues}. ` +
          `Value: ${JSON.stringify(newValues)}`
      );
    }

    const existingSignals = this.signals.peek();
    const newSignals: T[] = [];

    newValues.forEach((value, i) => {
      const signal =
        existingSignals[i] || this.fn(value as any, i, newValues as any[]);
      signal.set(value as any);
      newSignals.push(signal);
    });

    this.signals.set(newSignals);
    return this;
  }

  public map<U extends StateLike>(
    mapFn: (
      value: ExtractValue<T>,
      index: number,
      array: ExtractValue<T>[]
    ) => U
  ) {
    if (typeof mapFn !== "function") {
      throw new TypeError(
        `stateArray.map() expects a function, but received ${typeof mapFn}`
      );
    }

    const currentValues = this.get();

    const mappedStateArray = new StateArray(mapFn as any);

    mappedStateArray.set(currentValues);

    return mappedStateArray as StateArray<U>;
  }

  public filter(
    filterFn: (item: ExtractValue<T>, index: number) => boolean
  ): StateArray<T> {
    if (typeof filterFn !== "function") {
      throw new TypeError(
        `stateArray.filter() expects a function, but received ${typeof filterFn}`
      );
    }

    const filteredSignals = this.signals.get().filter((signal, index) => {
      return filterFn(signal.peek() as ExtractValue<T>, index);
    });

    return new StateArray<T>(this.fn, filteredSignals);
  }

  public push(value: ExtractValue<T>) {
    const existingSignals = this.signals.peek();
    const newSignal = this.fn(value, existingSignals.length, [
      ...existingSignals.map((s) => s.peek()),
      value,
    ] as any);
    this.signals.set([...existingSignals, newSignal]);
  }

  public pop(): ExtractValue<T> | undefined {
    const existingSignals = this.signals.peek();
    if (existingSignals.length === 0) return undefined;

    const lastSignal = existingSignals[existingSignals.length - 1];
    const lastValue = lastSignal.peek() as ExtractValue<T>;

    this.signals.set(existingSignals.slice(0, -1));
    return lastValue;
  }

  public toArray(): T[] {
    return [...this.signals.get()];
  }

  public some(
    fn: (item: ExtractValue<T>, index: number) => boolean
  ): Calc<boolean> {
    return calc(() =>
      this.signals
        .get()
        .some((signal, index) => fn(signal.peek() as ExtractValue<T>, index))
    );
  }

  public every(
    fn: (item: ExtractValue<T>, index: number) => boolean
  ): Calc<boolean> {
    return calc(() =>
      this.signals
        .get()
        .every((signal, index) => fn(signal.peek() as ExtractValue<T>, index))
    );
  }

  public find(
    fn: (item: ExtractValue<T>, index: number) => boolean
  ): T | undefined {
    return this.signals
      .get()
      .find((signal, index) => fn(signal.peek() as ExtractValue<T>, index));
  }

  public at(index: number): T | undefined {
    const signals = this.signals.get();
    return signals.at(index);
  }

  public length(): Calc<number> {
    return calc(() => this.signals.get().length);
  }

  public clear() {
    this.signals.set([]);
  }
}
