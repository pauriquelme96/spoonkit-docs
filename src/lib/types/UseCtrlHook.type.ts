import type { PropValues } from "../PropTypes";
import type { Calc } from "../signals/Calc";
import type { State } from "../signals/State";

export type UseCtrlHook<T> = {
  self: T;
  state: PropValues<T>;
  setState: (values: PropValues<T>) => void;
};

type Self<T> = Omit<
  {
    [K in keyof T as T[K] extends State<any>
      ? never
      : T[K] extends Calc<any>
      ? never
      : K]: T[K];
  },
  "key" | "set" | "get" | "ctrlStart" | "ctrlDestroy"
>;

/*
type Self<T> = Omit<
  {
    [K in keyof T as T[K] extends Ctrl
      ? K
      : T[K] extends Function
      ? K
      : never]: T[K];
  },
  "set" | "component"
>;

type Emitters<T> = {
  [K in keyof T as T[K] extends Emitter<any> ? K : never]: T[K] extends Emitter<
  infer U
  >
  ? U extends void
  ? () => void
  : (value: U) => void
  : never;
};
*/
