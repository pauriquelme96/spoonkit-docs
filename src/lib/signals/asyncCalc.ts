import { calc } from "./Calc";
import { monitor } from "./Monitor";
import { state } from "./State";

export function asyncCalc<T>(promiseFn: () => Promise<T>) {
  const value = state<T>();
  const active = state(false);

  monitor(() => {
    if (!active.get()) return;
    promiseFn().then((result) => value.set(result));
  });

  return calc(() => {
    active.set(true);
    return value.get();
  });
}
