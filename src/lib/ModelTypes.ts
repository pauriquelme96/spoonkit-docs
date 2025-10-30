import type { StateLike } from "./signals/StateLike";

/**
 * Extrae el tipo de valor que se puede establecer en un StateLike
 */
type ExtractSetType<T> = T extends { set(value: infer V): void } ? V : never;

/**
 * Infiere la interfaz de un modelo creado con stateObj
 *
 * @example
 * ```typescript
 * const userModel = stateObj({
 *   id: state<string>(),
 *   name: state<string>(),
 *   email: stateArray(() => state<string>()),
 *   age: state<number>(),
 * });
 *
 * type UserModel = InferModel<typeof userModel>;
 * // Result: { id: string; name: string; email: string[]; age: number; }
 *
 * // También funciona con una función que retorna el modelo:
 * const createUserModel = () => stateObj({...});
 * type UserModel = InferModel<typeof createUserModel>;
 * // Result: { id: string; name: string; email: string[]; age: number; }
 * ```
 */
export type Infer<T> = T extends (...args: any[]) => infer R
  ? R extends {
      get(): infer M;
      peek(): any;
      set(value: any): void;
    }
    ? M
    : never
  : T extends {
      get(): infer M;
      peek(): any;
      set(value: any): void;
    }
  ? M
  : never;

/**
 * Infiere la interfaz de un modelo basándose en su estructura de signals
 *
 * @example
 * ```typescript
 * type UserModel = InferModelFromSignals<{
 *   id: State<string>;
 *   name: State<string>;
 *   email: ReturnType<typeof stateArray<State<string>>>;
 *   age: State<number>;
 * }>;
 * // Result: { id: string; name: string; email: string[]; age: number; }
 * ```
 */
export type InferModelFromSignals<T extends Record<string, StateLike>> = {
  [K in keyof T]: ExtractSetType<T[K]>;
};
