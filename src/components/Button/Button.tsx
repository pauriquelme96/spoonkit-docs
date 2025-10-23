import { useCtrl } from "../../lib/useCtrl";
import { ButtonCtrl } from "./ButtonCtrl";

export function Button({ ctrl }: { ctrl: ButtonCtrl }) {
  const { self } = useCtrl(ctrl);

  return (
    <button
      className={`button button-${self.variant.get()} ${
        self.loading.get() ? "button-loading" : ""
      }`}
      disabled={self.disabled.get() || self.loading.get()}
      onClick={() => {
        self.onClick.next();
      }}
    >
      {self.loading.get() ? "..." : self.label.get()}
    </button>
  );
}
