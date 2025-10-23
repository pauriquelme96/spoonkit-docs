import { observer } from "@legendapp/state/react";
import { useCtrl } from "../../lib/useCtrl";
import { ButtonCtrl } from "./ButtonCtrl";

interface ButtonProps {
  ctrl: ButtonCtrl;
}

export const Button = observer(({ ctrl }: ButtonProps) => {
  const self = useCtrl(ctrl);

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
});
