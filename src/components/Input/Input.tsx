import { observer } from "@legendapp/state/react";
import { useCtrl } from "../../lib/useCtrl";
import { InputCtrl } from "./InputCtrl";

interface InputProps {
  ctrl: InputCtrl;
}

export const Input = observer(({ ctrl }: InputProps) => {
  const self = useCtrl(ctrl);

  return (
    <div className="input-wrapper">
      {self.label.get() && (
        <label className="input-label">{self.label.get()}</label>
      )}
      <input
        className={`input ${self.error.get() ? "input-error" : ""}`}
        type={self.type.get()}
        value={self.value.get()}
        placeholder={self.placeholder.get()}
        disabled={self.disabled.get()}
        onChange={(e) => {
          self.value.set(e.target.value);
          self.onChange.next(e.target.value);
        }}
      />
      {self.error.get() && (
        <span className="input-error-message">{self.error.get()}</span>
      )}
    </div>
  );
});
