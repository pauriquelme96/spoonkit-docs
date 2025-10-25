export interface StateLike<T = unknown> {
  get(): T;
  set(value: T): void;
  peek(): T;
}
