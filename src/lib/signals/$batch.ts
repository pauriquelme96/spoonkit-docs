import { batch } from "@preact/signals-core";

export function $batch<T>(fn: () => T): T {
  return batch(fn);
}
