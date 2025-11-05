import { useCtrl } from "../../lib/useCtrl";
import { CounterAppCtrl } from "./CounterAppCtrl";

export function CounterApp() {
  const { self } = useCtrl(CounterAppCtrl);

  return (
    <div>
      Counter: {self.counter.get()}{" "}
      <button onClick={() => self.increase()}>+</button>
    </div>
  );
}
