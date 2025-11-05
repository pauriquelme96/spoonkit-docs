import { Ctrl } from "../../lib/Ctrl";
import { state } from "../../lib/signals/State";

export class CounterAppCtrl extends Ctrl {
  counter = state(0);

  public increase() {
    this.counter.set(this.counter.get() + 1);
  }
}
