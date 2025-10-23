import { calc } from "./Calc";
import { state } from "./State";

export interface StateLike<T = unknown> {
  get(): T;
  set(value: T): void;
  peek(): T;
}

type ExtractSetType<T> = T extends { set(value: infer V): void } ? V : never;

export function stateArray<T extends StateLike>(fn: () => T) {
  const _signals = state<T[]>([]);
  const _value = calc(() => _signals.get().map((signal) => signal.get()));

  type SetType = ExtractSetType<T>;

  return {
    get() {
      return _value.get();
    },
    peek() {
      return _value.peek();
    },
    set(newValues: SetType[]) {
      const existingSignals = _signals.peek();
      const newSignals: T[] = [];

      newValues.forEach((value, i) => {
        const signal = existingSignals[i] || fn();
        signal.set(value as any);
        newSignals.push(signal);
      });

      _signals.set(newSignals);
    },
    map<R>(mapFn: (item: T, index: number) => R): R[] {
      return _signals.get().map(mapFn);
    },
    filter(filterFn: (item: T, index: number) => boolean): T[] {
      return _signals.get().filter(filterFn);
    },
    push(value: SetType) {
      const existingSignals = _signals.peek();
      const newSignal = fn();
      newSignal.set(value as any);
      _signals.set([...existingSignals, newSignal]);
    },
    pop(): SetType | undefined {
      const existingSignals = _signals.peek();
      if (existingSignals.length === 0) return undefined;

      const lastSignal = existingSignals[existingSignals.length - 1];
      const lastValue = lastSignal.peek() as SetType;

      _signals.set(existingSignals.slice(0, -1));
      return lastValue;
    },
    dispose() {
      // Limpieza completa del stateArray
      _signals.set([]);
    },
  };
}
