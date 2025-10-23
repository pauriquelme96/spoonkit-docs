import { calc } from "./Calc";
import type { StateLike } from "./stateArray";

type ExtractSetType<T> = T extends { set(value: infer V): void } ? V : never;

type ExtractStateTypes<T extends Record<string, StateLike>> = {
  [K in keyof T]?: ExtractSetType<T[K]>;
};

export function stateObject<T extends Record<string, StateLike>>(model: T) {
  const _value = calc(() => {
    const value: Record<string, any> = {};

    for (const key in model) {
      value[key] = model[key].get();
    }

    return value;
  });

  return {
    ...model,
    get() {
      return _value.get();
    },
    peek() {
      return _value.peek();
    },
    set(newValue: ExtractStateTypes<T>) {
      for (const key in model) {
        if (newValue[key] !== undefined) {
          model[key].set(newValue[key]);
        }
      }
    },
  };
}
