import { effect } from "@preact/signals-core";

export const monitor = (fn: () => void) => {
  return new Monitor(fn).dispose;
};

// TODO: Pending add dispose method
export class Monitor {
  public dispose: () => void;

  constructor(private monitorFn: () => void) {
    this.dispose = effect(this.monitorFn);
  }
}
