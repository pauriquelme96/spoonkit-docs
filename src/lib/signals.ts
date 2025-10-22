import {
  computed,
  observable,
  observe,
  type ObservableReadable,
} from "@legendapp/state";

export type State<T> = ReturnType<typeof observable<T>>;
export type Calc<T extends ObservableReadable> = ReturnType<typeof computed<T>>;

export const state = observable;
export const monitor = observe;
export const calc = computed;
