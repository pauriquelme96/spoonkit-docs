import { calc } from "./Calc";
import { State } from "./State";
import type { StateLike } from "./StateLike";

type ExtractValue<T extends Record<string, StateLike>> = {
  [K in keyof T]: T[K] extends { get(): infer V } ? V : never;
};

export type StateObject<T extends Record<string, StateLike>> =
  StateObjectClass<T> & T;

export function stateObject<T extends Record<string, StateLike>>(
  model: T
): StateObject<T> {
  return new StateObjectClass<T>(model) as StateObject<T>;
}

export class StateObjectClass<
  T extends Record<string, StateLike>
> extends State<any> {
  private value = calc<ExtractValue<T>>(() => {
    const value: Record<string, any> = {};

    for (const key in this.model) {
      value[key] = this.model[key].get();
    }

    return value as ExtractValue<T>;
  });

  constructor(private model: T) {
    super();
    if (!model || typeof model !== "object" || Array.isArray(model)) {
      throw new TypeError(
        `stateObject() expects an object, but received ${
          Array.isArray(model) ? "array" : typeof model
        }. ` + `Value: ${JSON.stringify(model)}`
      );
    }

    // Asignamos cada propiedad del modelo al primer nivel
    for (const key in model) {
      (this as any)[key] = model[key];
    }
  }

  public override get(): ExtractValue<T> {
    return { ...this.value.get() };
  }

  public override set(newValue: Partial<ExtractValue<T>>): this {
    if (!newValue || typeof newValue !== "object" || Array.isArray(newValue)) {
      throw new TypeError(
        `stateObject.set() expects an object, but received ${
          Array.isArray(newValue) ? "array" : typeof newValue
        }. ` + `Value: ${JSON.stringify(newValue)}`
      );
    }

    for (const key in this.model) {
      if (newValue.hasOwnProperty(key)) {
        this.model[key].set(newValue[key]);
      }
    }

    return this;
  }

  public override peek(): ExtractValue<T> {
    return { ...this.value.peek() };
  }
}
