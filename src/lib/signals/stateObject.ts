import { calc } from "./Calc";
import type { StateLike } from "./stateArray";

type ExtractSetType<T> = T extends { set(value: infer V): void } ? V : never;
type ExtractGetType<T> = T extends { get(): infer V } ? V : never;

type ExtractStateTypes<T extends Record<string, StateLike>> = {
  [K in keyof T]?: ExtractSetType<T[K]>;
};

type ExtractGetTypes<T extends Record<string, StateLike>> = {
  [K in keyof T]: ExtractGetType<T[K]>;
};

export type StateObject<T extends Record<string, StateLike>> = ReturnType<typeof stateObject<T>>;
export function stateObject<T extends Record<string, StateLike>>(model: T) {
  if (!model || typeof model !== 'object' || Array.isArray(model)) {
    throw new TypeError(
      `stateObject() expects an object, but received ${Array.isArray(model) ? 'array' : typeof model}. ` +
      `Value: ${JSON.stringify(model)}`
    );
  }

  type GetType = ExtractGetTypes<T>;

  const _value = calc<GetType>(() => {
    const value: Record<string, any> = {};

    for (const key in model) {
      value[key] = model[key].get();
    }

    return value as GetType;
  });

  return {
    ...model,
    get(): GetType {
      // Return a new object to prevent mutation issues
      return { ..._value.get() };
    },
    peek(): GetType {
      // Return a new object to prevent mutation issues
      return { ..._value.peek() };
    },
    set(newValue: ExtractStateTypes<T>) {
      if (!newValue || typeof newValue !== 'object' || Array.isArray(newValue)) {
        throw new TypeError(
          `stateObject.set() expects an object, but received ${Array.isArray(newValue) ? 'array' : typeof newValue}. ` +
          `Value: ${JSON.stringify(newValue)}`
        );
      }

      for (const key in model) {
        if (newValue.hasOwnProperty(key) && model[key].set) {
          model[key].set(newValue[key]);
        }
      }
    },
  };
}
