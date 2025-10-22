import type { Emitter } from "./Emitter";
import type { Calc, State } from "./signals";

type ExtractCalcType<P> = P extends Calc<infer T> ? T : never;
type ExtractEmitterType<P> = P extends Emitter<infer T> ? T : never;
type ExtractPropType<P> = P extends State<infer T> ? T : never;

export type PropModel<T> = {
  // Emisores (Events)
  [K in keyof T as T[K] extends Emitter<any> ? K : never]?: (
    value: ExtractEmitterType<T[K]>
  ) => void;
} & {
  // Propiedades (Prop)
  [K in keyof T as T[K] extends State<any> ? K : never]?:
    | ExtractPropType<T[K]>
    | State<ExtractPropType<T[K]>>
    | Calc<ExtractCalcType<T[K]>>;
};

export type PropValues<T> = {
  // Propiedades (Prop)
  [K in keyof T as T[K] extends State<any> ? K : never]?: T[K] extends State<
    infer U
  >
    ? U
    : never;
} & {
  [K in keyof T as T[K] extends Calc<any> ? K : never]?: ExtractCalcType<T[K]>;
};
