import { useCtrl } from "../../lib/useCtrl";
import { InputCtrl } from "./InputCtrl";

export function Input({ ctrl }: { ctrl: InputCtrl<any> }) {
  const { self } = useCtrl(ctrl);

  return (
    <div className="input-wrapper">
      {self.label.get() && (
        <label className="input-label">{self.label.get()}</label>
      )}
      <input
        className={`input ${self.error.get() ? "input-error" : ""}`}
        type={self.type.get()}
        value={self.value.get() || ""}
        placeholder={self.placeholder.get()}
        disabled={self.disabled.get()}
        onBlur={() => self.isTouched.set(true)}
        onChange={(e) => {
          self.value.set(e.target.value);
          self.onChange.next(e.target.value);
        }}
      />
      {self.error.get() && self.isTouched.get() && (
        <span className="input-error-message">{self.error.get()}</span>
      )}
    </div>
  );
}
