import { Field } from "./domain/Field";
import type { StateLike } from "./signals/stateArr";

export type FieldObject = { [key: string]: Field<any> | FieldObject };

export type ModelValues<T> = {
  [K in keyof T as T[K] extends Field<any>
    ? K
    : T[K] extends FieldObject
    ? K
    : never]?: T[K] extends Field<infer U>
    ? U
    : T[K] extends FieldObject
    ? ModelValues<T[K]>
    : never;
};

export type ModelErrors<T> = {
  [K in keyof T as T[K] extends Field<any>
    ? K
    : T[K] extends FieldObject
    ? K
    : never]?: T[K] extends Field<any>
    ? string[]
    : T[K] extends FieldObject
    ? ModelErrors<T[K]>
    : never;
};

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
 * ```
 */
export type InferModel<T> = T extends {
  get(): infer R;
  peek(): any;
  set(value: any): void;
}
  ? R
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
