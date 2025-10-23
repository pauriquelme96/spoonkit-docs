import { untracked } from "@preact/signals-core";

export function $untracked<T>(fn: () => T): T {
  return untracked(fn);
}
